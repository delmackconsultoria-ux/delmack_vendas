import { ENV } from "../_core/env";
import { batchUpsertPropertiesCache } from "../db/propertiesCache";

interface ProperfyProperty {
  id: string;
  chrReference?: string;
  chrDocument?: string;
  chrStatus?: string;
  dteNewListing?: string;
  dteTermination?: string;
  chrTerminationReason?: string;
  chrTypeListing?: string;
  dcmSaleValue?: number;
}

interface ProperfySyncResult {
  success: boolean;
  propertiesSynced: number;
  errors: string[];
  lastSyncAt: Date;
}

/**
 * Authenticate with Properfy API
 */
async function authenticatePropertyfy(): Promise<string | null> {
  try {
    const response = await fetch(`${ENV.properfyApiUrl}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vrcEmail: ENV.properfyEmail,
        vrcPass: ENV.properfyPassword,
      }),
    });

    if (!response.ok) {
      console.error("[ProperfySync] Authentication failed:", response.status);
      return null;
    }

    const data = await response.json();
    return data.token || data.access_token || null;
  } catch (error) {
    console.error("[ProperfySync] Authentication error:", error);
    return null;
  }
}

/**
 * Fetch all properties from Properfy
 */
async function fetchAllProperties(token: string): Promise<ProperfyProperty[]> {
  const allProperties: ProperfyProperty[] = [];
  let currentPage = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    try {
      const response = await fetch(
        `${ENV.properfyApiUrl}/properties?page=${currentPage}&per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(`[ProperfySync] Failed to fetch page ${currentPage}:`, response.status);
        break;
      }

      const data = await response.json();
      const properties = data.data || data.properties || [];

      if (properties.length === 0) {
        hasMorePages = false;
      } else {
        allProperties.push(...properties);
        console.log(`[ProperfySync] Fetched page ${currentPage}: ${properties.length} properties`);
        currentPage++;

        // Check if there are more pages
        if (data.meta && data.meta.last_page) {
          hasMorePages = currentPage <= data.meta.last_page;
        } else if (properties.length < 100) {
          hasMorePages = false;
        }
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[ProperfySync] Error fetching page ${currentPage}:`, error);
      hasMorePages = false;
    }
  }

  return allProperties;
}

/**
 * Sync properties from Properfy to local cache
 */
export async function syncProperfyProperties(companyId: string): Promise<ProperfySyncResult> {
  const errors: string[] = [];
  const startTime = Date.now();

  console.log("[ProperfySync] Starting sync for company:", companyId);

  try {
    // Step 1: Authenticate
    const token = await authenticatePropertyfy();
    if (!token) {
      errors.push("Failed to authenticate with Properfy");
      return {
        success: false,
        propertiesSynced: 0,
        errors,
        lastSyncAt: new Date(),
      };
    }

    console.log("[ProperfySync] Authentication successful");

    // Step 2: Fetch all properties
    const properties = await fetchAllProperties(token);
    console.log(`[ProperfySync] Fetched ${properties.length} properties from Properfy`);

    if (properties.length === 0) {
      errors.push("No properties found in Properfy");
      return {
        success: false,
        propertiesSynced: 0,
        errors,
        lastSyncAt: new Date(),
      };
    }

    // Step 3: Transform and save to cache
    const cacheData = properties.map(prop => ({
      companyId,
      properfyId: prop.id,
      chrReference: prop.chrReference || null,
      chrDocument: prop.chrDocument || null,
      chrStatus: prop.chrStatus || null,
      dteNewListing: prop.dteNewListing ? new Date(prop.dteNewListing) : null,
      dteTermination: prop.dteTermination ? new Date(prop.dteTermination) : null,
      chrTerminationReason: prop.chrTerminationReason || null,
      propertyType: prop.chrTypeListing || null,
      saleValue: prop.dcmSaleValue?.toString() || null,
    }));

    const syncedCount = await batchUpsertPropertiesCache(cacheData);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[ProperfySync] Sync completed in ${duration}s: ${syncedCount} properties synced`);

    return {
      success: true,
      propertiesSynced: syncedCount,
      errors,
      lastSyncAt: new Date(),
    };
  } catch (error) {
    console.error("[ProperfySync] Sync error:", error);
    errors.push(error instanceof Error ? error.message : "Unknown error");
    return {
      success: false,
      propertiesSynced: 0,
      errors,
      lastSyncAt: new Date(),
    };
  }
}
