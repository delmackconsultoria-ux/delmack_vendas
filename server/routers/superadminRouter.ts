import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { companies, users, actionLogs, sales, commissions } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { notifyOwner } from "../_core/notification";

function generateStrongPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
  let password = "";
  const bytes = randomBytes(12);
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

export const superadminRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "superadmin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    const db = await getDb();
    if (!db) return { totalCompanies: 0, activeCompanies: 0, totalUsers: 0, activeUsers: 0, activeLicenses: 0 };
    
    // Total de empresas
    const [companyCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(companies);
    
    // Empresas ativas
    const [activeCompanyCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(companies).where(eq(companies.isActive, true));
    
    // Total de usuários
    const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
    
    // Usuários ativos
    const [activeUserCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.isActive, true));
    
    // Licenças ativas (empresas ativas com licença válida ou perpetual)
    const [licenseCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(companies)
      .where(sql`${companies.isActive} = true AND (${companies.licenseType} = 'perpetual' OR ${companies.licenseExpiresAt} > NOW() OR ${companies.licenseExpiresAt} IS NULL)`);
    
    return {
      totalCompanies: Number(companyCount?.count || 0),
      activeCompanies: Number(activeCompanyCount?.count || 0),
      totalUsers: Number(userCount?.count || 0),
      activeUsers: Number(activeUserCount?.count || 0),
      activeLicenses: Number(licenseCount?.count || 0),
    };
  }),

  listCompanies: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "superadmin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    const db = await getDb();
    if (!db) return [];
    const result = await db.select({
      id: companies.id,
      name: companies.name,
      email: companies.email,
      phone: companies.phone,
      licenseType: companies.licenseType,
      licenseStartDate: companies.licenseStartDate,
      licenseExpiresAt: companies.licenseExpiresAt,
      contractResponsible: companies.contractResponsible,
      contractResponsibleEmail: companies.contractResponsibleEmail,
      contractResponsiblePhone: companies.contractResponsiblePhone,
      contractStartDate: companies.contractStartDate,
      contractNotes: companies.contractNotes,
      totalLogins: companies.totalLogins,
      isActive: companies.isActive,
      createdAt: companies.createdAt,
      userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE companyId = ${companies.id})`,
    }).from(companies);
    return result;
  }),

  updateCompany: protectedProcedure
    .input(z.object({
      companyId: z.string(),
      licenseType: z.enum(["perpetual", "monthly", "quarterly", "semiannual", "annual"]).optional(),
      licenseStartDate: z.date().optional(),
      contractResponsible: z.string().optional(),
      contractResponsibleEmail: z.string().optional(),
      contractResponsiblePhone: z.string().optional(),
      contractStartDate: z.date().optional(),
      contractNotes: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { companyId, ...updateData } = input;
      const cleanData: any = {};
      Object.entries(updateData).forEach(([k, v]) => { if (v !== undefined) cleanData[k] = v; });
      if (Object.keys(cleanData).length > 0) {
        await db.update(companies).set(cleanData).where(eq(companies.id, companyId));
      }
      return { success: true };
    }),

  createCompany: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      tradeName: z.string().optional(),
      cnpj: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Verificar se CNPJ já existe
      if (input.cnpj) {
        const existingCompany = await db.select().from(companies).where(eq(companies.cnpj, input.cnpj)).limit(1);
        if (existingCompany.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "CNPJ já cadastrado" });
        }
      }
      
      const id = `company_${Date.now()}`;
      await db.insert(companies).values({
        id,
        name: input.name,
        tradeName: input.tradeName || null,
        cnpj: input.cnpj || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        licenseType: "monthly",
        isActive: true,
      });
      
      return { id, success: true };
    }),

  createUser: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      role: z.enum(["broker", "manager", "finance"]),
      companyId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Verificar se email já existe
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existingUser.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado" });
      }
      
      const password = generateStrongPassword();
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(users).values({
        id,
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role,
        companyId: input.companyId,
        loginMethod: "email",
        isActive: true,
      });
      
      // Enviar email com credenciais
      try {
        await notifyOwner({
          title: `Novo usuário criado: ${input.name}`,
          content: `Email: ${input.email}\nSenha: ${password}\nPerfil: ${input.role}`,
        });
      } catch (e) {
        console.log("[SuperAdmin] Erro ao enviar notificação:", e);
      }
      
      return { success: true, email: input.email, password };
    }),

  uploadUsers: protectedProcedure
    .input(z.object({
      companyId: z.string(),
      users: z.array(z.object({
        name: z.string(),
        surname: z.string().optional(),
        email: z.string().email(),
        role: z.enum(["broker", "manager", "finance"]),
        company: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      let created = 0;
      const credentials: { email: string; password: string; name: string }[] = [];
      
      for (const user of input.users) {
        const password = generateStrongPassword();
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullName = user.surname ? `${user.name} ${user.surname}` : user.name;
        
        try {
          await db.insert(users).values({
            id,
            name: fullName,
            email: user.email,
            password: hashedPassword,
            role: user.role,
            companyId: input.companyId,
            loginMethod: "email",
            isActive: true,
          });
          
          credentials.push({ email: user.email, password, name: fullName });
          created++;
        } catch (error) {
          console.log(`[SuperAdmin] Erro ao criar usuário ${user.email}:`, error);
        }
      }
      
      // Send email notifications via Manus
      for (const cred of credentials) {
        try {
          await notifyOwner({
            title: `Novo usuário criado: ${cred.name}`,
            content: `Email: ${cred.email}\nSenha: ${cred.password}\n\nAcesse o sistema Delmack para começar.`,
          });
        } catch (error) {
          console.log(`[SuperAdmin] Erro ao enviar email para ${cred.email}:`, error);
        }
      }
      
      return { created, total: input.users.length };
    }),

  getCompanyStats: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) return { totalSales: 0, totalCommissions: 0, totalValue: 0 };
      const [salesCount] = await db.select({ count: sql<number>`COUNT(*)`, total: sql<number>`COALESCE(SUM(saleValue), 0)` }).from(sales).where(eq(sales.companyId, input.companyId));
      const [commCount] = await db.select({ count: sql<number>`COUNT(*)`, total: sql<number>`COALESCE(SUM(value), 0)` }).from(commissions).where(eq(commissions.companyId, input.companyId));
      return {
        totalSales: Number(salesCount?.count || 0),
        totalValue: Number(salesCount?.total || 0),
        totalCommissions: Number(commCount?.total || 0),
      };
    }),

  getActionLogs: protectedProcedure
    .input(z.object({ companyId: z.string().optional(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) return [];
      let query = db.select({
        id: actionLogs.id,
        userId: actionLogs.userId,
        targetType: actionLogs.targetType,
        action: actionLogs.action,
        details: actionLogs.details,
        createdAt: actionLogs.createdAt,
        userName: users.name,
      }).from(actionLogs).leftJoin(users, eq(actionLogs.userId, users.id)).orderBy(sql`${actionLogs.createdAt} DESC`).limit(input.limit);
      return await query;
    }),

  getLicenseAlerts: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "superadmin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    const db = await getDb();
    if (!db) return [];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const result = await db.select({
      id: companies.id,
      name: companies.name,
      licenseType: companies.licenseType,
      licenseExpiresAt: companies.licenseExpiresAt,
    }).from(companies).where(sql`${companies.licenseExpiresAt} IS NOT NULL AND ${companies.licenseExpiresAt} <= ${thirtyDaysFromNow} AND ${companies.isActive} = true`);
    return result;
  }),

  // Listar todos os usuários do sistema
  listAllUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "superadmin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    const db = await getDb();
    if (!db) return [];
    const result = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      companyId: users.companyId,
      isActive: users.isActive,
      failedLoginAttempts: users.failedLoginAttempts,
      lockedUntil: users.lockedUntil,
      lastSignedIn: users.lastSignedIn,
      createdAt: users.createdAt,
    }).from(users).orderBy(sql`${users.createdAt} DESC`);
    return result;
  }),

  // Redefinir senha de um usuário
  resetUserPassword: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

      const newPassword = generateStrongPassword();
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.update(users).set({
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
        resetToken: null,
        resetTokenExpiry: null,
      }).where(eq(users.id, input.userId));

      // Registrar ação
      await db.insert(actionLogs).values({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: ctx.user.id,
        targetType: "user",
        targetId: input.userId,
        action: "reset_password",
        details: `Senha redefinida para ${user.email}`,
      });

      // Enviar notificação com a nova senha
      await notifyOwner({
        title: `Senha Redefinida - ${user.name || user.email}`,
        content: `A senha do usuário ${user.name || user.email} foi redefinida pelo Super Admin.\n\nNova senha: ${newPassword}\n\nOriente o usuário a alterar a senha após o primeiro login.`
      });

      return { success: true, message: "Senha redefinida com sucesso. A nova senha foi enviada por notificação." };
    }),

  // Bloquear/Desbloquear usuário
  toggleUserBlock: protectedProcedure
    .input(z.object({ userId: z.string(), block: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

      if (input.block) {
        // Bloquear por 24 horas
        const lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await db.update(users).set({ lockedUntil: lockUntil }).where(eq(users.id, input.userId));
      } else {
        // Desbloquear
        await db.update(users).set({ lockedUntil: null, failedLoginAttempts: 0 }).where(eq(users.id, input.userId));
      }

      // Registrar ação
      await db.insert(actionLogs).values({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: ctx.user.id,
        targetType: "user",
        targetId: input.userId,
        action: input.block ? "block_user" : "unblock_user",
        details: `Usuário ${user.email} ${input.block ? "bloqueado" : "desbloqueado"}`,
      });

      return { success: true, message: input.block ? "Usuário bloqueado por 24 horas" : "Usuário desbloqueado com sucesso" };
    }),

  // Ativar/Desativar usuário
  toggleUserActive: protectedProcedure
    .input(z.object({ userId: z.string(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

      await db.update(users).set({ isActive: input.active }).where(eq(users.id, input.userId));

      // Registrar ação
      await db.insert(actionLogs).values({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: ctx.user.id,
        targetType: "user",
        targetId: input.userId,
        action: input.active ? "activate" : "deactivate",
        details: `Usuário ${user.email} ${input.active ? "ativado" : "desativado"}`,
      });

      return { success: true, message: input.active ? "Usuário ativado com sucesso" : "Usuário desativado com sucesso" };
    }),

  // Listar usuários de uma empresa
  listCompanyUsers: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) return [];
      const result = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        lastSignedIn: users.lastSignedIn,
        createdAt: users.createdAt,
        lockedUntil: users.lockedUntil,
      }).from(users).where(eq(users.companyId, input.companyId)).orderBy(sql`${users.createdAt} DESC`);
      return result;
    }),

  // Deletar empresa (hard delete - remove do banco)
  deleteCompany: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Deletar todos os usuários da empresa primeiro
      await db.delete(users).where(eq(users.companyId, input.companyId));
      
      // Deletar empresa permanentemente
      await db.delete(companies).where(eq(companies.id, input.companyId));
      
      // Registrar ação
      await db.insert(actionLogs).values({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: ctx.user.id,
        targetType: "company",
        targetId: input.companyId,
        action: "delete",
        details: `Empresa desativada`,
      });
      
      return { success: true };
    }),

  // Deletar usuário (hard delete - remove do banco)
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      
      // Deletar usuário permanentemente
      await db.delete(users).where(eq(users.id, input.userId));
      
      // Registrar ação
      await db.insert(actionLogs).values({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: ctx.user.id,
        targetType: "user",
        targetId: input.userId,
        action: "delete",
        details: `Usuário ${user.email} removido`,
      });
      
      return { success: true };
    }),

  // Redefinir senha com retorno da nova senha
  resetPasswordWithReturn: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

      const newPassword = generateStrongPassword();
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.update(users).set({
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
      }).where(eq(users.id, input.userId));

      return { success: true, password: newPassword, email: user.email };
    }),

  // Atualizar dados do usuário
  updateUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: z.enum(["admin", "manager", "broker", "finance", "viewer"]).optional(),
      managerId: z.string().nullable().optional(),
      companyId: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

      // Verificar se o email já está em uso por outro usuário
      if (input.email && input.email !== user.email) {
        const [existingUser] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "Este email já está em uso por outro usuário" });
        }
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.role !== undefined) updateData.role = input.role;
      if (input.companyId !== undefined) updateData.companyId = input.companyId;
      if (input.managerId !== undefined) updateData.managerId = input.managerId;

      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, input.userId));

        // Registrar ação
        await db.insert(actionLogs).values({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: ctx.user.id,
          targetType: "user",
          targetId: input.userId,
          action: "update",
          details: `Usuário ${user.email} atualizado`,
        });
      }

      return { success: true, message: "Usuário atualizado com sucesso" };
    }),

  // Atualizar email de notificação da empresa
  updateCompanyNotificationEmail: protectedProcedure
    .input(z.object({
      companyId: z.string(),
      notificationEmail: z.string().email().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(companies).set({ notificationEmail: input.notificationEmail }).where(eq(companies.id, input.companyId));
      return { success: true, message: "Email de notificação atualizado" };
    }),

  // Listar gerentes de uma empresa
  listManagers: protectedProcedure
    .input(z.object({ companyId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) return [];
      
      let query = db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        companyId: users.companyId,
      }).from(users).where(eq(users.role, "manager"));
      
      if (input.companyId) {
        query = db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          companyId: users.companyId,
        }).from(users).where(sql`${users.role} = 'manager' AND ${users.companyId} = ${input.companyId}`);
      }
      
      return await query;
    }),

  // Listar corretores de um gerente
  listBrokersByManager: protectedProcedure
    .input(z.object({ managerId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) return [];
      
      return await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      }).from(users).where(eq(users.managerId, input.managerId));
    }),

  // Atribuir corretor a um gerente
  assignBrokerToManager: protectedProcedure
    .input(z.object({
      brokerId: z.string(),
      managerId: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(users).set({ managerId: input.managerId }).where(eq(users.id, input.brokerId));
      
      await db.insert(actionLogs).values({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: ctx.user.id,
        targetType: "user",
        targetId: input.brokerId,
        action: "assign_manager",
        details: `Corretor vinculado ao gerente ${input.managerId || 'nenhum'}`,
      });

      return { success: true, message: "Corretor vinculado ao gerente" };
    }),

  // Vincular usuário a empresa (com atualização automática de contagem)
  assignUserToCompany: protectedProcedure
    .input(z.object({
      userId: z.string(),
      companyId: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(users).set({ companyId: input.companyId }).where(eq(users.id, input.userId));
      
      await db.insert(actionLogs).values({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: ctx.user.id,
        targetType: "user",
        targetId: input.userId,
        action: "assign_company",
        details: `Usuário vinculado à empresa ${input.companyId || 'nenhuma'}`,
      });

      return { success: true, message: "Usuário vinculado à empresa" };
    }),
});
