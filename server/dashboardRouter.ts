import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { sales, users, commissions } from "../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export const dashboardRouter = router({
  // Get sales and angariations by broker (Table 1)
  getSalesAndAngariationsByBroker: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const currentMonth = new Date();
    currentMonth.setDate(1);

    let whereClause = gte(sales.saleDate, currentMonth);
    if (ctx.user.role === "broker") {
      whereClause = and(whereClause, eq(sales.brokerVendedor, ctx.user.id))!;
    }

    const result = await db
      .select({
        brokerId: sales.brokerVendedor,
        brokerName: users.name,
        salesValue: sql`COALESCE(SUM(${sales.saleValue}), 0)`,
      })
      .from(sales)
      .leftJoin(users, eq(sales.brokerVendedor, users.id))
      .where(whereClause)
      .groupBy(sales.brokerVendedor, users.name);

    return result;
  }),

  // Get angariations value by broker (Table 2)
  getAngariationValueByBroker: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const currentMonth = new Date();
    currentMonth.setDate(1);

    let whereClause = gte(sales.saleDate, currentMonth);
    if (ctx.user.role === "broker") {
      whereClause = and(whereClause, eq(sales.brokerAngariador, ctx.user.id))!;
    }

    const result = await db
      .select({
        brokerId: sales.brokerAngariador,
        brokerName: users.name,
        angariationValue: sql`COALESCE(SUM(${sales.saleValue}), 0)`,
      })
      .from(sales)
      .leftJoin(users, eq(sales.brokerAngariador, users.id))
      .where(whereClause)
      .groupBy(sales.brokerAngariador, users.name);

    return result;
  }),

  // Get angariations quantity by broker (Table 3)
  getAngariationQuantityByBroker: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const currentMonth = new Date();
    currentMonth.setDate(1);

    let whereClause = gte(sales.saleDate, currentMonth);
    if (ctx.user.role === "broker") {
      whereClause = and(whereClause, eq(sales.brokerAngariador, ctx.user.id))!;
    }

    const result = await db
      .select({
        brokerId: sales.brokerAngariador,
        brokerName: users.name,
        quantity: sql`COUNT(*)`,
      })
      .from(sales)
      .leftJoin(users, eq(sales.brokerAngariador, users.id))
      .where(whereClause)
      .groupBy(sales.brokerAngariador, users.name);

    return result;
  }),

  // Get cancelled sales quantity by broker (Table 4)
  getCancelledSalesQuantityByBroker: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const currentMonth = new Date();
    currentMonth.setDate(1);

    let whereClause = and(
      gte(sales.saleDate, currentMonth),
      eq(sales.status, "cancelled")
    );
    if (ctx.user.role === "broker") {
      whereClause = and(whereClause, eq(sales.brokerVendedor, ctx.user.id))!;
    }

    const result = await db
      .select({
        brokerId: sales.brokerVendedor,
        brokerName: users.name,
        quantity: sql`COUNT(*)`,
      })
      .from(sales)
      .leftJoin(users, eq(sales.brokerVendedor, users.id))
      .where(whereClause)
      .groupBy(sales.brokerVendedor, users.name);

    return result;
  }),

  // Get cancelled sales value by broker (Table 5)
  getCancelledSalesValueByBroker: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const currentMonth = new Date();
    currentMonth.setDate(1);

    let whereClause = and(
      gte(sales.saleDate, currentMonth),
      eq(sales.status, "cancelled")
    );
    if (ctx.user.role === "broker") {
      whereClause = and(whereClause, eq(sales.brokerVendedor, ctx.user.id))!;
    }

    const result = await db
      .select({
        brokerId: sales.brokerVendedor,
        brokerName: users.name,
        value: sql`COALESCE(SUM(${sales.saleValue}), 0)`,
      })
      .from(sales)
      .leftJoin(users, eq(sales.brokerVendedor, users.id))
      .where(whereClause)
      .groupBy(sales.brokerVendedor, users.name);

    return result;
  }),

  // Get KPI data for current broker
  getKPIData: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const currentMonth = new Date();
    currentMonth.setDate(1);

    let whereClause = gte(sales.saleDate, currentMonth);
    if (ctx.user.role === "broker") {
      whereClause = and(whereClause, eq(sales.brokerVendedor, ctx.user.id))!;
    }

    // Get sales this month
    const salesThisMonth = await db
      .select({
        count: sql`COUNT(*)`,
        value: sql`COALESCE(SUM(${sales.saleValue}), 0)`,
      })
      .from(sales)
      .where(whereClause);

    // Get commissions
    let commissionWhereClause = gte(commissions.createdAt, currentMonth);
    if (ctx.user.role === "broker") {
      commissionWhereClause = and(
        commissionWhereClause,
        eq(commissions.brokerId, ctx.user.id)
      )!;
    }

    const commissionsData = await db
      .select({
        total: sql`COALESCE(SUM(${commissions.commissionValue}), 0)`,
        pending: sql`COALESCE(SUM(CASE WHEN ${commissions.status} = 'pending' THEN ${commissions.commissionValue} ELSE 0 END), 0)`,
      })
      .from(commissions)
      .where(commissionWhereClause);

    return {
      salesThisMonth: {
        count: Number(salesThisMonth[0]?.count || 0),
        value: Number(salesThisMonth[0]?.value || 0),
      },
      commissions: {
        total: Number(commissionsData[0]?.total || 0),
        pending: Number(commissionsData[0]?.pending || 0),
      },
    };
  }),

  // Get sales by business type
  getSalesByBusinessType: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const currentMonth = new Date();
    currentMonth.setDate(1);

    let whereClause = gte(sales.saleDate, currentMonth);
    if (ctx.user.role === "broker") {
      whereClause = and(whereClause, eq(sales.brokerVendedor, ctx.user.id))!;
    }

    const result = await db
      .select({
        businessType: sales.businessType,
        count: sql`COUNT(*)`,
        value: sql`COALESCE(SUM(${sales.saleValue}), 0)`,
      })
      .from(sales)
      .where(whereClause)
      .groupBy(sales.businessType);

    return result;
  }),

  // Get commissions by business type
  getCommissionsByBusinessType: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const currentMonth = new Date();
    currentMonth.setDate(1);

    let whereClause = gte(commissions.createdAt, currentMonth);
    if (ctx.user.role === "broker") {
      whereClause = and(whereClause, eq(commissions.brokerId, ctx.user.id))!;
    }

    const result = await db
      .select({
        businessType: sales.businessType,
        amount: sql`COALESCE(SUM(${commissions.commissionValue}), 0)`,
      })
      .from(commissions)
      .leftJoin(sales, eq(commissions.saleId, sales.id))
      .where(whereClause)
      .groupBy(sales.businessType);

    return result;
  }),

  // Get recent sales
  getRecentSales: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    let whereClause = undefined;
    if (ctx.user.role === "broker") {
      whereClause = eq(sales.brokerVendedor, ctx.user.id);
    }

    const result = await db
      .select({
        id: sales.id,
        buyerName: sales.buyerName,
        saleValue: sales.saleValue,
        saleDate: sales.saleDate,
        businessType: sales.businessType,
        status: sales.status,
      })
      .from(sales)
      .where(whereClause)
      .orderBy(sql`${sales.saleDate} DESC`)
      .limit(10);

    return result;
  }),
});

