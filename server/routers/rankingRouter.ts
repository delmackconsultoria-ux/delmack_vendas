import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sales, commissions, users } from "../../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export const rankingRouter = router({
  // Ranking de vendas por corretor
  getVendasRanking: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      })
    )
    .query(async (opts: any) => {
      const { input, ctx } = opts;
      const db = await getDb();
      if (!db) return [];

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      try {
        // Buscar ranking de vendas por corretor (como vendedor)
        const ranking = await db
          .select({
            brokerId: sales.brokerVendedor,
            brokerName: users.name,
            totalVendas: sql<number>`COUNT(${sales.id})`,
            valorTotal: sql<number>`SUM(${sales.saleValue})`,
            quantidadeVendas: sql<number>`COUNT(${sales.id})`,
          })
          .from(sales)
          .leftJoin(users, eq(sales.brokerVendedor, users.id))
          .where(
            and(
              eq(sales.companyId, ctx.user.companyId),
              gte(sales.createdAt, startDate),
              lte(sales.createdAt, endDate)
            )
          )
          .groupBy(sales.brokerVendedor, users.id, users.name);

        // Adicionar posição
        return ranking
          .sort((a, b) => (b.valorTotal || 0) - (a.valorTotal || 0))
          .map((item, index) => ({
            posicao: index + 1,
            brokerId: item.brokerId,
            brokerName: item.brokerName || "Sem vínculo",
            quantidadeVendas: item.quantidadeVendas || 0,
            valorTotal: item.valorTotal || 0,
          }));
      } catch (error) {
        console.error("Erro ao buscar ranking de vendas:", error);
        return [];
      }
    }),

  // Ranking de angariações por corretor
  getAngaricoesRanking: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      })
    )
    .query(async (opts: any) => {
      const { input, ctx } = opts;
      const db = await getDb();
      if (!db) return [];

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      try {
        // Buscar ranking de angariações por corretor (como angariador)
        const ranking = await db
          .select({
            brokerId: sales.brokerAngariador,
            brokerName: users.name,
            quantidadeAngariacao: sql<number>`COUNT(${sales.id})`,
            valorTotal: sql<number>`SUM(${sales.saleValue})`,
          })
          .from(sales)
          .leftJoin(users, eq(sales.brokerAngariador, users.id))
          .where(
            and(
              eq(sales.companyId, ctx.user.companyId),
              gte(sales.createdAt, startDate),
              lte(sales.createdAt, endDate)
            )
          )
          .groupBy(sales.brokerAngariador, users.id, users.name);

        // Adicionar posição
        return ranking
          .sort((a, b) => (b.valorTotal || 0) - (a.valorTotal || 0))
          .map((item, index) => ({
            posicao: index + 1,
            brokerId: item.brokerId,
            brokerName: item.brokerName || "Sem vínculo",
            quantidadeAngariacao: item.quantidadeAngariacao || 0,
            valorTotal: item.valorTotal || 0,
          }));
      } catch (error) {
        console.error("Erro ao buscar ranking de angariações:", error);
        return [];
      }
    }),

  // Dados do próprio corretor (para comparação)
  getMyPerformance: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      })
    )
    .query(async (opts: any) => {
      const { input, ctx } = opts;
      if (ctx.user.role !== "broker") {
        return null;
      }

      const db = await getDb();
      if (!db) return null;

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      try {
        // Vendas como vendedor
        const vendas = await db
          .select({
            quantidade: sql<number>`COUNT(${sales.id})`,
            valor: sql<number>`SUM(${sales.saleValue})`,
          })
          .from(sales)
          .where(
            and(
              eq(sales.brokerVendedor, ctx.user.id),
              gte(sales.createdAt, startDate),
              lte(sales.createdAt, endDate)
            )
          );

        // Angariações
        const angariacao = await db
          .select({
            quantidade: sql<number>`COUNT(${sales.id})`,
            valor: sql<number>`SUM(${sales.saleValue})`,
          })
          .from(sales)
          .where(
            and(
              eq(sales.brokerAngariador, ctx.user.id),
              gte(sales.createdAt, startDate),
              lte(sales.createdAt, endDate)
            )
          );

        return {
          vendas: {
            quantidade: vendas[0]?.quantidade || 0,
            valor: vendas[0]?.valor || 0,
          },
          angariacao: {
            quantidade: angariacao[0]?.quantidade || 0,
            valor: angariacao[0]?.valor || 0,
          },
        };
      } catch (error) {
        console.error("Erro ao buscar performance do corretor:", error);
        return null;
      }
    }),
});
