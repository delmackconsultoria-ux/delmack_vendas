import { getDb } from "./server/db";
import { commissions, users, sales } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function testFinanceData() {
  const db = await getDb();
  if (!db) {
    console.log("Erro: Banco não conectado");
    process.exit(1);
  }

  console.log("=== TESTE DE DADOS FINANCEIROS ===\n");

  // Buscar dados da Baggio
  const baggioCompany = "company_1766331506068";

  // 1. Comissões à receber (pending + received)
  const allCommissions = await db.select().from(commissions).where(eq(commissions.companyId, baggioCompany));
  const pendingCommissions = allCommissions.filter(c => c.status === "pending" || c.status === "received");
  const paidCommissions = allCommissions.filter(c => c.status === "paid");

  console.log("1. COMISSÕES À RECEBER (pending + received):");
  console.log(`   Total: ${pendingCommissions.length} comissões`);
  const totalPending = pendingCommissions.reduce((sum, c) => {
    const value = typeof c.commissionValue === "string" ? parseFloat(c.commissionValue) : (c.commissionValue || 0);
    return sum + value;
  }, 0);
  console.log(`   Valor: R$ ${totalPending.toFixed(2)}\n`);

  // 2. Comissões recebidas (paid)
  console.log("2. COMISSÕES RECEBIDAS (paid):");
  console.log(`   Total: ${paidCommissions.length} comissões`);
  const totalPaid = paidCommissions.reduce((sum, c) => {
    const value = typeof c.commissionValue === "string" ? parseFloat(c.commissionValue) : (c.commissionValue || 0);
    return sum + value;
  }, 0);
  console.log(`   Valor: R$ ${totalPaid.toFixed(2)}\n`);

  // 3. VGV (Valor Geral de Vendas)
  const monthSales = await db.select().from(sales).where(eq(sales.companyId, baggioCompany));
  const vgv = monthSales.reduce((sum, s) => {
    const value = typeof s.saleValue === "string" ? parseFloat(s.saleValue) : (s.saleValue || 0);
    return sum + value;
  }, 0);

  console.log("3. VGV (Valor Geral de Vendas):");
  console.log(`   Total: ${monthSales.length} vendas`);
  console.log(`   Valor: R$ ${vgv.toFixed(2)}\n`);

  // 4. Detalhamento por gerente
  console.log("4. COMISSÕES RECEBIDAS POR GERENTE:");
  const brokerIds = new Set([...pendingCommissions.map(c => c.brokerId), ...paidCommissions.map(c => c.brokerId)]);
  const brokerMap = new Map();
  
  for (const brokerId of Array.from(brokerIds)) {
    const broker = await db.select().from(users).where(eq(users.id, brokerId)).limit(1);
    if (broker.length > 0) {
      brokerMap.set(brokerId, broker[0]);
    }
  }

  const managerBreakdown: Record<string, number> = {};
  paidCommissions.forEach(c => {
    const broker = brokerMap.get(c.brokerId);
    if (broker?.role === "manager") {
      const managerName = broker.name || "Desconhecido";
      const value = typeof c.commissionValue === "string" ? parseFloat(c.commissionValue) : (c.commissionValue || 0);
      managerBreakdown[managerName] = (managerBreakdown[managerName] || 0) + value;
    }
  });

  Object.entries(managerBreakdown).forEach(([manager, value]) => {
    console.log(`   ${manager}: R$ ${(value as number).toFixed(2)}`);
  });

  console.log("\n✅ Teste concluído!");
  process.exit(0);
}

testFinanceData().catch(err => {
  console.error("Erro:", err);
  process.exit(1);
});
