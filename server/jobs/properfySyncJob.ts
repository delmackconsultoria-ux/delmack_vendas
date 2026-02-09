import { syncAllProperties, getLastSyncTime } from "../services/properfySyncService";

/**
 * Job to sync all Properfy properties to local database
 * Should be executed daily (e.g., at 3 AM)
 */
export async function runProperfySyncJob(): Promise<void> {
  console.log("[ProperfySyncJob] Starting daily sync job...");
  const startTime = Date.now();

  try {
    const result = await syncAllProperties();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[ProperfySyncJob] Job completed in ${duration}s`);
    
    if (result.success && result.stats) {
      console.log(`[ProperfySyncJob] Total properties: ${result.stats.total}`);
      console.log(`[ProperfySyncJob] Inserted/Updated: ${result.stats.inserted}`);
      console.log(`[ProperfySyncJob] Errors: ${result.stats.errors}`);
    } else {
      console.error(`[ProperfySyncJob] Sync failed: ${result.message}`);
    }
  } catch (error) {
    console.error("[ProperfySyncJob] Job error:", error);
  }
}

/**
 * Initialize sync job scheduler
 * Runs daily at 3 AM
 */
export function initProperfySyncScheduler(): void {
  console.log("[ProperfySyncJob] Initializing scheduler...");

  // Calculate time until next 3 AM
  const now = new Date();
  const next3AM = new Date();
  next3AM.setHours(3, 0, 0, 0);
  
  if (next3AM <= now) {
    // If 3 AM already passed today, schedule for tomorrow
    next3AM.setDate(next3AM.getDate() + 1);
  }

  const msUntilNext3AM = next3AM.getTime() - now.getTime();

  console.log(`[ProperfySyncJob] Next sync scheduled for: ${next3AM.toISOString()}`);

  // Schedule first run
  setTimeout(() => {
    runProperfySyncJob();

    // Then run every 24 hours
    setInterval(() => {
      runProperfySyncJob();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, msUntilNext3AM);
}

/**
 * Manual trigger for testing
 */
export async function triggerManualSync(): Promise<void> {
  console.log("[ProperfySyncJob] Manual sync triggered");
  await runProperfySyncJob();
}

/**
 * Get last sync information
 */
export async function getLastSyncInfo(): Promise<{ lastSyncTime: Date | null }> {
  const lastSyncTime = await getLastSyncTime();
  return { lastSyncTime };
}
