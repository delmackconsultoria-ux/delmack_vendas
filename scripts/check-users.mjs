import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const result = await connection.execute(
  "SELECT id, name, email, role, companyId FROM users WHERE role != 'superadmin' ORDER BY createdAt DESC LIMIT 10"
);

console.log('Usuários criados:');
console.table(result[0]);

await connection.end();
