import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sales, commissions } from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql, notInArray, or } from "drizzle-orm";

export const brokerDashboardRouter = router({
  // Obter resumo pessoal do corretor (acumulado anual usando saleDate)
  getSummary: protectedProcedure
    .input(
      z.object({
        month: z.number().min(0).max(12).optional(), // 0 = acumulado anual
        year: z.number().min(2020).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "broker") {
        throw new Error("Apenas corretores podem acessar este endpoint");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      const month = input.month ?? 0; // 0 = acumulado anual por padrão
      const year = input.year || now.getFullYear();

      const isYearly = month === 0;
      const startDate = isYearly ? new Date(year, 0, 1) : new Date(year, month - 1, 1);
      const endDate = isYearly ? new Date(year, 11, 31, 23, 59, 59) : new Date(year, month, 0, 23, 59, 59);

      // Vendas como vendedor (usando saleDate)
      const vendedorSales = await db
        .select({
          id: sales.id,
          saleValue: sales.saleValue,
          totalCommission: sales.totalCommission,
          status: sales.status,
          saleDate: sales.saleDate,
          saleType: sales.saleType,
        })
        .from(sales)
        .where(
          and(
            eq(sales.brokerVendedor, ctx.user.id),
            eq(sales.companyId, ctx.user.companyId!),
            gte(sales.saleDate, startDate),
            lte(sales.saleDate, endDate),
            notInArray(sales.status, ['draft', 'cancelled']),
            sql`YEAR(${sales.saleDate}) > 1970`
          )
        );

      // Vendas como angariador (usando saleDate)
      const angariadorSales = await db
        .select({
          id: sales.id,
          saleValue: sales.saleValue,
          totalCommission: sales.totalCommission,
          status: sales.status,
          saleDate: sales.saleDate,
          saleType: sales.saleType,
        })
        .from(sales)
        .where(
          and(
            eq(sales.brokerAngariador, ctx.user.id),
            eq(sales.companyId, ctx.user.companyId!),
            gte(sales.saleDate, startDate),
            lte(sales.saleDate, endDate),
            notInArray(sales.status, ['draft', 'cancelled']),
            sql`YEAR(${sales.saleDate}) > 1970`
          )
        );

      // Comissões pagas ao corretor (usando createdAt pois são registros de pagamento)
      const myCommissions = await db
        .select()
        .from(commissions)
        .where(
          and(
            eq(commissions.brokerId, ctx.user.id),
            eq(commissions.companyId, ctx.user.companyId!),
          )
        );

      const totalVendedorValue = vendedorSales.reduce(
        (sum, s) => sum + Number(s.saleValue || 0), 0
      );
      const totalAngariadorValue = angariadorSales.reduce(
        (sum, s) => sum + Number(s.saleValue || 0), 0
      );

      // Comissões recebidas = vendas com status commission_paid
      const paidCommissionValue = vendedorSales
        .filter(s => s.status === 'commission_paid')
        .reduce((sum, s) => sum + Number(s.totalCommission || 0), 0);

      // Pendentes de aprovação = vendas em finance_review
      const pendingApproval = vendedorSales.filter(s => 
        s.status === 'finance_review' || s.status === 'manager_review'
      ).length;

      const totalCommissionValue = myCommissions.reduce(
        (sum, c) => sum + Number(c.commissionValue || 0), 0
      );

      return {
        period: { month, year, isYearly },
        sales: {
          asVendedor: vendedorSales.length,
          asAngariador: angariadorSales.length,
          total: vendedorSales.length + angariadorSales.length,
          valueAsVendedor: totalVendedorValue,
          valueAsAngariador: totalAngariadorValue,
          totalValue: totalVendedorValue + totalAngariadorValue,
          pendingApproval,
          paidCommissionValue,
          recentSales: vendedorSales.slice(0, 5),
        },
        commissions: {
          total: myCommissions.length,
          totalValue: totalCommissionValue,
          paid: myCommissions.filter((c) => c.status === "paid").length,
          paidValue: myCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.commissionValue || 0), 0),
          pending: myCommissions.filter((c) => c.status !== "paid").length,
          pendingValue: myCommissions.filter(c => c.status !== 'paid').reduce((sum, c) => sum + Number(c.commissionValue || 0), 0),
        },
      };
    }),

  // Listar vendas pessoais com histórico (usando saleDate)
  listMySales: protectedProcedure
    .input(
      z.object({
        month: z.number().min(0).max(12).optional(),
        year: z.number().min(2020).optional(),
        role: z.enum(["vendedor", "angariador", "all"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "broker") {
        throw new Error("Apenas corretores podem acessar este endpoint");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      const month = input.month ?? 0;
      const year = input.year || now.getFullYear();

      const isYearly = month === 0;
      const startDate = isYearly ? new Date(year, 0, 1) : new Date(year, month - 1, 1);
      const endDate = isYearly ? new Date(year, 11, 31, 23, 59, 59) : new Date(year, month, 0, 23, 59, 59);

      const role = input.role || "all";

      const baseConditions = [
        eq(sales.companyId, ctx.user.companyId!),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate),
        notInArray(sales.status, ['draft', 'cancelled']),
        sql`YEAR(${sales.saleDate}) > 1970`,
      ];

      let mySales;
      if (role === "vendedor") {
        mySales = await db.select().from(sales)
          .where(and(...baseConditions, eq(sales.brokerVendedor, ctx.user.id)))
          .orderBy(desc(sales.saleDate));
      } else if (role === "angariador") {
        mySales = await db.select().from(sales)
          .where(and(...baseConditions, eq(sales.brokerAngariador, ctx.user.id)))
          .orderBy(desc(sales.saleDate));
      } else {
        // all - vendedor OU angariador
        mySales = await db.select().from(sales)
          .where(and(
            eq(sales.companyId, ctx.user.companyId!),
            gte(sales.saleDate, startDate),
            lte(sales.saleDate, endDate),
            notInArray(sales.status, ['draft', 'cancelled']),
            sql`YEAR(${sales.saleDate}) > 1970`,
            or(
              eq(sales.brokerVendedor, ctx.user.id),
              eq(sales.brokerAngariador, ctx.user.id)
            )
          ))
          .orderBy(desc(sales.saleDate));
      }

      return mySales;
    }),

  // Listar comissões pessoais
  listMyCommissions: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12).optional(),
        year: z.number().min(2020).optional(),
        status: z.enum(["all", "paid", "pending", "cancelled"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "broker") {
        throw new Error("Apenas corretores podem acessar este endpoint");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const status = input.status || "all";

      const conditions: any[] = [
        eq(commissions.brokerId, ctx.user.id),
        eq(commissions.companyId, ctx.user.companyId!),
      ];

      if (status !== "all") {
        conditions.push(eq(commissions.status, status));
      }

      const myCommissions = await db
        .select()
        .from(commissions)
        .where(and(...conditions))
        .orderBy(desc(commissions.createdAt));

      return myCommissions;
    }),

  // Obter histórico completo (todos os meses/anos)
  getCompleteHistory: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "broker") {
      throw new E