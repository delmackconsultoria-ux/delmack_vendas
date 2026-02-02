import { syncProperfyProperties } from "../services/properfySyncService";
import { getDb } from "../db";
import { companies } from "../../drizzle/schema";

/**
 * Job to sync Properfy properties for all companies
 * Should be executed daily (e.g., at 2 AM)
 */
export async function runProperfySyncJob(): Promise<void> {
  console.log("[ProperfySyncJob] Starting daily sync job...");
  const startTime = Date.now();

  try {
    // Get all active companies
    const db = await getDb();
    if (!db) {
      console.error("[ProperfySyncJob] Database not available");
      return;
    }

    const allCompanies = await db.select().from(companies);
    console.log(`[ProperfySyncJob] Found ${allCompanies.length} companies to sync`);

    // Sync each company
    const results = [];
    for (const company of allCompanies) {
      console.log(`[ProperfySyncJob] Syncing company: ${company.name} (${company.id})`);
      
      try {
        const result = await syncProperfyProperties(company.id);
        results.push({
          companyId: company.id,
          companyName: company.name,
          ...result,
        });

        // Add delay between companies to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[ProperfySyncJob] Error syncing company ${company.id}:`, error);
        results.push({
          companyId: company.id,
          companyName: company.name,
          success: false,
          propertiesSynced: 0,
          errors: [error instanceof Error ? error.message : "Unknown error"],
          lastSyncAt: new Date(),
        });
      }
    }

    // Summary
    const totalSynced = results.reduce((sum, r) => sum + r.propertiesSynced, 0);
    const successCount = results.filter(r => r.success).length;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[ProperfySyncJob] Job completed in ${duration}s`);
    console.log(`[ProperfySyncJob] Companies synced: ${successCount}/${allCompanies.length}`);
    console.log(`[ProperfySyncJob] Total properties synced: ${totalSynced}`);

    // Log errors
    const failedCompanies = results.filter(r => !r.success);
    if (failedCompanies.length > 0) {
      console.error(`[ProperfySyncJob] Failed companies:`, failedCompanies);
    }
  } catch (error) {
    console.error("[ProperfySyncJob] Job error:", error);
  }
}

/**
 * Initialize sync job scheduler
 * Runs daily at 2 AM
 */
export function initProperfySyncScheduler(): void {
  console.log("[ProperfySyncJob] Initializing scheduler...");

  // Calculate time until next 2 AM
  const now = new Date();
  const next2AM = new Date();
  next2AM.setHours(2, 0, 0, 0);
  
  if (next2AM <= now) {
    // If 2 AM already passed today, schedule for tomorrow
    next2AM.setDate(next2AM.getDate() + 1);
  }

  const msUntilNext2AM = next2AM.getTime() - now.getTime();

  console.log(`[ProperfySyncJob] Next sync scheduled for: ${next2AM.toISOString()}`);

  // Schedule first run
  setTimeout(() => {
    runProperfySyncJob();

    // Then run every 24 hours
    setInterval(() => {
      runProperfySyncJob();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, msUntilNext2AM);
}

/**
 * Manual trigger for testing
 */
export async function triggerManualSync(companyId?: string): Promise<void> {
  if (companyId) {
    console.log(`[ProperfySyncJob] Manual sync triggered for company: ${companyId}`);
    await syncProperfyProperties(companyId);
  } else {
    console.log("[ProperfySyncJob] Manual sync triggered for all companies");
    await runProperfySyncJob();
  }
}
