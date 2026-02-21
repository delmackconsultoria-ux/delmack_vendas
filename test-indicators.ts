import { getDb } from "./server/db";
import { sales, commissions } from "./drizzle/schema";

async function testIndicators() {
  try {
    const db = await getDb();
    if (!db) {
      console.log("Erro: Banco de dados não conectado");
      process.exit(1);
    }

    console.log("=== TESTANDO INDICADORES COM DADOS REAIS ===\n");

    // 1. Verificar campos da tabela commissions
    const sampleCommission = await db.select().from(commissions).limit(1);
    if (sampleCommission.length > 0) {
      console.log("Campos da tabela commissions:");
      Object.keys(sampleCommission[0]).forEach(key => {
        console.log(`  - ${key}`);
      });
    }

    // 2. Contar vendas da Baggio
    const allSales = await db.select().from(sales);
    const baggioSales = allSales.filter(s => s.companyId === 'company_1766331506068');
    console.log(`\nVendas na Baggio: ${baggioSales.length}`);

    // 3. Contar comissões da Baggio
    const allCommissions = await db.select().from(commissions);
    const baggioCommissions = allCommissions.filter(c => c.companyId === 'company_1766331506068');
    console.log(`Comissões na Baggio: ${baggioCommissions.length}`);

    // 4. Vendas com brokerVendedor preenchido
    const withBroker = baggioSales.filter(s => s.brokerVendedor && s.brokerVendedor.trim() !== '');
    console.log(`Vendas com brokerVendedor: ${withBroker.length}`);

    // 5. Calcular total de comissões
    const totalCommissions = baggioCommissions.reduce((sum, c) => {
      const value = typeof c.totalCommission === 'string' ? parseFloat(c.totalCommission) : (c.totalCommission || 0);
      return sum + value;
    }, 0);
    console.log(`Total de comissões: R$ ${totalCommissions.toFixed(2)}`);

    // 6. Comissões pagas
    const paidCommissions = baggioCommissions.filter(c => c.status === 'paid');
    const totalPaid = paidCommissions.reduce((sum, c) => {
      const value = typeof c.totalCommission === 'string' ? parseFloat(c.totalCommission) : (c.totalCommission || 0);
      return sum + value;
    }, 0);
    console.log(`Comissões pagas: ${paidCommissions.length} (R$ ${totalPaid.toFixed(2)})`);

    // 7. Comissões pendentes
    const pendingCommissions = baggioCommissions.filter(c => c.status !== 'paid');
    const totalPending = pendingCommissions.reduce((sum, c) => {
      const value = typeof c.totalCommission === 'string' ? parseFloat(c.totalCommission) : (c.totalCommission || 0);
      return sum + value;
    }, 0);
    console.log(`Comissões pendentes: ${pendingCommissions.length} (R$ ${totalPending.toFixed(2)})`);

    console.log("\n✅ Indicadores testados com sucesso!");

  } catch (error) {
    console.error("Erro:", error);
  }
  process.exit(0);
}

testIndicators();
