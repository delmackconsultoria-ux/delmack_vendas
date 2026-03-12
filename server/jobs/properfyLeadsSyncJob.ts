import { syncProperfyLeads } from "../indicators/properfyLeadsSync";

/**
 * Job to sync all Properfy leads to local database
 * Should be executed hourly
 */
export async function runProperfyLeadsSyncJob(): Promise<void> {
  console.log("[ProperfyLeadsSyncJob] Starting leads sync job...");
  const startTime = Date.now();

  try {
    const result = await syncProperfyLeads();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[ProperfyLeadsSyncJob] Job completed in ${duration}s`);
    
    if (result) {
      console.log(`[ProperfyLeadsSyncJob] Total leads: ${result.total}`);
      console.log(`[ProperfyLeadsSyncJob] Inserted: ${result.inserted}`);
      console.log(`[ProperfyLeadsSyncJob] Updated: ${result.updated}`);
    }
  } catch (error) {
    console.error("[ProperfyLeadsSyncJob] Job error:", error);
  }
}

/**
 * Initialize leads sync job scheduler
 * Runs every hour
 */
export function initProperfyLeadsSyncScheduler(): void {
  console.log("[ProperfyLeadsSyncJob] Initializing scheduler (every 1 hour)...");

  // Run immediately on startup
  console.log("[ProperfyLeadsSyncJob] Running initial sync...");
  runProperfyLeadsSyncJob().catch(err => 
    console.error("[ProperfyLeadsSyncJob] Initial sync error:", err)
  );

  // Then run every hour
  const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
  setInterval(() => {
    console.log("[ProperfyLeadsSyncJob] Running scheduled sync (every 1 hour)...");
    runProperfyLeadsSyncJob().catch(err => 
      console.error("[ProperfyLeadsSyncJob] Scheduled sync error:", err)
    );
  }, ONE_HOUR);

  console.log("[ProperfyLeadsSyncJob] Scheduler initialized - syncing every 1 hour");
}

/**
 * Manual trigger for testing
 */
export async function triggerManualLeadsSync(): Promise<void> {
  console.log("[ProperfyLeadsSyncJob] Manual sync triggered");
  await runProperfyLeadsSyncJob();
}
