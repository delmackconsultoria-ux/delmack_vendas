import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('=== VERIFICANDO ESTRUTURA DO BANCO DE DADOS ===\n');

// Verificar colunas da tabela sales
const [salesColumns] = await connection.execute(`
  SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'sales'
  ORDER BY ORDINAL_POSITION
`);

console.log('📊 Tabela SALES - Total de colunas:', salesColumns.length);
console.log('\n🆕 Novos campos adicionados (FASE 1):');

const newFields = [
  'listingDate', 'listingStore', 'sellingStore', 'team', 'region',
  'managementResponsible', 'deedStatus', 'bankName', 'financedAmount',
  'bankReturnPercentage', 'bankReturnAmount', 'observations', 'wasRemoved',
  'priceDiscount', 'listingToSaleDays', 'commissionPaymentDate',
  'commissionAmountReceived', 'commissionPaymentBank', 'commissionPaymentMethod',
  'commissionPaymentObservations'
];

salesColumns.forEach(col => {
  if (newFields.includes(col.COLUMN_NAME)) {
    console.log(`  ✅ ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
  }
});

// Verificar tabela salePaymentHistory
const [historyTables] = await connection.execute(`
  SELECT TABLE_NAME
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'salePaymentHistory'
`);

console.log('\n📋 Tabela SALEPAYMENTHISTORY:');
if (historyTables.length > 0) {
  console.log('  ✅ Tabela criada com sucesso');
  
  const [historyColumns] = await connection.execute(`
    SELECT COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'salePaymentHistory'
    ORDER BY ORDINAL_POSITION
  `);
  
  console.log('  Colunas:');
  historyColumns.forEach(col => {
    console.log(`    - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
  });
} else {
  console.log('  ❌ Tabela NÃO encontrada');
}

console.log('\n=== VERIFICAÇÃO CONCLUÍDA ===');

await connection.end();
