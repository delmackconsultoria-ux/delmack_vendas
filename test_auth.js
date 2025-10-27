const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkPassword() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.execute(
      'SELECT email, password FROM users WHERE email = ?',
      ['corretor@baggio.com.br']
    );

    if (rows.length > 0) {
      const user = rows[0];
      console.log('Email:', user.email);
      console.log('Password hash:', user.password);
      console.log('Hash starts with $2b$:', user.password.startsWith('$2b$'));
      
      const isValid = await bcrypt.compare('senha123', user.password);
      console.log('Senha "senha123" é válida:', isValid);
    } else {
      console.log('Usuário não encontrado');
    }

    await connection.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkPassword();
