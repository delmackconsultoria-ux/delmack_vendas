import { getDb } from "./server/db";
import { sales, commissions, users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function finalTests() {
  try {
    const db = await getDb();
    if (!db) {
      console.log("Erro: Banco de dados não conectado");
      process.exit(1);
    }

    console.log("=== TESTES FINAIS ===\n");

    // TESTE 2: Verificar se corretores têm vendas/comissões
    console.log("TESTE 2 - GERENCIAMENTO DE CORRETORES");
    const baggio = await db.select().from(users).where(eq(users.companyId, 'company_1766331506068'));
    const brokers = baggio.filter(u => u.role === 'broker');
    
    let brokersWithData = 0;
    for (const broker of brokers.slice(0, 5)) {
      const brokerSales = await db.select().from(sales).where(eq(sales.brokerVendedor, broker.id));
      const brokerCommissions = await db.select().from(commissions).where(eq(commissions.brokerId, broker.id));
      
      if (brokerSales.length > 0 || brokerCommissions.length > 0) {
        brokersWithData++;
        console.log(`✓ ${broker.name}: ${brokerSales.length} vendas, ${brokerCommissions.length} comissões`);
      }
    }
    console.log(`Corretores com dados: ${brokersWithData}/5\n`);

    // TESTE 3: Validar indicadores
    console.log("TESTE 3 - INDICADORES");
    const allSales = await db.select().from(sales).where(eq(sales.companyId, 'company_1766331506068'));
    const allCommissions = await db.select().from(commissions).where(eq(commissions.companyId, 'company_1766331506068'));
    
    const totalSalesValue = allSales.reduce((sum, s) => {
      const value = typeof s.saleValue === 'string' ? parseFloat(s.saleValue) : (s.saleValue || 0);
      return sum + value;
    }, 0);
    
    const totalCommissionValue = allCommissions.reduce((sum, c) => {
      const value = typeof c.commissionValue === 'string' ? parseFloat(c.commissionValue) : (c.commissionValue || 0);
      return sum + value;
    }, 0);
    
    const paidCommissions = allCommissions.filter(c => c.status === 'paid');
    const totalPaidValue = paidCommissions.reduce((sum, c) => {
      const value = typeof c.commissionValue === 'string' ? parseFloat(c.commissionValue) : (c.commissionValue || 0);
      return sum + value;
    }, 0);
    
    const percentageCommission = totalSalesValue > 0 ? (totalCommissionValue / totalSalesValue) * 100 : 0;
    
    console.log(`Negócios no mês (unidades): ${allSales.length}`);
    console.log(`Valor total vendido: R$ ${totalSalesValue.toFixed(2)}`);
    console.log(`Comissão Vendida: R$ ${totalCommissionValue.toFixed(2)}`);
    console.log(`Comissão Recebida (Paga): R$ ${totalPaidValue.toFixed(2)} (${paidCommissions.length} comissões)`);
    console.log(`% Comissão Vendida: ${percentageCommission.toFixed(2)}%`);
    console.log(`Negócios acima de 1M: ${allSales.filter(s => {
      const value = typeof s.saleValue === 'string' ? parseFloat(s.saleValue) : (s.saleValue || 0);
      return value >= 1000000;
    }).length}\n`);

    // TESTE 5: Ranking
    console.log("TESTE 5 - RANKING");
    const rankingData: Record<string, { vendas: number; valor: number; comissoes: number }> = {};
    
    for (const broker of brokers) {
      const brokerSales = await db.select().from(sales).where(eq(sales.brokerVendedor, broker.id));
      const brokerCommissions = await db.select().from(commissions).where(eq(commissions.brokerId, broker.id));
      
      const valor = brokerSales.reduce((sum, s) => {
        const value = typeof s.saleValue === 'string' ? parseFloat(s.saleValue) : (s.saleValue || 0);
        return sum + value;
      }, 0);
      
      if (brokerSales.length > 0) {
        rankingData[broker.name] = {
          vendas: brokerSales.length,
          valor: valor,
          comissoes: brokerCommissions.length
        };
      }
    }
    
    const topBrokers = Object.entries(rankingData)
      .sort((a, b) => b[1].valor - a[1].valor)
      .slice(0, 5);
    
    console.log("Top 5 Corretores por Valor:");
    topBrokers.forEach((entry, i) => {
      console.log(`${i + 1}. ${entry[0]}: R$ ${entry[1].valor.toFixed(2)} (${entry[1].vendas} vendas)`);
    });

    console.log("\n✅ Testes finalizados!");

  } catch (error) {
    console.error("Erro:", error);
  }
  process.exit(0);
}

finalTests();
