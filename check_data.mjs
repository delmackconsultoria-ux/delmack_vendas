import { drizzle } from 'drizzle-orm/mysql2';
import { eq, like } from 'drizzle-orm';
import { sales, users, companies } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

// Buscar empresa B I IMOVEIS
const company = await db.select().from(companies).where(like(companies.name, '%B I IMOVEIS%')).limit(1);
console.log('Empresa:', company[0]);

// Buscar Camila
const camila = await db.select().from(users).where(like(users.email, '%camila%')).limit(1);
console.log('Camila:', camila[0]);

// Buscar vendas da empresa
const salesCount = await db.select().from(sales).where(eq(sales.companyId, company[0].id));
console.log('Total vendas:', salesCount.length);
console.log('Primeiras 3 vendas:', salesCount.slice(0, 3));
