import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { sales, users } from "../drizzle/schema";
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
});

