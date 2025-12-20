import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function resetSuperAdmin() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Nova senha para o Super Admin
  const newPassword = 'Delmack@2025';
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Verificar se existe Super Admin
  const [rows] = await connection.execute(
    'SELECT id, email FROM users WHERE role = ?',
    ['superadmin']
  );
  
  if (rows.length === 0) {
    // Criar Super Admin se não existir
    const id = `superadmin_${Date.now()}`;
    await connection.execute(
      `INSERT INTO users (id, name, email, password, role, isActive, loginMethod) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, 'Super Admin', 'delmackconsultoria@gmail.com', hashedPassword, 'superadmin', true, 'email']
    );
    console.log('Super Admin criado com sucesso!');
  } else {
    // Atualizar senha do Super Admin existente
    await connection.execute(
      'UPDATE users SET password = ?, isActive = ?, failedLoginAttempts = 0, lockedUntil = NULL WHERE role = ?',
      [hashedPassword, true, 'superadmin']
    );
    console.log('Senha do Super Admin atualizada!');
  }
  
  console.log('');
  console.log('=== CREDENCIAIS DO SUPER ADMIN ===');
  console.log('Email: delmackconsultoria@gmail.com');
  console.log('Senha: Delmack@2025');
  console.log('==================================');
  
  await connection.end();
}

resetSuperAdmin().catch(console.error);
