import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../../db";
import {
  calculateActivePropertiesCount,
  calculateAngariationsCount,
  calculateRemovedPropertiesCount,
  calculateVSO,
  calculateReadyAttendances,
  calculateLaunchAttendances,
} from "../properfyIndicators";
import { properfyProperties, properfyLeads } from "../../../drizzle/schema";
import { v4 as uuid } from "uuid";

describe("Properfy Indicators", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available for tests");
  });

  describe("calculateActivePropertiesCount", () => {
    it("deve retornar contagem de imóveis ativos para venda", async () => {
      const startDate = new Date("2026-03-01");
      const endDate = new Date("2026-03-31");

      const count = await calculateActivePropertiesCount(startDate, endDate);

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("calculateAngariationsCount", () => {
    it("deve retornar contagem de angariações no mês", async () => {
      const startDate = new Date("2026-03-01");
      const endDate = new Date("2026-03-31");

      const count = await calculateAngariationsCount(startDate, endDate);

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("calculateRemovedPropertiesCount", () => {
    it("deve retornar contagem de baixas no mês", async () => {
      const startDate = new Date("2026-03-01");
      const endDate = new Date("2026-03-31");

      const count = await calculateRemovedPropertiesCount(startDate, endDate);

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("calculateVSO", () => {
    it("deve calcular VSO (venda/oferta) corretamente", async () => {
      const salesCount = 10;
      const activeProperties = 100;

      const vso = await calculateVSO(salesCount, activeProperties);

      expect(vso).toBe(10); // (10 / 100) * 100 = 10
    });

    it("deve retornar 0 quando não há imóveis ativos", async () => {
      const salesCount = 10;
      const activeProperties = 0;

      const vso = await calculateVSO(salesCount, activeProperties);

      expect(vso).toBe(0);
    });
  });

  describe("calculateReadyAttendances", () => {
    it("deve retornar contagem de atendimentos prontos", async () => {
      const startDate = new Date("2026-03-01");
      const endDate = new Date("2026-03-31");

      const count = await calculateReadyAttendances(startDate, endDate);

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("calculateLaunchAttendances", () => {
    it("deve retornar contagem de atendimentos lançamentos", async () => {
      const startDate = new Date("2026-03-01");
      const endDate = new Date("2026-03-31");

      const count = await calculateLaunchAttendances(startDate, endDate);

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
