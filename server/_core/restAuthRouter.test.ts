/**
 * Tests for REST Authentication Router
 * 
 * Tests the REST endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/logout
 * - GET /api/auth/me
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { Express } from "express";
import { registerRestAuthRoutes } from "./restAuthRouter";
import * as db from "../db";

// Mock the database functions
vi.mock("../db", () => ({
  authenticateUser: vi.fn(),
  getUserByEmail: vi.fn(),
  incrementFailedAttempts: vi.fn(),
  resetFailedAttempts: vi.fn(),
}));

// Mock the cookies module
vi.mock("./cookies", () => ({
  getSessionCookieOptions: vi.fn(() => ({
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  })),
}));

describe("REST Auth Router", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerRestAuthRoutes(app);
    vi.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        id: "user_123",
        email: "user@test.com",
        name: "Test User",
        role: "broker",
        companyId: "comp_123",
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(db.authenticateUser).mockResolvedValue(mockUser);
      vi.mocked(db.resetFailedAttempts).mockResolvedValue(undefined);

      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@test.com", password: "password123" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe("user@test.com");
    });

    it("should return 400 for missing email", async () => {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "password123" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Email e senha são obrigatórios");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid-email", password: "password123" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it("should return 401 for non-existent user", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(null);

      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nonexistent@test.com", password: "password123" }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Email ou senha incorretos");
    });

    it("should return 401 for wrong password", async () => {
      const mockUser = {
        id: "user_123",
        email: "user@test.com",
        name: "Test User",
        role: "broker",
        companyId: "comp_123",
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(db.authenticateUser).mockResolvedValue(null);
      vi.mocked(db.incrementFailedAttempts).mockResolvedValue(undefined);

      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@test.com", password: "wrongpassword" }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Senha incorreta");
    });

    it("should return 429 for locked account", async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      const mockUser = {
        id: "user_123",
        email: "user@test.com",
        name: "Test User",
        role: "broker",
        companyId: "comp_123",
        isActive: true,
        failedLoginAttempts: 5,
        lockedUntil,
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);

      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@test.com", password: "password123" }),
      });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("bloqueada");
    });

    it("should return 403 for inactive account", async () => {
      const mockUser = {
        id: "user_123",
        email: "user@test.com",
        name: "Test User",
        role: "broker",
        companyId: "comp_123",
        isActive: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(db.authenticateUser).mockResolvedValue(mockUser);

      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@test.com", password: "password123" }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("desativada");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully", async () => {
      const response = await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await fetch("http://localhost:3000/api/auth/me", {
        method: "GET",
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Não autenticado");
    });
  });
});
