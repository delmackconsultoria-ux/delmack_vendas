import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { calculateAllIndicators } from "../indicatorsHelpers";

export const indicatorsRouter = router({
  /**
   * Calcular todos os indicadores de uma vez
   */
  getAll: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12).optional(),
        year: z.number().min(2020).max(2030).optional(),
        brokerId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const companyId = user.companyId;

      if (!companyId) {
        throw new Error("Usuário não possui companyId");
      }

      // Se for corretor, forçar brokerId para o próprio usuário
      let brokerId = input.brokerId;
      if (user.role === "broker") {
        brokerId = user.id;
      }

      const filters = {
        companyId,
        month: input.month,
        year: input.year,
        brokerId,
      };

      const indicators = await calculateAllIndicators(filters);

      return {
        success: true,
        indicators,
      };
    }),
});
