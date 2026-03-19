import { getDb } from "../db";
import { sql, eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { indicatorManualData } from "../../drizzle/schema";

/**
 * Estrutura de dados manuais
 */
export interface ManualIndicatorData {
  despesaGeral: number;
  despesaImpostos: number;
  fundoInovacao: number;
  resultadoSocios: number;
  fundoEmergencial: number;
}

/**
 * Buscar dados manuais de um mês específico
 */
export async function getManualData(
  companyId: string,
  year: number,
  month: number
): Promise<ManualIndicatorData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(indicatorManualData)
    .where(
      and(
        eq(indicatorManualData.companyId, companyId),
        eq(indicatorManualData.year, year),
        eq(indicatorManualData.month, month)
      )
    );

  if (!result || result.length === 0) {
    return {
      despesaGeral: 0,
      despesaImpostos: 0,
      fundoInovacao: 0,
      resultadoSocios: 0,
      fundoEmergencial: 0,
    };
  }

  const row = result[0];
  return {
    despesaGeral: parseFloat(String(row.despesaGeral || "0")),
    despesaImpostos: parseFloat(String(row.despesaImpostos || "0")),
    fundoInovacao: parseFloat(String(row.fundoInovacao || "0")),
    resultadoSocios: parseFloat(String(row.resultadoSocios || "0")),
    fundoEmergencial: parseFloat(String(row.fundoEmergencial || "0")),
  };
}

/**
 * Salvar dados manuais de um mês (apenas gerentes)
 */
export async function saveManualData(
  companyId: string,
  year: number,
  month: number,
  data: ManualIndicatorData,
  updatedBy: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe registro
  const existing = await db
    .select()
    .from(indicatorManualData)
    .where(
      and(
        eq(indicatorManualData.companyId, companyId),
        eq(indicatorManualData.year, year),
        eq(indicatorManualData.month, month)
      )
    );

  if (existing && existing.length > 0) {
    // Atualizar usando SQL raw
    await db.execute(
      sql`UPDATE indicatorManualData 
          SET despesaGeral = ${data.despesaGeral},
              despesaImpostos = ${data.despesaImpostos},
              fundoInovacao = ${data.fundoInovacao},
              resultadoSocios = ${data.resultadoSocios},
              fundoEmergencial = ${data.fundoEmergencial},
              updatedBy = ${updatedBy},
              updatedAt = NOW()
          WHERE companyId = ${companyId} AND year = ${year} AND month = ${month}`
    );
  } else {
    // Inserir
    await db.insert(indicatorManualData).values({
      id: uuid(),
      companyId,
      year,
      month,
      despesaGeral: String(data.despesaGeral),
      despesaImpostos: String(data.despesaImpostos),
      fundoInovacao: String(data.fundoInovacao),
      resultadoSocios: String(data.resultadoSocios),
      fundoEmergencial: String(data.fundoEmergencial),
      updatedBy,
    });
  }
}
