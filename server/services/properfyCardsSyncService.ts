import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { properfyCards, properfyCardsSyncStatus, InsertProperfyCard } from "../../drizzle/schema";
import { ENV } from "../_core/env";

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
  dttRegistered?: string;
  dttUpdated?: string;
}

async function getDb() {
  if (!process.env.DATABASE_URL) {
    console.error("[ProperfyCardsSync] DATABASE_URL not set");
    return null;
  }

  try {
    return drizzle(process.env.DATABASE_URL);
  } catch (error) {
    console.error("[ProperfyCardsSync] Failed to connect to database:", error);
    return null;
  }
}

async function fetchCardsFromAPI(pageSize: number = 500): Promise<ProperfyCard[]> {
  const allCards: ProperfyCard[] = [];
  let page = 1;
  const maxPages = 100; // Limite de segurança

  console.log(`[ProperfyCardsSync] ===== API FETCH START =====`);
  console.log(`[ProperfyCardsSync] API URL: ${PROPERFY_API_URL}`);
  console.log(`[ProperfyCardsSync] Token length: ${PROPERFY_API_TOKEN?.length || 0}`);
  console.log(`[ProperfyCardsSync] Page size: ${pageSize}`);

  try {
    while (page <= maxPages) {
      const url = `${PROPERFY_API_URL}/crm/card?page=${page}&size=${pageSize}`;
      console.log(`[ProperfyCardsSync] Fetching page ${page}: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`[ProperfyCardsSync] Timeout on page ${page}`);
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

        console.log(`[ProperfyCardsSync] Page ${page} - Status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[ProperfyCardsSync] API Error ${response.status}: ${errorText.substring(0, 200)}`);
          break;
        }

        const data = await response.json();
        console.log(`[ProperfyCardsSync] Page ${page} - Response keys: ${Object.keys(data).join(", ")}`);
        
        if (!data.data) {
          console.error(`[ProperfyCardsSync] Page ${page} - No 'data' field in response`);
          console.log(`[ProperfyCardsSync] Response structure:`, JSON.stringify(data).substring(0, 500));
          break;
        }

        if (!Array.isArray(data.data)) {
          console.error(`[ProperfyCardsSync] Page ${page} - 'data' is not an array: ${typeof data.data}`);
          break;
        }

        console.log(`[ProperfyCardsSync] Page ${page} - Got ${data.data.length} cards`);

        if (data.data.length === 0) {
          console.log(`[ProperfyCardsSync] Page ${page} - No more cards found`);
          break;
        }

        allCards.push(...data.data);
        
        // Se retornou menos que pageSize, é a última página
        if (data.data.length < pageSize) {
          console.log(`[ProperfyCardsSync] Page ${page} - Last page (${data.data.length} < ${pageSize})`);
          break;
        }

        page++;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`[ProperfyCardsSync] Page ${page} - Request timeout`);
        } else {
          console.error(`[ProperfyCardsSync] Page ${page} - Error:`, error);
        }
        break;
      }
    }
  } catch (error) {
    console.error(`[ProperfyCardsSync] Error in fetchCardsFromAPI:`, error);
  }

  console.log(`[ProperfyCardsSync] ===== API FETCH END: ${allCards.length} cards fetched =====`);
  return allCards;
}

async function getPipelineName(pipelineId: number): Promise<string> {
  const names: Record<number, string> = {
    [PIPELINE_IDS.VENDAS_LANCAMENTOS]: "Vendas Lançamentos",
    [PIPELINE_IDS.VENDAS_PRONTOS]: "Vendas Prontos",
    [PIPELINE_IDS.ANGARIACAO_VENDAS]: "Angariação de Vendas",
    [PIPELINE_IDS.LEADS_FOR_YOU]: "Leads for You",
  };
  return names[pipelineId] || `Pipeline ${pipelineId}`;
}

export async function syncProperfyCards() {
  console.log("[ProperfyCardsSync] ===== SYNC START =====");
  
  const db = await getDb();
  if (!db) {
    console.error("[ProperfyCardsSync] Database not available");
    return;
  }

  const startTime = Date.now();

  try {
    // Atualizar status para "syncing"
    await updateSyncStatus("syncing", null);
    console.log("[ProperfyCardsSync] Status updated to: syncing");

    console.log("[ProperfyCardsSync] Starting sync...");

    // Buscar todos os cards da API
    const allCards = await fetchCardsFromAPI();
    console.log(`[ProperfyCardsSync] Total cards from API: ${allCards.length}`);

    if (allCards.length === 0) {
      console.warn("[ProperfyCardsSync] ⚠️  No cards fetched from API!");
      await updateSyncStatus("completed", "No cards found in API", 0);
      console.log("[ProperfyCardsSync] ===== SYNC END (NO DATA) =====");
      return;
    }

    // Filtrar apenas os pipelines que nos interessam
    const relevantCards = allCards.filter(
      (card) =>
        card.fkPipeline === PIPELINE_IDS.VENDAS_LANCAMENTOS ||
        card.fkPipeline === PIPELINE_IDS.VENDAS_PRONTOS ||
        card.fkPipeline === PIPELINE_IDS.ANGARIACAO_VENDAS ||
        card.fkPipeline === PIPELINE_IDS.LEADS_FOR_YOU
    );

    console.log(`[ProperfyCardsSync] Relevant cards: ${relevantCards.length} out of ${allCards.length}`);

    if (relevantCards.length === 0) {
      console.warn("[ProperfyCardsSync] ⚠️  No relevant cards found!");
      // Mostrar distribuição de pipelines
      const pipelineDistribution: Record<number, number> = {};
      allCards.forEach(card => {
        pipelineDistribution[card.fkPipeline] = (pipelineDistribution[card.fkPipeline] || 0) + 1;
      });
      console.log("[ProperfyCardsSync] Pipeline distribution:", JSON.stringify(pipelineDistribution));
    }

    // Inserir/atualizar cards
    let insertedCount = 0;
    let errorCount = 0;

    console.log(`[ProperfyCardsSync] Starting to insert ${relevantCards.length} cards...`);

    for (const card of relevantCards) {
      const pipelineName = await getPipelineName(card.fkPipeline);
      
      const cardData: InsertProperfyCard = {
        id: `card_${card.id}`,
        pipelineId: card.fkPipeline,
        pipelineName: pipelineName,
        timelineId: card.fkTimeline,
        timelineName: `Timeline ${card.fkTimeline}`,
        leadId: `lead_${card.fkLead}`,
        leadName: card.chrTitle || "Unknown",
        userId: card.fkUser,
        propertyRef: card.chrPropertyRef,
        propertyTitle: card.chrTitle,
        cardType: card.chrType,
        createdAt: card.dttRegistered ? new Date(card.dttRegistered) : new Date(),
        updatedAt: card.dttUpdated ? new Date(card.dttUpdated) : new Date(),
        syncedAt: new Date(),
      };

      try {
        await db
          .insert(properfyCards)
          .values(cardData)
          .onDuplicateKeyUpdate({
            set: {
              pipelineName: cardData.pipelineName,
              timelineId: cardData.timelineId,
              timelineName: cardData.timelineName,
              leadName: cardData.leadName,
              propertyTitle: cardData.propertyTitle,
              updatedAt: cardData.updatedAt,
              syncedAt: new Date(),
            },
          });

        insertedCount++;
        if (insertedCount % 10 === 0) {
          console.log(`[ProperfyCardsSync] Inserted ${insertedCount} cards so far...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`[ProperfyCardsSync] Error inserting card ${card.id}:`, error instanceof Error ? error.message : error);
      }
    }

    const duration = Date.now() - startTime;
    const message = `Sync completed in ${(duration / 1000).toFixed(2)}s. Total API: ${allCards.length}, Relevant: ${relevantCards.length}, Inserted/Updated: ${insertedCount}, Errors: ${errorCount}`;
    console.log(`[ProperfyCardsSync] ${message}`);

    // Atualizar status para "completed"
    await updateSyncStatus("completed", null, insertedCount);
    console.log("[ProperfyCardsSync] Status updated to: completed");
    console.log("[ProperfyCardsSync] ===== SYNC END (SUCCESS) =====");
  } catch (error) {
    console.error("[ProperfyCardsSync] Sync failed:", error instanceof Error ? error.message : error);
    await updateSyncStatus("failed", error instanceof Error ? error.message : "Unknown error");
    console.log("[ProperfyCardsSync] ===== SYNC END (FAILED) =====");
  }
}

