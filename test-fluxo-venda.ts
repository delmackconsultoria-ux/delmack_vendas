import { getDb } from "./server/db";
import { sales, commissions } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function testFluxoVenda() {
  const db = await getDb();
  if (!db) {
    console.log("Erro: Banco não conectado");
    process.exit(1);
  }

  console.log("=== TESTE DO FLUXO COMPLETO DE VENDA ===\n");

  // Buscar uma venda para teste
  const testSale = await db.select().from(sales).limit(1);
  
  if (testSale.length === 0) {
    console.log("❌ Nenhuma venda encontrada no banco");
    process.exit(1);
  }

  const sale = testSale[0];
  console.log("📋 VENDA SELECIONADA PARA TESTE:");
  console.log(`   ID: ${sale.id}`);
  console.log(`   Comprador: ${sale.buyerName}`);
  console.log(`   Valor: R$ ${sale.saleValue}`);
  console.log(`   Status Atual: ${sale.status}\n`);

  // Buscar comissões da venda
  const saleCommissions = await db
    .select()
    .from(commissions)
    .where(eq(commissions.saleId, sale.id));

  console.log("💰 COMISSÕES DA VENDA:");
  console.log(`   Total: ${saleCommissions.length} comissões`);
  saleCommissions.forEach((c, i) => {
    console.log(`   ${i + 1}. Tipo: ${c.type}, Status: ${c.status}, Valor: R$ ${c.commissionValue}`);
  });

  console.log("\n📊 FLUXO ESPERADO:");
  console.log("   1. ✅ Nova Venda (status: 'pending')");
  console.log("   2. ⏳ Aprovação do Gerente (status: 'manager_review')");
  console.log("   3. ⏳ Aprovação do Financeiro (status: 'finance_review')");
  console.log("   4. ⏳ Comissão Paga (status: 'commission_paid')");
  console.log("   5. ⏳ Anexar NF para comprovar pagamento\n");

  console.log("✅ Teste concluído!");
  process.exit(0);
}

testFluxoVenda().catch(err => {
  console.error("Erro:", err);
  process.exit(1);
});
