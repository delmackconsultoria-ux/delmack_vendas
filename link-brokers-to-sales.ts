import { getDb } from "./server/db";
import { sales, users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function linkBrokersToSales() {
  try {
    const db = await getDb();
    if (!db) {
      console.log("Erro: Banco de dados não conectado");
      process.exit(1);
    }

    console.log("=== VINCULANDO VENDAS AOS CORRETORES ===\n");

    // 1. Obter todos os corretores da Baggio
    const baggio = await db.select().from(users).where(eq(users.companyId, 'company_1766331506068'));
    const brokers = baggio.filter(u => u.role === 'broker');
    console.log(`Corretores disponíveis: ${brokers.length}`);
    brokers.forEach((b, i) => {
      console.log(`${i + 1}. ${b.name} (ID: ${b.id})`);
    });

    // 2. Obter todas as vendas
    const allSales = await db.select().from(sales).where(eq(sales.companyId, 'company_1766331506068'));
    console.log(`\nVendas na Baggio: ${allSales.length}`);

    // 3. Vincular vendas aos corretores (distribuir entre os corretores)
    if (brokers.length === 0) {
      console.log("Erro: Nenhum corretor encontrado!");
      process.exit(1);
    }

    let updated = 0;
    for (let i = 0; i < allSales.length; i++) {
      const sale = allSales[i];
      const brokerIndex = i % brokers.length;
      const broker = brokers[brokerIndex];

      // Atualizar venda com ID do corretor
      await db.update(sales)
        .set({
          brokerVendedor: broker.id,
          brokerAngariador: broker.id,
        })
        .where(eq(sales.id, sale.id));

      console.log(`✓ Venda ${i + 1}: Vinculada a ${broker.name}`);
      updated++;
    }

    console.log(`\n✅ ${updated} vendas vinculadas aos corretores!`);

  } catch (error) {
    console.error("Erro:", error);
  }
  process.exit(0);
}

linkBrokersToSales();
