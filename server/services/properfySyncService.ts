import { getDb } from "../db";
import { properfyProperties } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const envUrl = process.env.PROPERFY_API_URL || 'https://sandbox.properfy.com.br/api';
const PROPERFY_API_URL = envUrl.replace('/auth/token', '').replace(/\/$/, '');
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || '';

interface ProperfyPropertyRaw {
  id: number;
  chrReference: string;
  chrInnerReference?: string;
  chrType?: string;
  chrStatus?: string;
  chrTransactionType?: string;
  dcmAreaTotal?: number;
  dcmAreaPrivate?: number;
  dcmAreaUsable?: number;
  dcmAreaBuilt?: number;
  intRooms?: number;
  intBedrooms?: number;
  intSuites?: number;
  intBathrooms?: number;
  intGarage?: number;
  dcmSale?: number;
  dcmRentNetValue?: number;
  dcmCondoValue?: number;
  dcmPropertyTax?: number;
  chrAddressPostalCode?: string;
  chrAddressStreet?: string;
  chrAddressNumber?: string;
  chrAddressComplement?: string;
  chrAddressNeighborhood?: string;
  chrAddressCity?: string;
  chrAddressCityCode?: string;
  chrAddressState?: string;
  chrCondoName?: string;
  fkCondo?: number;
  intBuiltYear?: number;
  intFloors?: number;
  // Indicadores
  dteNewListing?: string | Date; // Data de angariação
  dteTermination?: string | Date; // Data de baixa/remoção
  chrPurpose?: string; // Finalidade: SALE, RENT, etc
  isLaunched?: boolean; // Se é lançamento
  fkCompany?: string; // ID da imobiliária/empresa
}

/**
 * Sync all properties from Properfy API to local database
 * This function fetches all properties and upserts them into properfyProperties table
 */
