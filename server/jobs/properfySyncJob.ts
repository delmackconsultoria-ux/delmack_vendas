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
 * Runs every 2 hours
 */
export function initProperfySyncScheduler(): void {
  console.log("[ProperfySyncJob] Initializing scheduler (every 2 hours)...");

  // NÃO executar sync na inicialização - esperar o primeiro intervalo
  // console.log("[ProperfySyncJob] Running initial sync...");
  // runProperfySyncJob().catch(err => 
  //   console.error("[ProperfySyncJob] Initial sync error:", err)
  // );

  // Executar a cada 2 horas (mas não na inicialização)
  const TWO_HOURS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  setInterval(() => {
    console.log("[ProperfySyncJob] Running scheduled sync (every 2 hours)...");
    runProperfySyncJob().catch(err => 
      console.error("[ProperfySyncJob] Scheduled sync error:", err)
    );
  }, TWO_HOURS);
  console.log("[ProperfySyncJob] Scheduler initialized - syncing every 2 hours");
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
