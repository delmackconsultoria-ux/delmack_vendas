import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as properfyIndicators from "../indicators/properfyIndicators";

// Mock do getDb
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("Properfy Indicators - Robustness Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateActivePropertiesCount", () => {
    it("deve retornar 0 quando database não está disponível", async () => {
      const { getDb } = await import("../db");
      vi.mocked(getDb).mockResolvedValueOnce(null);

      const result = await properfyIndicators.calculateActivePropertiesCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(result).toBe(0);
    });

    it("deve retornar 0 com datas inválidas", async () => {
      const result = await properfyIndicators.calculateActivePropertiesCount(
        null as any,
        new Date("2026-03-31")
      );

      expect(result).toBe(0);
    });

    it("deve retornar número quando query é bem-sucedida", async () => {
      const { getDb } = await import("../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ count: 575 }]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await properfyIndicators.calculateActivePropertiesCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(result).toBe(575);
    });

    it("deve capturar erros sem lançar exceção", async () => {
      const { getDb } = await import("../db");
      vi.mocked(getDb).mockRejectedValueOnce(new Error("DB Error"));

      const result = await properfyIndicators.calculateActivePropertiesCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(result).toBe(0);
    });
  });

  describe("calculateAngariationsCount", () => {
    it("deve retornar 0 quando database não está disponível", async () => {
      const { getDb } = await import("../db");
      vi.mocked(getDb).mockResolvedValueOnce(null);

      const result = await properfyIndicators.calculateAngariationsCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(result).toBe(0);
    });

    it("deve retornar 0 com datas inválidas", async () => {
      const result = await properfyIndicators.calculateAngariationsCount(
        undefined as any,
        new Date("2026-03-31")
      );

      expect(result).toBe(0);
    });

    it("deve retornar número quando query é bem-sucedida", async () => {
      const { getDb } = await import("../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ count: 7 }]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await properfyIndicators.calculateAngariationsCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(result).toBe(7);
    });

    it("deve capturar erros sem lançar exceção", async () => {
      const { getDb } = await import("../db");
      vi.mocked(getDb).mockRejectedValueOnce(new Error("DB Error"));

      const result = await properfyIndicators.calculateAngariationsCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(result).toBe(0);
    });
  });

  describe("calculateRemovedPropertiesCount", () => {
    it("deve retornar 0 quando database não está disponível", async () => {
      const { getDb } = await import("../db");
      vi.mocked(getDb).mockResolvedValueOnce(null);

      const result = await properfyIndicators.calculateRemovedPropertiesCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(result).toBe(0);
    });

    it("deve retornar 0 com datas inválidas", async () => {
      const result = await properfyIndicators.calculateRemovedPropertiesCount(
        new Date("2026-03-01"),
        "invalid" as any
      );

      expect(result).toBe(0);
    });

    it("deve retornar número quando query é bem-sucedida", async () => {
      const { getDb } = await import("../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ count: 4129 }]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await properfyIndicators.calculateRemovedPropertiesCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(result).toBe(4129);
    });

    it("deve capturar erros sem lançar exceção", async () => {
      const { getDb } = await import("../db");
      vi.mocked(getDb).mockRejectedValueOnce(new Error("DB Error"));

      const result = await properfyIndicators.calculateRemovedPropertiesCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(result).toBe(0);
    });
  });

  describe("calculateVSO", () => {
    it("deve retornar 0 quando carteira anterior é 0", async () => {
      const result = await properfyIndicators.calculateVSO(10, 0);
      expect(result).toBe(0);
    });

    it("deve retornar 0 quando vendas são 0", async () => {
      const result = await properfyIndicators.calculateVSO(0, 575);
      expect(result).toBe(0);
    });

    it("deve retornar 0 com inputs inválidos", async () => {
      const result = await properfyIndicators.calculateVSO(null as any, 575);
      expect(result).toBe(0);
    });

    it("deve calcular VSO corretamente", async () => {
      // 10 vendas / 575 carteira = 0.0173913...
      const result = await properfyIndicators.calculateVSO(10, 575);
      expect(result).toBeCloseTo(0.0173913, 5);
    });

    it("deve retornar 0 quando resultado é NaN", async () => {
      const result = await properfyIndicators.calculateVSO(NaN, 575);
      expect(result).toBe(0);
    });

    it("deve capturar erros sem lançar exceção", async () => {
      const result = await properfyIndicators.calculateVSO(
        undefined as any,
        undefined as any
      );
      expect(result).toBe(0);
    });
  });

  describe("calculateReadyAttendances", () => {
    it("deve retornar 0 com datas inválidas", async () => {
      const result = await properfyIndicators.calculateReadyAttendances(
        null as any,
        new Date("2026-03-31")
      );

      expect(result).toBe(0);
    });

    it("deve retornar 0 quando erro ocorre", async () => {
      const result = await properfyIndicators.calculateReadyAttendances(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      // Deve retornar 0 sem lançar erro
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("deve retornar número válido", async () => {
      const result = await properfyIndicators.calculateReadyAttendances(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(typeof result).toBe("number");
      expect(!isNaN(result)).toBe(true);
    });
  });

  describe("calculateLaunchAttendances", () => {
    it("deve retornar 0 com datas inválidas", async () => {
      const result = await properfyIndicators.calculateLaunchAttendances(
        new Date("2026-03-01"),
        undefined as any
      );

      expect(result).toBe(0);
    });

    it("deve retornar 0 quando erro ocorre", async () => {
      const result = await properfyIndicators.calculateLaunchAttendances(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      // Deve retornar 0 sem lançar erro
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("deve retornar número válido", async () => {
      const result = await properfyIndicators.calculateLaunchAttendances(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(typeof result).toBe("number");
      expect(!isNaN(result)).toBe(true);
    });
  });

  describe("calculateAverageSaleTime", () => {
    it("deve retornar 0 quando database não está disponível", async () => {
      const { getDb } = await import("../db");
      vi.mocked(getDb).mockResolvedValueOnce(null);

      const result = await properfyIndicators.calculateAverageSaleTime(
        new Date("2026-03-01"),
        new Date("2026-03-31"),
        "company-baggio"
      );

      expect(result).toBe(0);
    });

    it("deve retornar 0 com datas inválidas", async () => {
      const result = await properfyIndicators.calculateAverageSaleTime(
        null as any,
        new Date("2026-03-31"),
        "company-baggio"
      );

      expect(result).toBe(0);
    });

    it("deve retornar 0 com companyId inválido", async () => {
      const result = await properfyIndicators.calculateAverageSaleTime(
        new Date("2026-03-01"),
        new Date("2026-03-31"),
        "" as any
      );

      expect(result).toBe(0);
    });

    it("deve retornar 0 quando query falha", async () => {
      const { getDb } = await import("../db");
      const mockDb = {
        execute: vi.fn().mockRejectedValueOnce(new Error("Query failed")),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await properfyIndicators.calculateAverageSaleTime(
        new Date("2026-03-01"),
        new Date("2026-03-31"),
        "company-baggio"
      );

      expect(result).toBe(0);
    });

    it("deve capturar erros sem lançar exceção", async () => {
      const { getDb } = await import("../db");
      vi.mocked(getDb).mockRejectedValueOnce(new Error("DB Error"));

      const result = await properfyIndicators.calculateAverageSaleTime(
        new Date("2026-03-01"),
        new Date("2026-03-31"),
        "company-baggio"
      );

      expect(result).toBe(0);
    });
  });

  describe("Type Coercion", () => {
    it("calculateActivePropertiesCount deve converter count para número", async () => {
      const { getDb } = await import("../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ count: "575" }]), // String instead of number
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await properfyIndicators.calculateActivePropertiesCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(result).toBe(575);
      expect(typeof result).toBe("number");
    });

    it("calculateAngariationsCount deve converter count para número", async () => {
      const { getDb } = await import("../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ count: "7" }]), // String instead of number
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await properfyIndicators.calculateAngariationsCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(result).toBe(7);
      expect(typeof result).toBe("number");
    });

    it("calculateRemovedPropertiesCount deve converter count para número", async () => {
      const { getDb } = await import("../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ count: "4129" }]), // String instead of number
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await properfyIndicators.calculateRemovedPropertiesCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );

      expect(result).toBe(4129);
      expect(typeof result).toBe("number");
    });
  });

  describe("Edge Cases", () => {
    it("calculateVSO com ambos valores 0", async () => {
      const result = await properfyIndicators.calculateVSO(0, 0);
      expect(result).toBe(0);
    });

    it("calculateVSO com valores negativos", async () => {
      const result = await properfyIndicators.calculateVSO(-10, 575);
      expect(result).toBeLessThan(0);
    });

    it("calculateVSO com valores muito grandes", async () => {
      const result = await properfyIndicators.calculateVSO(1000000, 575);
      expect(result).toBeGreaterThan(0);
      expect(!isNaN(result)).toBe(true);
    });

    it("calculateReadyAttendances com datas iguais", async () => {
      const date = new Date("2026-03-01");
      const result = await properfyIndicators.calculateReadyAttendances(date, date);
      expect(typeof result).toBe("number");
    });

    it("calculateLaunchAttendances com datas iguais", async () => {
      const date = new Date("2026-03-01");
      const result = await properfyIndicators.calculateLaunchAttendances(date, date);
      expect(typeof result).toBe("number");
    });
  });

  describe("Return Type Validation", () => {
    it("todas as funções devem retornar number", async () => {
      const { getDb } = await import("../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{ count: 0 }]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const r1 = await properfyIndicators.calculateActivePropertiesCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );
      const r2 = await properfyIndicators.calculateAngariationsCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );
      const r3 = await properfyIndicators.calculateRemovedPropertiesCount(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );
      const r4 = await properfyIndicators.calculateVSO(0, 575);
      const r5 = await properfyIndicators.calculateReadyAttendances(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );
      const r6 = await properfyIndicators.calculateLaunchAttendances(
        new Date("2026-03-01"),
        new Date("2026-03-31")
      );
      const r7 = await properfyIndicators.calculateAverageSaleTime(
        new Date("2026-03-01"),
        new Date("2026-03-31"),
        "company-baggio"
      );

      expect(typeof r1).toBe("number");
      expect(typeof r2).toBe("number");
      expect(typeof r3).toBe("number");
      expect(typeof r4).toBe("number");
      expect(typeof r5).toBe("number");
      expect(typeof r6).toBe("number");
      expect(typeof r7).toBe("number");
    });
  });
});
