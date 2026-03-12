import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Consultar corretores reais ordenados por companyId
const [brokers] = await connection.execute(
  `SELECT id, name, email, companyId, role FROM users 
   WHERE role = 'broker' 
   ORDER BY companyId, name ASC`
);

console.log(`\n📊 Total de corretores encontrados: ${brokers.length}\n`);

// Agrupar por companyId
const brokersByCompany = {};
brokers.forEach(broker => {
  const company = broker.companyId || 'unknown';
  if (!brokersByCompany[company]) {
    brokersByCompany[company] = [];
  }
  brokersByCompany[company].push(broker);
});

// Gerar novos IDs e preparar updates
let updateCount = 0;
const updates = [];

for (const [company, companyBrokers] of Object.entries(brokersByCompany)) {
  console.log(`\n🏢 Empresa: ${company}`);
  console.log(`   Corretores: ${companyBrokers.length}`);
  
  companyBrokers.forEach((broker, index) => {
    const newId = `broker_${company.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${String(index + 1).padStart(3, '0')}`;
    updates.push({
      oldId: broker.id,
      newId: newId,
      name: broker.name,
      email: broker.email,
      company: company
    });
    console.log(`   ${index + 1}. ${broker.name} (${broker.email})`);
    console.log(`      ID Antigo: ${broker.id}`);
    console.log(`      ID Novo:  ${newId}`);
  });
}

console.log(`\n\n⚠️  RESUMO DAS ALTERAÇÕES:`);
console.log(`Total de corretores a atualizar: ${updates.length}`);

// Executar updates
console.log(`\n🔄 Iniciando atualização de IDs...\n`);

for (const update of updates) {
  try {
    await connection.execute(
      'UPDATE users SET id = ? WHERE id = ?',
      [update.newId, update.oldId]
    );
    console.log(`✅ ${update.name}: ${update.oldId} → ${update.newId}`);
    updateCount++;
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${update.name}: ${error.message}`);
  }
}

console.log(`\n✅ Atualização concluída: ${updateCount}/${updates.length} corretores`);

await connection.end();
