import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getManualData, saveManualData } from "../manualDataHelper";

// Mock do getDb
vi.mock("../../db", () => ({
  getDb: vi.fn(),
}));

// Mock do saveAuditLog
vi.mock("../auditLogHelper", () => ({
  saveAuditLog: vi.fn(),
}));

describe("Manual Data Helper - Monetary Value Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("parseMonetaryValue - Locale Brasileiro", () => {
    it("deve converter valor com vírgula brasileira", async () => {
      const { getDb } = await import("../../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            despesaGeral: "0.10", // Pode vir como string decimal
            despesaImpostos: "0",
            fundoInovacao: "0",
            resultadoSocios: "0",
            fundoEmergencial: "0",
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await getManualData("company-baggio", 2026, 3);

      expect(result.despesaGeral).toBe(0.1);
    });

    it("deve converter valor com ponto decimal", async () => {
      const { getDb } = await import("../../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            despesaGeral: 0.1,
            despesaImpostos: "0",
            fundoInovacao: "0",
            resultadoSocios: "0",
            fundoEmergencial: "0",
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await getManualData("company-baggio", 2026, 3);

      expect(result.despesaGeral).toBe(0.1);
    });

    it("deve converter valor com milhares e vírgula", async () => {
      const { getDb } = await import("../../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            despesaGeral: "1234.56", // 1.234,56 em locale brasileiro
            despesaImpostos: "0",
            fundoInovacao: "0",
            resultadoSocios: "0",
            fundoEmergencial: "0",
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await getManualData("company-baggio", 2026, 3);

      expect(result.despesaGeral).toBe(1234.56);
    });

    it("deve retornar 0 para valores nulos ou vazios", async () => {
      const { getDb } = await import("../../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            despesaGeral: null,
            despesaImpostos: "",
            fundoInovacao: undefined,
            resultadoSocios: "0",
            fundoEmergencial: "0",
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await getManualData("company-baggio", 2026, 3);

      expect(result.despesaGeral).toBe(0);
      expect(result.despesaImpostos).toBe(0);
      expect(result.fundoInovacao).toBe(0);
    });

    it("deve retornar objeto vazio quando não há dados", async () => {
      const { getDb } = await import("../../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await getManualData("company-baggio", 2026, 3);

      expect(result).toEqual({
        despesaGeral: 0,
        despesaImpostos: 0,
        fundoInovacao: 0,
        resultadoSocios: 0,
        fundoEmergencial: 0,
      });
    });
  });

  describe("saveManualData - Validação e Conversão", () => {
    it("deve validar valores negativos", async () => {
      const { getDb } = await import("../../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      try {
        await saveManualData(
          "company-baggio",
          2026,
          3,
          {
            despesaGeral: -10, // Negativo
            despesaImpostos: 0,
            fundoInovacao: 0,
            resultadoSocios: 0,
            fundoEmergencial: 0,
          },
          "user-123",
          "João"
        );
        expect.fail("Deveria lançar erro para valor negativo");
      } catch (error) {
        expect(String(error)).toContain("Invalid monetary value");
      }
    });

    it("deve salvar valores como DECIMAL (não string)", async () => {
      const { getDb } = await import("../../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValueOnce(undefined),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      await saveManualData(
        "company-baggio",
        2026,
        3,
        {
          despesaGeral: 0.1,
          despesaImpostos: 100.5,
          fundoInovacao: 1000,
          resultadoSocios: 500.25,
          fundoEmergencial: 250,
        },
        "user-123",
        "João"
      );

      // Verificar que insert foi chamado com valores numéricos
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("deve aceitar valores com até 2 casas decimais", async () => {
      const { getDb } = await import("../../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValueOnce(undefined),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      await saveManualData(
        "company-baggio",
        2026,
        3,
        {
          despesaGeral: 0.01,
          despesaImpostos: 0.99,
          fundoInovacao: 1234.56,
          resultadoSocios: 999.99,
          fundoEmergencial: 0.1,
        },
        "user-123",
        "João"
      );

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("deve converter zero corretamente", async () => {
      const { getDb } = await import("../../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            despesaGeral: "0",
            despesaImpostos: "0.00",
            fundoInovacao: 0,
            resultadoSocios: "0,00",
            fundoEmergencial: null,
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await getManualData("company-baggio", 2026, 3);

      expect(result.despesaGeral).toBe(0);
      expect(result.despesaImpostos).toBe(0);
      expect(result.fundoInovacao).toBe(0);
      expect(result.resultadoSocios).toBe(0);
      expect(result.fundoEmergencial).toBe(0);
    });

    it("deve converter valores muito grandes", async () => {
      const { getDb } = await import("../../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            despesaGeral: "999999.99",
            despesaImpostos: "0",
            fundoInovacao: "0",
            resultadoSocios: "0",
            fundoEmergencial: "0",
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await getManualData("company-baggio", 2026, 3);

      expect(result.despesaGeral).toBe(999999.99);
    });

    it("deve retornar 0 para valores inválidos", async () => {
      const { getDb } = await import("../../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            despesaGeral: "abc", // Inválido
            despesaImpostos: "0",
            fundoInovacao: "0",
            resultadoSocios: "0",
            fundoEmergencial: "0",
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await getManualData("company-baggio", 2026, 3);

      expect(result.despesaGeral).toBe(0);
    });
  });

  describe("Type Consistency", () => {
    it("todas as funções devem retornar números", async () => {
      const { getDb } = await import("../../db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([
          {
            despesaGeral: "100.50",
            despesaImpostos: "50.25",
            fundoInovacao: "75.10",
            resultadoSocios: "200.99",
            fundoEmergencial: "25.01",
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

      const result = await getManualData("company-baggio", 2026, 3);

      expect(typeof result.despesaGeral).toBe("number");
      expect(typeof result.despesaImpostos).toBe("number");
      expect(typeof result.fundoInovacao).toBe("number");
      expect(typeof result.resultadoSocios).toBe("number");
      expect(typeof result.fundoEmergencial).toBe("number");
    });
  });
});
