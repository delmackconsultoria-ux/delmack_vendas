import { getDb } from "./server/db";
import { sales, users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function investigate() {
  try {
    const db = await getDb();
    if (!db) {
      console.log("Erro: Banco de dados não conectado");
      process.exit(1);
    }

    console.log("=== INVESTIGANDO VENDAS ===\n");

    // 1. Contar vendas
    const allSales = await db.select().from(sales);
    console.log(`Total de vendas: ${allSales.length}\n`);

    // 2. Verificar quantas têm brokerVendedor
    const withVendedor = allSales.filter(s => s.brokerVendedor && s.brokerVendedor.trim() !== '');
    console.log(`Vendas com brokerVendedor preenchido: ${withVendedor.length}`);

    // 3. Verificar quantas têm brokerAngariador
    const withAngariador = allSales.filter(s => s.brokerAngariador && s.brokerAngariador.trim() !== '');
    console.log(`Vendas com brokerAngariador preenchido: ${withAngariador.length}\n`);

    // 4. Listar primeiras 5 vendas
    console.log("=== PRIMEIRAS 5 VENDAS ===");
    allSales.slice(0, 5).forEach((sale, i) => {
      console.log(`\n${i + 1}. ${sale.buyerName}`);
      console.log(`   ID: ${sale.id}`);
      console.log(`   Vendedor: ${sale.brokerVendedor || 'VAZIO'}`);
      console.log(`   Angariador: ${sale.brokerAngariador || 'VAZIO'}`);
      console.log(`   CompanyId: ${sale.companyId}`);
    });

    // 5. Listar corretores da Baggio
    console.log("\n=== CORRETORES DA BAGGIO ===");
    const baggio = await db.select().from(users).where(eq(users.companyId, 'company_1766331506068'));
    const brokers = baggio.filter(u => u.role === 'broker');
    console.log(`Total de corretores: ${brokers.length}`);
    brokers.slice(0, 5).forEach((broker, i) => {
      console.log(`${i + 1}. ${broker.name} (ID: ${broker.id})`);
    });

  } catch (error) {
    console.error("Erro:", error);
  }
  process.exit(0);
}

investigate();
