import { and, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "../db";
import { sales, users, propertiesCache } from "../../drizzle/schema";

/**
 * Relatório 1: Valor por corretor (angariações + vendas)
 */
export async function getValueByBrokerReport(companyId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  // Buscar vendas no período
  const salesData = await db
    .select({
      brokerId: sales.brokerVendedor,
      brokerName: sales.brokerVendedorName,
      totalSales: sql<string>`SUM(${sales.saleValue})`,
      salesCount: sql<number>`COUNT(*)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate),
        eq(sales.status, "sale")
      )
    )
    .groupBy(sales.brokerVendedor, sales.brokerVendedorName);

  // Buscar angariações no período (do Properfy)
  const angariationsData = await db
    .select({
      // Precisamos relacionar com sales para pegar o corretor angariador
      brokerId: sales.brokerAngariador,
      brokerName: sales.brokerAngariadorName,
      totalAngariations: sql<string>`SUM(${propertiesCache.saleValue})`,
      angariationsCount: sql<number>`COUNT(DISTINCT ${propertiesCache.id})`,
    })
    .from(propertiesCache)
    .leftJoin(sales, eq(propertiesCache.properfyId, sales.propertyId))
    .where(
      and(
        eq(propertiesCache.companyId, companyId),
        gte(propertiesCache.dteNewListing, startDate),
        lte(propertiesCache.dteNewListing, endDate)
      )
    )
    .groupBy(sales.brokerAngariador, sales.brokerAngariadorName);

  // Combinar resultados
  const brokerMap = new Map<string, {
    brokerId: string;
    brokerName: string;
    salesValue: number;
    salesCount: number;
    angariationsValue: number;
    angariationsCount: number;
  }>();

  // Adicionar vendas
  salesData.forEach((row: any) => {
    if (!row.brokerId) return;
    brokerMap.set(row.brokerId, {
      brokerId: row.brokerId,
      brokerName: row.brokerName || "Sem nome",
      salesValue: parseFloat(row.totalSales || "0"),
      salesCount: row.salesCount,
      angariationsValue: 0,
      angariationsCount: 0,
    });
  });

  // Adicionar angariações
  angariationsData.forEach((row: any) => {
    if (!row.brokerId) return;
    const existing = brokerMap.get(row.brokerId);
    if (existing) {
      existing.angariationsValue = parseFloat(row.totalAngariations || "0");
      existing.angariationsCount = row.angariationsCount;
    } else {
      brokerMap.set(row.brokerId, {
        brokerId: row.brokerId,
        brokerName: row.brokerName || "Sem nome",
        salesValue: 0,
        salesCount: 0,
        angariationsValue: parseFloat(row.totalAngariations || "0"),
        angariationsCount: row.angariationsCount,
      });
    }
  });

  return Array.from(brokerMap.values());
}

/**
 * Relatório 2: Valor por corretor (somente angariações)
 */
export async function getAngariationsValueByBrokerReport(companyId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      brokerId: sales.brokerAngariador,
      brokerName: sales.brokerAngariadorName,
      totalValue: sql<string>`SUM(${propertiesCache.saleValue})`,
      count: sql<number>`COUNT(DISTINCT ${propertiesCache.id})`,
    })
    .from(propertiesCache)
    .leftJoin(sales, eq(propertiesCache.properfyId, sales.propertyId))
    .where(
      and(
        eq(propertiesCache.companyId, companyId),
        gte(propertiesCache.dteNewListing, startDate),
        lte(propertiesCache.dteNewListing, endDate)
      )
    )
    .groupBy(sales.brokerAngariador, sales.brokerAngariadorName);

  return result.map((row: any) => ({
    brokerId: row.brokerId || "",
    brokerName: row.brokerName || "Sem nome",
    totalValue: parseFloat(row.totalValue || "0"),
    count: row.count,
  }));
}

/**
 * Relatório 3: Quantidade por corretor (somente angariações)
 */
export async function getAngariationsCountByBrokerReport(companyId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      brokerId: sales.brokerAngariador,
      brokerName: sales.brokerAngariadorName,
      count: sql<number>`COUNT(DISTINCT ${propertiesCache.id})`,
    })
    .from(propertiesCache)
    .leftJoin(sales, eq(propertiesCache.properfyId, sales.propertyId))
    .where(
      and(
        eq(propertiesCache.companyId, companyId),
        gte(propertiesCache.dteNewListing, startDate),
        lte(propertiesCache.dteNewListing, endDate)
      )
    )
    .groupBy(sales.brokerAngariador, sales.brokerAngariadorName);

  return result.map((row: any) => ({
    brokerId: row.brokerId || "",
    brokerName: row.brokerName || "Sem nome",
    count: row.count,
  }));
}

/**
 * Relatório 7: Tabela pivotada (valor x corretor)
 * Retorna dados para montar tabela com corretores nas colunas e vendas/angariações nas linhas
 */
export async function getPivotTableReport(companyId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { brokers: [], data: [] };

  // Buscar todos os corretores ativos
  const brokers = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(
      and(
        eq(users.companyId, companyId),
        eq(users.isActive, true),
        eq(users.role, "broker")
      )
    );

  // Buscar vendas por corretor
  const salesByBroker = await db
    .select({
      brokerId: sales.brokerVendedor,
      totalValue: sql<string>`SUM(${sales.saleValue})`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.companyId, companyId),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate),
        eq(sales.status, "sale")
      )
    )
    .groupBy(sales.brokerVendedor);

  // Buscar angariações por corretor
  const angariationsByBroker = await db
    .select({
      brokerId: sales.brokerAngariador,
      totalValue: sql<string>`SUM(${propertiesCache.saleValue})`,
    })
    .from(propertiesCache)
    .leftJoin(sales, eq(propertiesCache.properfyId, sales.propertyId))
    .where(
      and(
        eq(propertiesCache.companyId, companyId),
        gte(propertiesCache.dteNewListing, startDate),
        lte(propertiesCache.dteNewListing, endDate)
      )
    )
    .groupBy(sales.brokerAngariador);

  // Montar estrutura de dados
  const salesMap = new Map(salesByBroker.map((s: any) => [s.brokerId, parseFloat(s.totalValue || "0")]));
  const angariationsMap = new Map(angariationsByBroker.map((a: any) => [a.brokerId, parseFloat(a.totalValue || "0")]));

  const data = [
    {
      category: "Vendas",
      values: brokers.map((b: any) => salesMap.get(b.id) || 0),
    },
    {
      category: "Angariações",
      values: brokers.map((b: any) => angariationsMap.get(b.id) || 0),
    },
  ];

  return {
    brokers: brokers.map((b: any) => ({ id: b.id, name: b.name || "Sem nome" })),
    data,
  };
}
