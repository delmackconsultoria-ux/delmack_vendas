import { drizzle } from "drizzle-orm/mysql2";
import { sales, users, brokers } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

// Verificar vendas importadas
const allSales = await db.select().from(sales).limit(5);
console.log("\n=== VENDAS IMPORTADAS (primeiras 5) ===");
allSales.forEach(s => {
  console.log(`ID: ${s.id} | Comprador: ${s.buyerName} | CompanyID: ${s.companyId} | BrokerID: ${s.brokerId}`);
});

// Verificar corretores
const allBrokers = await db.select().from(brokers).limit(10);
console.log("\n=== CORRETORES CADASTRADOS ===");
allBrokers.forEach(b => {
  console.log(`ID: ${b.id} | Nome: ${b.name} | CompanyID: ${b.companyId}`);
});

// Verificar usuário Carolina
const carolina = await db.select().from(users).where(eq(users.name, "Carolina Cardoso")).limit(1);
console.log("\n=== USUÁRIO CAROLINA ===");
console.log(carolina[0]);

process.exit(0);
