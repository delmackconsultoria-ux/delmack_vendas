import { drizzle } from "drizzle-orm/mysql2";
import { users, companies } from "../drizzle/schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function createTestUsers() {
  const db = drizzle(process.env.DATABASE_URL!);

  // Create company
  const companyId = uuidv4();
  await db.insert(companies).values({
    id: companyId,
    name: "Baggio Imóveis",
    email: "contato@baggio.com",
    phone: "(11) 3000-0000",
    address: "São Paulo, SP",
    logo: null,
  });

  // Create test users
  const testUsers = [
    {
      email: "admin@delmack.com",
      password: "admin123",
      name: "Admin Delmack",
      role: "admin" as const,
      companyId: null,
    },
    {
      email: "gerente@baggio.com",
      password: "gerente123",
      name: "Gerente Baggio",
      role: "manager" as const,
      companyId,
    },
    {
      email: "financeiro@baggio.com",
      password: "financeiro123",
      name: "Financeiro Baggio",
      role: "finance" as const,
      companyId,
    },
    {
      email: "corretor@baggio.com",
      password: "corretor123",
      name: "Corretor Baggio",
      role: "broker" as const,
      companyId,
    },
  ];

  for (const user of testUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await db.insert(users).values({
      id: uuidv4(),
      email: user.email,
      password: hashedPassword,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      loginMethod: "email",
      isActive: true,
    });
    console.log(`✓ Created user: ${user.email} (${user.role})`);
  }

  console.log("✓ All test users created successfully!");
}

createTestUsers().catch(console.error);
