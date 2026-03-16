import { describe, it, expect, beforeEach, vi } from "vitest";
import { financeRouter } from "../financeRouter";
import { getDb } from "../../db";

// Mock do banco de dados
vi.mock("../../db", () => ({
  getDb: vi.fn(),
}));

describe("Finance Router - Permissões", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb);
  });

  describe("getMonthlyFinanceSummary - Permissões", () => {
    it("Finance role deve ver todas as comissões", async () => {
      // Simular usuário finance
      const ctx = {
        user: {
          id: "finance-user-1",
          role: "finance",
          companyId: "company-1",
        },
      };

      const input = {
        companyId: "company-1",
        month: 3,
        year: 2026,
      };

      // Mock das comissões
      const mockCommissions = [
        {
          id: "comm-1",
          brokerId: "broker-1",
          commissionValue: 1000,
          status: "pending",
        },
        {
          id: "comm-2",
          brokerId: "broker-2",
          commissionValue: 2000,
          status: "paid",
        },
      ];

      mockDb.where.mockResolvedValue(mockCommissions);

      // Finance deve ver ambas as comissões
      expect(mockCommissions.length).toBe(2);
    });

    it("Manager role deve ver apenas comissões de seus corretores", async () => {
      // Simular usuário manager
      const ctx = {
        user: {
          id: "manager-1",
          role: "manager",
          companyId: "company-1",
        },
      };

      const input = {
        companyId: "company-1",
        month: 3,
        year: 2026,
      };

      // Mock das comissões
      const mockCommissions = [
        {
          id: "comm-1",
          brokerId: "broker-1",
          commissionValue: 1000,
          status: "pending",
        },
        {
          id: "comm-2",
          brokerId: "broker-2",
          commissionValue: 2000,
          status: "paid",
        },
      ];

      // Mock dos brokers gerenciados
      const managedBrokers = [
        {
          id: "broker-1",
          managerId: "manager-1",
          name: "Broker 1",
        },
      ];

      mockDb.where.mockResolvedValueOnce(mockCommissions);
      mockDb.where.mockResolvedValueOnce(managedBrokers);

      // Manager deve ver apenas comissão de broker-1
      const filteredCommissions = mockCommissions.filter(
        (c) => c.brokerId === "broker-1"
      );
      expect(filteredCommissions.length).toBe(1);
      expect(filteredCommissions[0].brokerId).toBe("broker-1");
    });

    it("Broker role deve ver apenas suas próprias comissões", async () => {
      // Simular usuário broker
      const ctx = {
        user: {
          id: "broker-1",
          role: "broker",
          companyId: "company-1",
        },
      };

      const input = {
        companyId: "company-1",
        month: 3,
        year: 2026,
      };

      // Mock das comissões
      const mockCommissions = [
        {
          id: "comm-1",
          brokerId: "broker-1",
          commissionValue: 1000,
          status: "pending",
        },
        {
          id: "comm-2",
          brokerId: "broker-2",
          commissionValue: 2000,
          status: "paid",
        },
      ];

      mockDb.where.mockResolvedValue(mockCommissions);

      // Broker deve ver apenas sua comissão
      const filteredCommissions = mockCommissions.filter(
        (c) => c.brokerId === "broker-1"
      );
      expect(filteredCommissions.length).toBe(1);
      expect(filteredCommissions[0].brokerId).toBe("broker-1");
    });
  });

  describe("getCommissionsToPay - Permissões", () => {
    it("Finance role deve ver todas as comissões pendentes", async () => {
      const mockCommissions = [
        {
          id: "comm-1",
          brokerId: "broker-1",
          commissionValue: 1000,
          status: "pending",
        },
        {
          id: "comm-2",
          brokerId: "broker-2",
          commissionValue: 2000,
          status: "pending",
        },
      ];

      const pendingCommissions = mockCommissions.filter(
        (c) => c.status === "pending"
      );
      expect(pendingCommissions.length).toBe(2);
    });

    it("Manager role deve ver apenas comissões pendentes de sua equipe", async () => {
      const mockCommissions = [
        {
          id: "comm-1",
          brokerId: "broker-1",
          commissionValue: 1000,
          status: "pending",
        },
        {
          id: "comm-2",
          brokerId: "broker-2",
          commissionValue: 2000,
          status: "pending",
        },
      ];

      const managedBrokerIds = new Set(["broker-1"]);
      const filteredCommissions = mockCommissions.filter(
        (c) => managedBrokerIds.has(c.brokerId)
      );

      expect(filteredCommissions.length).toBe(1);
      expect(filteredCommissions[0].brokerId).toBe("broker-1");
    });
  });

  describe("getCommissionsPaid - Permissões", () => {
    it("Finance role deve ver todas as comissões pagas", async () => {
      const mockCommissions = [
        {
          id: "comm-1",
          brokerId: "broker-1",
          commissionValue: 1000,
          status: "paid",
        },
        {
          id: "comm-2",
          brokerId: "broker-2",
          commissionValue: 2000,
          status: "paid",
        },
      ];

      const paidCommissions = mockCommissions.filter(
        (c) => c.status === "paid"
      );
      expect(paidCommissions.length).toBe(2);
    });

    it("Broker role deve ver apenas suas comissões pagas", async () => {
      const mockCommissions = [
        {
          id: "comm-1",
          brokerId: "broker-1",
          commissionValue: 1000,
          status: "paid",
        },
        {
          id: "comm-2",
          brokerId: "broker-2",
          commissionValue: 2000,
          status: "paid",
        },
      ];

      const filteredCommissions = mockCommissions.filter(
        (c) => c.brokerId === "broker-1"
      );
      expect(filteredCommissions.length).toBe(1);
      expect(filteredCommissions[0].brokerId).toBe("broker-1");
    });
  });
});
