import { getDb } from "../db";
import { properfyProperties } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

/**
 * Carteira de Divulgação (em número)
 * Contagem de imóveis ativos para venda
 * Filtro: chrTransactionType = 'sale' AND chrStatus = 'LISTED' AND isActive = 1
 * NOTA: Apenas imóveis para VENDA, nunca locação
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

    // Validar datas
    if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
      console.warn("[calculateActivePropertiesCount] Invalid dates", { startDate, endDate });
      return 0;
    }

    // Contar imóveis para VENDA com status LISTED e isActive = 1
    const conditions = [
      eq(properfyProperties.chrTransactionType, "sale"),
      eq(properfyProperties.chrStatus, "LISTED"),
      eq(properfyProperties.isActive, 1)
    ];
    
    // Sem filtro de companyId - Properfy puxa dados apenas da Baggio

    const result = await db
      .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
      .from(properfyProperties)
      .where(and(...conditions));

    const count = result[0]?.count || 0;
    return typeof count === 'number' ? count : parseInt(String(count), 10) || 0;
  } catch (error) {
    console.error("[calculateActivePropertiesCount] Error:", error);
    return 0;
  }
}

/**
 * Angariações mês
 * Contagem de imóveis para VENDA com dteNewListing dentro do mês corrente
 * Filtro: chrTransactionType = 'sale' AND dteNewListing >= startDate AND dteNewListing <= endDate
 * NOTA: Apenas imóveis para VENDA, nunca locação. Usa dteNewListing para data real de angariação
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

    // Validar datas
    if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
      console.warn("[calculateAngariationsCount] Invalid dates", { startDate, endDate });
      return 0;
    }

    // Contar imóveis para VENDA com dteNewListing dentro do período
    const conditions = [
      eq(properfyProperties.chrTransactionType, "sale"),
      sql`${properfyProperties.dteNewListing} IS NOT NULL`,
      sql`${properfyProperties.dteNewListing} >= ${startDate} AND ${properfyProperties.dteNewListing} <= ${endDate}`
    ];
    
    // Sem filtro de companyId - Properfy puxa dados apenas da Baggio

    const result = await db
      .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
      .from(properfyProperties)
      .where(and(...conditions));

    const count = result[0]?.count || 0;
    return typeof count === 'number' ? count : parseInt(String(count), 10) || 0;
  } catch (error) {
    console.error("[calculateAngariationsCount] Error:", error);
    return 0;
  }
}

/**
 * Baixas no mês (em quantidade)
 * Contagem de imóveis anunciados para VENDA que saíram da carteira durante o período
 * Filtra por: chrTransactionType='sale' E chrStatus IN ('REMOVED', 'RENTED', 'IN_TERMINATION')
 * E dteTermination entre startDate e endDate
 * NOTA: Se dteTermination estiver vazio, usa updatedAt como fallback
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

    // Validar datas
    if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
      console.warn("[calculateRemovedPropertiesCount] Invalid dates", { startDate, endDate });
      return 0;
    }

    // Contar imóveis anunciados para VENDA que saíram da carteira no período específico
    const conditions = [
      eq(properfyProperties.chrTransactionType, "sale"), // Apenas imóveis para venda
      sql`${properfyProperties.chrStatus} IN ('REMOVED', 'RENTED', 'IN_TERMINATION')`,
      // Filtrar por período: se dteTermination existe, usar; senão usar updatedAt
      sql`(
        (${properfyProperties.dteTermination} IS NOT NULL AND ${properfyProperties.dteTermination} >= ${startDate} AND ${properfyProperties.dteTermination} <= ${endDate})
        OR
        (${properfyProperties.dteTermination} IS NULL AND ${properfyProperties.updatedAt} >= ${startDate} AND ${properfyProperties.updatedAt} <= ${endDate})
      )`
    ];
    
    // Sem filtro de companyId - Properfy puxa dados apenas da Baggio

    const result = await db
      .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
      .from(properfyProperties)
      .where(and(...conditions));

    const count = result[0]?.count || 0;
    return typeof count === 'number' ? count : parseInt(String(count), 10) || 0;
  } catch (error) {
    console.error("[calculateRemovedPropertiesCount] Error:", error);
    return 0;
  }
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
  try {
    // Validar inputs
    if (typeof salesCountMonth !== 'number' || typeof previousMonthActiveProperties !== 'number') {
      console.warn("[calculateVSO] Invalid inputs", { salesCountMonth, previousMonthActiveProperties });
      return 0;
    }

    // Se não há carteira anterior, VSO é 0
    if (previousMonthActiveProperties === 0) {
      return 0;
    }

    // Se não há vendas, VSO é 0
    if (salesCountMonth === 0) {
      return 0;
    }

    const vso = salesCountMonth / previousMonthActiveProperties;
    return typeof vso === 'number' && !isNaN(vso) ? vso : 0;
  } catch (error) {
    console.error("[calculateVSO] Error:", error);
    return 0;
  }
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
  try {
    // Validar datas
    if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
      console.warn("[calculateReadyAttendances] Invalid dates", { startDate, endDate });
      return 0;
    }

    const { calculateReadyAttendances: calculateReady } = await import(
      "./properfyLeadsSync"
    );
    const result = await calculateReady(startDate, endDate);
    return typeof result === 'number' && !isNaN(result) ? result : 0;
  } catch (error) {
    console.error("[calculateReadyAttendances] Error:", error);
    return 0;
  }
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
  try {
    // Validar datas
    if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
      console.warn("[calculateLaunchAttendances] Invalid dates", { startDate, endDate });
      return 0;
    }

    const { calculateLaunchAttendances: calculateLaunch } = await import(
      "./properfyLeadsSync"
    );
    const result = await calculateLaunch(startDate, endDate);
    return typeof result === 'number' && !isNaN(result) ? result : 0;
  } catch (error) {
    console.error("[calculateLaunchAttendances] Error:", error);
    return 0;
  }
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
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[calculateAverageSaleTime] Database not available");
      return 0;
    }

    // Validar inputs
    if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
      console.warn("[calculateAverageSaleTime] Invalid dates", { startDate, endDate });
      return 0;
    }

    if (!companyId || typeof companyId !== 'string') {
      console.warn("[calculateAverageSaleTime] Invalid companyId", { companyId });
      return 0;
    }

    // Calcular dias entre dteNewListing (Properfy) e saleDate (Delmack)
    // Usa propertiesCache.delmackPropertyId para conectar com sales.propertyId
    const { sales } = await import("../../drizzle/schema");
    
    const result = await db.execute(sql`
      SELECT AVG(DATEDIFF(s.saleDate, COALESCE(pc.dteNewListing, pc.createdAt))) as avgDays
      FROM sales s
      INNER JOIN propertiesCache pc ON s.propertyId = pc.delmackPropertyId
      WHERE pc.companyId = ${companyId}
        AND s.saleDate >= ${startDate}
        AND s.saleDate <= ${endDate}
        AND s.status = 'commission_paid'
        AND COALESCE(pc.dteNewListing, pc.createdAt) IS NOT NULL
    `);

    const avgDays = (result as any)?.[0]?.avgDays || 0;
    const rounded = Math.round(avgDays);
    return typeof rounded === 'number' && !isNaN(rounded) ? rounded : 0;
  } catch (error) {
    console.error("[calculateAverageSaleTime] Error:", error);
    return 0;
  }
}
