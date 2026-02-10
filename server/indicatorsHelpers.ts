import { eq, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { sales, historicalSales } from "../drizzle/schema";

/**
 * Helpers para calcular indicadores de vendas
 * Baseado nas fórmulas do Excel fornecido
 */

interface IndicatorFilters {
  month?: number; // 1-12
  year?: number;
  brokerId?: string;
  companyId: string;
}

/**
 * 1. Negócios no mês (valor total de vendas)
 */
export async function calculateMonthlyRevenue(filters: IndicatorFilters): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { month, year, brokerId, companyId } = filters;

  // Construir condições para vendas atuais
  const currentConditions = [eq(sales.companyId, companyId)];
  if (month && year) {
    currentConditions.push(sql`MONTH(${sales.saleDate}) = ${month}`);
    currentConditions.push(sql`YEAR(${sales.saleDate}) = ${year}`);
  }
  if (brokerId) {
    currentConditions.push(
      sql`(${sales.brokerAngariador} = ${brokerId} OR ${sales.brokerVendedor} = ${brokerId})`
    );
  }

  // Construir condições para vendas históricas
  const historicalConditions = [eq(historicalSales.companyId, companyId)];
  if (month && year) {
    historicalConditions.push(sql`MONTH(${historicalSales.saleDate}) = ${month}`);
    historicalConditions.push(sql`YEAR(${historicalSales.saleDate}) = ${year}`);
  }
  if (brokerId) {
    historicalConditions.push(
      sql`(${historicalSales.acquisitionBrokerName} LIKE CONCAT('%', ${brokerId}, '%') OR ${historicalSales.saleBrokerName} LIKE CONCAT('%', ${brokerId}, '%'))`
    );
  }

  const [currentResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${sales.saleValue}), 0)` })
    .from(sales)
    .where(and(...currentConditions));

  const [historicalResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${historicalSales.salePrice}), 0)` })
    .from(historicalSales)
    .where(and(...historicalConditions));

  const currentTotal = Number(currentResult?.total || 0);
  const historicalTotal = Number(historicalResult?.total || 0);

  return currentTotal + historicalTotal;
}

/**
 * 2. Negócios no mês (unidades)
 */
export async function calculateMonthlyUnits(filters: IndicatorFilters): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { month, year, brokerId, companyId } = filters;

  // Construir condições para vendas atuais
  const currentConditions = [eq(sales.companyId, companyId)];
  if (month && year) {
    currentConditions.push(sql`MONTH(${sales.saleDate}) = ${month}`);
    currentConditions.push(sql`YEAR(${sales.saleDate}) = ${year}`);
  }
  if (brokerId) {
    currentConditions.push(
      sql`(${sales.brokerAngariador} = ${brokerId} OR ${sales.brokerVendedor} = ${brokerId})`
    );
  }

  // Construir condições para vendas históricas
  const historicalConditions = [eq(historicalSales.companyId, companyId)];
  if (month && year) {
    historicalConditions.push(sql`MONTH(${historicalSales.saleDate}) = ${month}`);
    historicalConditions.push(sql`YEAR(${historicalSales.saleDate}) = ${year}`);
  }
  if (brokerId) {
    historicalConditions.push(
      sql`(${historicalSales.acquisitionBrokerName} LIKE CONCAT('%', ${brokerId}, '%') OR ${historicalSales.saleBrokerName} LIKE CONCAT('%', ${brokerId}, '%'))`
    );
  }

  const [currentCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sales)
    .where(and(...currentConditions));

  const [historicalCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(historicalSales)
    .where(and(...historicalConditions));

  return Number(currentCount?.count || 0) + Number(historicalCount?.count || 0);
}

/**
 * 3. Vendas Canceladas (valor)
 */
export async function calculateCancelledSales(filters: IndicatorFilters): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { month, year, brokerId, companyId } = filters;

  const conditions = [
    eq(sales.companyId, companyId),
    eq(sales.status, "cancelled")
  ];

  if (month && year) {
    conditions.push(sql`MONTH(${sales.saleDate}) = ${month}`);
    conditions.push(sql`YEAR(${sales.saleDate}) = ${year}`);
  }

  if (brokerId) {
    conditions.push(
      sql`(${sales.brokerAngariador} = ${brokerId} OR ${sales.brokerVendedor} = ${brokerId})`
    );
  }

  const [result] = await db
    .select({ total: sql<number>`COALESCE(SUM(${sales.saleValue}), 0)` })
    .from(sales)
    .where(and(...conditions));

  return Number(result?.total || 0);
}

/**
 * 4. Comissão Recebida (commission_paid)
 */
