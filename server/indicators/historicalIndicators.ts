import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getDb } from "../db";
import { historicalSales } from "../../drizzle/schema";

/**
 * Calcula o valor total de vendas para um período histórico
 */
export async function calculateHistoricalSalesValue(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({
      total: sql<string>`SUM(${historicalSales.salePrice})`,
    })
    .from(historicalSales)
    .where(
      and(
        eq(historicalSales.companyId, companyId),
        gte(historicalSales.saleDate, startDate),
        lte(historicalSales.saleDate, endDate)
      )
    );

  return Number(result[0]?.total || 0);
}

/**
 * Calcula a quantidade de vendas para um período histórico
 */
export async function calculateHistoricalSalesCount(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({
      count: sql<string>`COUNT(*)`,
    })
    .from(historicalSales)
    .where(
      and(
        eq(historicalSales.companyId, companyId),
        gte(historicalSales.saleDate, startDate),
        lte(historicalSales.saleDate, endDate)
      )
    );

  return Number(result[0]?.count || 0);
}

/**
 * Calcula o valor total de comissões para um período histórico
 */
export async function calculateHistoricalCommissions(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({
      total: sql<string>`SUM(${historicalSales.commissionAmount})`,
    })
    .from(historicalSales)
    .where(
      and(
        eq(historicalSales.companyId, companyId),
        gte(historicalSales.saleDate, startDate),
        lte(historicalSales.saleDate, endDate)
      )
    );

  return Number(result[0]?.total || 0);
}

/**
 * Calcula o valor médio do imóvel para um período histórico
 */
export async function calculateHistoricalAvgPropertyValue(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({
      avg: sql<string>`AVG(${historicalSales.salePrice})`,
    })
    .from(historicalSales)
    .where(
      and(
        eq(historicalSales.companyId, companyId),
        gte(historicalSales.saleDate, startDate),
        lte(historicalSales.saleDate, endDate)
      )
    );

  return Number(result[0]?.avg || 0);
}

/**
 * Calcula a quantidade de angariações para um período histórico
 */
export async function calculateHistoricalAngariations(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({
      count: sql<string>`COUNT(DISTINCT ${historicalSales.acquisitionBrokerName})`,
    })
    .from(historicalSales)
    .where(
      and(
        eq(historicalSales.companyId, companyId),
        gte(historicalSales.acquisitionDate, startDate),
        lte(historicalSales.acquisitionDate, endDate)
      )
    );

  return Number(result[0]?.count || 0);
}

/**
 * Calcula o percentual de comissão para um período histórico
 */
export async function calculateHistoricalCommissionPercent(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const totalCommission = await calculateHistoricalCommissions(companyId, startDate, endDate);
  const totalSales = await calculateHistoricalSalesValue(companyId, startDate, endDate);

  if (totalSales === 0) return 0;
  return (totalCommission / totalSales) * 100;
}
