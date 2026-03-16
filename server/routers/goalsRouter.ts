import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { 
  getOrCreateGoals, 
  getGoalIndicators, 
  upsertGoalIndicator,
  saveGoalIndicators,
  getGoalsWithIndicators 
} from "../db-goals";

/**
 * Router para gerenciamento de metas (goals)
 * Apenas gerentes e admins podem configurar metas
 */
export const goalsRouter = router({
  /**
   * Obter ou criar metas para um ano
   */
  getOrCreateGoals: protectedProcedure
    .input(
      z.object({
        year: z.number().int().min(2020).max(2100),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      if (!user.companyId) {
        throw new Error("Usuário não está vinculado a uma empresa");
      }

      // Buscar ou criar metas
      const goal = await getOrCreateGoals(user.id, user.companyId, input.year);

      // Buscar indicadores
      const indicators = await getGoalIndicators(goal.id);

      return {
        goalId: goal.id,
        year: input.year,
        indicators: indicators.reduce(
          (acc, ind) => {
            acc[ind.indicatorName] = ind.targetValue ? parseFloat(ind.targetValue.toString()) : null;
            return acc;
          },
          {} as Record<string, number | null>
        ),
      };
    }),

  /**
   * Salvar indicadores de meta
   */
  saveIndicators: protectedProcedure
    .input(
      z.object({
        goalId: z.string(),
        indicators: z.record(z.string(), z.number().nullable()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      
      // Verificar se é gerente ou admin
      if (user.role !== "manager" && user.role !== "admin" && user.role !== "superadmin") {
        throw new Error("Apenas gerentes e admins podem editar metas");
      }

      // Salvar indicadores
      await saveGoalIndicators(input.goalId, input.indicators as Record<string, number | null>);

      return {
        success: true,
        message: "Indicadores salvos com sucesso",
      };
    }),

  /**
   * Buscar metas com indicadores
   */
  getGoalsWithIndicators: protectedProcedure
    .input(
      z.object({
        year: z.number().int().min(2020).max(2100),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      if (!user.companyId) {
        throw new Error("Usuário não está vinculado a uma empresa");
      }

      const result = await getGoalsWithIndicators(user.id, input.year);
      
      if (!result) {
        return null;
      }

      return {
        goalId: result.goal.id,
        year: result.goal.year,
        indicators: result.indicators,
      };
    }),

  /**
   * Listar todas as metas da empresa
   */
  listGoals: protectedProcedure
    .input(
      z.object({
        year: z.number().int().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      if (!user.companyId) {
        throw new Error("Usuário não está vinculado a uma empresa");
      }

      // Por enquanto, retornar apenas as metas do usuário
      // Em produção, pode retornar todas as metas da empresa se for admin/finance
      const result = await getGoalsWithIndicators(user.id, input.year || new Date().getFullYear());
      
      if (!result) {
        return [];
      }

      return [{
        goalId: result.goal.id,
        year: result.goal.year,
        indicators: result.indicators,
      }];
    }),
});
