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
  const maxPages = 100;

  console.log(`[ProperfyCardsSync] ===== API FETCH START =====`);
  console.log(`[ProperfyCardsSync] API URL: ${PROPERFY_API_URL}`);
  console.log(`[ProperfyCardsSync] Token length: ${PROPERFY_API_TOKEN?.length || 0}`);

  try {
    while (page <= maxPages) {
      const url = `${PROPERFY_API_URL}/crm/card?page=${page}&size=${pageSize}`;
      console.log(`[ProperfyCardsSync] Fetching page ${page}: ${url}`);
      
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

        console.log(`[ProperfyCardsSync] Page ${page} - Status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[ProperfyCardsSync] ❌ API Error ${response.status}: ${errorText.substring(0, 200)}`);
          break;
        }

        const data = await response.json();
        
        // A API retorna um array de objetos de cards
        if (!Array.isArray(data)) {
          console.error(`[ProperfyCardsSync] ❌ Expected array, got ${typeof data}`);
          console.log(`[ProperfyCardsSync] Response:`, JSON.stringify(data).substring(0, 500));
          break;
        }

        console.log(`[ProperfyCardsSync] ✅ Page ${page} - Got ${data.length} cards`);

        if (data.length === 0) {
          console.log(`[ProperfyCardsSync] ℹ️ Page ${page} - Empty page, stopping pagination`);
          break;
        }

        allCards.push(...data);
        page++;

        // Delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.error(`[ProperfyCardsSync] ❌ Request timeout on page ${page}`);
        } else {
          console.error(`[ProperfyCardsSync] ❌ Error fetching page ${page}:`, error);
        }
        break;
      }
    }

    console.log(`[ProperfyCardsSync] ===== FETCHED ${allCards.length} CARDS =====`);
    return allCards;
  } catch (error) {
    console.error("[ProperfyCardsSync] Fatal error in fetchCardsFromAPI:", error);
    return [];
  }
}

export async function syncProperfyCards() {
  console.log("[ProperfyCardsSync] ===== SYNC START =====");
  
  const db = await getDb();
  if (!db) {
    console.error("[ProperfyCardsSync] ❌ Database not available");
    return { total: 0, inserted: 0, updated: 0, errors: 0 };
  }

  try {
    // Buscar cards da API
    const cards = await fetchCardsFromAPI();

    if (!cards || cards.length === 0) {
      console.warn("[ProperfyCardsSync] ⚠️  No cards fetched from API!");
      console.log("[ProperfyCardsSync] ===== SYNC END (NO DATA) =====");
      return { total: 0, inserted: 0, updated: 0, errors: 0 };
    }

    console.log(`[ProperfyCardsSync] Processing ${cards.length} cards...`);

    // Filtrar apenas os pipelines que nos interessam
    const relevantCards = cards.filter(card => 
      Object.values(PIPELINE_IDS).includes(card.fkPipeline)
    );

    console.log(`[ProperfyCardsSync] Filtered to ${relevantCards.length} cards in relevant pipelines`);

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const card of relevantCards) {
      try {
        const cardId = `card_${card.id}`;
        
        // Verificar se o card já existe
        const existing = await db
          .select()
          .from(properfyCards)
          .where(eq(properfyCards.id, cardId))
          .limit(1);

        const cardData: InsertProperfyCard = {
          id: cardId,
          pipelineId: card.fkPipeline,
          pipelineName: getPipelineName(card.fkPipeline),
          timelineId: card.fkTimeline,
          timelineName: card.chrTitle || null,
          leadId: `lead_${card.fkLead}`,
          leadName: card.chrTitle || null,
          userId: card.fkUser,
          propertyRef: card.chrPropertyRef || null,
          propertyTitle: card.chrTitle || null,
          cardType: card.chrType || null,
          createdAt: card.dttRegistered ? new Date(card.dttRegistered) : new Date(),
          updatedAt: card.dttUpdated ? new Date(card.dttUpdated) : new Date(),
        };

        if (existing.length > 0) {
          // Atualizar card existente
          await db
            .update(properfyCards)
            .set(cardData)
            .where(eq(properfyCards.id, cardId));
          updated++;
        } else {
          // Inserir novo card
          await db.insert(properfyCards).values(cardData);
          inserted++;
        }
      } catch (error) {
        console.error(`[ProperfyCardsSync] ❌ Error processing card ${card.id}:`, error);
        errors++;
      }
    }

    console.log(`[ProperfyCardsSync] ✅ Sync completed: Inserted=${inserted}, Updated=${updated}, Errors=${errors}`);
    console.log("[ProperfyCardsSync] ===== SYNC END =====");

    return {
      total: cards.length,
      inserted,
      updated,
      errors,
    };
  } catch (error) {
    console.error("[ProperfyCardsSync] ❌ Fatal error in syncProperfyCards:", error);
    return { total: 0, inserted: 0, updated: 0, errors: 1 };
  }
}

function getPipelineName(pipelineId: number): string {
  const names: Record<number, string> = {
    [PIPELINE_IDS.VENDAS_LANCAMENTOS]: "VENDAS LANÇAMENTOS",
    [PIPELINE_IDS.VENDAS_PRONTOS]: "VENDAS PRONTOS",
    [PIPELINE_IDS.ANGARIACAO_VENDAS]: "ANGARIAÇÃO DE VENDAS",
    [PIPELINE_IDS.LEADS_FOR_YOU]: "LEADS FOR YOU",
  };
  return names[pipelineId] || `Pipeline ${pipelineId}`;
}
