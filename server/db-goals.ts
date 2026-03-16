import { eq, and } from "drizzle-orm";
import { goals, goalIndicators, type Goal, type GoalIndicator } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Buscar ou criar metas para um gerente e ano
 */
export async function getOrCreateGoals(managerId: string, companyId: string, year: number): Promise<Goal> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(goals)
    .where(and(eq(goals.managerId, managerId), eq(goals.year, year)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Criar nova meta
  const newGoal: Goal = {
    id: `goal_${Date.now()}`,
    managerId,
    companyId,
    year,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(goals).values(newGoal);
  return newGoal;
}

/**
 * Buscar todos os indicadores de uma meta
 */
export async function getGoalIndicators(goalId: string): Promise<GoalIndicator[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(goalIndicators).where(eq(goalIndicators.goalId, goalId));
}

/**
 * Salvar ou atualizar indicador de meta
 */
export async function upsertGoalIndicator(
  goalId: string,
  indicatorName: string,
  targetValue: number | null
): Promise<GoalIndicator> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(goalIndicators)
    .where(and(eq(goalIndicators.goalId, goalId), eq(goalIndicators.indicatorName, indicatorName)))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar
    await db
      .update(goalIndicators)
      .set({ targetValue: targetValue?.toString() as any, updatedAt: new Date() })
      .where(eq(goalIndicators.id, existing[0].id));
    return { ...existing[0], targetValue: targetValue?.toString() as any };
  }

  // Criar novo
  const newIndicator: GoalIndicator = {
    id: `gi_${Date.now()}_${Math.random()}`,
    goalId,
    indicatorName,
    targetValue: targetValue?.toString() as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(goalIndicators).values(newIndicator);
  return newIndicator;
}

/**
 * Salvar múltiplos indicadores de uma vez
 */
export async function saveGoalIndicators(
  goalId: string,
  indicators: Record<string, number | null>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const [name, value] of Object.entries(indicators)) {
    await upsertGoalIndicator(goalId, name, value);
  }
}

/**
 * Buscar metas com todos os indicadores
 */
export async function getGoalsWithIndicators(managerId: string, year: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const goalsData = await db
    .select()
    .from(goals)
    .where(and(eq(goals.managerId, managerId), eq(goals.year, year)));

  if (goalsData.length === 0) return null;

  const goal = goalsData[0];
  const indicators = await getGoalIndicators(goal.id);

  return {
    goal,
    indicators: indicators.reduce(
      (acc, ind) => {
        acc[ind.indicatorName] = ind.targetValue ? parseFloat(ind.targetValue as any) : null;
        return acc;
      },
      {} as Record<string, number | null>
    ),
  };
}

/**
 * Deletar indicador
 */
export async function deleteGoalIndicator(indicatorId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(goalIndicators).where(eq(goalIndicators.id, indicatorId));
}

/**
 * Buscar indicador específico
 */
export async function getGoalIndicator(goalId: string, indicatorName: string): Promise<GoalIndicator | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(goalIndicators)
    .where(and(eq(goalIndicators.goalId, goalId), eq(goalIndicators.indicatorName, indicatorName)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
