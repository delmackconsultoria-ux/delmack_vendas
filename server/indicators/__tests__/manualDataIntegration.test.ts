import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as manualDataHelper from "../manualDataHelper";
import { getDb } from "../../db";
import { indicatorManualData } from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Manual Data Integration", () => {
  const testCompanyId = "test-company-manual";
  const testYear = 2026;
  const testMonth = 3;

  beforeAll(async () => {
    // Limpar dados de teste anteriores
    const db = await getDb();
    if (db) {
      await db
        .delete(indicatorManualData)
        .where(
          and(
            eq(indicatorManualData.companyId, testCompanyId),
            eq(indicatorManualData.year, testYear),
            eq(indicatorManualData.month, testMonth)
          )
        );
    }
  });

  afterAll(async () => {
    // Limpar dados de teste
    const db = await getDb();
    if (db) {
      await db
        .delete(indicatorManualData)
        .where(
          and(
            eq(indicatorManualData.companyId, testCompanyId),
            eq(indicatorManualData.year, testYear),
            eq(indicatorManualData.month, testMonth)
          )
        );
    }
  });

  it("should save and retrieve manual data correctly", async () => {
    const testData = {
      despesaGeral: 50000,
      despesaImpostos: 30000,
      fundoInovacao: 20000,
      resultadoSocios: 100000,
      fundoEmergencial: 10000,
    };

    // Salvar dados
    await manualDataHelper.saveManualData(
      testCompanyId,
      testYear,
      testMonth,
      testData,
      "test-user",
      "Test User"
    );

    // Recuperar dados
    const retrievedData = await manualDataHelper.getManualData(
      testCompanyId,
      testYear,
      testMonth
    );

    // Validar
    expect(retrievedData.despesaGeral).toBe(testData.despesaGeral);
    expect(retrievedData.despesaImpostos).toBe(testData.despesaImpostos);
    expect(retrievedData.fundoInovacao).toBe(testData.fundoInovacao);
    expect(retrievedData.resultadoSocios).toBe(testData.resultadoSocios);
    expect(retrievedData.fundoEmergencial).toBe(testData.fundoEmergencial);
  });

  it("should return zeros for non-existent data", async () => {
    const nonExistentData = await manualDataHelper.getManualData(
      "non-existent-company",
      2026,
      12
    );

    expect(nonExistentData.despesaGeral).toBe(0);
    expect(nonExistentData.despesaImpostos).toBe(0);
    expect(nonExistentData.fundoInovacao).toBe(0);
    expect(nonExistentData.resultadoSocios).toBe(0);
    expect(nonExistentData.fundoEmergencial).toBe(0);
  });

  it("should update existing manual data", async () => {
    const initialData = {
      despesaGeral: 50000,
      despesaImpostos: 30000,
      fundoInovacao: 20000,
      resultadoSocios: 100000,
      fundoEmergencial: 10000,
    };

    // Salvar dados iniciais
    await manualDataHelper.saveManualData(
      testCompanyId,
      testYear,
      testMonth,
      initialData,
      "test-user",
      "Test User"
    );

    // Atualizar dados
    const updatedData = {
      despesaGeral: 60000,
      despesaImpostos: 35000,
      fundoInovacao: 25000,
      resultadoSocios: 120000,
      fundoEmergencial: 15000,
    };

    await manualDataHelper.saveManualData(
      testCompanyId,
      testYear,
      testMonth,
      updatedData,
      "test-user",
      "Test User"
    );

    // Recuperar e validar
    const retrievedData = await manualDataHelper.getManualData(
      testCompanyId,
      testYear,
      testMonth
    );

    expect(retrievedData.despesaGeral).toBe(updatedData.despesaGeral);
    expect(retrievedData.despesaImpostos).toBe(updatedData.despesaImpostos);
    expect(retrievedData.fundoInovacao).toBe(updatedData.fundoInovacao);
    expect(retrievedData.resultadoSocios).toBe(updatedData.resultadoSocios);
    expect(retrievedData.fundoEmergencial).toBe(updatedData.fundoEmergencial);
  });
});
