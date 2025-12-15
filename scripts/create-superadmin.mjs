import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { randomBytes } from 'crypto';

const SUPER_ADMIN_EMAIL = 'delmackconsultoria@gmail.com';

// Generate strong password: 16 chars with uppercase, lowercase, numbers, symbols
function generateStrongPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  const bytes = randomBytes(16);
  for (let i = 0; i < 16; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  
  const password = generateStrongPassword();
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = `superadmin_${Date.now()}`;
  
  // Check if super admin exists
  const [existing] = await connection.execute(
    'SELECT id FROM users WHERE email = ?',
    [SUPER_ADMIN_EMAIL]
  );
  
  if (existing.length > 0) {
    // Update existing
    await connection.execute(
      'UPDATE users SET password = ?, role = ?, name = ? WHERE email = ?',
      [hashedPassword, 'superadmin', 'Super Admin Delmack', SUPER_ADMIN_EMAIL]
    );
    console.log('Super Admin atualizado!');
  } else {
    // Create new
    await connection.execute(
      'INSERT INTO users (id, name, email, password, role, loginMethod, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, 'Super Admin Delmack', SUPER_ADMIN_EMAIL, hashedPassword, 'superadmin', 'email', true]
    );
    console.log('Super Admin criado!');
  }
  
  console.log('');
  console.log('='.repeat(50));
  console.log('CREDENCIAIS DO SUPER ADMIN');
  console.log('='.repeat(50));
  console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
  console.log(`Senha: ${password}`);
  console.log('='.repeat(50));
  console.log('');
  console.log('IMPORTANTE: Guarde esta senha em local seguro!');
  
  await connection.end();
}

main().catch(console.error);
