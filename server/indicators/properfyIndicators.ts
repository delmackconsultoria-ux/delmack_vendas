import { getDb } from "../db";
import { properfyProperties, properfyLeads, properfyCards } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

/**
 * Carteira de Divulgação (em número)
 * Contagem de imóveis ativos para venda
 * Filtro: chrTransactionType = 'SALE' AND chrStatus = 'LISTED' AND isActive = 1
 * Usa dados locais do banco de dados (sincronizados via properfySyncService)
 */
export async function calculateActivePropertiesCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[calculateActivePropertiesCount] Database not available");
      return 0;
    }

    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(properfyProperties)
      .where(
        and(
          eq(properfyProperties.chrTransactionType, "SALE"),
          eq(properfyProperties.chrStatus, "LISTED"),
          eq(properfyProperties.isActive, 1)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[calculateActivePropertiesCount] Error:", error);
    return 0;
  }
}

/**
 * Angariações mês
 * Contagem de imóveis para VENDA com dteNewListing dentro do mês corrente
 * Filtro: chrTransactionType = 'SALE' AND dteNewListing >= startDate AND dteNewListing <= endDate
 * Usa dados locais do banco de dados
 */
export async function calculateAngariationsCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[calculateAngariationsCount] Database not available");
      return 0;
    }

    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(properfyProperties)
      .where(
        and(
          eq(properfyProperties.chrTransactionType, "SALE"),
          isNotNull(properfyProperties.dteNewListing),
          gte(properfyProperties.dteNewListing, startDate),
          lte(properfyProperties.dteNewListing, endDate)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[calculateAngariationsCount] Error:", error);
    return 0;
  }
}

/**
 * Baixas no mês
 * Contagem de imóveis para VENDA com baixa durante o mês
 * Filtro: chrTransactionType = 'SALE' AND dteTermination dentro do período
 * Usa dados locais do banco de dados
 */
export async function calculateRemovedPropertiesCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[calculateRemovedPropertiesCount] Database not available");
      return 0;
    }

    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(properfyProperties)
      .where(
        and(
          eq(properfyProperties.chrTransactionType, "SALE"),
          isNotNull(properfyProperties.dteTermination),
          gte(properfyProperties.dteTermination, startDate),
          lte(properfyProperties.dteTermination, endDate)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[calculateRemovedPropertiesCount] Error:", error);
    return 0;
  }
}

/**
 * VSO - venda/oferta
 * Calcula percentual de vendas vs ofertas
 * Fórmula: (Negócios / Carteira de Divulgação) * 100
 * Usa dados locais do banco de dados
 */
export async function calculateVSO(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[calculateVSO] Database not available");
      return 0;
    }

    // Contar vendas (chrStatus = 'REMOVED')
    const vendasResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(properfyProperties)
      .where(
        and(
          eq(properfyProperties.chrTransactionType, "SALE"),
          eq(properfyProperties.chrStatus, "REMOVED")
        )
      );

    const vendas = vendasResult[0]?.count || 0;

    // Contar carteira ativa
    const carteiraResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(properfyProperties)
      .where(
        and(
          eq(properfyProperties.chrTransactionType, "SALE"),
          eq(properfyProperties.chrStatus, "LISTED")
        )
      );

    const carteira = carteiraResult[0]?.count || 0;

    if (carteira === 0) return 0;
    return (vendas / carteira) * 100;
  } catch (error) {
    console.error("[calculateVSO] Error:", error);
    return 0;
  }
}



/**
 * Atendimentos Prontos
 * Soma dos leads nos pipelines: VENDAS PRONTOS + ANGARIACAO DE VENDAS + LEADS FOR YOU
 */
export async function calculateReadyAttendancesFromCards(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[calculateReadyAttendances] Database not available");
      return 0;
    }

    const READY_PIPELINES = [21, 24, 49];
    const result = await db
      .select({ count: sql<number>`COUNT(DISTINCT id)` })
      .from(properfyCards)
      .where(
        and(
          sql`${properfyCards.pipelineId} IN (${sql.raw(READY_PIPELINES.join(","))})`,
          gte(properfyCards.createdAt, startDate),
          lte(properfyCards.createdAt, endDate)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[calculateReadyAttendances] Error:", error);
    return 0;
  }
}

/**
 * Atendimentos Lancamentos
 * Conta os leads no pipeline: VENDAS LANCAMENTOS
 */
export async function calculateLaunchAttendancesFromCards(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[calculateLaunchAttendancesFromCards] Database not available");
      return 0;
    }

    const LAUNCH_PIPELINE = 20;
    const result = await db
      .select({ count: sql<number>`COUNT(DISTINCT id)` })
      .from(properfyCards)
      .where(
        and(
          eq(properfyCards.pipelineId, LAUNCH_PIPELINE),
          gte(properfyCards.createdAt, startDate),
          lte(properfyCards.createdAt, endDate)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[calculateLaunchAttendancesFromCards] Error:", error);
    return 0;
  }
}

/**
 * Tempo médio de venda (angariação X venda)
 * Calcula tempo médio entre angariação e venda
 * Usa dados locais do banco de dados
 */
export async function calculateAverageSaleTime(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[calculateAverageSaleTime] Database not available");
      return 0;
    }

    // Buscar imóveis vendidos (chrStatus = 'REMOVED') com ambas as datas
    const properties = await db
      .select()
      .from(properfyProperties)
      .where(
        and(
          eq(properfyProperties.chrTransactionType, "SALE"),
          eq(properfyProperties.chrStatus, "REMOVED"),
          isNotNull(properfyProperties.dteNewListing),
          isNotNull(properfyProperties.dteTermination)
        )
      );

    if (properties.length === 0) return 0;

    // Calcular tempo médio em dias
    const tempos = properties.map((p) => {
      const inicio = new Date(p.dteNewListing!);
      const fim = new Date(p.dteTermination!);
      const dias = Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      return dias;
    });

    const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    return Math.round(media);
  } catch (error) {
    console.error("[calculateAverageSaleTime] Error:", error);
    return 0;
  }
}