async function updateSyncStatus(
  status: "pending" | "syncing" | "completed" | "failed",
  errorMessage: string | null,
  totalCardsSynced?: number
) {
  const db = await getDb();
  if (!db) {
    console.error("[ProperfyCardsSync] Cannot update sync status: database not available");
    return;
  }

  try {
    const syncStatus = await db
      .select()
      .from(properfyCardsSyncStatus)
      .limit(1);

    const nextSyncAt = new Date();
    nextSyncAt.setHours(nextSyncAt.getHours() + 1); // Próxima sincronização em 1 hora

    if (syncStatus.length > 0) {
      await db
        .update(properfyCardsSyncStatus)
        .set({
          lastSyncAt: new Date(),
          nextSyncAt: status === "completed" ? nextSyncAt : syncStatus[0].nextSyncAt,
          totalCardsSynced: totalCardsSynced || syncStatus[0].totalCardsSynced,
          status,
          errorMessage,
        })
        .where(eq(properfyCardsSyncStatus.id, syncStatus[0].id));
    } else {
      await db.insert(properfyCardsSyncStatus).values({
        id: "sync_status_1",
        lastSyncAt: new Date(),
        nextSyncAt: status === "completed" ? nextSyncAt : new Date(),
        totalCardsSynced: totalCardsSynced || 0,
        status,
        errorMessage,
      });
    }
  } catch (error) {
    console.error("[ProperfyCardsSync] Error updating sync status:", error);
  }
}

export async function getSyncStatus() {
  const db = await getDb();
  if (!db) return null;

  try {
    const status = await db.select().from(properfyCardsSyncStatus).limit(1);
    return status.length > 0 ? status[0] : null;
  } catch (error) {
    console.error("[ProperfyCardsSync] Error getting sync status:", error);
    return null;
  }
}
