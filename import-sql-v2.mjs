import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'delmack';

async function importSQL() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    });

    console.log('✅ Conectado ao banco de dados!');

    // Ler arquivo SQL
    const sqlFile = path.join(process.cwd(), 'baggio_2026_corrected_v2.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
    
    // Dividir em statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`\n📄 Total de statements: ${statements.length}`);
    console.log('🚀 Iniciando importação...\n');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      try {
        await connection.execute(statements[i]);
        successCount++;
        
        if ((i + 1) % 100 === 0) {
          console.log(`  ✓ ${i + 1}/${statements.length} statements executados`);
        }
      } catch (error) {
        errorCount++;
        errors.push({
          statement: i + 1,
          error: error.message,
        });
        
        if (errorCount <= 5) {
          console.log(`  ✗ Erro no statement ${i + 1}: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Importação concluída!`);
    console.log(`  ✓ Sucesso: ${successCount}`);
    console.log(`  ✗ Erros: ${errorCount}`);

    // Validar dados inseridos
    console.log('\n📊 Validando dados inseridos...');
    const [properties] = await connection.execute(
      'SELECT COUNT(*) as count FROM properties WHERE companyId = ?',
      ['comp_baggio_001']
    );
    const [sales] = await connection.execute(
      'SELECT COUNT(*) as count FROM sales WHERE companyId = ?',
      ['comp_baggio_001']
    );
    const [commissions] = await connection.execute(
      'SELECT COUNT(*) as count FROM commissions WHERE companyId = ?',
      ['comp_baggio_001']
    );
    
    const [totalValue] = await connection.execute(
      'SELECT SUM(saleValue) as total FROM sales WHERE companyId = ?',
      ['comp_baggio_001']
    );

    console.log(`  Properties: ${properties[0].count}`);
    console.log(`  Sales: ${sales[0].count}`);
    console.log(`  Commissions: ${commissions[0].count}`);
    console.log(`  Total Value: R$ ${totalValue[0].total}`);

    if (properties[0].count > 0) {
      console.log('\n✅ Dados importados com sucesso!');
    } else {
      console.log('\n❌ Nenhum dado foi importado!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importSQL();
