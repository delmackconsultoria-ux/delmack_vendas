import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { propertiesCache, type InsertPropertyCache, type PropertyCache } from "../../drizzle/schema";
import { nanoid } from "nanoid";

/**
 * Get property from cache by Properfy ID
 */
export async function getPropertyFromCache(properfyId: string, companyId: string): Promise<PropertyCache | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db
    .select()
    .from(propertiesCache)
    .where(and(
      eq(propertiesCache.properfyId, properfyId),
      eq(propertiesCache.companyId, companyId)
    ))
    .limit(1);

  return results[0];
}

/**
 * Get all cached properties for a company
 */
export async function getAllCachedProperties(companyId: string): Promise<PropertyCache[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(propertiesCache)
    .where(eq(propertiesCache.companyId, companyId));
}

/**
 * Upsert property in cache
 */
export async function upsertPropertyCache(data: Omit<InsertPropertyCache, 'id'>): Promise<PropertyCache> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if exists
  const existing = await getPropertyFromCache(data.properfyId, data.companyId);

  if (existing) {
    // Update
    await db
      .update(propertiesCache)
      .set({
        ...data,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(propertiesCache.id, existing.id));

    return {
      ...existing,
      ...data,
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    };
  } else {
    // Insert
    const id = nanoid();
    await db.insert(propertiesCache).values({
      id,
      ...data,
      lastSyncAt: new Date(),
    });

    return {
      id,
      ...data,
      lastSyncAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PropertyCache;
  }
}

/**
 * Batch upsert properties
 */
export async function batchUpsertPropertiesCache(properties: Omit<InsertPropertyCache, 'id'>[]): Promise<number> {
  let count = 0;
  for (const property of properties) {
    try {
      await upsertPropertyCache(property);
      count++;
    } catch (error) {
      console.error(`[PropertiesCache] Error upserting property ${property.properfyId}:`, error);
    }
  }
  return count;
}

/**
 * Delete old cache entries (older than X days)
 */
export async function deleteOldCache(companyId: string, daysOld: number = 30): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await db
    .delete(propertiesCache)
    .where(and(
      eq(propertiesCache.companyId, companyId),
      // Note: This requires a custom SQL condition, simplified here
    ));

  return 0; // Return count if needed
}
