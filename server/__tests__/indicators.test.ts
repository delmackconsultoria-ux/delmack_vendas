import { describe, it, expect } from "vitest";
import {
  calculateMonthlyRevenue,
  calculateMonthlyUnits,
  calculateCancelledSales,
  calculateCommissionReceived,
  calculateCommissionSold,
  calculateCommissionPending,
  calculateAverageSaleTime,
  calculateAveragePropertyValue,
  calculateAverageCommissionPercent,
  calculateSalesByType,
  calculateAllIndicators,
} from "../indicatorsHelpers";

describe("Indicators Helpers", () => {
  const testFilters = {
    companyId: "test-company-id",
    month: 1, // Janeiro
    year: 2024,
  };

  it("should calculate monthly revenue", async () => {
    const revenue = await calculateMonthlyRevenue(testFilters);
    expect(typeof revenue).toBe("number");
    expect(revenue).toBeGreaterThanOrEqual(0);
  });

  it("should calculate monthly units", async () => {
    const units = await calculateMonthlyUnits(testFilters);
    expect(typeof units).toBe("number");
    expect(units).toBeGreaterThanOrEqual(0);
  });

  it("should calculate cancelled sales", async () => {
    const cancelled = await calculateCancelledSales(testFilters);
    expect(typeof cancelled).toBe("number");
    expect(cancelled).toBeGreaterThanOrEqual(0);
  });

  it("should calculate commission received", async () => {
    const received = await calculateCommissionReceived(testFilters);
    expect(typeof received).toBe("number");
    expect(received).toBeGreaterThanOrEqual(0);
  });

  it("should calculate commission sold", async () => {
    const sold = await calculateCommissionSold(testFilters);
    expect(typeof sold).toBe("number");
    expect(sold).toBeGreaterThanOrEqual(0);
  });

  it("should calculate commission pending", async () => {
    const pending = await calculateCommissionPending(testFilters);
    expect(typeof pending).toBe("number");
    expect(pending).toBeGreaterThanOrEqual(0);
  });

  it("should calculate average sale time", async () => {
    const avgTime = await calculateAverageSaleTime(testFilters);
    expect(typeof avgTime).toBe("number");
    expect(avgTime).toBeGreaterThanOrEqual(0);
  });

  it("should calculate average property value", async () => {
    const avgValue = await calculateAveragePropertyValue(testFilters);
    expect(typeof avgValue).toBe("number");
    expect(avgValue).toBeGreaterThanOrEqual(0);
  });

  it("should calculate average commission percent", async () => {
    const avgPercent = await calculateAverageCommissionPercent(testFilters);
    expect(typeof avgPercent).toBe("number");
    expect(avgPercent).toBeGreaterThanOrEqual(0);
    expect(avgPercent).toBeLessThanOrEqual(100);
  });

  it("should calculate sales by type", async () => {
    const byType = await calculateSalesByType(testFilters);
    expect(typeof byType).toBe("object");
    expect(byType).toHaveProperty("prontos");
    expect(byType).toHaveProperty("lancamentos");
    expect(typeof byType.prontos).toBe("number");
    expect(typeof byType.lancamentos).toBe("number");
  });

  it("should calculate all indicators at once", async () => {
    const indicators = await calculateAllIndicators(testFilters);
    
    expect(indicators).toHaveProperty("monthlyRevenue");
    expect(indicators).toHaveProperty("monthlyUnits");
    expect(indicators).toHaveProperty("cancelledSales");
    expect(indicators).toHaveProperty("commissionReceived");
    expect(indicators).toHaveProperty("commissionSold");
    expect(indicators).toHaveProperty("commissionPending");
    expect(indicators).toHaveProperty("avgSaleTime");
    expect(indicators).toHaveProperty("avgPropertyValue");
    expect(indicators).toHaveProperty("avgCommissionPercent");
    expect(indicators).toHaveProperty("salesByType");

    // Validar tipos
    expect(typeof indicators.monthlyRevenue).toBe("number");
    expect(typeof indicators.monthlyUnits).toBe("number");
    expect(typeof indicators.cancelledSales).toBe("number");
    expect(typeof indicators.commissionReceived).toBe("number");
    expect(typeof indicators.commissionSold).toBe("number");
    expect(typeof indicators.commissionPending).toBe("number");
    expect(typeof indicators.avgSaleTime).toBe("number");
    expect(typeof indicators.avgPropertyValue).toBe("number");
    expect(typeof indicators.avgCommissionPercent).toBe("number");
    expect(typeof indicators.salesByType).toBe("object");
  });

  it("should filter by broker ID", async () => {
    const filtersWithBroker = {
      ...testFilters,
      brokerId: "test-broker-id",
    };

    const indicators = await calculateAllIndicators(filtersWithBroker);
    
    // Deve retornar dados válidos mesmo com filtro de corretor
    expect(typeof indicators.monthlyRevenue).toBe("number");
    expect(typeof indicators.monthlyUnits).toBe("number");
  });

  it("should work without month/year filters", async () => {
    const filtersWithoutDate = {
      companyId: "test-company-id",
    };

    const indicators = await calculateAllIndicators(filtersWithoutDate);
    
    // Deve retornar dados de todos os períodos
    expect(typeof indicators.monthlyRevenue).toBe("number");
    expect(typeof indicators.monthlyUnits).toBe("number");
  });
});
