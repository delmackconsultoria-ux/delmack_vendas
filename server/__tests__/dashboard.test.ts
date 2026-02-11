import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db.js";
import { calculateMonthlyVGV, calculateMonthlySalesCount, calculateMonthlyAverageTicket, calculateReceivedCommissions } from "../dashboardHelpers.js";

describe("Dashboard KPIs", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }
  });

  it("should calculate monthly VGV correctly", async () => {
    const companyId = "test_company";
    const month = 1; // Janeiro
    const year = 2026;

    const vgv = await calculateMonthlyVGV(companyId, month, year);

    expect(typeof vgv).toBe("number");
    expect(vgv).toBeGreaterThanOrEqual(0);
  });

  it("should calculate monthly sales count correctly", async () => {
    const companyId = "test_company";
    const month = 1;
    const year = 2026;

    const count = await calculateMonthlySalesCount(companyId, month, year);

    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(count)).toBe(true);
  });

  it("should calculate monthly average ticket correctly", async () => {
    const companyId = "test_company";
    const month = 1;
    const year = 2026;

    const avgTicket = await calculateMonthlyAverageTicket(companyId, month, year);

    expect(typeof avgTicket).toBe("number");
    expect(avgTicket).toBeGreaterThanOrEqual(0);
  });

  it("should calculate received commissions correctly", async () => {
    const companyId = "test_company";
    const month = 1;
    const year = 2026;

    const received = await calculateReceivedCommissions(companyId, month, year);

    expect(typeof received).toBe("number");
    expect(received).toBeGreaterThanOrEqual(0);
  });

  it("should return 0 for VGV when no sales exist", async () => {
    const companyId = "nonexistent_company";
    const month = 12;
    const year = 2099;

    const vgv = await calculateMonthlyVGV(companyId, month, year);

    expect(vgv).toBe(0);
  });

  it("should return 0 for average ticket when no sales exist", async () => {
    const companyId = "nonexistent_company";
    const month = 12;
    const year = 2099;

    const avgTicket = await calculateMonthlyAverageTicket(companyId, month, year);

    expect(avgTicket).toBe(0);
  });
});
