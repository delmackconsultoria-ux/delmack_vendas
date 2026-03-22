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

async function fetchCardsFromAPI(pageSize: number = 500): Promise<ProperfyCard[]> {
  const allCards: ProperfyCard[] = [];
  let page = 1;
  const maxPages = 100; // Limite de segurança

  try {
    while (page <= maxPages) {
      console.log(`[ProperfyCardsSync] Fetching page ${page}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(
        `${PROPERFY_API_URL}/crm/card?page=${page}&size=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${PROPERFY_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[ProperfyCardsSync] API Error: ${response.status}`);
        break;
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        console.log(`[ProperfyCardsSync] No more cards found at page ${page}`);
        break;
      }

      allCards.push(...data.data);
      
      // Se retornou menos que pageSize, é a última página
      if (data.data.length < pageSize) {
        break;
      }

      page++;
    }
  } catch (error) {
    console.error(`[ProperfyCardsSync] Error fetching cards:`, error);
  }

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
  const db = await getDb();
  if (!db) {
    console.error("[ProperfyCardsSync] Database not available");
    return;
  }

  const startTime = Date.now();

  try {
    // Atualizar status para "syncing"
    await updateSyncStatus("syncing", null);

    console.log("[ProperfyCardsSync] Starting sync...");

    // Buscar todos os cards da API
    const allCards = await fetchCardsFromAPI();
    console.log(`[ProperfyCardsSync] Fetched ${allCards.length} cards from API`);

    // Filtrar apenas os pipelines que nos interessam
    const relevantCards = allCards.filter(
      (card) =>
        card.fkPipeline === PIPELINE_IDS.VENDAS_LANCAMENTOS ||
        card.fkPipeline === PIPELINE_IDS.VENDAS_PRONTOS ||
        card.fkPipeline === PIPELINE_IDS.ANGARIACAO_VENDAS ||
        card.fkPipeline === PIPELINE_IDS.LEADS_FOR_YOU
    );

    console.log(`[ProperfyCardsSync] Found ${relevantCards.length} relevant cards`);

    // Limpar cards antigos
    await db.delete(properfyCards).where(eq(properfyCards.id, ""));
    // Na verdade, vamos manter os antigos e fazer upsert

    // Inserir/atualizar cards
    let insertedCount = 0;
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
      } catch (error) {
        console.error(`[ProperfyCardsSync] Error inserting card ${card.id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[ProperfyCardsSync] Sync completed in ${(duration / 1000).toFixed(2)}s. Total: ${allCards.length}, Inserted/Updated: ${insertedCount}`
    );

    // Atualizar status para "completed"
    await updateSyncStatus("completed", null, insertedCount);
  } catch (error) {
    console.error("[ProperfyCardsSync] Sync failed:", error);
    await updateSyncStatus("failed", error instanceof Error ? error.message : "Unknown error");
  }
}

async function updateSyncStatus(
  status: "pending" | "syncing" | "completed" | "failed",
  errorMessage: string | null,
  totalCardsSynced?: number
) {
  const db = await getDb();
  if (!db) return;

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

async function getDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("[ProperfyCardsSync] DATABASE_URL not set");
    return null;
  }

  try {
    return drizzle(process.env.DATABASE_URL);
  } catch (error) {
    console.error("[ProperfyCardsSync] Failed to connect to database:", error);
    return null;
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
