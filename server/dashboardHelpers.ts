import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { sales } from "../drizzle/schema";

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
        sql`${sales.status} = 'approved'`,
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

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
        sql`${sales.status} = 'approved'`,
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

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
      total: sql<string>`SUM(${sales.commissionAmountReceived})`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        sql`${sales.status} = 'paid'`,
        gte(sales.commissionPaymentDate, startDate),
        lte(sales.commissionPaymentDate, endDate)
      )
    );

  return Number(result[0]?.total || 0);
}
