import { getDb } from "../db";
import { sql, eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { indicatorManualData } from "../../drizzle/schema";
import { saveAuditLog } from "./auditLogHelper";

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
 * Converter valor com locale brasileiro (vírgula) para número
 * Exemplo: "0,10" -> 0.10, "1.234,56" -> 1234.56
 */
function parseMonetaryValue(value: any): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const str = String(value).trim();
  
  // Se já é um número, retornar como é
  if (!isNaN(Number(str)) && str !== "") {
    return Number(str);
  }

  // Converter locale brasileiro (1.234,56) para número
  // Remover pontos (separador de milhares) e substituir vírgula por ponto
  const normalized = str
    .replace(/\./g, "") // Remove pontos (1.234 -> 1234)
    .replace(/,/g, "."); // Substitui vírgula por ponto (1234,56 -> 1234.56)

  const parsed = parseFloat(normalized);
  return !isNaN(parsed) ? parsed : 0;
}

/**
 * Validar se valor é um número válido
 */
function isValidMonetaryValue(value: any): boolean {
  const parsed = parseMonetaryValue(value);
  return !isNaN(parsed) && parsed >= 0;
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
    despesaGeral: parseMonetaryValue(row.despesaGeral),
    despesaImpostos: parseMonetaryValue(row.despesaImpostos),
    fundoInovacao: parseMonetaryValue(row.fundoInovacao),
    resultadoSocios: parseMonetaryValue(row.resultadoSocios),
    fundoEmergencial: parseMonetaryValue(row.fundoEmergencial),
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
  updatedBy: string,
  updatedByName: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validar todos os valores
  const fieldNames = [
    "despesaGeral",
    "despesaImpostos",
    "fundoInovacao",
    "resultadoSocios",
    "fundoEmergencial",
  ] as const;

  for (const field of fieldNames) {
    if (!isValidMonetaryValue(data[field])) {
      throw new Error(`Invalid monetary value for ${field}: ${data[field]}`);
    }
  }

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
    // Registrar auditoria para cada campo alterado
    const oldData = existing[0] as any;
    for (const field of fieldNames) {
      const oldValue = parseMonetaryValue(oldData[field]);
      const newValue = data[field];

      if (oldValue !== newValue) {
        await saveAuditLog({
          companyId,
          year,
          month,
          fieldName: field,
          previousValue: oldValue,
          newValue,
          editedBy: updatedBy,
          editedByName: updatedByName,
        });
      }
    }

    // Atualizar usando SQL raw com valores DECIMAL corretos
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
    // Registrar auditoria para cada novo valor
    for (const field of fieldNames) {
      await saveAuditLog({
        companyId,
        year,
        month,
        fieldName: field,
        previousValue: null,
        newValue: data[field],
        editedBy: updatedBy,
        editedByName: updatedByName,
      });
    }

    // Inserir com valores DECIMAL corretos (não como string)
    await db.insert(indicatorManualData).values({
      id: uuid(),
      companyId,
      year,
      month,
      despesaGeral: data.despesaGeral,
      despesaImpostos: data.despesaImpostos,
      fundoInovacao: data.fundoInovacao,
      resultadoSocios: data.resultadoSocios,
      fundoEmergencial: data.fundoEmergencial,
      updatedBy,
    } as any);
  }
}
