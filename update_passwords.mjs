import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const passwords = {
  'adriana.simoes@baggioimoveis.com.br': 'HPQOidW&R*rm',
  'allan.sobiech@baggioimoveis.com.br': 'RVRJIZ9&Hlz2',
  'charles.lucca@baggioimoveis.com.br': 'VZP80jDMuGj@',
  'diego.ferreira@baggioimoveis.com.br': '6wqv#bM5PLBO',
  'edmar.antunes@baggioimoveis.com.br': 'xSq7ipb&LXKc',
  'fabiano@baggioimoveis.com.br': '4mhDHvMgNyMA',
  'fabio@baggioimoveis.com.br': '2Gfc6unMaE4r',
  'joseli@baggioimoveis.com.br': 'uzLcfJAHv%3',
  'marcojoao@baggioimoveis.com.br': '7i#F6SqVQcs6',
  'carolina.munhoz@baggioimoveis.com.br': '%KhnnOL7yL&L',
  'odair@baggioimoveis.com.br': '&FYgkcUWSg1D',
  'priscillagomes@baggioimoveis.com.br': 'XoGsNyw&6zOa',
  'priscilla.andrelle@baggioimoveis.com.br': 'aPKCOZ420Y&G',
  'regiana@baggioimoveis.com.br': 'OI70OkkbKFU',
  'rosani@baggioimoveis.com.br': '9UbY68sKfR0K',
  'sandra.lima@baggioimoveis.com.br': '1B9yOSRzW9W1',
  'camila.pires@baggioimoveis.com.br': 'EHSQY#3&kVJn',
  'darlan@baggioimoveis.com.br': 'sSTwhw@QlR8&9n',
  'consultoriadelmack@gmail.com': 'Gibiangelical'
};

async function updatePasswords() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'delmack##1!',
    database: 'delmack_vendas'
  });

  for (const [email, password] of Object.entries(passwords)) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );
    console.log(`✅ Atualizado: ${email}`);
  }

  await connection.end();
  console.log('\n✅ Todas as senhas foram atualizadas!');
}

updatePasswords().catch(console.error);
