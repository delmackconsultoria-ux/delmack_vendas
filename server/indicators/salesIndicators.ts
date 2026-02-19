import { getDb } from "../db";
import { sales, commissions } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, ne } from "drizzle-orm";

/**
 * Negócios no mês (valor)
 * Soma do valor de venda das vendas registradas no mês
 */
export async function calculateSalesValueMonth(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      value: sql<number>`COALESCE(SUM(saleValue), 0)`,
      count: sql<number>`COUNT(id)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

  return {
    value: typeof result[0]?.value === 'number' ? result[0].value : parseFloat(result[0]?.value || "0"),
    count: result[0]?.count || 0,
  };
}

/**
 * Negócios no mês (unidades)
 * Contagem de vendas registradas no mês
 */
export async function calculateSalesCountMonth(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${sales.id})` })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

  return result[0]?.count || 0;
}

/**
 * Vendas Canceladas
 * Contagem de vendas com status = CANCELADA no mês
 */
export async function calculateCancelledSalesCount(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${sales.id})` })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        eq(sales.status, sql`'cancelled'`),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

  return result[0]?.count || 0;
}

/**
 * Comissão Recebida
 * Soma das comissões com status = PAGA no mês
 */
export async function calculateCommissionReceived(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      value: sql<string>`COALESCE(SUM(${commissions.commissionValue}), 0)`,
    })
    .from(commissions)
    .where(
      and(
        eq(commissions.companyId, companyId),
        eq(commissions.status, sql`'paid'`),
        gte(commissions.paymentDate, startDate),
        lte(commissions.paymentDate, endDate)
      )
    );

  return parseFloat(result[0]?.value || "0");
}

/**
 * Comissão Vendida
 * Soma das comissões geradas pelas vendas registradas no mês
 */
export async function calculateCommissionSold(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      value: sql<string>`COALESCE(SUM(${commissions.commissionValue}), 0)`,
    })
    .from(commissions)
    .innerJoin(sales, eq(commissions.saleId, sales.id))
    .where(
      and(
        eq(sales.companyId, companyId),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

  return parseFloat(result[0]?.value || "0");
}

/**
 * Comissão Pendentes Final do mês
 * Soma das comissões com status pendente no último dia do mês
 */
export async function calculateCommissionPending(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      value: sql<string>`COALESCE(SUM(${commissions.commissionValue}), 0)`,
    })
    .from(commissions)
    .innerJoin(sales, eq(commissions.saleId, sales.id))
    .where(
      and(
        eq(sales.companyId, companyId),
        ne(commissions.status, sql`'paid'`),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

  return parseFloat(result[0]?.value || "0");
}

/**
 * % comissão vendida
 * Comissão total vendida ÷ valor total vendido
 */
export async function calculatePercentCommissionSold(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const totalSales = await calculateSalesValueMonth(companyId, startDate, endDate);
  const totalCommission = await calculateCommissionSold(companyId, startDate, endDate);

  if (totalSales.value === 0) return 0;
  return (totalCommission / totalSales.value) * 100;
}

/**
 * Negócios acima de 1 milhão
 * Contagem de vendas com valor ≥ 1.000.000
 */
export async function calculateSalesAbove1M(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${sales.id})` })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        sql`CAST(${sales.saleValue} AS DECIMAL) >= 1000000`,
        sql`${sales.saleDate} >= ${startDate}`,
        sql`${sales.saleDate} <= ${endDate}`
      )
    );

  return result[0]?.count || 0;
}

/**
 * Prazo médio recebimento de venda
 * Média de (data de pagamento − data de registro da venda)
 */
export async function calculateAvgPaymentDays(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      avgDays: sql<number>`COALESCE(AVG(DATEDIFF(${commissions.paymentDate}, ${sales.saleDate})), 0)`,
    })
    .from(commissions)
    .innerJoin(sales, eq(commissions.saleId, sales.id))
    .where(
      and(
        eq(sales.companyId, companyId),
        eq(commissions.status, sql`'paid'`),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

  return Math.round(result[0]?.avgDays || 0);
}

/**
 * % Com cancelada / com pendente
 * Quantidade de vendas canceladas ÷ quantidade de vendas pendentes
 */
export async function calculatePercentCancelledPending(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cancelled = await calculateCancelledSalesCount(companyId, startDate, endDate);

  const pendingResult = await db
    .select({ count: sql<number>`COUNT(${sales.id})` })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        ne(sales.status, sql`'commission_paid'`),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

  const pending = pendingResult[0]?.count || 0;
  if (pending === 0) return 0;

  return (cancelled / pending) * 100;
}

/**
 * Valor médio do imóvel de venda
 * Valor total vendido ÷ número de vendas
 */
export async function calculateAvgPropertyValue(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const totalSales = await calculateSalesValueMonth(companyId, startDate, endDate);
  if (totalSales.count === 0) return 0;
  return totalSales.value / totalSales.count;
}

/**
 * Negócios na Rede (UNA)
 * Contagem de vendas com tipo = parceria UNA
 */
export async function calculateSalesUNA(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${sales.id})` })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        sql`${sales.tipoComissao} LIKE '%Parceria UNA%'`,
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

  return result[0]?.count || 0;
}

/**
 * Negócios Internos
 * Contagem de vendas com tipo = venda interna
 */
export async function calculateSalesInternal(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${sales.id})` })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        sql`${sales.tipoComissao} LIKE '%Venda Interna%'`,
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

  return result[0]?.count || 0;
}

/**
 * Negócios Parceria Externa
 * Contagem de vendas com tipo = parceria externa
 */
export async function calculateSalesExternalPartner(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${sales.id})` })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        sql`${sales.tipoComissao} LIKE '%Parceria Externa%'`,
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

  return result[0]?.count || 0;
}

/**
 * Negócios Lançamentos
 * Contagem de vendas com tipo = lançamento
 */
export async function calculateSalesLaunch(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${sales.id})` })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        sql`${sales.tipoComissao} LIKE '%Lançamento%'`,
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    );

  return result[0]?.count || 0;
}
