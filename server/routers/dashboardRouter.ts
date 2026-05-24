import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  calculateActivePortfolio,
} from "../dashboardHelpers";
import * as properfyIndicators from "../indicators/properfyIndicators";
import { getDb } from "../db";
import { sales } from "../../drizzle/schema";
import { sql } from "drizzle-orm";

/**
 * Calcula KPIs anuais acumulados (ano corrente)
 */
async function calculateYearlyKPIs(companyId: string, year: number) {
  const db = await getDb();
  if (!db) return { vgv: 0, salesCount: 0, averageTicket: 0, receivedCommissions: 0 };

  const result = await db
    .select({
      vgv: sql<string>`SUM(CASE WHEN status NOT IN ('draft', 'cancelled') AND YEAR(saleDate) = ${year} AND YEAR(saleDate) > 1970 THEN saleValue ELSE 0 END)`,
      salesCount: sql<string>`COUNT(CASE WHEN status NOT IN ('draft', 'cancelled') AND YEAR(saleDate) = ${year} AND YEAR(saleDate) > 1970 THEN 1 END)`,
      receivedCommissions: sql<string>`SUM(CASE WHEN status = 'commission_paid' AND YEAR(saleDate) = ${year} AND YEAR(saleDate) > 1970 THEN totalCommission ELSE 0 END)`,
    })
    .from(sales)
    .where(sql`${sales.companyId} = ${companyId}`);

  const vgv = Number(result[0]?.vgv || 0);
  const salesCount = Number(result[0]?.salesCount || 0);
  const receivedCommissions = Number(result[0]?.receivedCommissions || 0);
  const averageTicket = salesCount > 0 ? vgv / salesCount : 0;

  console.log('[Dashboard] KPIs anuais:', { vgv, salesCount, averageTicket, receivedCommissions, year });
  return { vgv, salesCount, averageTicket, receivedCommissions };
}

/**
 * Calcula KPIs mensais
 */
async function calculateMonthlyKPIs(companyId: string, month: number, year: number) {
  const db = await getDb();
  if (!db) return { vgv: 0, salesCount: 0, averageTick