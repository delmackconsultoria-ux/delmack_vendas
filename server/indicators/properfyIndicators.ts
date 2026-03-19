import { getDb } from "../db";
import { properfyProperties } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

/**
 * Carteira de Divulgação (em número)
 * Contagem de imóveis ativos para venda
 * Filtro: chrStatus = 'LISTED' AND isActive = 1
 */
export async function calculateActivePropertiesCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
    .from(properfyProperties)
    .where(
      and(
        eq(properfyProperties.chrStatus, "LISTED"),
        eq(properfyProperties.isActive, 1)
      )
    );

  return result[0]?.count || 0;
}

/**
 * Angariações mês
 * Contagem de imóveis com data de angariação no mês
 * Campo: dteNewListing
 */
export async function calculateAngariationsCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
    .from(properfyProperties)
    .where(
      and(
        isNotNull(properfyProperties.dteNewListing),
        gte(properfyProperties.dteNewListing, startDate),
        lte(properfyProperties.dteNewListing, endDate)
      )
    );

  return result[0]?.count || 0;
}

/**
 * Baixas no mês (em quantidade)
 * Contagem de imóveis que saíram da carteira no mês
 * Campo: dteTermination (Data de Baixa)
 */
export async function calculateRemovedPropertiesCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
    .from(properfyProperties)
    .where(
      and(
        isNotNull(properfyProperties.dteTermination),
        gte(properfyProperties.dteTermination, startDate),
        lte(properfyProperties.dteTermination, endDate)
      )
    );

  return result[0]?.count || 0;
}

/**
 * VSO — venda / oferta
 * Vendas do mês (unidades) ÷ carteira de imóveis ativos do mês anterior
 * Retorna como decimal (ex: 0.034 para 3,4%)
 * Requer dados do Sistema de Vendas + Properfy
 */
export async function calculateVSO(
  salesCountMonth: number,
  previousMonthActiveProperties: number
): Promise<number> {
  if (previousMonthActiveProperties === 0) return 0;
  return salesCountMonth / previousMonthActiveProperties;
}

/**
 * Número de atendimentos Prontos
 * Contagem de leads vinculados a imóveis prontos no mês
 * Importado de properfyLeadsSync.ts
 */
export async function calculateReadyAttendances(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { calculateReadyAttendances: calculateReady } = await import(
    "./properfyLeadsSync"
  );
  return calculateReady(startDate, endDate);
}

/**
 * Número de atendimentos Lançamentos
 * Contagem de leads vinculados a lançamentos no mês
 * Importado de properfyLeadsSync.ts
 */
export async function calculateLaunchAttendances(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { calculateLaunchAttendances: calculateLaunch } = await import(
    "./properfyLeadsSync"
  );
  return calculateLaunch(startDate, endDate);
}


/**
 * Tempo medio de venda angariada X venda
 * Calcula dias entre data de angariacao (dteNewListing do Properfy) e data de venda (saleDate do Delmack)
 * Usa propertiesCache para conectar as duas tabelas
 */
export async function calculateAverageSaleTime(
  startDate: Date,
  endDate: Date,
  companyId: string
): Promise<number> {
  // TODO: Implementar JOIN correto quando houver campo de conexão entre propertiesCache e sales
  // Atualmente retorna 0 pois não há campo delmackPropertyId em propertiesCache
  return 0;
}