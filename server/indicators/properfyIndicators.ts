import { getDb } from "../db";
import { properfyProperties } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

/**
 * Carteira de Divulgação (em número)
 * Contagem de imóveis ativos para venda
 * Filtro: chrStatus = 'LISTED' AND isActive = 1 AND chrPurpose LIKE '%SALE%'
 */
export async function calculateActivePropertiesCount(
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
    .from(properfyProperties)
    .where(
      and(
        eq(properfyProperties.chrStatus, "LISTED"),
        eq(properfyProperties.isActive, 1),
        sql`${properfyProperties.chrPurpose} LIKE '%SALE%'`
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
  endDate: Date
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
  endDate: Date
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
 * Requer dados do Sistema de Vendas + Properfy
 */
export async function calculateVSO(
  salesCountMonth: number,
  previousMonthActiveProperties: number
): Promise<number> {
  if (previousMonthActiveProperties === 0) return 0;
  return (salesCountMonth / previousMonthActiveProperties) * 100;
}

/**
 * Número de atendimentos Prontos
 * Contagem de leads vinculados a imóveis prontos no mês
 * Nota: Requer integração com endpoint /api/crm/lead do Properfy
 * Por enquanto, retorna 0 até que leads sejam sincronizados
 */
export async function calculateReadyAttendances(): Promise<number> {
  // TODO: Implementar sincronização de leads do Properfy
  // Quando implementado, buscar leads com tipo = "prontos"
  return 0;
}

/**
 * Número de atendimentos Lançamentos
 * Contagem de leads vinculados a lançamentos no mês
 * Nota: Requer integração com endpoint /api/crm/lead do Properfy
 * Por enquanto, retorna 0 até que leads sejam sincronizados
 */
export async function calculateLaunchAttendances(): Promise<number> {
  // TODO: Implementar sincronização de leads do Properfy
  // Quando implementado, buscar leads com tipo = "lançamentos"
  return 0;
}
