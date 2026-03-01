import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { sales, properfyProperties } from "../drizzle/schema";

/**
 * Calcula o VGV (Valor Geral de Vendas) mensal
 * Soma de salePrice de todas as vendas aprovadas no mês
 */
export async function calculateMonthlyVGV(
  companyId: string,
  month: number,
  year: number
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const result = await db
    .select({
      total: sql<string>`SUM(${sales.saleValue})`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        sql`${sales.status} IN ('sale', 'commission_paid')`,
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );
  
  console.log('[Dashboard] VGV calculado:', result[0]?.total, 'para', companyId, month, year);

  return Number(result[0]?.total || 0);
}

/**
 * Calcula a quantidade de vendas no mês
 * Conta vendas aprovadas no mês
 */
export async function calculateMonthlySalesCount(
  companyId: string,
  month: number,
  year: number
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const result = await db
    .select({
      count: sql<string>`COUNT(*)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        sql`${sales.status} IN ('sale', 'commission_paid')`,
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );
  
  console.log('[Dashboard] Sales count:', result[0]?.count, 'para', companyId, month, year);

  return Number(result[0]?.count || 0);
}

/**
 * Calcula o ticket médio mensal
 * VGV / Quantidade de vendas
 */
export async function calculateMonthlyAverageTicket(
  companyId: string,
  month: number,
  year: number
): Promise<number> {
  const vgv = await calculateMonthlyVGV(companyId, month, year);
  const count = await calculateMonthlySalesCount(companyId, month, year);

  if (count === 0) return 0;
  return vgv / count;
}

/**
 * Calcula o valor de comissões recebidas no mês
 * Soma de commissionAmountReceived de vendas com status 'paid'
 */
/**
 * Calcula a carteira ativa de imóveis do Properfy
 * Conta imóveis com status LISTED e isActive = 1
 */
export async function calculateActivePortfolio(
  companyId: string
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({
      count: sql<string>`COUNT(*)`,
    })
    .from(properfyProperties)
    .where(
      sql`${properfyProperties.chrStatus} = 'LISTED' AND ${properfyProperties.isActive} = 1`
    );

  const count = Number(result[0]?.count || 0);
  console.log('[Dashboard] Active portfolio:', count);
  return count;
}

export async function calculateReceivedCommissions(
  companyId: string,
  month: number,
  year: number
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const result = await db
    .select({
      total: sql<string>`SUM(${sales.totalCommission})`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        sql`${sales.status} = 'commission_paid'`,
        gte(sales.registeredAt, startDate),
        lte(sales.registeredAt, endDate)
      )
    );
  
  console.log('[Dashboard] Received commissions:', result[0]?.total, 'para', companyId, month, year);

  return Number(result[0]?.total || 0);
}
