import { getDb } from "../db";
import { sql, eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";

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

  const result = await db.query.raw(
    sql`SELECT despesaGeral, despesaImpostos, fundoInovacao, resultadoSocios, fundoEmergencial 
        FROM indicatorManualData 
        WHERE companyId = ${companyId} AND year = ${year} AND month = ${month}`
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

  const row = result[0] as any;
  return {
    despesaGeral: parseFloat(row.despesaGeral || "0"),
    despesaImpostos: parseFloat(row.despesaImpostos || "0"),
    fundoInovacao: parseFloat(row.fundoInovacao || "0"),
    resultadoSocios: parseFloat(row.resultadoSocios || "0"),
    fundoEmergencial: parseFloat(row.fundoEmergencial || "0"),
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
  const existing = await db.query.raw(
    sql`SELECT id FROM indicatorManualData WHERE companyId = ${companyId} AND year = ${year} AND month = ${month}`
  );

  if (existing && existing.length > 0) {
    // Atualizar
    await db.query.raw(
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
    await db.query.raw(
      sql`INSERT INTO indicatorManualData 
          (id, companyId, year, month, despesaGeral, despesaImpostos, fundoInovacao, resultadoSocios, fundoEmergencial, updatedBy)
          VALUES (${uuid()}, ${companyId}, ${year}, ${month}, ${data.despesaGeral}, ${data.despesaImpostos}, ${data.fundoInovacao}, ${data.resultadoSocios}, ${data.fundoEmergencial}, ${updatedBy})`
    );
  }
}
