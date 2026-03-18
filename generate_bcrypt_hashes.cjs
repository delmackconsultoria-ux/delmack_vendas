const bcrypt = require('bcryptjs');

const users = [
  { name: "Adriana Simões Barbosa Karter", email: "adriana.simoes@baggioimoveis.com.br", password: "HPQ0IdW&R*rm", role: "broker" },
  { name: "Allan Sobiech", email: "allan.sobiech@baggioimoveis.com.br", password: "RVRIJz9&Hlz2", role: "broker" },
  { name: "Charles Luciano Lucca", email: "charles.lucca@baggioimoveis.com.br", password: "VZP80jDMuGj@", role: "broker" },
  { name: "Diego Ferreira dos Santos", email: "diego.ferreira@baggioimoveis.com.br", password: "6wqv#bM5PLBO", role: "broker" },
  { name: "Edmar Antunes", email: "edmar.antunes@baggioimoveis.com.br", password: "xSq7ipb&LXKc", role: "broker" },
  { name: "Fabiano Buziak", email: "fabiano@baggioimoveis.com.br", password: "4mhDHvMgNyMA", role: "broker" },
  { name: "Fabio Simões", email: "fabio@baggioimoveis.com.br", password: "2Gfc6unMaE4r", role: "broker" },
  { name: "Joseli do Rocio Bueno", email: "joseli@baggioimoveis.com.br", password: "uzLcfJlAHv%3", role: "broker" },
  { name: "Marco Antonio do Nascimento João", email: "marcojoao@baggioimoveis.com.br", password: "7#mF65qVQcs6", role: "broker" },
  { name: "Maria Carolina Munhoz de Miranda Nicolodi", email: "carolina.munhoz@baggioimoveis.com.br", password: "%RhnnOL7yL&L", role: "broker" },
  { name: "Odair Amancio", email: "odair@baggioimoveis.com.br", password: "8Y&Ycit1Xg1D", role: "broker" },
  { name: "Priscilla Gomes Ziolkowski", email: "priscillagomes@baggioimoveis.com.br", password: "XoGsNyw&6z0a", role: "broker" },
  { name: "Priscilla Pires Andrelle", email: "priscilla.andrelle@baggioimoveis.com.br", password: "aPKCOZ420Y&G", role: "broker" },
  { name: "Regiana Mirian Baggio Favarini", email: "regiana@baggioimoveis.com.br", password: "OI70OkkkbKFU", role: "broker" },
  { name: "Rosani Felix dos Santos", email: "rosani@baggioimoveis.com.br", password: "9UbY68sKfR0K", role: "broker" },
  { name: "Sandra Maria Alves de Lima Przybysz", email: "sandra.lima@baggioimoveis.com.br", password: "1B9yOSRzW9W1", role: "broker" },
  { name: "Camila", email: "camila.pires@baggioimoveis.com.br", password: "EHSQY#3&kVJn", role: "manager" },
  { name: "Darlan", email: "darlan@baggioimoveis.com.br", password: "sSTwhw@QlR8&9n", role: "finance" },
];

const superAdmin = {
  name: "Delmack Consultor",
  email: "delmackconsultor@gmail.com",
  password: null,
  role: "superadmin"
};

function generateRandomPassword() {
  const length = 16;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

async function generateHashes() {
  console.log("=== GERANDO HASHES BCRYPT ===\n");
  
  const hashes = [];
  
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    hashes.push({
      email: user.email,
      name: user.name,
      password: user.password,
      hash: hash,
      role: user.role
    });
    console.log(`✅ ${user.email}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Senha Original: ${user.password}`);
    console.log(`   Hash Bcrypt: ${hash}`);
    console.log(`   Role: ${user.role}\n`);
  }
  
  const superAdminPassword = generateRandomPassword();
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);
  
  console.log(`\n🔐 SUPER ADMIN - NOVA SENHA GERADA`);
  console.log(`✅ ${superAdmin.email}`);
  console.log(`   Nome: ${superAdmin.name}`);
  console.log(`   Senha Gerada: ${superAdminPassword}`);
  console.log(`   Hash Bcrypt: ${superAdminHash}`);
  console.log(`   Role: ${superAdmin.role}\n`);
  
  hashes.push({
    email: superAdmin.email,
    name: superAdmin.name,
    password: superAdminPassword,
    hash: superAdminHash,
    role: superAdmin.role
  });
  
  return hashes;
}

generateHashes().then(hashes => {
  console.log("\n=== RESUMO PARA COPIAR ===\n");
  hashes.forEach(h => {
    console.log(`${h.email} | ${h.password} | ${h.hash}`);
  });
});
