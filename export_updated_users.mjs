import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.execute(
  'SELECT id, name, email, companyId, role FROM users ORDER BY name ASC'
);

const csv = ['id,name,email,companyId,role'];
rows.forEach(row => {
  const line = [
    `"${row.id}"`,
    `"${row.name || ''}"`,
    `"${row.email || ''}"`,
    `"${row.companyId || ''}"`,
    `"${row.role || ''}"`
  ].join(',');
  csv.push(line);
});

fs.writeFileSync('LISTA_USUARIOS_ATUALIZADA.csv', csv.join('\n'));
console.log('✅ Arquivo exportado: LISTA_USUARIOS_ATUALIZADA.csv');
console.log(`Total de usuários: ${rows.length}`);

await connection.end();
