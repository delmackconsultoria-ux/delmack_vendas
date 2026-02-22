import { getDb } from "./server/db";
import { commissions } from "./drizzle/schema";

async function checkStatus() {
  const db = await getDb();
  if (!db) {
    console.log("Erro: Banco não conectado");
    process.exit(1);
  }

  // Buscar todas as comissões com seus status
  const allCommissions = await db.select().from(commissions);
  
  console.log("=== STATUS DAS COMISSÕES NO BANCO ===\n");
  
  const statusCount: Record<string, number> = {};
  allCommissions.forEach(c => {
    statusCount[c.status] = (statusCount[c.status] || 0) + 1;
  });

  console.log("Status encontrados:");
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count} comissões`);
  });

  console.log("\nExemplos de comissões por status:");
  Object.keys(statusCount).forEach(status => {
    const example = allCommissions.find(c => c.status === status);
    if (example) {
      console.log(`\n${status}:`);
      console.log(`  - ID: ${example.id}`);
      console.log(`  - Valor: R$ ${example.commissionValue}`);
      console.log(`  - Tipo: ${example.type}`);
      console.log(`  - Data de Pagamento: ${example.paymentDate}`);
    }
  });

  process.exit(0);
}

checkStatus().catch(err => {
  console.error("Erro:", err);
  process.exit(1);
});
