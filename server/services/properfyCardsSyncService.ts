import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { properfyCards, InsertProperfyCard } from "../../drizzle/schema";
import {
  retryWithBackoff,
  createSyncHistory,
  updateSyncHistory,
  completeSyncHistory,
  failSyncHistory,
  recordSyncError,
  validateCardData,
  formatCardForDatabase,
  sanitizeString,
} from "./properfySyncServiceRobust";
import { v4 as uuidv4 } from "uuid";

const PROPERFY_API_URL = process.env.PROPERFY_API_URL || "https://adm.baggioimoveis.com.br/api";
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || "";

// IDs dos pipelines que nos interessam
const PIPELINE_IDS = {
  VENDAS_LANCAMENTOS: 20,  // Leads de Lançamentos
  VENDAS_PRONTOS: 21,      // Leads de Prontos
  ANGARIACAO_VENDAS: 24,   // Leads de Prontos
  LEADS_FOR_YOU: 49,       // Leads de Prontos
};

interface ProperfyCard {
  id: number;
  fkPipeline: number;
  fkTimeline: number;
  fkLead: number;
  fkUser: number;
  chrPropertyRef?: string;
  chrTitle?: string;
  chrType?: string;
  chrPipelineName?: string;
  chrTimelineName?: string;
  chrLeadName?: string;
  chrLeadEmail?: string;
  chrLeadPhone?: string;
  dttRegistered?: string;
  dttUpdated?: string;
}

/**
 * Busca lista de IDs de cards da API com retry
 */
async function fetchCardIdsFromAPI(
  page: number = 1,
  pageSize: number = 500,
  syncHistoryId?: string
): Promise<{ ids: number[]; hasMore: boolean }> {
  return retryWithBackoff(
    async () => {
      const url = `${PROPERFY_API_URL}/crm/card?page=${page}&size=${pageSize}`;
      console.log(`[ProperfyCardsSync] Fetching IDs page ${page}: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`[ProperfyCardsSync] ⏱️ Timeout on page ${page} (120s)`);
        controller.abort();
      }, 120000);

      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${PROPERFY_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error ${response.status}: ${errorText.substring(0, 200)}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(`Expected array, got ${typeof data}`);
        }

        console.log(`[ProperfyCardsSync] ✅ Page ${page} - Got ${data.length} card IDs`);

        return {
          ids: data,
          hasMore: data.length === pageSize,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },
    `FetchCardIdsPage${page}`,
    syncHistoryId
  );
}

/**
 * Busca detalhes de um card específico com retry
 */
async function fetchCardDetails(
  cardId: number,
  syncHistoryId?: string
): Promise<ProperfyCard | null> {
  try {
    return await retryWithBackoff(
      async () => {
        const url = `${PROPERFY_API_URL}/crm/card/${cardId}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 30000);

        try {
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${PROPERFY_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`API Error ${response.status}`);
          }

          const data = await response.json();
          return data;
        } finally {
          clearTimeout(timeoutId);
        }
      },
      `FetchCardDetails${cardId}`,
      syncHistoryId
    );
  } catch (error) {
    console.error(`[ProperfyCardsSync] Failed to fetch card ${cardId}:`, error);
    if (syncHistoryId) {
      await recordSyncError(
        syncHistoryId,
        String(cardId),
        `Failed to fetch card details: ${(error as Error).message}`,
        "FETCH_ERROR",
        1
      );
    }
    return null;
  }
}

/**
 * Sincroniza todos os cards do Properfy com retry e persistência
 */
export async function syncProperfyCards(): Promise<void> {
  const startTime = Date.now();
  let syncHistoryId: string | null = null;

  try {
    // Criar registro de sincronização
    syncHistoryId = await createSyncHistory("cards");
    console.log(`[ProperfyCardsSync] Started sync: ${syncHistoryId}`);

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    let totalCards = 0;
    let processedCards = 0;
    let failedCards = 0;
    let page = 1;
    const maxPages = 1000;

    // Buscar IDs de cards em páginas
    while (page <= maxPages) {
      try {
        const { ids, hasMore } = await fetchCardIdsFromAPI(page, 500, syncHistoryId);

        if (ids.length === 0) {
          console.log(`[ProperfyCardsSync] No more cards to fetch`);
          break;
        }

        totalCards += ids.length;
        console.log(`[ProperfyCardsSync] Processing ${ids.length} cards from page ${page}`);

        // Processar cada card
        for (const cardId of ids) {
          try {
            const cardDetails = await fetchCardDetails(cardId, syncHistoryId);

            if (!cardDetails) {
              failedCards++;
              continue;
            }

            // Validar dados
            const validation = validateCardData(cardDetails);
            if (!validation.valid) {
              console.warn(
                `[ProperfyCardsSync] Card ${cardId} validation failed:`,
                validation.errors
              );
              failedCards++;
              await recordSyncError(
                syncHistoryId,
                String(cardId),
                `Validation failed: ${validation.errors.join(", ")}`,
                "VALIDATION_ERROR",
                1
              );
              continue;
            }

            // Formatar para banco de dados
            const formattedCard = formatCardForDatabase(cardDetails);

            // Salvar no banco (upsert)
            await db
              .insert(properfyCards)
              .values({
                id: uuidv4(),
                ...formattedCard,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .onDuplicateKeyUpdate({
                set: {
                  ...formattedCard,
                  updatedAt: new Date(),
                },
              });

            processedCards++;

            // Atualizar progresso a cada 100 cards
            if (processedCards % 100 === 0) {
              await updateSyncHistory(syncHistoryId, {
                processedRecords: processedCards,
                failedRecords: failedCards,
                lastPageProcessed: page,
                nextPageToProcess: page + (hasMore ? 1 : 0),
                totalRecords: totalCards,
              });
            }
          } catch (error) {
            console.error(`[ProperfyCardsSync] Error processing card ${cardId}:`, error);
            failedCards++;
            await recordSyncError(
              syncHistoryId,
              String(cardId),
              `Processing error: ${(error as Error).message}`,
              "PROCESSING_ERROR",
              1
            );
          }
        }

        if (!hasMore) {
          console.log(`[ProperfyCardsSync] Reached last page`);
          break;
        }

        page++;
      } catch (error) {
        console.error(`[ProperfyCardsSync] Error on page ${page}:`, error);
        await recordSyncError(
          syncHistoryId,
          null,
          `Page ${page} error: ${(error as Error).message}`,
          "PAGE_ERROR",
          1
        );

        // Continuar para próxima página
        page++;
      }
    }

    // Marcar como completa
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    await completeSyncHistory(syncHistoryId, durationSeconds);

    console.log(
      `[ProperfyCardsSync] ✅ Sync completed! Total: ${totalCards}, Processed: ${processedCards}, Failed: ${failedCards}, Duration: ${durationSeconds}s`
    );
  } catch (error) {
    console.error(`[ProperfyCardsSync] ❌ Sync failed:`, error);

    if (syncHistoryId) {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      await failSyncHistory(syncHistoryId, (error as Error).message, durationSeconds);
    }

    throw error;
  }
}

/**
 * Limpa cards antigos (mais de 90 dias)
 */
export async function cleanupOldCards(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await db
      .delete(properfyCards)
      .where(eq(properfyCards.updatedAt, ninetyDaysAgo));

    console.log(`[ProperfyCardsSync] Cleaned up old cards`);
  } catch (error) {
    console.error(`[ProperfyCardsSync] Error cleaning up old cards:`, error);
  }
}
