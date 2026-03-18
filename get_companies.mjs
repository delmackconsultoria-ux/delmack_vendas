import { getDb } from './server/db.ts';
import { companies, users, sales, goals } from './drizzle/schema.ts';
import { count } from 'drizzle-orm';

const db = await getDb();
if (db) {
  const companiesList = await db.select().from(companies);
  
  console.log('\n=== EMPRESAS NO BANCO DE DADOS ===\n');
  
  for (const company of companiesList) {
    const userCount = await db.select({ count: count() }).from(users).where(users.companyId === company.id);
    const salesCount = await db.select({ count: count() }).from(sales).where(sales.companyId === company.id);
    const goalsCount = await db.select({ count: count() }).from(goals).where(goals.companyId === company.id);
    
    console.log(`ID: ${company.id}`);
    console.log(`Nome: ${company.name}`);
    console.log(`Usuários: ${userCount[0]?.count || 0}`);
    console.log(`Vendas: ${salesCount[0]?.count || 0}`);
    console.log(`Metas: ${goalsCount[0]?.count || 0}`);
    console.log('---');
  }
} else {
  console.log('Database not available');
}
