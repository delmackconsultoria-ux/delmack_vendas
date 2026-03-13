import { getDb } from "./server/db.ts";
import { properfyProperties } from "./drizzle/schema.ts";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

async function testIndicators() {
  const db = await getDb();
  if (!db) {
    console.log("Database not available");
    return;
  }

  const companyId = 'company_1766331506068';
  
  // Test 1: Active Properties
  console.log("\n=== Test 1: Active Properties ===");
  const activeResult = await db
    .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
    .from(properfyProperties)
    .where(
      and(
        eq(properfyProperties.chrStatus, "LISTED"),
        eq(properfyProperties.isActive, 1),
        sql`${properfyProperties.chrPurpose} LIKE '%SALE%'`,
        eq(properfyProperties.companyId, companyId)
      )
    );
  console.log("Active Properties:", activeResult[0]?.count || 0);

  // Test 2: Angariations this month
  console.log("\n=== Test 2: Angariations this month ===");
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const angariationResult = await db
    .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
    .from(properfyProperties)
    .where(
      and(
        isNotNull(properfyProperties.dteNewListing),
        gte(properfyProperties.dteNewListing, startOfMonth),
        lte(properfyProperties.dteNewListing, endOfMonth),
        eq(properfyProperties.companyId, companyId)
      )
    );
  console.log("Angariations:", angariationResult[0]?.count || 0);

  // Test 3: Removals this month
  console.log("\n=== Test 3: Removals this month ===");
  const removalResult = await db
    .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
    .from(properfyProperties)
    .where(
      and(
        isNotNull(properfyProperties.dteTermination),
        gte(properfyProperties.dteTermination, startOfMonth),
        lte(properfyProperties.dteTermination, endOfMonth),
        eq(properfyProperties.companyId, companyId)
      )
    );
  console.log("Removals:", removalResult[0]?.count || 0);

  // Test 4: Average value
  console.log("\n=== Test 4: Average value ===");
  const avgResult = await db
    .select({ avg: sql<number>`AVG(${properfyProperties.dcmSale})` })
    .from(properfyProperties)
    .where(eq(properfyProperties.companyId, companyId));
  console.log("Average value:", avgResult[0]?.avg || 0);

  process.exit(0);
}

testIndicators().catch(console.error);
