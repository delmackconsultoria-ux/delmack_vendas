/**
 * REST Authentication Router
 * 
 * Provides REST endpoints for authentication operations.
 * Used by frontend login form and other clients that prefer REST over tRPC.
 * 
 * Endpoints:
 * - POST /api/auth/login - Login with email and password
 * - POST /api/auth/logout - Logout (clear session)
 * - GET /api/auth/me - Get current user info
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { authenticateUser, getUserByEmail, incrementFailedAttempts, resetFailedAttempts } from "../db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export function registerRestAuthRoutes(app: Express) {
  // Debug middleware para todas as requisições de auth
  app.use('/api/auth', (req, res, next) => {
    console.log(`[REST Auth Debug] ${req.method} ${req.path}`);
    console.log(`[REST Auth Debug] Headers:`, req.headers);
    console.log(`[REST Auth Debug] Body:`, req.body);
    next();
  });
  /**
   * POST /api/auth/login
   * 
   * Login with email and password
   * 
   * Request body:
   * {
   *   "email": "user@example.com",
   *   "password": "password123"
   * }
   * 
   * Response (200):
   * {
   *   "success": true,
   *   "user": {
   *     "id": "user_123",
   *     "email": "user@example.com",
   *     "name": "John Doe",
   *     "role": "broker",
   *     "companyId": "comp_123"
   *   }
   * }
   * 
   * Response (401):
   * {
   *   "success": false,
   *   "error": "Credenciais inválidas"
   * }
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validation = LoginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Email e senha são obrigatórios",
          details: validation.error.issues,
        });
      }

      const { email, password } = validation.data;

      // Check if user exists
      const existingUser = await getUserByEmail(email);
      if (!existingUser) {
        return res.status(401).json({
          success: false,
          error: "Email ou senha incorretos",
        });
      }

      // Check if account is locked
      if (existingUser.lockedUntil && new Date(existingUser.lockedUntil) > new Date()) {
        const minutesLeft = Math.ceil(
          (new Date(existingUser.lockedUntil).getTime() - Date.now()) / 60000
        );
        return res.status(429).json({
          success: false,
          error: `Conta temporariamente bloqueada. Tente novamente em ${minutesLeft} minuto(s).`,
        });
      }

      // Authenticate user
      const user = await authenticateUser(email, password);
      if (!user) {
        // Increment failed attempts
        await incrementFailedAttempts(email);
        const attempts = (existingUser.failedLoginAttempts || 0) + 1;
        const remaining = 5 - attempts;

        if (remaining <= 0) {
          return res.status(429).json({
            success: false,
            error: "Conta bloqueada por 15 minutos devido a múltiplas tentativas incorretas.",
          });
        }

        return res.status(401).json({
          success: false,
          error: `Senha incorreta. Você tem mais ${remaining} tentativa(s) antes do bloqueio.`,
        });
      }

      // Reset failed attempts after successful login
      await resetFailedAttempts(email);

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: "Sua conta está desativada. Entre em contato com o administrador.",
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

      const cookieOptions = getSessionCookieOptions(req);
      const cookieValue = encodeURIComponent(JSON.stringify(sessionCookie));
      res.cookie(COOKIE_NAME, cookieValue, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return success response
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
        },
      });
    } catch (error) {
      console.error("[REST Auth] Login error:", error);
      return res.status(500).json({
        success: false,
        error: "Erro ao fazer login",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  /**
   * POST /api/auth/logout
   * 
   * Logout - Clear session cookie
   * 
   * Response (200):
   * {
   *   "success": true
   * }
   */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    try {
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("[REST Auth] Logout error:", error);
      return res.status(500).json({
        success: false,
        error: "Erro ao fazer logout",
      });
    }
  });

  /**
   * GET /api/auth/me
   * 
   * Get current user info from session cookie
   * 
   * Response (200):
   * {
   *   "success": true,
   *   "user": {
   *     "id": "user_123",
   *     "email": "user@example.com",
   *     "name": "John Doe",
   *     "role": "broker",
   *     "companyId": "comp_123"
   *   }
   * }
   * 
   * Response (401):
   * {
   *   "success": false,
   *   "error": "Não autenticado"
   * }
   */
  app.get("/api/auth/me", (req: Request, res: Response) => {
    try {
      // Get session cookie
      const cookieValue = req.cookies[COOKIE_NAME];
      if (!cookieValue) {
        return res.status(401).json({
          success: false,
          error: "Não autenticado",
        });
      }

      // Parse session cookie
      const sessionCookie = JSON.parse(decodeURIComponent(cookieValue));

      return res.status(200).json({
        success: true,
        user: {
          id: sessionCookie.userId,
          email: sessionCookie.email,
          name: sessionCookie.name,
          role: sessionCookie.role,
          companyId: sessionCookie.companyId,
        },
      });
    } catch (error) {
      console.error("[REST Auth] Get me error:", error);
      return res.status(401).json({
        success: false,
        error: "Não autenticado",
      });
    }
  });
}
