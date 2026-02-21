import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sales, commissions } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export const brokerDashboardRouter = router({
  // Obter resumo pessoal do corretor
  getSummary: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12).optional(),
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
      const month = input.month || now.getMonth() + 1;
      const year = input.year || now.getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Vendas como vendedor
      const vendedorSales = await db
        .select()
        .from(sales)
        .where(
          and(
            eq(sales.brokerVendedor, ctx.user.id),
            eq(sales.companyId, ctx.user.companyId!),
            gte(sales.createdAt, startDate),
            lte(sales.createdAt, endDate)
          )
        );

      // Vendas como angariador
      const angariadorSales = await db
        .select()
        .from(sales)
        .where(
          and(
            eq(sales.brokerAngariador, ctx.user.id),
            eq(sales.companyId, ctx.user.companyId!),
            gte(sales.createdAt, startDate),
            lte(sales.createdAt, endDate)
          )
        );

      // Comissões
      const myCommissions = await db
        .select()
        .from(commissions)
        .where(
          and(
            eq(commissions.brokerId, ctx.user.id),
            eq(commissions.companyId, ctx.user.companyId!),
            gte(commissions.createdAt, startDate),
            lte(commissions.createdAt, endDate)
          )
        );

      const totalVendedorValue = vendedorSales.reduce(
        (sum, s) => sum + Number(s.saleValue || 0),
        0
      );
      const totalAngariadorValue = angariadorSales.reduce(
        (sum, s) => sum + Number(s.saleValue || 0),
        0
      );
      const totalCommissionValue = myCommissions.reduce(
        (sum, c) => sum + Number(c.commissionValue || 0),
        0
      );
      const paidCommissionValue = myCommissions
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + Number(c.commissionValue || 0), 0);
      const pendingCommissionValue = myCommissions
        .filter((c) => c.status !== "paid")
        .reduce((sum, c) => sum + Number(c.commissionValue || 0), 0);

      return {
        period: { month, year },
        sales: {
          asVendedor: vendedorSales.length,
          asAngariador: angariadorSales.length,
          total: vendedorSales.length + angariadorSales.length,
          valueAsVendedor: totalVendedorValue,
          valueAsAngariador: totalAngariadorValue,
          totalValue: totalVendedorValue + totalAngariadorValue,
        },
        commissions: {
          total: myCommissions.length,
          totalValue: totalCommissionValue,
          paid: myCommissions.filter((c) => c.status === "paid").length,
          paidValue: paidCommissionValue,
          pending: myCommissions.filter((c) => c.status !== "paid").length,
          pendingValue: pendingCommissionValue,
        },
      };
    }),

  // Listar vendas pessoais com histórico
  listMySales: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12).optional(),
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
      const month = input.month || now.getMonth() + 1;
      const year = input.year || now.getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const role = input.role || "all";

      const conditions = [
        eq(sales.companyId, ctx.user.companyId!),
        gte(sales.createdAt, startDate),
        lte(sales.createdAt, endDate),
      ];

      if (role === "vendedor") {
        conditions.push(eq(sales.brokerVendedor, ctx.user.id));
      } else if (role === "angariador") {
        conditions.push(eq(sales.brokerAngariador, ctx.user.id));
      } else {
        // all - mostrar vendas onde é vendedor OU angariador
        conditions.push(eq(sales.brokerVendedor, ctx.user.id));
      }

      const mySales = await db
        .select()
        .from(sales)
        .where(and(...conditions))
        .orderBy(desc(sales.createdAt));

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

      const now = new Date();
      const month = input.month || now.getMonth() + 1;
      const year = input.year || now.getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const status = input.status || "all";

      const conditions = [
        eq(commissions.brokerId, ctx.user.id),
        eq(commissions.companyId, ctx.user.companyId!),
        gte(commissions.createdAt, startDate),
        lte(commissions.createdAt, endDate),
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
      throw new Error("Apenas corretores podem acessar este endpoint");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar todas as vendas do corretor
    const allSales = await db
      .select()
      .from(sales)
      .where(
        and(
          eq(sales.brokerVendedor, ctx.user.id),
          eq(sales.companyId, ctx.user.companyId!)
        )
      )
      .orderBy(desc(sales.createdAt));

    // Buscar todas as comissões do corretor
    const allCommissions = await db
      .select()
      .from(commissions)
      .where(
        and(
          eq(commissions.brokerId, ctx.user.id),
          eq(commissions.companyId, ctx.user.companyId!)
        )
      )
      .orderBy(desc(commissions.createdAt));

    // Agrupar por mês/ano
    const salesByMonth: Record<string, typeof allSales> = {};
    const commissionsByMonth: Record<string, typeof allCommissions> = {};

    allSales.forEach((sale) => {
      const key = `${sale.createdAt?.getFullYear()}-${String(
        ((sale.createdAt?.getMonth() || 0) + 1)
      ).padStart(2, "0")}`;
      if (!salesByMonth[key]) salesByMonth[key] = [];
      salesByMonth[key].push(sale);
    });

    allCommissions.forEach((commission) => {
      const key = `${commission.createdAt?.getFullYear()}-${String(
        ((commission.createdAt?.getMonth() || 0) + 1)
      ).padStart(2, "0")}`;
      if (!commissionsByMonth[key]) commissionsByMonth[key] = [];
      commissionsByMonth[key].push(commission);
    });

    return {
      salesByMonth,
      commissionsByMonth,
      totalSales: allSales.length,
      totalCommissions: allCommissions.length,
    };
  }),
});
