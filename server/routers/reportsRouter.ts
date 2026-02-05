import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getValueByBrokerReport,
  getAngariationsValueByBrokerReport,
  getAngariationsCountByBrokerReport,
  getPivotTableReport,
} from "../db/reports";

export const reportsRouter = router({
  /**
   * Relatório 1: Valor por corretor (angariações + vendas)
   */
  valueByBroker: protectedProcedure
    .input(
      z.object({
        startDate: z.string(), // ISO date string
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const companyId = ctx.user.companyId || "";

      return await getValueByBrokerReport(companyId, startDate, endDate);
    }),

  /**
   * Relatório 2: Valor por corretor (somente angariações)
   */
  angariationsValueByBroker: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const companyId = ctx.user.companyId || "";

      return await getAngariationsValueByBrokerReport(companyId, startDate, endDate);
    }),

  /**
   * Relatório 3: Quantidade por corretor (somente angariações)
   */
  angariationsCountByBroker: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const companyId = ctx.user.companyId || "";

      return await getAngariationsCountByBrokerReport(companyId, startDate, endDate);
    }),

  /**
   * Relatório 7: Tabela pivotada (valor x corretor)
   */
  pivotTable: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const companyId = ctx.user.companyId || "";

      return await getPivotTableReport(companyId, startDate, endDate);
    }),
});
