import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../../db";
import { commissions, users, sales, companies } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Finance Router - Data Validation", () => {
  let db: any;
  let testCompanyId: string;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    // Usar a empresa da Baggio
    testCompanyId = "company_1766331506068";
  });

  it("should have commissions with pending status", async () => {
    const allCommissions = await db
      .select()
      .from(commissions)
      .where(eq(commissions.companyId, testCompanyId));

    const pendingCommissions = allCommissions.filter(
      (c: any) => c.status === "pending" || c.status === "received"
    );

    expect(pendingCommissions.length).toBeGreaterThan(0);
    expect(pendingCommissions[0]).toHaveProperty("commissionValue");
    expect(pendingCommissions[0]).toHaveProperty("brokerId");
  });

  it("should calculate total commissions to pay correctly", async () => {
    const allCommissions = await db
      .select()
      .from(commissions)
      .where(eq(commissions.companyId, testCompanyId));

    const pendingCommissions = allCommissions.filter(
      (c: any) => c.status === "pending" || c.status === "received"
    );

    const total = pendingCommissions.reduce((sum: number, c: any) => {
      const value =
        typeof c.commissionValue === "string"
          ? parseFloat(c.commissionValue)
          : c.commissionValue || 0;
      return sum + value;
    }, 0);

    expect(total).toBeGreaterThan(0);
    expect(total).toBeCloseTo(14552.76, 2); // Valor esperado baseado no teste anterior
  });

  it("should have sales for VGV calculation", async () => {
    const monthSales = await db
      .select()
      .from(sales)
      .where(eq(sales.companyId, testCompanyId));

    expect(monthSales.length).toBeGreaterThan(0);
    expect(monthSales[0]).toHaveProperty("saleValue");
    expect(monthSales[0]).toHaveProperty("saleDate");
  });

  it("should calculate VGV correctly", async () => {
    const monthSales = await db
      .select()
      .from(sales)
      .where(eq(sales.companyId, testCompanyId));

    const vgv = monthSales.reduce((sum: number, s: any) => {
      const value =
        typeof s.saleValue === "string"
          ? parseFloat(s.saleValue)
          : s.saleValue || 0;
      return sum + value;
    }, 0);

    expect(vgv).toBeGreaterThan(0);
    expect(vgv).toBe(1356364); // Valor esperado
    expect(monthSales.length).toBe(15); // 15 vendas
  });

  it("should separate commissions by broker type", async () => {
    const allCommissions = await db
      .select()
      .from(commissions)
      .where(eq(commissions.companyId, testCompanyId));

    const pendingCommissions = allCommissions.filter(
      (c: any) => c.status === "pending" || c.status === "received"
    );

    // Buscar brokers
    const brokerIds = new Set(pendingCommissions.map((c: any) => c.brokerId));
    const brokerMap = new Map();

    for (const brokerId of Array.from(brokerIds)) {
      const broker = await db
        .select()
        .from(users)
        .where(eq(users.id, brokerId as string))
        .limit(1);
      if (broker.length > 0) {
        brokerMap.set(brokerId, broker[0]);
      }
    }

    let baggioTotal = 0;
    let brokerTotal = 0;

    pendingCommissions.forEach((c: any) => {
      const broker = brokerMap.get(c.brokerId);
      const value =
        typeof c.commissionValue === "string"
          ? parseFloat(c.commissionValue)
          : c.commissionValue || 0;

      if (broker?.role === "manager") {
        baggioTotal += value;
      } else {
        brokerTotal += value;
      }
    });

    // Deve ter comissões de corretores
    expect(brokerTotal).toBeGreaterThan(0);
    // Pode ter ou não comissões de Baggio (depende dos dados)
    expect(baggioTotal + brokerTotal).toBeCloseTo(14552.76, 2);
  });

  it("should have commission data with required fields", async () => {
    const allCommissions = await db
      .select()
      .from(commissions)
      .where(eq(commissions.companyId, testCompanyId));

    expect(allCommissions.length).toBeGreaterThan(0);

    const commission = allCommissions[0];
    expect(commission).toHaveProperty("id");
    expect(commission).toHaveProperty("saleId");
    expect(commission).toHaveProperty("brokerId");
    expect(commission).toHaveProperty("commissionValue");
    expect(commission).toHaveProperty("commissionPercentage");
    expect(commission).toHaveProperty("type");
    expect(commission).toHaveProperty("status");
    expect(commission).toHaveProperty("createdAt");
  });

  it("should have sales with required fields", async () => {
    const monthSales = await db
      .select()
      .from(sales)
      .where(eq(sales.companyId, testCompanyId));

    expect(monthSales.length).toBeGreaterThan(0);

    const sale = monthSales[0];
    expect(sale).toHaveProperty("id");
    expect(sale).toHaveProperty("saleValue");
    expect(sale).toHaveProperty("saleDate");
    expect(sale).toHaveProperty("buyerName");
    expect(sale).toHaveProperty("brokerVendedor");
    expect(sale).toHaveProperty("brokerAngariador");
  });
});
