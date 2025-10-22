import { authenticateUser, getUserByEmail } from "../server/db";

async function testLogins() {
  console.log("🧪 Testando autenticação das contas...\n");

  const testAccounts = [
    { email: "admin@delmack.com.br", password: "NUc7QJQE340Z1ZJ8", role: "Admin" },
    { email: "darlan@baggioimoveis.com.br", password: "cauF3otxRAzf", role: "Financeiro" },
    { email: "camila.pires@baggioimoveis.com.br", password: "IBCjvnxQxdc@", role: "Gerente" },
    { email: "evelize@baggioimoveis.com.br", password: "Cy6l27sAhbAm", role: "Corretora" },
  ];

  for (const account of testAccounts) {
    console.log(`🔐 Testando ${account.role} (${account.email})...`);
    
    try {
      // First check if user exists
      const user = await getUserByEmail(account.email);
      if (!user) {
        console.log(`   ❌ Usuário não encontrado no banco de dados\n`);
        continue;
      }

      // Try to authenticate
      const authenticatedUser = await authenticateUser(account.email, account.password);
      
      if (authenticatedUser) {
        console.log(`   ✅ Login bem-sucedido!`);
        console.log(`      ID: ${authenticatedUser.id}`);
        console.log(`      Nome: ${authenticatedUser.name}`);
        console.log(`      Email: ${authenticatedUser.email}`);
        console.log(`      Papel: ${authenticatedUser.role}`);
        console.log(`      Ativo: ${authenticatedUser.isActive}\n`);
      } else {
        console.log(`   ❌ Falha na autenticação - senha incorreta ou usuário inativo\n`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error}\n`);
    }
  }

  console.log("=" .repeat(60));
  console.log("✅ Testes concluídos!");
}

testLogins();
