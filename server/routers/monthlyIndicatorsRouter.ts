import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getMonthlyIndicator,
  getMonthlyIndicatorsByCompany,
  upsertMonthlyIndicator,
  deleteMonthlyIndicator,
} from "../db/monthlyIndicators";

/**
 * Monthly Indicators Router
 * Gerencia indicadores mensais de preenchimento manual (despesas e fundos)
 */
export const monthlyIndicatorsRouter = router({
  /**
   * Get indicator for specific month
   */
  getByMonth: protectedProcedure
    .input(z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário não possui empresa associada",
        });
      }

      return await getMonthlyIndicator(input.month, ctx.user.companyId);
    }),

  /**
   * Get all indicators for company
   */
  listAll: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário não possui empresa associada",
        });
      }

      return await getMonthlyIndicatorsByCompany(ctx.user.companyId);
    }),

  /**
   * Create or update monthly indicator
   * Only managers and finance can edit
   */
  upsert: protectedProcedure
    .input(z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/),
      generalExpense: z.number().optional(),
      taxExpense: z.number().optional(),
      innovationFund: z.number().optional(),
      partnerResult: z.number().optional(),
      emergencyFund: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!["manager", "finance", "superadmin"].includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas gerentes e financeiro podem editar indicadores",
        });
      }

      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário não possui empresa associada",
        });
      }

      return await upsertMonthlyIndicator({
        month: input.month,
        companyId: ctx.user.companyId,
        generalExpense: input.generalExpense?.toString(),
        taxExpense: input.taxExpense?.toString(),
        innovationFund: input.innovationFund?.toString(),
        partnerResult: input.partnerResult?.toString(),
        emergencyFund: input.emergencyFund?.toString(),
        createdBy: ctx.user.id,
      });
    }),

  /**
   * Delete monthly indicator
   * Only managers and finance can delete
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!["manager", "finance", "superadmin"].includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas gerentes e financeiro podem deletar indicadores",
        });
      }

      await deleteMonthlyIndicator(input.id);

      return { success: true };
    }),
});
