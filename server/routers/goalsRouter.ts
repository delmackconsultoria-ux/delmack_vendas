import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { goals } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Router para gerenciamento de metas (goals)
 * Apenas gerentes e admins podem configurar metas
 */
export const goalsRouter = router({
  /**
   * Salvar ou atualizar meta mensal do time
   */
  saveGoal: protectedProcedure
    .input(
      z.object({
        year: z.number().int().min(2020).max(2100),
        month: z.number().int().min(1).max(12),
        teamGoal: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { user } = ctx;
      if (!user.companyId) {
        throw new Error("Usuário não está vinculado a uma empresa");
      }

      // Verificar se já existe meta para este mês/ano
      const existing = await db
        .select()
        .from(goals)
        .where(
          and(
            eq(goals.companyId, user.companyId),
            eq(goals.year, input.year),
            eq(goals.month, input.month)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Atualizar meta existente
        await db
          .update(goals)
          .set({
            teamGoal: input.teamGoal.toString(),
            updatedAt: new Date(),
          })
          .where(eq(goals.id, existing[0].id));

        return {
          success: true,
          message: "Meta atualizada com sucesso",
          goalId: existing[0].id,
        };
      } else {
        // Criar nova meta
        const goalId = nanoid();
        await db.insert(goals).values({
          id: goalId,
          companyId: user.companyId,
          year: input.year,
          month: input.month,
          teamGoal: input.teamGoal.toString(),
        });

        return {
          success: true,
          message: "Meta criada com sucesso",
          goalId,
        };
      }
    }),

  /**
   * Buscar meta de um mês/ano específico
   */
  getGoal: protectedProcedure
    .input(
      z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { user } = ctx;
      if (!user.companyId) {
        throw new Error("Usuário não está vinculado a uma empresa");
      }

      const result = await db
        .select()
        .from(goals)
        .where(
          and(
            eq(goals.companyId, user.companyId),
            eq(goals.year, input.year),
            eq(goals.month, input.month)
          )
        )
        .limit(1);

      if (result.length === 0) {
        // Retornar meta padrão de R$ 15 milhões
        return {
          year: input.year,
          month: input.month,
          teamGoal: "15000000.00",
          isDefault: true,
        };
      }

      return {
        ...result[0],
        isDefault: false,
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
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { user } = ctx;
      if (!user.companyId) {
        throw new Error("Usuário não está vinculado a uma empresa");
      }

      let result;
      
      if (input.year) {
        result = await db
          .select()
          .from(goals)
          .where(
            and(
              eq(goals.companyId, user.companyId),
              eq(goals.year, input.year)
            )
          );
      } else {
        result = await db
          .select()
          .from(goals)
          .where(eq(goals.companyId, user.companyId));
      }

      return result.map((goal) => ({
        ...goal,
        teamGoal: parseFloat(goal.teamGoal),
      }));
    }),

  /**
   * Obter progresso da meta do mês atual
   */
  getGoalProgress: protectedProcedure
    .input(
      z.object({
        year: z.number().int().optional(),
        month: z.number().int().min(1).max(12).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { user } = ctx;
      if (!user.companyId) {
        throw new Error("Usuário não está vinculado a uma empresa");
      }

      // Usar mês/ano atual se não especificado
      const now = new Date();
      const targetYear = input.year || now.getFullYear();
      const targetMonth = input.month || now.getMonth() + 1;

      // Buscar meta do mês
      const goalResult = await db
        .select()
        .from(goals)
        .where(
          and(
            eq(goals.companyId, user.companyId),
            eq(goals.year, targetYear),
            eq(goals.month, targetMonth)
          )
        )
        .limit(1);

      const goalValue = goalResult.length > 0 
        ? parseFloat(goalResult[0].teamGoal)
        : 15000000; // Meta padrão R$ 15 milhões

      // Calcular VGV acumulado do mês
      const vgvQuery = `
        SELECT COALESCE(SUM(saleValue), 0) as totalVGV
        FROM sales
        WHERE companyId = ?
          AND YEAR(saleDate) = ?
          AND MONTH(saleDate) = ?
          AND status != 'cancelled'
          AND status != 'draft'
      `;

      const vgvResult: any = await db.execute(vgvQuery);
      const vgvAccumulated = parseFloat((vgvResult[0] as any)[0]?.totalVGV || 0);

      // Calcular % atingida
      const percentageAchieved = (vgvAccumulated / goalValue) * 100;

      // Calcular dias do mês
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      const currentDay = targetYear === now.getFullYear() && targetMonth === now.getMonth() + 1
        ? now.getDate()
        : daysInMonth;
      const daysRemaining = daysInMonth - currentDay;

      // Calcular progresso esperado (proporcional aos dias decorridos)
      const expectedProgress = (currentDay / daysInMonth) * 100;
      const isOnTrack = percentageAchieved >= expectedProgress;

      // Calcular projeção de fechamento
      const dailyAverage = currentDay > 0 ? vgvAccumulated / currentDay : 0;
      const projectedTotal = dailyAverage * daysInMonth;
      const projectedPercentage = (projectedTotal / goalValue) * 100;

      return {
        year: targetYear,
        month: targetMonth,
        goal: goalValue,
        vgvAccumulated,
        percentageAchieved,
        daysInMonth,
        currentDay,
        daysRemaining,
        expectedProgress,
        isOnTrack,
        dailyAverage,
        projectedTotal,
        projectedPercentage,
        remaining: goalValue - vgvAccumulated,
      };
    }),
});
