import { mysqlTable, varchar, text, timestamp, mysqlEnum, decimal, int, boolean, date, json, datetime, index } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, or, sql, gte, lte } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import { ENV } from './_core/env';

const { users, companies, sales, commissions, historicalSales } = schema;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

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

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get users by company
 */
export async function getCompanyUsers(companyId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).where(eq(users.companyId, companyId));
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).where(eq(users.role, role));
}

/**
 * Update user
 */
export async function updateUser(id: string, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return;
  }

  await db.update(users).set(data).where(eq(users.id, id));
}

/**
 * Delete user
 */
export async function deleteUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete user: database not available");
    return;
  }

  await db.delete(users).where(eq(users.id, id));
}

/**
 * Create a new user
 */
export async function createUser(data: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userId = data.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(users).values({
    ...data,
    id: userId,
  });

  return { id: userId, ...data };
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
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const companyId = `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(companies).values({
    id: companyId,
    ...data,
  });

  return { id: companyId, ...data };
}

/**
 * Get sales for a company
 */
export async function getCompanySales(companyId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(sales).where(eq(sales.companyId, companyId));
}

/**
 * Get sales for a broker
 */
export async function getBrokerSales(brokerId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(sales).where(
    or(
      eq(sales.brokerAngariador, brokerId),
      eq(sales.brokerVendedor, brokerId)
    )
  );
}

/**
 * Create sale
 */
export async function createSale(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const saleId = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(sales).values({
    ...data,
    id: saleId,
  });

  return { id: saleId, ...data };
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

/**
 * ========================================
 * HISTORICAL SALES (Vendas Históricas)
 * ========================================
 * Funções para consultar vendas importadas do Excel (2024 e anteriores)
 * Estas vendas NÃO passam por fluxo de aprovação (status fixo: "commission_paid")
 */

/**
 * Get all historical sales for a company
 */
export async function getCompanyHistoricalSales(companyId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(historicalSales).where(eq(historicalSales.companyId, companyId));
}

/**
 * Get historical sales for a specific broker (by name)
 * Busca vendas onde o corretor aparece como angariador OU vendedor
 */
export async function getBrokerHistoricalSales(companyId: string, brokerName: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(historicalSales).where(
    and(
      eq(historicalSales.companyId, companyId),
      or(
        eq(historicalSales.acquisitionBrokerName, brokerName),
        eq(historicalSales.saleBrokerName, brokerName)
      )
    )
  );
}

/**
 * Get historical sale by ID
 */
export async function getHistoricalSaleById(id: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(historicalSales).where(eq(historicalSales.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Count historical sales for a company
 */
export async function countCompanyHistoricalSales(companyId: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { count } = await import('drizzle-orm');
  const result = await db.select({ count: count() }).from(historicalSales).where(eq(historicalSales.companyId, companyId));
  return result[0]?.count || 0;
}

/**
 * Count historical sales for a broker
 */
export async function countBrokerHistoricalSales(companyId: string, brokerName: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { count } = await import('drizzle-orm');
  const result = await db.select({ count: count() }).from(historicalSales).where(
    and(
      eq(historicalSales.companyId, companyId),
      or(
        eq(historicalSales.acquisitionBrokerName, brokerName),
        eq(historicalSales.saleBrokerName, brokerName)
      )
    )
  );
  return result[0]?.count || 0;
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string) {
  const db = await getDb();
  if (!db) return null;

  const user = await getUserByEmail(email);
  if (!user || !user.password) return null;

  const bcrypt = await import('bcryptjs');
  const isValid = await bcrypt.compare(password, user.password);
  
  return isValid ? user : null;
}

// Password hashing helper
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
}
