import { getDb } from "../db";
import { properfyProperties, properfyLeads, properfyCards } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

/**
 * Carteira de Divulgação (em número)
 * Contagem de imóveis ativos para venda no momento atual.
 * Retorna o valor real apenas para o mês corrente.
 * Para meses anteriores, retorna 0 (dados históricos devem ser inseridos manualmente).
 * Filtro: chrTransactionType = 'SALE' AND chrStatus = 'LISTED' AND isActive = 1
 */
export async function calculateActivePropertiesCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    // Verificar se o período solicitado é o mês atual
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const requestedYear = startDate.getFullYear();
    const requestedMonth = startDate.getMonth() + 1;

    // Para meses anteriores ao atual, retornar 0
    // Os dados históricos devem ser inseridos manualmente via "Incluir dados manuais"
    if (requestedYear < currentYear || (requestedYear === currentYear && requestedMonth < currentMonth)) {
      return 0;
    }

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

    // Contar vendas DO MÊS (chrStatus = 'REMOVED' dentro do período)
    const vendasResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(properfyProperties)
      .where(
        and(
          eq(properfyProperties.chrTransactionType, "SALE"),
          eq(properfyProperties.chrStatus, "REMOVED"),
          gte(properfyProperties.dteTermination, startDate),
          lte(properfyProperties.dteTermination, endDate)
        )
      );

    const vendas = vendasResult[0]?.count || 0;

    // Contar carteira ATIVA no mês anterior
    // Propriedades que estavam LISTED no final do mês anterior
    const prevMonthEnd = new Date(startDate);
    prevMonthEnd.setDate(0); // Último dia do mês anterior
    const prevMonthStart = new Date(prevMonthEnd);
    prevMonthStart.setDate(1); // Primeiro dia do mês anterior

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
    return vendas / carteira;
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
          isNotNull(properfyProperti