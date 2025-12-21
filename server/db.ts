import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertSale, users, companies, sales, commissions, properties, commissionRules, type Company, type Sale, type Commission, type Property, type CommissionRule } from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from 'bcryptjs';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = result.length > 0 ? result[0] : null;

  if (!user || !user.password) {
    return null;
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  // Update last signed in
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

  return user;
}

/**
 * Create a new user with email and password
 */
export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'broker' | 'finance' | 'viewer';
  companyId?: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const hashedPassword = await hashPassword(data.password);
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(users).values({
    id: userId,
    email: data.email,
    password: hashedPassword,
    name: data.name,
    role: data.role,
    companyId: data.companyId,
    loginMethod: 'email',
  });

  return { id: userId, email: data.email, name: data.name, role: data.role };
}

/**
 * Upsert user (for OAuth compatibility)
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  
  if (result.length === 0) return undefined;
  
  const user = result[0];
  
  // Buscar nome da empresa se o usuário tiver companyId
  let companyName: string | null = null;
  let companyTradeName: string | null = null;
  if (user.companyId) {
    const companyResult = await db.select().from(companies).where(eq(companies.id, user.companyId)).limit(1);
    if (companyResult.length > 0) {
      companyName = companyResult[0].name;
      companyTradeName = companyResult[0].tradeName || null;
    }
  }
  
  // Usar Nome Fantasia se existir, senão Razão Social
  const displayCompanyName = companyTradeName || companyName;
  
  return { ...user, companyName: displayCompanyName, companyTradeName, companyLegalName: companyName };
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Increment failed login attempts
 */
export async function incrementFailedAttempts(email: string) {
  const db = await getDb();
  if (!db) return;

  const user = await getUserByEmail(email);
  if (!user) return;

  const attempts = (user.failedLoginAttempts || 0) + 1;
  const updateData: any = { failedLoginAttempts: attempts };

  // Bloquear por 15 minutos após 5 tentativas
  if (attempts >= 5) {
    updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  await db.update(users).set(updateData).where(eq(users.email, email));
}

/**
 * Reset failed login attempts
 */
export async function resetFailedAttempts(email: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ 
    failedLoginAttempts: 0, 
    lockedUntil: null 
  }).where(eq(users.email, email));
}

/**
 * Request password reset - generate token
 */
export async function requestPasswordReset(email: string) {
  const db = await getDb();
  if (!db) return null;

  const user = await getUserByEmail(email);
  if (!user) return null;

  // Gerar token aleatório
  const token = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await db.update(users).set({ 
    resetToken: token, 
    resetTokenExpiry: expiry 
  }).where(eq(users.email, email));

  return { token, email: user.email, name: user.name };
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string) {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados indisponível" };

  // Buscar usuário pelo token
  const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  const user = result.length > 0 ? result[0] : null;

  if (!user) {
    return { success: false, message: "Token inválido ou expirado" };
  }

  if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
    return { success: false, message: "Token expirado. Solicite um novo link de recuperação." };
  }

  // Atualizar senha
  const hashedPassword = await hashPassword(newPassword);
  await db.update(users).set({ 
    password: hashedPassword, 
    resetToken: null, 
    resetTokenExpiry: null,
    failedLoginAttempts: 0,
    lockedUntil: null
  }).where(eq(users.id, user.id));

  return { success: true, message: "Senha alterada com sucesso" };
}

/**
 * Get company by ID
 */
export async function getCompany(id: string): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new company
 */
export async function createCompany(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const companyId = `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(companies).values({
    id: companyId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    logo: data.logo,
  });

  return { id: companyId, ...data };
}

/**
 * Get all users for a company
 */
export async function getCompanyUsers(companyId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).where(eq(users.companyId, companyId));
}

/**
 * Get all sales for a company
 */
export async function getCompanySales(companyId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(sales).where(eq(sales.companyId, companyId));
}

/**
 * Get sale by ID with related data
 */
export async function getSaleWithDetails(saleId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Create a new sale
 */
export async function createSale(data: Omit<InsertSale, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const saleId = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(sales).values({
    ...data,
    id: saleId,
  } as InsertSale);

  return { id: saleId, ...data };
}

/**
 * Update sale status
 */
export async function updateSaleStatus(saleId: string, status: 'pending' | 'received' | 'paid' | 'cancelled', observation?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status, updatedAt: new Date() };
  if (observation) {
    updateData.observation = observation;
  }

  await db.update(sales).set(updateData).where(eq(sales.id, saleId));
}

/**
 * Get commissions for a broker
 */
export async function getBrokerCommissions(brokerId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(commissions).where(eq(commissions.brokerId, brokerId));
}

/**
 * Create commission
 */
export async function createCommission(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const commissionId = `commission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(commissions).values({
    ...data,
    id: commissionId,
  });

  return { id: commissionId, ...data };
}

