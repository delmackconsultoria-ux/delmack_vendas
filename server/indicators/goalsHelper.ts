import { getDb } from "../db";
import { indicatorGoals } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Buscar Média Anual de um indicador do cadastro de Metas (indicatorGoals)
 * @param companyId - ID da empresa
 * @param indicatorName - Nome do indicador
 * @param year - Ano
 * @returns Média Anual ou 0 se não encontrado
 */
export async function getAnnualAverage(
  companyId: string,
  indicatorName: string,
  year: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ annualAverage: indicatorGoals.annualAverage })
    .from(indicatorGoals)
    .where(
      and(
        eq(indicatorGoals.companyId, companyId),
        eq(indicatorGoals.indicatorName, indicatorName),
        eq(indicatorGoals.year, year)
      )
    )
    .limit(1);

  if (!result || result.length === 0) {
    return 0;
  }

  const value = result[0]?.annualAverage;
  return typeof value === 'number' ? value : parseFloat(value || "0");
}

/**
 * Buscar todas as Metas Anuais de um ano
 * @param companyId - ID da empresa
 * @param year - Ano
 * @returns Objeto com indicatorName como chave e annualAverage como valor
 */
export async function getAllAnnualAverages(
  companyId: string,
  year: number
): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select({
      indicatorName: indicatorGoals.indicatorName,
      annualAverage: indicatorGoals.annualAverage,
    })
    .from(indicatorGoals)
    .where(
      and(
        eq(indicatorGoals.companyId, companyId),
        eq(indicatorGoals.year, year)
      )
    );

  const averages: Record<string, number> = {};
  
  results.forEach((row) => {
    const value = row.annualAverage;
    averages[row.indicatorName] = typeof value === 'number' ? value : parseFloat(value || "0");
  });

  return averages;
}
