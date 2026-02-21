import { getDb } from "./server/db";
import { sales, commissions } from "./drizzle/schema";

async function recalculateCommissions() {
  try {
    const db = await getDb();
    if (!db) {
      console.log("Erro: Banco de dados não conectado");
      process.exit(1);
    }

    console.log("=== VERIFICANDO VALORES DE VENDAS E COMISSÕES ===\n");

    // 1. Listar vendas com seus valores
    const allSales = await db.select().from(sales);
    const baggioSales = allSales.filter(s => s.companyId === 'company_1766331506068');
    
    console.log("Primeiras 5 vendas:");
    baggioSales.slice(0, 5).forEach((sale, i) => {
      const value = typeof sale.saleValue === 'string' ? parseFloat(sale.saleValue) : (sale.saleValue || 0);
      console.log(`${i + 1}. ${sale.buyerName} - R$ ${value.toFixed(2)}`);
    });

    // 2. Calcular total de vendas
    const totalSalesValue = baggioSales.reduce((sum, s) => {
      const value = typeof s.saleValue === 'string' ? parseFloat(s.saleValue) : (s.saleValue || 0);
      return sum + value;
    }, 0);
    console.log(`\nTotal de vendas: R$ ${totalSalesValue.toFixed(2)}`);

    // 3. Listar comissões
    const allCommissions = await db.select().from(commissions);
    const baggioCommissions = allCommissions.filter(c => c.companyId === 'company_1766331506068');
    
    console.log(`\nComissões no banco: ${baggioCommissions.length}`);
    baggioCommissions.slice(0, 5).forEach((comm, i) => {
      const value = typeof comm.commissionValue === 'string' ? parseFloat(comm.commissionValue) : (comm.commissionValue || 0);
      const percentage = typeof comm.commissionPercentage === 'string' ? parseFloat(comm.commissionPercentage) : (comm.commissionPercentage || 0);
      console.log(`${i + 1}. Venda: ${comm.saleId} - Valor: R$ ${value.toFixed(2)} - %: ${percentage}%`);
    });

    console.log("\n✅ Verificação concluída!");

  } catch (error) {
    console.error("Erro:", error);
  }
  process.exit(0);
}

recalculateCommissions();
