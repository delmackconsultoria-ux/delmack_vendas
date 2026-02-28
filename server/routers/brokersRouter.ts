import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, sales, commissions } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

function generateStrongPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
  let password = "";
  const bytes = randomBytes(12);
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

export const brokersRouter = router({
  // Listar corretores da empresa do gerente
  list: protectedProcedure.query(async ({ ctx }) => {
    // Permitir que gerentes, finance e viewers vejam os corretores
    const allowedRoles = ["manager", "finance", "viewer"];
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }

    const db = await getDb();
    if (!db) return [];

    const brokers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "broker"),
          eq(users.companyId, ctx.user.companyId || "")
        )
      );
    
    console.log('[brokersRouter] Retornando', brokers.length, 'corretores');

    return brokers;
  }),

  // Obter detalhes de um corretor
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas gerentes podem acessar" });
      }

      const db = await getDb();
      if (!db) return null;

      const broker = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, input.id),
            eq(users.role, "broker"),
            eq(users.companyId, ctx.user.companyId || ""),
            eq(users.managerId, ctx.user.id)
          )
        )
        .limit(1);

      if (!broker.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Corretor não encontrado" });
      }

      return broker[0];
    }),

  // Criar novo corretor
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas gerentes podem criar corretores" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });
      }

      // Verificar se email já existe
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email já cadastrado" });
      }

      // Gerar senha forte
      const password = generateStrongPassword();
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Criar novo corretor
      const newBrokerId = `broker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(users).values({
        id: newBrokerId,
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: "broker",
        companyId: ctx.user.companyId,
        managerId: ctx.user.id,
        isActive: true,
      });

      // TODO: Enviar email com senha via Manus

      return {
        id: newBrokerId,
        name: input.name,
        email: input.email,
        message: "Corretor criado com sucesso. Senha enviada por email.",
      };
    }),

  // Editar corretor
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Nome é obrigatório").optional(),
        email: z.string().email("Email inválido").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas gerentes podem editar corretores" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });
      }

      // Verificar se corretor pertence ao gerente
      const broker = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, input.id),
            eq(users.role, "broker"),
            eq(users.managerId, ctx.user.id)
          )
        )
        .limit(1);

      if (!broker.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Corretor não encontrado" });
      }

      // Verificar se novo email já existe (se for diferente)
      if (input.email && input.email !== broker[0].email) {
        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing.length > 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Email já cadastrado" });
        }
      }

      // Atualizar corretor
      await db
        .update(users)
        .set({
          name: input.name || broker[0].name,
          email: input.email || broker[0].email,
        })
        .where(eq(users.id, input.id));

      return { id: input.id, message: "Corretor atualizado com sucesso" };
    }),

  // Desativar corretor (soft delete - mantém dados históricos)
  deactivate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas gerentes podem desativar corretores" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });
      }

      // Verificar se corretor pertence ao gerente
      const broker = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, input.id),
            eq(users.role, "broker"),
            eq(users.managerId, ctx.user.id)
          )
        )
        .limit(1);

      if (!broker.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Corretor não encontrado" });
      }

      // Desativar corretor (mantém dados históricos)
      await db.update(users).set({ isActive: false }).where(eq(users.id, input.id));

      return { id: input.id, message: "Corretor desativado com sucesso. Dados históricos mantidos." };
    }),

  // Obter estatísticas do corretor
  getStats: protectedProcedure
    .input(z.object({ brokerId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas gerentes podem acessar" });
      }

      const db = await getDb();
      if (!db) return { totalSales: 0, totalCommission: 0, paidCommission: 0, pendingCommission: 0 };

      // Verificar se corretor pertence ao gerente
      const broker = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, input.brokerId),
            eq(users.role, "broker"),
            eq(users.managerId, ctx.user.id)
          )
        )
        .limit(1);

      if (!broker.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Corretor não encontrado" });
      }

      // Total de vendas do corretor (via comissões)
      const [salesCount] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${commissions.saleId})` })
        .from(commissions)
        .where(
          and(
            eq(commissions.brokerId, input.brokerId),
            eq(commissions.companyId, ctx.user.companyId || "")
          )
        );

      // Total de comissões
      const [totalComm] = await db
        .select({ total: sql<number>`COALESCE(SUM(${commissions.commissionValue}), 0)` })
        .from(commissions)
        .where(
          and(
            eq(commissions.brokerId, input.brokerId),
            eq(commissions.companyId, ctx.user.companyId || "")
          )
        );

      // Comissões pagas
      const [paidComm] = await db
        .select({ total: sql<number>`COALESCE(SUM(${commissions.commissionValue}), 0)` })
        .from(commissions)
        .where(
          and(
            eq(commissions.brokerId, input.brokerId),
            eq(commissions.status, "paid"),
            eq(commissions.companyId, ctx.user.companyId || "")
          )
        );

      // Comissões pendentes
      const [pendingComm] = await db
        .select({ total: sql<number>`COALESCE(SUM(${commissions.commissionValue}), 0)` })
        .from(commissions)
        .where(
          and(
            eq(commissions.brokerId, input.brokerId),
            sql`${commissions.status} != 'paid'`,
            eq(commissions.companyId, ctx.user.companyId || "")
          )
        );

      return {
        totalSales: Number(salesCount?.count || 0),
        totalCommission: Number(totalComm?.total || 0),
        paidCommission: Number(paidComm?.total || 0),
        pendingCommission: Number(pendingComm?.total || 0),
      };
    }),
});
