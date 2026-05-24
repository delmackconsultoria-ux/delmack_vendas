import 'dotenv/config';
import { syncAllProperties } from '../services/properfySyncService';

async function main() {
  console.log('[InitialSync] Starting Properfy synchronization...');
  const startTime = Date.now();
  
  try {
    const result = await syncAllProperties();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`[InitialSync] Sync completed in ${duration}s`);
    console.log(`[InitialSync] Result:`, JSON.stringify(result, null, 2));
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('[InitialSync] Error:', error);
    process.exit(1);
  }
}

main();
