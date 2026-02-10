#!/usr/bin/env node
/**
 * Script para importar vendas históricas diretamente no banco de dados
 */
import { readFileSync } from 'fs';
import { createConnection } from 'mysql2/promise';

// Ler DATABASE_URL do ambiente do projeto
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada');
  process.exit(1);
}

console.log('🔗 Conectando ao banco de dados...');

// Parsear DATABASE_URL
// Formato: mysql://user:pass@host:port/dbname?params
const urlMatch = DATABASE_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?/);

if (!urlMatch) {
  console.error('❌ Formato de DATABASE_URL inválido');
  process.exit(1);
}

const [, user, password, host, port, database, params] = urlMatch;

// Extrair parâmetros SSL
const sslEnabled = params && params.includes('ssl-mode=REQUIRED');

const connection = await createConnection({
  host,
  port: parseInt(port),
  user,
  password,
  database,
  ssl: { rejectUnauthorized: true }, // TiDB Cloud requer SSL
  multipleStatements: true, // Permite executar múltiplos INSERTs
});

console.log('✅ Conectado ao banco de dados');
console.log('========================================');

const TOTAL_BATCHES = 32;
let successCount = 0;
let errorCount = 0;
let totalRows = 0;

for (let i = 1; i <= TOTAL_BATCHES; i++) {
  const batchNum = String(i).padStart(3, '0');
  const filename = `/home/ubuntu/insert_vendas_batch_${batchNum}.sql`;
  
  try {
    process.stdout.write(`📦 Batch ${i}/${TOTAL_BATCHES}: Lendo arquivo... `);
    
    const sql = readFileSync(filename, 'utf-8');
    
    process.stdout.write(`Executando... `);
    
    const [result] = await connection.query(sql);
    
    // Contar quantos INSERTs foram executados
    const insertCount = sql.split('INSERT INTO').length - 1;
    totalRows += insertCount;
    
    console.log(`✅ ${insertCount} vendas inseridas`);
    successCount++;
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    errorCount++;
  }
}

await connection.end();

console.log('========================================');
console.log(`✅ Batches processados: ${successCount}/${TOTAL_BATCHES}`);
console.log(`❌ Erros: ${errorCount}`);
console.log(`📊 Total de vendas importadas: ${totalRows}`);
console.log('========================================');