export async function syncAllProperties(): Promise<{ success: boolean; message: string; stats?: { total: number; inserted: number; updated: number; errors: number } }> {
  console.log('[ProperfySync] Starting full sync...');
  
  if (!PROPERFY_API_URL || !PROPERFY_API_TOKEN) {
    const error = '[ProperfySync] Missing PROPERFY_API_URL or PROPERFY_API_TOKEN';
    console.error(error);
    return { success: false, message: error };
  }

  const db = await getDb();
  if (!db) {
    const error = '[ProperfySync] Database not available';
    console.error(error);
    return { success: false, message: error };
  }

  try {
    const startTime = Date.now();
    let totalProperties = 0;
    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let propertiesWithDates = 0;

    // Fetch first page to get total count
    console.log('[ProperfySync] Fetching first page to determine total...');
    const firstPageResponse = await fetch(`${PROPERFY_API_URL}/property/property?page=1&size=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!firstPageResponse.ok) {
      throw new Error(`API returned ${firstPageResponse.status}`);
    }

    const firstPageData = await firstPageResponse.json();
    const totalPages = firstPageData.last_page || 1;
    totalProperties = firstPageData.max || 0;

    console.log(`[ProperfySync] Found ${totalProperties} properties across ${totalPages} pages`);

    // Process first page
    if (firstPageData.data && Array.isArray(firstPageData.data)) {
      for (const property of firstPageData.data) {
        try {
          await upsertProperty(db, property);
          insertedCount++;
        } catch (error) {
          console.error(`[ProperfySync] Error upserting property ${property.id}:`, error);
          errorCount++;
        }
      }
    }

    // Fetch remaining pages in parallel batches
    const batchSize = 20; // Process 20 pages at a time
    for (let batchStart = 2; batchStart <= totalPages; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, totalPages);
      console.log(`[ProperfySync] Processing pages ${batchStart}-${batchEnd}...`);

      const batchPromises = [];
      for (let page = batchStart; page <= batchEnd; page++) {
        batchPromises.push(
          fetch(`${PROPERFY_API_URL}/property/property?page=${page}&size=100`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          })
          .then(res => res.ok ? res.json() : null)
          .then(data => ({ page, data }))
          .catch(err => {
            console.error(`[ProperfySync] Error fetching page ${page}:`, err);
            return { page, data: null };
          })
        );
      }

      const results = await Promise.all(batchPromises);

      for (const { page, data } of results) {
        if (!data?.data || !Array.isArray(data.data)) {
          console.warn(`[ProperfySync] No data in page ${page}`);
          continue;
        }

        for (const property of data.data) {
          try {
            // Debug: Count properties with dates
            if (property.dteNewListing || property.dteTermination) {
              propertiesWithDates++;
            }
            await upsertProperty(db, property);
            insertedCount++;
          } catch (error) {
            console.error(`[ProperfySync] Error upserting property ${property.id}:`, error);
            errorCount++;
          }
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const message = `[ProperfySync] Sync completed in ${duration}s. Total: ${totalProperties}, Inserted/Updated: ${insertedCount}, Errors: ${errorCount}, Properties with dates: ${propertiesWithDates}`;
    console.log(message);

    return {
      success: true,
      message,
      stats: {
        total: totalProperties,
        inserted: insertedCount,
        updated: updatedCount,
        errors: errorCount
      }
    };

  } catch (error) {
    const errorMessage = `[ProperfySync] Sync failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }
}

/**
 * Upsert a single property into the database
 */
async function upsertProperty(db: any, property: ProperfyPropertyRaw): Promise<void> {
  const values = {
    id: property.id,
    chrReference: property.chrReference || '',
    chrInnerReference: property.chrInnerReference || null,
    chrType: property.chrType || null,
    chrStatus: property.chrStatus || null,
    chrTransactionType: property.chrTransactionType || null,
    dcmAreaTotal: property.dcmAreaTotal?.toString() || null,
    dcmAreaPrivate: property.dcmAreaPrivate?.toString() || null,
    dcmAreaUsable: property.dcmAreaUsable?.toString() || null,
    dcmAreaBuilt: property.dcmAreaBuilt?.toString() || null,
    intRooms: property.intRooms || null,
    intBedrooms: property.intBedrooms || null,
    intSuites: property.intSuites || null,
    intBathrooms: property.intBathrooms || null,
    intGarage: property.intGarage || null,
    dcmSale: property.dcmSale?.toString() || null,
    dcmRentNetValue: property.dcmRentNetValue?.toString() || null,
    dcmCondoValue: property.dcmCondoValue?.toString() || null,
    dcmPropertyTax: property.dcmPropertyTax?.toString() || null,
    chrAddressPostalCode: property.chrAddressPostalCode || null,
    chrAddressStreet: property.chrAddressStreet || null,
    chrAddressNumber: property.chrAddressNumber || null,
    chrAddressComplement: property.chrAddressComplement || null,
    chrAddressNeighborhood: property.chrAddressNeighborhood || null,
    chrAddressCity: property.chrAddressCity || null,
    chrAddressCityCode: property.chrAddressCityCode || null,
    chrAddressState: property.chrAddressState || null,
    chrCondoName: property.chrCondoName || null,
    fkCondo: property.fkCondo || null,
    intBuiltYear: property.intBuiltYear || null,
    intFloors: property.intFloors || null,
    // Indicadores
    dteNewListing: property.dteNewListing ? new Date(property.dteNewListing) : null,
    dteTermination: property.dteTermination ? new Date(property.dteTermination) : null,
    chrPurpose: property.chrPurpose || null,
    isActive: 1, // Padrão ativo
    companyId: property.fkCompany || null,
    lastSyncedAt: new Date(),
  };

  // Check if property exists
  const existing = await db
    .select()
    .from(properfyProperties)
    .where(eq(properfyProperties.id, property.id))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(properfyProperties)
      .set(values)
      .where(eq(properfyProperties.id, property.id));
  } else {
    // Insert new
    await db.insert(properfyProperties).values(values);
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select({ lastSyncedAt: properfyProperties.lastSyncedAt })
      .from(properfyProperties)
      .orderBy(properfyProperties.lastSyncedAt)
      .limit(1);

    return result.length > 0 ? result[0].lastSyncedAt : null;
  } catch (error) {
    console.error('[ProperfySync] Error getting last sync time:', error);
    return null;
  }
}
