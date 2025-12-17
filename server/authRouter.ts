import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { authenticateUser, createUser, getUserByEmail, hashPassword, incrementFailedAttempts, resetFailedAttempts, requestPasswordReset, resetPassword } from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

export const authRouter = router({
  /**
   * Get current authenticated user
   */
  me: publicProcedure.query((opts) => opts.ctx.user),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Primeiro verificar se o email existe
      const existingUser = await getUserByEmail(input.email);
      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Este e-mail não está cadastrado no sistema. Verifique o e-mail digitado ou entre em contato com o administrador.",
        });
      }

      // Verificar se a conta está bloqueada
      if (existingUser.lockedUntil && new Date(existingUser.lockedUntil) > new Date()) {
        const minutesLeft = Math.ceil((new Date(existingUser.lockedUntil).getTime() - Date.now()) / 60000);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Conta temporariamente bloqueada devido a múltiplas tentativas incorretas. Tente novamente em ${minutesLeft} minuto(s).`,
        });
      }

      const user = await authenticateUser(input.email, input.password);

      if (!user) {
        // Incrementar tentativas falhas
        await incrementFailedAttempts(input.email);
        const attempts = (existingUser.failedLoginAttempts || 0) + 1;
        const remaining = 5 - attempts;
        
        if (remaining <= 0) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Conta bloqueada por 15 minutos devido a múltiplas tentativas incorretas.",
          });
        }
        
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `Senha incorreta. Você tem mais ${remaining} tentativa(s) antes do bloqueio.`,
        });
      }

      // Resetar tentativas após login bem-sucedido
      await resetFailedAttempts(input.email);

      if (!user.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sua conta está desativada. Entre em contato com o administrador da sua empresa para reativá-la.",
        });
      }

      // Set session cookie
      const sessionCookie = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      };

      const cookieOptions = getSessionCookieOptions(ctx.req);
      const cookieValue = encodeURIComponent(JSON.stringify(sessionCookie));
      ctx.res.cookie(COOKIE_NAME, cookieValue, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
        },
      };
    }),

  /**
   * Register a new user
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        confirmPassword: z.string(),
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        companyId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate password confirmation
      if (input.password !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "As senhas não correspondem",
        });
      }

      // Check if user already exists
      const existingUser = await getUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email já cadastrado",
        });
      }

      // Create new user
      const newUser = await createUser({
        email: input.email,
        password: input.password,
        name: input.name,
        role: "broker", // Default role for new users
        companyId: input.companyId,
      });

      // Set session cookie
      const sessionCookie = {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        companyId: input.companyId,
      };

      const cookieOptions = getSessionCookieOptions(ctx.req);
      const cookieValue = encodeURIComponent(JSON.stringify(sessionCookie));
      ctx.res.cookie(COOKIE_NAME, cookieValue, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        success: true,
        user: newUser,
      };
    }),

  /**
   * Logout
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

  /**
   * Reset password request - envia e-mail com link de recuperação
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const result = await requestPasswordReset(input.email);
      
      if (result) {
        // Enviar e-mail com link de recuperação
        const { notifyOwner } = await import("./_core/notification");
        const resetLink = `${process.env.VITE_OAUTH_PORTAL_URL?.replace('/oauth', '')}/reset-password?token=${result.token}`;
        
        await notifyOwner({
          title: `Recuperação de Senha - ${result.name || result.email}`,
          content: `O usuário ${result.name || result.email} solicitou recuperação de senha.\n\nLink de recuperação: ${resetLink}\n\nEste link expira em 1 hora.`
        });
      }
      
      // Sempre retorna sucesso para não revelar se o email existe
      return { 
        success: true, 
        message: "Se o e-mail estiver cadastrado, você receberá um link de recuperação em breve." 
      };
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "As senhas não correspondem",
        });
      }

      const result = await resetPassword(input.token, input.newPassword);
      
      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return { success: true, message: "Senha alterada com sucesso! Você já pode fazer login." };
    }),
});

