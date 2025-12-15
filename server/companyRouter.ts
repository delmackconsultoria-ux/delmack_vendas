/**
 * Router tRPC para gerenciamento de empresas (multi-tenant)
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { companies, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const companyRouter = router({
  /**
   * Cria uma nova empresa
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Apenas admin pode criar empresas
        if (ctx.user?.role !== "admin") {
          throw new Error("Acesso negado");
        }

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const companyId = uuidv4();

        await db.insert(companies).values({
          id: companyId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          address: input.address,
        });

        return { success: true, companyId };
      } catch (error) {
        console.error("[Company] Erro ao criar empresa:", error);
        throw error;
      }
    }),

  /**
   * Lista todas as empresas (apenas admin)
   */
  listAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user?.role !== "admin") {
        throw new Error("Acesso negado");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const result = await db.select().from(companies);
      return result;
    } catch (error) {
      console.error("[Company] Erro ao listar empresas:", error);
      throw error;
    }
  }),

  /**
   * Obtém a empresa do usuário logado
   */
  getMyCompany: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user?.companyId) {
        return null;
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const result = await db
        .select()
        .from(companies)
        .where(eq(companies.id, ctx.user.companyId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("[Company] Erro ao obter empresa:", error);
      throw error;
    }
  }),

  /**
   * Atualiza dados da empresa
   */
  update: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        logo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verificar se o usuário é admin ou gerente da empresa
        if (
          ctx.user?.role !== "admin" &&
          ctx.user?.companyId !== input.companyId
        ) {
          throw new Error("Acesso negado");
        }

        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.email) updateData.email = input.email;
        if (input.phone) updateData.phone = input.phone;
        if (input.address) updateData.address = input.address;
        if (input.logo) updateData.logo = input.logo;
        updateData.updatedAt = new Date();

        await db
          .update(companies)
          .set(updateData)
          .where(eq(companies.id, input.companyId));

        return { success: true };
      } catch (error) {
        console.error("[Company] Erro ao atualizar empresa:", error);
        throw error;
      }
    }),

  /**
   * Lista usuários da empresa (sem input - usa companyId do usuário logado)
   */
  listUsers: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (!ctx.user?.companyId && ctx.user?.role !== "manager") {
        return [];
      }
      const companyId = ctx.user.companyId;
      if (!companyId) return [];
      const result = await db.select().from(users).where(eq(users.companyId, companyId));
      return result.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      }));
    } catch (error) {
      console.error("[Company] Erro ao listar usuários:", error);
      throw error;
    }
  }),

  /**
   * Lista usuários da empresa (com companyId)
   */
  listUsersById: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verificar se o usuário é admin ou gerente da empresa
        if (
          ctx.user?.role !== "admin" &&
          ctx.user?.companyId !== input.companyId
        ) {
          throw new Error("Acesso negado");
        }

        const result = await db
          .select()
          .from(users)
          .where(eq(users.companyId, input.companyId));

        return result.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt,
        }));
      } catch (error) {
        console.error("[Company] Erro ao listar usuários:", error);
        throw error;
      }
    }),

  /**
   * Cria novo usuário na empresa (Manager)
   */
  addUser: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        surname: z.string().optional(),
        email: z.string().email(),
        role: z.enum(["broker", "finance"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (ctx.user?.role !== "manager" && ctx.user?.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        const bcrypt = await import("bcryptjs");
        const { randomBytes } = await import("crypto");
        const { notifyOwner } = await import("./_core/notification");
        
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
        let password = "";
        const bytes = randomBytes(12);
        for (let i = 0; i < 12; i++) password += chars[bytes[i] % chars.length];
        
        const hashedPassword = await bcrypt.default.hash(password, 10);
        const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullName = input.surname ? `${input.name} ${input.surname}` : input.name;
        
        await db.insert(users).values({
          id,
          name: fullName,
          email: input.email,
          password: hashedPassword,
          role: input.role,
          companyId: ctx.user.companyId,
          loginMethod: "email",
          isActive: true,
        });
        
        await notifyOwner({
          title: `Novo usuário: ${fullName}`,
          content: `Email: ${input.email}\nSenha: ${password}`,
        });
        
        return { success: true, id };
      } catch (error) {
        console.error("[Company] Erro ao criar usuário:", error);
        throw error;
      }
    }),

  /**
   * Ativa/Desativa usuário (soft delete)
   */
  toggleUserStatus: protectedProcedure
    .input(z.object({ userId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (ctx.user?.role !== "manager" && ctx.user?.role !== "superadmin") {
          throw new Error("Acesso negado");
        }
        await db.update(users).set({ isActive: input.isActive }).where(eq(users.id, input.userId));
        return { success: true };
      } catch (error) {
        console.error("[Company] Erro ao alterar status:", error);
        throw error;
      }
    }),

  /**
   * Adiciona usuário existente à empresa
   */
  addExistingUser: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (ctx.user?.role !== "admin" && ctx.user?.companyId !== input.companyId) {
          throw new Error("Acesso negado");
        }
        await db.update(users).set({ companyId: input.companyId }).where(eq(users.id, input.userId));
        return { success: true };
      } catch (error) {
        console.error("[Company] Erro ao adicionar usuário:", error);
        throw error;
      }
    }),

  /**
   * Remove usuário da empresa
   */
  removeUser: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Apenas admin ou gerente da empresa pode remover usuários
        if (
          ctx.user?.role !== "admin" &&
          ctx.user?.companyId !== input.companyId
        ) {
          throw new Error("Acesso negado");
        }

        await db
          .update(users)
          .set({ companyId: null })
          .where(eq(users.id, input.userId));

        return { success: true };
      } catch (error) {
        console.error("[Company] Erro ao remover usuário:", error);
        throw error;
      }
    }),
});

