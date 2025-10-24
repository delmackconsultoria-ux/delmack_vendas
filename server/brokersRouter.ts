/**
 * Router tRPC para gerenciar corretores
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const brokersRouter = router({
  /**
   * Listar todos os corretores da empresa
   */
  listBrokers: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const brokers = await db
        .select()
        .from(users)
        .where(eq(users.companyId, ctx.user.companyId || "1"));

      return brokers.map((broker) => ({
        id: broker.id,
        name: broker.name || "Sem nome",
        email: broker.email || "",
        role: broker.role,
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

