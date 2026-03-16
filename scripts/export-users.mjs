#!/usr/bin/env node

/**
 * Script para exportar usuários do banco de dados Manus
 * Uso: node scripts/export-users.mjs
 * 
 * Este script exporta:
 * - Email
 * - Senha (hash)
 * - Role
 * - Company ID
 * 
 * Gera um arquivo SQL que pode ser importado no servidor local
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuração do banco Manus (altere conforme necessário)
const MANUS_DB_CONFIG = {
  host: process.env.MANUS_DB_HOST || 'localhost',
  user: process.env.MANUS_DB_USER || 'delmack_user',
  password: process.env.MANUS_DB_PASSWORD || 'delmack##1',
  database: process.env.MANUS_DB_NAME || 'delmack',
  port: process.env.MANUS_DB_PORT || 3306,
};

async function exportUsers() {
  let connection;

  try {
    console.log('🔗 Conectando ao banco de dados Manus...');
    connection = await mysql.createConnection(MANUS_DB_CONFIG);

    console.log('📊 Buscando usuários...');
    const [users] = await connection.query(
      'SELECT id, email, password, role, companyId FROM users WHERE isActive = true'
    );

    if (users.length === 0) {
      console.log('⚠️  Nenhum usuário ativo encontrado');
      return;
    }

    console.log(`✅ ${users.length} usuários encontrados`);

    // Gerar SQL INSERT
    let sqlContent = `-- Exportação de Usuários Delmack
-- Gerado em: ${new Date().toISOString()}
-- Total de usuários: ${users.length}

-- Desabilitar verificação de chave estrangeira temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpar usuários existentes (opcional - comente se quiser manter)
-- DELETE FROM users WHERE id NOT IN (SELECT id FROM users WHERE email = 'delmackconsultoria@gmail.com');

-- Inserir usuários
`;

    users.forEach((user) => {
      const id = connection.escape(user.id);
      const email = connection.escape(user.email);
      const password = connection.escape(user.password);
      const role = connection.escape(user.role);
      const companyId = user.companyId ? connection.escape(user.companyId) : 'NULL';

      sqlContent += `INSERT INTO users (id, email, password, role, companyId, loginMethod, isActive, createdAt, lastSignedIn)
VALUES (${id}, ${email}, ${password}, ${role}, ${companyId}, 'email', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  email = ${email},
  password = ${password},
  role = ${role},
  companyId = ${companyId},
  isActive = true;

`;
    });

    sqlContent += `-- Reabilitar verificação de chave estrangeira
SET FOREIGN_KEY_CHECKS = 1;

-- Resumo
-- Total de usuários importados: ${users.length}
-- Data: ${new Date().toLocaleString('pt-BR')}
`;

    // Salvar arquivo
    const outputPath = path.join(__dirname, '..', 'export-users.sql');
    fs.writeFileSync(outputPath, sqlContent, 'utf-8');

    console.log(`\n✅ Arquivo exportado com sucesso!`);
    console.log(`📁 Localização: ${outputPath}`);
    console.log(`\n📋 Resumo:`);
    console.log(`   - Total de usuários: ${users.length}`);
    console.log(`   - Roles encontrados: ${[...new Set(users.map(u => u.role))].join(', ')}`);
    console.log(`\n💡 Para importar no servidor local, execute:`);
    console.log(`   mysql -u delmack_user -p delmack < export-users.sql`);

    // Também gerar um arquivo CSV para referência
    const csvContent = [
      'email,role,companyId',
      ...users.map(u => `${u.email},${u.role},${u.companyId || 'N/A'}`),
    ].join('\n');

    const csvPath = path.join(__dirname, '..', 'export-users.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    console.log(`\n📊 Arquivo CSV também gerado: ${csvPath}`);

  } catch (error) {
    console.error('❌ Erro ao exportar usuários:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar
exportUsers();
