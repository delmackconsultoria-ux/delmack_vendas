/**
 * Tests for tRPC Auth Router
 * 
 * Tests the tRPC procedures:
 * - auth.me
 * - auth.login
 * - auth.logout
 * - auth.register
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { authRouter } from "./authRouter";
import * as db from "./db";

// Mock the database functions
vi.mock("./db", () => ({
  authenticateUser: vi.fn(),
  createUser: vi.fn(),
  getUserByEmail: vi.fn(),
  hashPassword: vi.fn(),
  incrementFailedAttempts: vi.fn(),
  resetFailedAttempts: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  getDb: vi.fn(),
}));

// Mock the cookies module
vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: vi.fn(() => ({
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  })),
}));

describe("tRPC Auth Router", () => {
  const mockContext = {
    user: {
      id: "user_123",
      email: "user@test.com",
      name: "Test User",
      role: "broker",
      companyId: "comp_123",
    },
    req: {
      cookies: {},
    } as any,
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("auth.me", () => {
    it("should return current user when authenticated", async () => {
      const caller = authRouter.createCaller(mockContext);
      const result = await caller.me();

      expect(result).toEqual(mockContext.user);
    });

    it("should return null when not authenticated", async () => {
      const unauthenticatedContext = {
        ...mockContext,
        user: null,
      };

      const caller = authRouter.createCaller(unauthenticatedContext);
      const result = await caller.me();

      expect(result).toBeNull();
    });
  });

  describe("auth.login", () => {
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

      const caller = authRouter.createCaller(mockContext);
      const result = await caller.login({ email: "user@test.com", password: "password123" });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe("user@test.com");
      expect(mockContext.res.cookie).toHaveBeenCalled();
    });

    it("should throw error for non-existent user", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(null);

      const caller = authRouter.createCaller(mockContext);

      await expect(
        caller.login({ email: "nonexistent@test.com", password: "password123" })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for wrong password", async () => {
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

      const caller = authRouter.createCaller(mockContext);

      await expect(
        caller.login({ email: "user@test.com", password: "wrongpassword" })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for locked account", async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
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

      const caller = authRouter.createCaller(mockContext);

      await expect(
        caller.login({ email: "user@test.com", password: "password123" })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for inactive account", async () => {
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

      const caller = authRouter.createCaller(mockContext);

      await expect(
        caller.login({ email: "user@test.com", password: "password123" })
      ).rejects.toThrow(TRPCError);
    });

    it("should validate email format", async () => {
      const caller = authRouter.createCaller(mockContext);

      await expect(
        caller.login({ email: "invalid-email", password: "password123" })
      ).rejects.toThrow();
    });

    it("should validate password length", async () => {
      const caller = authRouter.createCaller(mockContext);

      await expect(
        caller.login({ email: "user@test.com", password: "short" })
      ).rejects.toThrow();
    });
  });

  describe("auth.logout", () => {
    it("should logout successfully", async () => {
      const caller = authRouter.createCaller(mockContext);
      const result = await caller.logout();

      expect(result.success).toBe(true);
      expect(mockContext.res.clearCookie).toHaveBeenCalled();
    });
  });

  describe("auth.register", () => {
    it("should register successfully with valid data", async () => {
      const newUser = {
        id: "user_new_123",
        email: "newuser@test.com",
        name: "New User",
        role: "broker",
        companyId: "comp_123",
        isActive: true,
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(null);
      vi.mocked(db.createUser).mockResolvedValue(newUser);

      const caller = authRouter.createCaller(mockContext);
      const result = await caller.register({
        email: "newuser@test.com",
        password: "password123",
        confirmPassword: "password123",
        name: "New User",
        companyId: "comp_123",
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe("newuser@test.com");
    });

    it("should throw error if passwords don't match", async () => {
      const caller = authRouter.createCaller(mockContext);

      await expect(
        caller.register({
          email: "newuser@test.com",
          password: "password123",
          confirmPassword: "different",
          name: "New User",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error if email already exists", async () => {
      const existingUser = {
        id: "user_123",
        email: "existing@test.com",
        name: "Existing User",
        role: "broker",
        companyId: "comp_123",
        isActive: true,
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(existingUser);

      const caller = authRouter.createCaller(mockContext);

      await expect(
        caller.register({
          email: "existing@test.com",
          password: "password123",
          confirmPassword: "password123",
          name: "New User",
        })
      ).rejects.toThrow(TRPCError);
    });
  });
});
