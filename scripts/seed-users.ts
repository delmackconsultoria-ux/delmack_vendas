import { createUser, createCompany, getDb } from "../server/db";

async function seedUsers() {
  console.log("🌱 Iniciando seed de usuários...\n");

  try {
    // Create Baggio company
    console.log("📍 Criando empresa Baggio...");
    const baggioCom = await createCompany({
      name: "Baggio Imóveis",
      email: "contato@baggio.com.br",
      phone: "(41) 3000-0000",
      address: "Curitiba, PR",
    });
    console.log(`✅ Empresa criada: ${baggioCom.id}\n`);

    // Admin user
    const adminPassword = "NUc7QJQE340Z1ZJ8";
    console.log("👨‍💼 Criando conta Admin...");
    const adminUser = await createUser({
      email: "admin@delmack.com.br",
      password: adminPassword,
      name: "Administrador Delmack",
      role: "admin",
      companyId: baggioCom.id,
    });
    console.log(`✅ Admin criado: ${adminUser.email}`);
    console.log(`   Senha: ${adminPassword}\n`);

    // Finance user
    console.log("💰 Criando conta Financeiro...");
    const financeUser = await createUser({
      email: "darlan@baggioimoveis.com.br",
      password: "cauF3otxRAzf",
      name: "Darlan - Financeiro",
      role: "finance",
      companyId: baggioCom.id,
    });
    console.log(`✅ Financeiro criado: ${financeUser.email}\n`);

    // Manager user
    console.log("👔 Criando conta Gerente...");
    const managerUser = await createUser({
      email: "camila.pires@baggioimoveis.com.br",
      password: "IBCjvnxQxdc@",
      name: "Camila Pires - Gerente",
      role: "manager",
      companyId: baggioCom.id,
    });
    console.log(`✅ Gerente criada: ${managerUser.email}\n`);

    // Broker user
    console.log("🏠 Criando conta Corretora...");
    const brokerUser = await createUser({
      email: "evelize@baggioimoveis.com.br",
      password: "Cy6l27sAhbAm",
      name: "Evelize - Corretora",
      role: "broker",
      companyId: baggioCom.id,
    });
    console.log(`✅ Corretora criada: ${brokerUser.email}\n`);

    console.log("=" .repeat(60));
    console.log("🎉 SEED CONCLUÍDO COM SUCESSO!\n");
    console.log("📋 CREDENCIAIS DE ACESSO:\n");

    console.log("🔐 ADMIN");
    console.log(`   Email: admin@delmack.com.br`);
    console.log(`   Senha: ${adminPassword}\n`);

    console.log("💰 FINANCEIRO");
    console.log(`   Email: darlan@baggioimoveis.com.br`);
    console.log(`   Senha: cauF3otxRAzf\n`);

    console.log("👔 GERENTE");
    console.log(`   Email: camila.pires@baggioimoveis.com.br`);
    console.log(`   Senha: IBCjvnxQxdc@\n`);

    console.log("🏠 CORRETORA");
    console.log(`   Email: evelize@baggioimoveis.com.br`);
    console.log(`   Senha: Cy6l27sAhbAm\n`);

    console.log("=" .repeat(60));
  } catch (error) {
    console.error("❌ Erro ao criar usuários:", error);
    process.exit(1);
  }
}

seedUsers();

