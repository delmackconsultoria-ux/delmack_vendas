import { syncProperfyCards } from "../services/properfyCardsSyncService";

/**
 * Job to sync all Properfy cards (leads) to local database
 * Should be executed hourly
 */
export async function runProperfyCardsSyncJob(): Promise<void> {
  console.log("[ProperfyCardsSyncJob] Starting cards sync job...");
  const startTime = Date.now();

  try {
    await syncProperfyCards();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[ProperfyCardsSyncJob] Job completed in ${duration}s`);
  } catch (error) {
    console.error("[ProperfyCardsSyncJob] Job error:", error);
  }
}

/**
 * Initialize cards sync job scheduler
 * Runs every hour
 */
export function initProperfyCardsSyncScheduler(): void {
  console.log("[ProperfyCardsSyncJob] Initializing scheduler (every 1 hour)...");

  // Run immediately on startup
  console.log("[ProperfyCardsSyncJob] Running initial sync...");
  runProperfyCardsSyncJob().catch(err => 
    console.error("[ProperfyCardsSyncJob] Initial sync error:", err)
  );

  // Then run every hour
  const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
  setInterval(() => {
    console.log("[ProperfyCardsSyncJob] Running scheduled sync (every 1 hour)...");
    runProperfyCardsSyncJob().catch(err => 
      console.error("[ProperfyCardsSyncJob] Scheduled sync error:", err)
    );
  }, ONE_HOUR);

  console.log("[ProperfyCardsSyncJob] Scheduler initialized - syncing every 1 hour");
}

/**
 * Manual trigger for testing
 */
export async function triggerManualCardsSync(): Promise<void> {
  console.log("[ProperfyCardsSyncJob] Manual sync triggered");
  await runProperfyCardsSyncJob();
}
