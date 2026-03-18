import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { 
  getOrCreateGoals, 
  saveGoalIndicators,
  getGoalsWithIndicators,
  getGoalById
} from "../db-goals";

/**
 * Router para gerenciamento de metas (goals)
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

      // Buscar indicadores (agora são colunas da tabela goals)
      const result = await getGoalsWithIndicators(user.id, user.companyId, input.year);

      if (!result) {
        return {
          goalId: goal.id,
          year: input.year,
          indicators: {},
        };
      }

      return {
        goalId: result.goal.id,
        year: result.goal.year,
        indicators: result.indicators,
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
      
      if (!user.id) {
        throw new Error("Usuário não autenticado");
      }

      try {
        // Validar que a meta pertence ao usuário
        const goal = await getGoalById(input.goalId);
        if (!goal) {
          throw new Error("Meta não encontrada");
        }

        if (goal.managerId !== user.id) {
          throw new Error("Você não tem permissão para editar esta meta");
        }

        // Salvar indicadores
        await saveGoalIndicators(input.goalId, input.indicators as Record<string, number | null>);

        return {
          success: true,
          message: "Indicadores salvos com sucesso",
        };
      } catch (error) {
        console.error("[Goals] Erro ao salvar indicadores:", error);
        throw new Error(`Erro ao salvar indicadores: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
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

      const result = await getGoalsWithIndicators(user.id, user.companyId, input.year);
      
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

      // Retornar apenas as metas do usuário
      const result = await getGoalsWithIndicators(user.id, user.companyId, input.year || new Date().getFullYear());
      
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
