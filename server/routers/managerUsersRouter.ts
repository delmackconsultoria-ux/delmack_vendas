import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
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

export const managerUsersRouter = router({
  // Listar usuários da equipe do gerente
  listTeamUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "manager") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Apenas gerentes podem acessar esta funcionalidade" });
    }

    const db = await getDb();
    if (!db) return [];

    // Buscar todos os usuários da mesma empresa (equipe do gerente)
    const teamUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    }).from(users).where(
      and(
        eq(users.companyId, ctx.user.companyId || ""),
        eq(users.isActive, true)
      )
    );

    return teamUsers;
  }),

  // Criar novo usuário (corretor ou financeiro)
  createTeamUser: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      email: z.string().email("Email inválido"),
      role: z.enum(["broker", "finance"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas gerentes podem criar usuários" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar se email já existe
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existingUser.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado no sistema" });
      }

      // Gerar senha forte
      const password = generateStrongPassword();
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      try {
        // Inserir novo usuário
        await db.insert(users).values({
          id,
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: input.role,
          companyId: ctx.user.companyId,
          loginMethod: "email",
          isActive: true,
        });

        // Notificar o proprietário sobre o novo usuário
        try {
          await notifyOwner({
            title: `Novo usuário criado por ${ctx.user.name}`,
            content: `Nome: ${input.name}\nEmail: ${input.email}\nPerfil: ${input.role === "broker" ? "Corretor" : "Financeiro"}\nSenha: ${password}`,
          });
        } catch (e) {
          console.log("[ManagerUsers] Erro ao enviar notificação:", e);
        }

        return { 
          success: true, 
          email: input.email, 
          password,
          message: `Usuário ${input.name} criado com sucesso! Credenciais enviadas por email.`
        };
      } catch (error) {
        console.error("[ManagerUsers] Erro ao criar usuário:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Erro ao criar usuário. Tente novamente." 
        });
      }
    }),

  // Remover usuário (desativar, mantendo dados históricos)
  removeTeamUser: protectedProcedure
    .input(z.object({
      userId: z.string().min(1, "ID do usuário é obrigatório"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas gerentes podem remover usuários" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar se o usuário a ser removido pertence à mesma empresa
      const userToRemove = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (userToRemove.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      if (userToRemove[0].companyId !== (ctx.user.companyId || "")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não pode remover usuários de outras empresas" });
      }

      // Não permitir remover a si mesmo
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode remover sua própria conta" });
      }

      // Desativar usuário (não deletar, mantendo dados históricos)
      try {
        await db.update(users).set({ isActive: false }).where(eq(users.id, input.userId));

        return { 
          success: true, 
          message: `Usuário ${userToRemove[0].name} foi removido da equipe. Dados históricos foram mantidos.`
        };
      } catch (error) {
        console.error("[ManagerUsers] Erro ao remover usuário:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Erro ao remover usuário. Tente novamente." 
        });
      }
    }),
});
