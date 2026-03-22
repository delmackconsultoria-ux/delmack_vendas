#!/usr/bin/env node
/**
 * Script para importar dados Baggio 2026
 * Executa o SQL INSERT completo no banco de dados
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { URL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse DATABASE_URL
function parseDatabaseUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
    ssl: parsed.searchParams.get('ssl') ? JSON.parse(url.split('ssl=')[1]) : false,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

const dbConfig = process.env.DATABASE_URL 
  ? parseDatabaseUrl(process.env.DATABASE_URL)
  : {
      host: process.env.DATABASE_HOST || "localhost",
      user: process.env.DATABASE_USER || "root",
      password: process.env.DATABASE_PASSWORD || "",
      database: process.env.DATABASE_NAME || "delmack_vendas",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

async function importBaggioData() {
  let connection;

  try {
    console.log("🔗 Conectando ao banco de dados...");
    console.log(`  Host: ${dbConfig.host}`);
    console.log(`  Database: ${dbConfig.database}`);
    connection = await mysql.createConnection(dbConfig);

    console.log("✅ Conectado!");
    console.log("");

    // Ler arquivo SQL
    const sqlFile = path.join(__dirname, "baggio_2026_insert_final.sql");
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`Arquivo não encontrado: ${sqlFile}`);
    }

    console.log(`📂 Lendo arquivo: ${sqlFile}`);
    const sqlContent = fs.readFileSync(sqlFile, "utf-8");

    // Dividir em statements (separados por ;)
    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    console.log(`📊 Total de statements: ${statements.length}`);

    // Executar cada statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        await connection.execute(statement);
        successCount++;

        // Mostrar progresso a cada 50 statements
        if ((i + 1) % 50 === 0) {
          console.log(`  ✓ ${i + 1}/${statements.length} statements executados`);
        }
      } catch (error) {
        errorCount++;
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error(`  ✗ Erro no statement ${i + 1}: ${error.message}`);
        }
      }
    }

    console.log("\n✅ Importação concluída!");
    console.log(`  ✓ Sucesso: ${successCount}`);
    console.log(`  ✗ Erros: ${errorCount}`);

    // Validar dados inseridos
    console.log("\n📊 Validando dados inseridos...");

    const [properties] = await connection.execute(
      "SELECT COUNT(*) as total FROM properties WHERE companyId = 'company_baggio_001'"
    );
    console.log(`  Properties: ${properties[0][0]?.total || 0}`);

    const [sales] = await connection.execute(
      "SELECT COUNT(*) as total FROM sales WHERE companyId = 'company_baggio_001'"
    );
    console.log(`  Sales: ${sales[0]?.total || 0}`);

    const [commissions] = await connection.execute(
      "SELECT COUNT(*) as total FROM commissions WHERE companyId = 'company_baggio_001'"
    );
    console.log(`  Commissions: ${commissions[0]?.total || 0}`);

    const [history] = await connection.execute(
      "SELECT COUNT(*) as total FROM commissionHistory WHERE companyId = 'company_baggio_001'"
    );
    console.log(`  CommissionHistory: ${history[0]?.total || 0}`);

    // Verificar status
    const [statusCount] = await connection.execute(
      "SELECT status, COUNT(*) as total FROM sales WHERE companyId = 'company_baggio_001' GROUP BY status"
    );
    console.log("\n📊 Sales por status:");
    if (Array.isArray(statusCount) && statusCount.length > 0) {
      statusCount.forEach((row) => {
        console.log(`  ${row.status}: ${row.total}`);
      });
    } else {
      console.log("  (Nenhum dado encontrado)");
    }

    console.log("\n🎉 Dados Baggio importados com sucesso!");

  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar
importBaggioData();