export async function calculateCommissionReceived(filters: IndicatorFilters): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { month, year, brokerId, companyId } = filters;

  // Vendas atuais com comissão paga
  const currentConditions = [
    eq(sales.companyId, companyId),
    eq(sales.status, "commission_paid")
  ];

  if (month && year) {
    currentConditions.push(sql`MONTH(${sales.saleDate}) = ${month}`);
    currentConditions.push(sql`YEAR(${sales.saleDate}) = ${year}`);
  }

  if (brokerId) {
    currentConditions.push(
      sql`(${sales.brokerAngariador} = ${brokerId} OR ${sales.brokerVendedor} = ${brokerId})`
    );
  }

  // Vendas históricas (todas são commission_paid)
  const historicalConditions = [eq(historicalSales.companyId, companyId)];

  if (month && year) {
    historicalConditions.push(sql`MONTH(${historicalSales.saleDate}) = ${month}`);
    historicalConditions.push(sql`YEAR(${historicalSales.saleDate}) = ${year}`);
  }

  if (brokerId) {
    historicalConditions.push(
      sql`(${historicalSales.acquisitionBrokerName} LIKE CONCAT('%', ${brokerId}, '%') OR ${historicalSales.saleBrokerName} LIKE CONCAT('%', ${brokerId}, '%'))`
    );
  }

  const [currentResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${sales.totalCommission}), 0)` })
    .from(sales)
    .where(and(...currentConditions));

  const [historicalResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${historicalSales.commissionAmount}), 0)` })
    .from(historicalSales)
    .where(and(...historicalConditions));

  return Number(currentResult?.total || 0) + Number(historicalResult?.total || 0);
}

/**
 * 5. Comissão Vendida (todas as vendas exceto canceladas)
 */
export async function calculateCommissionSold(filters: IndicatorFilters): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { month, year, brokerId, companyId } = filters;

  const currentConditions = [
    eq(sales.companyId, companyId),
    sql`${sales.status} != 'cancelled'`
  ];

  if (month && year) {
    currentConditions.push(sql`MONTH(${sales.saleDate}) = ${month}`);
    currentConditions.push(sql`YEAR(${sales.saleDate}) = ${year}`);
  }

  if (brokerId) {
    currentConditions.push(
      sql`(${sales.brokerAngariador} = ${brokerId} OR ${sales.brokerVendedor} = ${brokerId})`
    );
  }

  // Vendas históricas
  const historicalConditions = [eq(historicalSales.companyId, companyId)];

  if (month && year) {
    historicalConditions.push(sql`MONTH(${historicalSales.saleDate}) = ${month}`);
    historicalConditions.push(sql`YEAR(${historicalSales.saleDate}) = ${year}`);
  }

  if (brokerId) {
    historicalConditions.push(
      sql`(${historicalSales.acquisitionBrokerName} LIKE CONCAT('%', ${brokerId}, '%') OR ${historicalSales.saleBrokerName} LIKE CONCAT('%', ${brokerId}, '%'))`
    );
  }

  const [currentResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${sales.totalCommission}), 0)` })
    .from(sales)
    .where(and(...currentConditions));

  const [historicalResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${historicalSales.commissionAmount}), 0)` })
    .from(historicalSales)
    .where(and(...historicalConditions));

  return Number(currentResult?.total || 0) + Number(historicalResult?.total || 0);
}

/**
 * 6. Comissão Pendente (vendas não pagas)
 */
export async function calculateCommissionPending(filters: IndicatorFilters): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { month, year, brokerId, companyId } = filters;

  const conditions = [
    eq(sales.companyId, companyId),
    sql`${sales.status} IN ('sale', 'manager_review', 'finance_review')`
  ];

  if (month && year) {
    conditions.push(sql`MONTH(${sales.saleDate}) = ${month}`);
    conditions.push(sql`YEAR(${sales.saleDate}) = ${year}`);
  }

  if (brokerId) {
    conditions.push(
      sql`(${sales.brokerAngariador} = ${brokerId} OR ${sales.brokerVendedor} = ${brokerId})`
    );
  }

  const [result] = await db
    .select({ total: sql<number>`COALESCE(SUM(${sales.totalCommission}), 0)` })
    .from(sales)
    .where(and(...conditions));

  return Number(result?.total || 0);
}

/**
 * 7. Tempo médio de venda (dias entre angariação e venda)
 */
export async function calculateAverageSaleTime(filters: IndicatorFilters): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { month, year, companyId } = filters;

  const conditions = [
    eq(historicalSales.companyId, companyId),
    sql`${historicalSales.saleDate} IS NOT NULL`,
    sql`${historicalSales.acquisitionDate} IS NOT NULL`
  ];

  if (month && year) {
    conditions.push(sql`MONTH(${historicalSales.saleDate}) = ${month}`);
    conditions.push(sql`YEAR(${historicalSales.saleDate}) = ${year}`);
  }

  const [result] = await db
    .select({
      avgDays: sql<number>`AVG(DATEDIFF(${historicalSales.saleDate}, ${historicalSales.acquisitionDate}))`
    })
    .from(historicalSales)
    .where(and(...conditions));

  return Math.round(Number(result?.avgDays || 0));
}

