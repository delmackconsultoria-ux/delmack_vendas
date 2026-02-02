import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { monthlyIndicators, type InsertMonthlyIndicator, type MonthlyIndicator } from "../../drizzle/schema";
import { nanoid } from "nanoid";

/**
 * Get monthly indicator by month and company
 */
export async function getMonthlyIndicator(month: string, companyId: string): Promise<MonthlyIndicator | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db
    .select()
    .from(monthlyIndicators)
    .where(and(
      eq(monthlyIndicators.month, month),
      eq(monthlyIndicators.companyId, companyId)
    ))
    .limit(1);

  return results[0];
}

/**
 * Get all monthly indicators for a company
 */
export async function getMonthlyIndicatorsByCompany(companyId: string): Promise<MonthlyIndicator[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(monthlyIndicators)
    .where(eq(monthlyIndicators.companyId, companyId))
    .orderBy(desc(monthlyIndicators.month));
}

/**
 * Create or update monthly indicator
 */
export async function upsertMonthlyIndicator(data: Omit<InsertMonthlyIndicator, 'id'>): Promise<MonthlyIndicator> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if exists
  const existing = await getMonthlyIndicator(data.month, data.companyId);

  if (existing) {
    // Update
    await db
      .update(monthlyIndicators)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(monthlyIndicators.id, existing.id));

    return {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
  } else {
    // Insert
    const id = nanoid();
    await db.insert(monthlyIndicators).values({
      id,
      ...data,
    });

    return {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as MonthlyIndicator;
  }
}

/**
 * Delete monthly indicator
 */
export async function deleteMonthlyIndicator(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(monthlyIndicators).where(eq(monthlyIndicators.id, id));
}
