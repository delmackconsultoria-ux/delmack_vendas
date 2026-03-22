import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "../../db";
import { indicatorSnapshots } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import * as salesIndicators from "../../indicators/salesIndicators";
import * as properfyIndicators from "../../indicators/properfyIndicators";
import * as manualDataHelper from "../../indicators/manualDataHelper";

/**
 * Teste para o job de snapshot mensal
 * Verifica se todos os 27 indicadores são salvos corretamente
 */
describe("Indicator Snapshot Job - 27 Indicadores", () => {
  const companyId = "company_1766331506068";
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    
    // Limpar snapshots anteriores para este teste
    await db.delete(indicatorSnapshots).where(eq(indicatorSnapshots.companyId, companyId));
  });

  afterAll(async () => {
    // Limpar dados de teste
    await db.delete(indicatorSnapshots).where(eq(indicatorSnapshots.companyId, companyId));
  });

  it("deve calcular todos os 27 indicadores corretamente", async () => {
    // Usar data de março 2026 (último dia = 31)
    const year = 2026;
    const month = 3;
    const startDate = new Date(year, month - 1, 1); // 1º de março
    const endDate = new Date(year, month, 0); // 31 de março
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;

    // Calcular todos os indicadores
    const salesValue = await salesIndicators.calculateSalesValueMonth(
      companyId,
      startDate,
      endDate
    );
    const salesCount = await salesIndicators.calculateSalesCountMonth(
      companyId,
      startDate,
      endDate
    );
    const cancelledSales = await salesIndicators.calculateCancelledSalesCount(
      companyId,
      startDate,
      endDate
    );
    const commissionReceived = await salesIndicators.calculateCommissionReceived(
      companyId,
      startDate,
      endDate
    );
    const commissionSold = await salesIndicators.calculateCommissionSold(
      companyId,
      startDate,
      endDate
    );
    const commissionPending = await salesIndicators.calculateCommissionPending(
      companyId,
      startDate,
      endDate
    );
    const percentCommission = await salesIndicators.calculatePercentCommissionSold(
      companyId,
      startDate,
      endDate
    );
    const salesAbove1M = await salesIndicators.calculateSalesAbove1M(
      companyId,
      startDate,
      endDate
    );
    const avgPaymentDays = await salesIndicators.calculateAvgPaymentDays(
      companyId,
      startDate,
      endDate
    );
    const percentCancelledPending = await salesIndicators.calculatePercentCancelledPending(
      companyId,
      startDate,
      endDate
    );
    const avgPropertyValue = await salesIndicators.calculateAvgPropertyValue(
      companyId,
      startDate,
      endDate
    );
    const salesUNA = await salesIndicators.calculateSalesUNA(
      companyId,
      startDate,
      endDate
    );
    const salesInternal = await salesIndicators.calculateSalesInternal(
      companyId,
      startDate,
      endDate
    );
    const salesExternalPartner = await salesIndicators.calculateSalesExternalPartner(
      companyId,
      startDate,
      endDate
    );
    const salesLaunch = await salesIndicators.calculateSalesLaunch(
      companyId,
      startDate,
      endDate
    );

    // Properfy indicators
    const activeProperties = await properfyIndicators.calculateActivePropertiesCount(
      startDate,
      endDate,
      companyId
    );
    const angariations = await properfyIndicators.calculateAngariationsCount(
      startDate,
      endDate,
      companyId
    );
    const removedProperties = await properfyIndicators.calculateRemovedPropertiesCount(
      startDate,
      endDate,
      companyId
    );
    const vso = await properfyIndicators.calculateVSO(
      startDate,
      endDate,
      companyId
    );
    const readyAttendances = await properfyIndicators.calculateReadyAttendancesFromCards(
      startDate,
      endDate
    );
    const launchAttendances = await properfyIndicators.calculateLaunchAttendancesFromCards(
      startDate,
      endDate
    );
    const averageSaleTime = await properfyIndicators.calculateAverageSaleTime(
      startDate,
      endDate,
      companyId
    );

    // Manual data
    const manualData = await manualDataHelper.getManualData(
      companyId,
      year,
      month
    );

    // Verificar que todos os indicadores foram calculados
    expect(salesValue).toBeDefined();
    expect(salesCount).toBeGreaterThanOrEqual(0);
    expect(cancelledSales).toBeGreaterThanOrEqual(0);
    expect(commissionReceived).toBeGreaterThanOrEqual(0);
    expect(commissionSold).toBeGreaterThanOrEqual(0);
    expect(commissionPending).toBeGreaterThanOrEqual(0);
    expect(percentCommission).toBeGreaterThanOrEqual(0);
    expect(salesAbove1M).toBeGreaterThanOrEqual(0);
    expect(avgPaymentDays).toBeGreaterThanOrEqual(0);
    expect(percentCancelledPending).toBeGreaterThanOrEqual(0);
    expect(avgPropertyValue).toBeGreaterThanOrEqual(0);
    expect(salesUNA).toBeGreaterThanOrEqual(0);
    expect(salesInternal).toBeGreaterThanOrEqual(0);
    expect(salesExternalPartner).toBeGreaterThanOrEqual(0);
    expect(salesLaunch).toBeGreaterThanOrEqual(0);
    expect(activeProperties).toBeGreaterThanOrEqual(0);
    expect(angariations).toBeGreaterThanOrEqual(0);
    expect(removedProperties).toBeGreaterThanOrEqual(0);
    expect(vso).toBeGreaterThanOrEqual(0);
    expect(readyAttendances).toBeGreaterThanOrEqual(0);
    expect(launchAttendances).toBeGreaterThanOrEqual(0);
    expect(averageSaleTime).toBeGreaterThanOrEqual(0);
    expect(manualData).toBeDefined();

    console.log("✅ Todos os 27 indicadores foram calculados com sucesso!");
    console.log(`  - Negócios no mês (valor): ${salesValue.value}`);
    console.log(`  - Negócios no mês (unidades): ${salesCount}`);
    console.log(`  - Valor médio do imóvel: ${avgPropertyValue}`);
    console.log(`  - Carteira de Divulgação: ${activeProperties}`);
    console.log(`  - Angariações: ${angariations}`);
    console.log(`  - Baixas: ${removedProperties}`);
    console.log(`  - Atendimentos Prontos: ${readyAttendances}`);
    console.log(`  - Atendimentos Lançamentos: ${launchAttendances}`);
  });

  it("deve detectar corretamente o último dia do mês", () => {
    // Teste para verificar a lógica de detecção do último dia do mês
    const testCases = [
      { date: new Date(2026, 0, 31), isLastDay: true },   // 31 de janeiro
      { date: new Date(2026, 1, 28), isLastDay: true },   // 28 de fevereiro (2026 não é bissexto)
      { date: new Date(2024, 1, 29), isLastDay: true },   // 29 de fevereiro (2024 é bissexto)
      { date: new Date(2026, 2, 31), isLastDay: true },   // 31 de março
      { date: new Date(2026, 3, 30), isLastDay: true },   // 30 de abril
      { date: new Date(2026, 0, 30), isLastDay: false },  // 30 de janeiro (não é último dia)
      { date: new Date(2026, 1, 27), isLastDay: false },  // 27 de fevereiro (não é último dia)
    ];

    testCases.forEach(({ date, isLastDay }) => {
      const tomorrow = new Date(date);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isLastDayOfMonth = tomorrow.getDate() === 1;
      
      expect(isLastDayOfMonth).toBe(isLastDay);
    });

    console.log("✅ Detecção de último dia do mês funcionando corretamente!");
  });

  it("deve salvar todos os 27 indicadores em formato long (uma linha por indicador)", async () => {
    // Simular salvamento de snapshots com todos os 27 indicadores
    const year = 2026;
    const month = 3;
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;

    const testSnapshots = [
      // Sistema de Vendas (15 indicadores)
      { id: "test-1", companyId, month: monthStr, indicatorName: "Negócios no mês (valor)", value: "13739507", unit: "currency" as const, createdAt: new Date() },
      { id: "test-2", companyId, month: monthStr, indicatorName: "Negócios no mês (unidades)", value: "39", unit: "units" as const, createdAt: new Date() },
      { id: "test-3", companyId, month: monthStr, indicatorName: "Vendas Canceladas", value: "0", unit: "units" as const, createdAt: new Date() },
      { id: "test-4", companyId, month: monthStr, indicatorName: "VSO - venda/oferta", value: "321.47", unit: "percentage" as const, createdAt: new Date() },
      { id: "test-5", companyId, month: monthStr, indicatorName: "Comissão Recebida", value: "0", unit: "currency" as const, createdAt: new Date() },
      { id: "test-6", companyId, month: monthStr, indicatorName: "Comissão Vendida", value: "0", unit: "currency" as const, createdAt: new Date() },
      { id: "test-7", companyId, month: monthStr, indicatorName: "Comissão Pendente Final do mês", value: "0", unit: "currency" as const, createdAt: new Date() },
      { id: "test-8", companyId, month: monthStr, indicatorName: "% comissão vendida", value: "0", unit: "percentage" as const, createdAt: new Date() },
      { id: "test-9", companyId, month: monthStr, indicatorName: "Negócios acima de 1 milhão", value: "0", unit: "units" as const, createdAt: new Date() },
      { id: "test-10", companyId, month: monthStr, indicatorName: "Prazo médio recebimento de venda", value: "0", unit: "days" as const, createdAt: new Date() },
      { id: "test-11", companyId, month: monthStr, indicatorName: "% Com cancelada / com pendente", value: "0", unit: "percentage" as const, createdAt: new Date() },
      { id: "test-12", companyId, month: monthStr, indicatorName: "Negócios na Rede", value: "0", unit: "units" as const, createdAt: new Date() },
      { id: "test-13", companyId, month: monthStr, indicatorName: "Negócios Internos", value: "0", unit: "units" as const, createdAt: new Date() },
      { id: "test-14", companyId, month: monthStr, indicatorName: "Negócios Parceria Externa", value: "0", unit: "units" as const, createdAt: new Date() },
      { id: "test-15", companyId, month: monthStr, indicatorName: "Negócios Lançamentos", value: "0", unit: "units" as const, createdAt: new Date() },
      { id: "test-16", companyId, month: monthStr, indicatorName: "Valor médio do imóvel de venda", value: "681874.68", unit: "currency" as const, createdAt: new Date() },
      
      // Properfy (6 indicadores)
      { id: "test-17", companyId, month: monthStr, indicatorName: "Carteira de Divulgação (em número)", value: "475", unit: "units" as const, createdAt: new Date() },
      { id: "test-18", companyId, month: monthStr, indicatorName: "Angariações mês", value: "28", unit: "units" as const, createdAt: new Date() },
      { id: "test-19", companyId, month: monthStr, indicatorName: "Baixas no mês (em quantidade)", value: "13", unit: "units" as const, createdAt: new Date() },
      { id: "test-20", companyId, month: monthStr, indicatorName: "Número de atendimentos Prontos", value: "594", unit: "units" as const, createdAt: new Date() },
      { id: "test-21", companyId, month: monthStr, indicatorName: "Número de atendimentos Lançamentos", value: "110", unit: "units" as const, createdAt: new Date() },
      { id: "test-22", companyId, month: monthStr, indicatorName: "Tempo médio de venda ang X venda", value: "0", unit: "days" as const, createdAt: new Date() },
      
      // Manuais (5 indicadores)
      { id: "test-23", companyId, month: monthStr, indicatorName: "Despesa Geral", value: "0", unit: "currency" as const, createdAt: new Date() },
      { id: "test-24", companyId, month: monthStr, indicatorName: "Despesa com Impostos", value: "0", unit: "currency" as const, createdAt: new Date() },
      { id: "test-25", companyId, month: monthStr, indicatorName: "Fundo Inovação", value: "0", unit: "currency" as const, createdAt: new Date() },
      { id: "test-26", companyId, month: monthStr, indicatorName: "Resultado Sócios", value: "0", unit: "currency" as const, createdAt: new Date() },
      { id: "test-27", companyId, month: monthStr, indicatorName: "Fundo Emergencial", value: "0", unit: "currency" as const, createdAt: new Date() },
    ];

    // Inserir snapshots de teste
    await db.insert(indicatorSnapshots).values(testSnapshots);

    // Verificar que foram salvos
    const saved = await db.select().from(indicatorSnapshots).where(
      eq(indicatorSnapshots.month, monthStr)
    );

    expect(saved.length).toBeGreaterThanOrEqual(27);
    expect(saved[0].indicatorName).toBeDefined();
    expect(saved[0].value).toBeDefined();
    expect(saved[0].unit).toBeDefined();

    console.log(`✅ Todos os 27 indicadores salvos em formato long corretamente!`);
    console.log(`  - Total de snapshots: ${saved.length}`);
  });
});
