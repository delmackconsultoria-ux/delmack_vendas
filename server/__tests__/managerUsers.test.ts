import { describe, it, expect, beforeEach, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { managerUsersRouter } from "../routers/managerUsersRouter";
import { getDb } from "../db";

// Mock do banco de dados
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// Mock do notifyOwner
vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("managerUsersRouter", () => {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  };

  const mockCtx = {
    user: {
      id: "manager_123",
      name: "Gerente Teste",
      email: "gerente@test.com",
      role: "manager",
      companyId: "company_123",
    },
    req: {},
    res: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getDb as any).mockResolvedValue(mockDb);
  });

  describe("listTeamUsers", () => {
    it("deve retornar lista vazia se gerente não tem permissão", async () => {
      const invalidCtx = { ...mockCtx, user: { ...mockCtx.user, role: "broker" } };
      
      const caller = managerUsersRouter.createCaller(invalidCtx);
      
      try {
        await caller.listTeamUsers();
        expect.fail("Deveria lançar erro");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError<any>).code).toBe("FORBIDDEN");
      }
    });

    it("deve retornar usuários da equipe do gerente", async () => {
      const mockUsers = [
        {
          id: "user_1",
          name: "Corretor 1",
          email: "corretor1@test.com",
          role: "broker",
          isActive: true,
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockUsers),
        }),
      };

      mockDb.select.mockReturnValue(mockQuery);

      const caller = managerUsersRouter.createCaller(mockCtx);
      const result = await caller.listTeamUsers();

      expect(result).toEqual(mockUsers);
    });
  });

  describe("createTeamUser", () => {
    it("deve rejeitar se usuário não é gerente", async () => {
      const invalidCtx = { ...mockCtx, user: { ...mockCtx.user, role: "broker" } };
      
      const caller = managerUsersRouter.createCaller(invalidCtx);
      
      try {
        await caller.createTeamUser({
          name: "Novo Corretor",
          email: "novo@test.com",
          role: "broker",
        });
        expect.fail("Deveria lançar erro");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError<any>).code).toBe("FORBIDDEN");
      }
    });

    it("deve rejeitar email duplicado", async () => {
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: "user_existing" }]),
        }),
      };

      mockDb.select.mockReturnValue(mockQuery);

      const caller = managerUsersRouter.createCaller(mockCtx);
      
      try {
        await caller.createTeamUser({
          name: "Novo Corretor",
          email: "existing@test.com",
          role: "broker",
        });
        expect.fail("Deveria lançar erro");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError<any>).code).toBe("CONFLICT");
      }
    });

    it("deve criar novo usuário com sucesso", async () => {
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      };

      mockDb.select.mockReturnValue(mockQuery);
      
      const mockInsert = {
        values: vi.fn().mockResolvedValue(undefined),
      };
      
      mockDb.insert.mockReturnValue(mockInsert);

      const caller = managerUsersRouter.createCaller(mockCtx);
      const result = await caller.createTeamUser({
        name: "Novo Corretor",
        email: "novo@test.com",
        role: "broker",
      });

      expect(result.success).toBe(true);
      expect(result.email).toBe("novo@test.com");
      expect(result.password).toBeDefined();
      expect(result.password?.length).toBeGreaterThan(0);
    });
  });

  describe("removeTeamUser", () => {
    it("deve rejeitar se usuário não é gerente", async () => {
      const invalidCtx = { ...mockCtx, user: { ...mockCtx.user, role: "broker" } };
      
      const caller = managerUsersRouter.createCaller(invalidCtx);
      
      try {
        await caller.removeTeamUser({ userId: "user_123" });
        expect.fail("Deveria lançar erro");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError<any>).code).toBe("FORBIDDEN");
      }
    });

    it("deve rejeitar se usuário não existe", async () => {
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      };

      mockDb.select.mockReturnValue(mockQuery);

      const caller = managerUsersRouter.createCaller(mockCtx);
      
      try {
        await caller.removeTeamUser({ userId: "user_nonexistent" });
        expect.fail("Deveria lançar erro");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError<any>).code).toBe("NOT_FOUND");
      }
    });

    it("deve rejeitar remoção de si mesmo", async () => {
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "manager_123",
              name: "Gerente",
              email: "gerente@test.com",
              role: "manager",
              companyId: "company_123",
            },
          ]),
        }),
      };

      mockDb.select.mockReturnValue(mockQuery);

      const caller = managerUsersRouter.createCaller(mockCtx);
      
      try {
        await caller.removeTeamUser({ userId: "manager_123" });
        expect.fail("Deveria lançar erro");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError<any>).code).toBe("BAD_REQUEST");
      }
    });

    it("deve remover usuário com sucesso", async () => {
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "user_to_remove",
              name: "Corretor a Remover",
              email: "remover@test.com",
              role: "broker",
              companyId: "company_123",
            },
          ]),
        }),
      };

      mockDb.select.mockReturnValue(mockQuery);
      
      const mockUpdate = {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      };
      
      mockDb.update.mockReturnValue(mockUpdate);

      const caller = managerUsersRouter.createCaller(mockCtx);
      const result = await caller.removeTeamUser({ userId: "user_to_remove" });

      expect(result.success).toBe(true);
      expect(result.message).toContain("removido da equipe");
    });
  });
});