/**
 * 8. Valor médio do imóvel
 */
export async function calculateAveragePropertyValue(filters: IndicatorFilters): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { month, year, companyId } = filters;

  // Vendas atuais
  const currentConditions = [eq(sales.companyId, companyId)];
  if (month && year) {
    currentConditions.push(sql`MONTH(${sales.saleDate}) = ${month}`);
    currentConditions.push(sql`YEAR(${sales.saleDate}) = ${year}`);
  }

  // Vendas históricas
  const historicalConditions = [eq(historicalSales.companyId, companyId)];
  if (month && year) {
    historicalConditions.push(sql`MONTH(${historicalSales.saleDate}) = ${month}`);
    historicalConditions.push(sql`YEAR(${historicalSales.saleDate}) = ${year}`);
  }

  const [currentResult] = await db
    .select({ avg: sql<number>`AVG(${sales.saleValue})` })
    .from(sales)
    .where(and(...currentConditions));

  const [historicalResult] = await db
    .select({ avg: sql<number>`AVG(${historicalSales.salePrice})` })
    .from(historicalSales)
    .where(and(...historicalConditions));

  // Média ponderada
  const currentAvg = currentResult?.avg || 0;
  const historicalAvg = historicalResult?.avg || 0;

  return currentAvg > 0 && historicalAvg > 0 
    ? (currentAvg + historicalAvg) / 2 
    : currentAvg || historicalAvg;
}

/**
 * 9. Percentual de comissão média
 */
export async function calculateAverageCommissionPercent(filters: IndicatorFilters): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { month, year, companyId } = filters;

  const conditions = [eq(historicalSales.companyId, companyId)];
  if (month && year) {
    conditions.push(sql`MONTH(${historicalSales.saleDate}) = ${month}`);
    conditions.push(sql`YEAR(${historicalSales.saleDate}) = ${year}`);
  }

  const [result] = await db
    .select({ avg: sql<number>`AVG(${historicalSales.commissionPercentage})` })
    .from(historicalSales)
    .where(and(...conditions));

  return Number(result?.avg || 0);
}

/**
 * 10. Negócios por tipo (Prontos vs Lançamentos)
 */
export async function calculateSalesByType(filters: IndicatorFilters): Promise<{ prontos: number; lancamentos: number }> {
  const db = await getDb();
  if (!db) return { prontos: 0, lancamentos: 0 };

  const { month, year, companyId } = filters;

  const conditions = [eq(historicalSales.companyId, companyId)];
  if (month && year) {
    conditions.push(sql`MONTH(${historicalSales.saleDate}) = ${month}`);
    conditions.push(sql`YEAR(${historicalSales.saleDate}) = ${year}`);
  }

  const results = await db
    .select({
      businessType: historicalSales.businessType,
      count: sql<number>`COUNT(*)`
    })
    .from(historicalSales)
    .where(and(...conditions))
    .groupBy(historicalSales.businessType);

  const prontos = Number(results.find(r => r.businessType?.toLowerCase().includes("pronto"))?.count || 0);
  const lancamentos = Number(results.find(r => r.businessType?.toLowerCase().includes("lançamento"))?.count || 0);

  return { prontos, lancamentos };
}

/**
 * Função auxiliar para calcular todos os indicadores de uma vez
 */
export async function calculateAllIndicators(filters: IndicatorFilters) {
  const [
    monthlyRevenue,
    monthlyUnits,
    cancelledSales,
    commissionReceived,
    commissionSold,
    commissionPending,
    avgSaleTime,
    avgPropertyValue,
    avgCommissionPercent,
    salesByType,
  ] = await Promise.all([
    calculateMonthlyRevenue(filters),
    calculateMonthlyUnits(filters),
    calculateCancelledSales(filters),
    calculateCommissionReceived(filters),
    calculateCommissionSold(filters),
    calculateCommissionPending(filters),
    calculateAverageSaleTime(filters),
    calculateAveragePropertyValue(filters),
    calculateAverageCommissionPercent(filters),
    calculateSalesByType(filters),
  ]);

  return {
    monthlyRevenue,
    monthlyUnits,
    cancelledSales,
    commissionReceived,
    commissionSold,
    commissionPending,
    avgSaleTime,
    avgPropertyValue,
    avgCommissionPercent,
    salesByType,
  };
}
