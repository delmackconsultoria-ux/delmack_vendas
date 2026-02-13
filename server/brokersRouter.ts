/**
 * Router tRPC para gerenciar corretores
 * Regra: Corretores veem apenas a si mesmos
 *        Gerentes/Financeiro veem corretores da mesma empresa
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const brokersRouter = router({
  /**
   * Listar corretores com controle de acesso por papel
   * - Corretores: veem apenas a si mesmos
   * - Gerentes/Financeiro: veem todos da mesma empresa
   */
  listBrokers: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Se for corretor, retorna apenas ele mesmo
      if (ctx.user.role === "broker") {
        return [
          {
            id: ctx.user.id,
            name: ctx.user.name || "Sem nome",
            email: ctx.user.email || "",
            role: ctx.user.role,
          },
        ];
      }

      // Se for gerente, retorna apenas corretores vinculados a ele
      if (ctx.user.role === "manager") {
        const brokers = await db
          .select()
          .from(users)
          .where(eq(users.managerId, ctx.user.id));

        return brokers.map((broker) => ({
          id: broker.id,
          name: broker.name || "Sem nome",
          email: broker.email || "",
          role: broker.role,
          isActive: broker.isActive,
        }));
      }

      // Se for financeiro ou admin, retorna todos os corretores da empresa
      const brokers = await db
        .select()
        .from(users)
        .where(eq(users.companyId, ctx.user.companyId || "1"));

      return brokers
        .filter((broker) => broker.role === "broker")
        .map((broker) => ({
          id: broker.id,
          name: broker.name || "Sem nome",
          email: broker.email || "",
          role: broker.role,
          isActive: broker.isActive,
        }));
    } catch (error) {
      console.error("[Brokers Router] Erro ao listar corretores:", error);
      throw new Error("Erro ao listar corretores");
    }
  }),

  /**
   * Validar email externo
   */
  validateExternalEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(input.email);
    }),
});

