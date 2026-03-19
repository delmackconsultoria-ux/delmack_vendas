import { getDb } from "../db";
import { indicatorAuditLog } from "../../drizzle/schema";
import { v4 as uuidv4 } from "uuid";
import { eq, and } from "drizzle-orm";

export interface AuditLogEntry {
  companyId: string;
  year: number;
  month: number;
  fieldName: string;
  previousValue?: number | null;
  newValue: number;
  editedBy: string;
  editedByName: string;
  notes?: string;
}

/**
 * Salva um log de auditoria quando um dado manual é alterado
 */
export async function saveAuditLog(entry: AuditLogEntry): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[AuditLog] Database not available");
    return;
  }

  try {
    await db.insert(indicatorAuditLog).values({
      id: uuidv4(),
      companyId: entry.companyId,
      year: entry.year,
      month: entry.month,
      fieldName: entry.fieldName,
      previousValue: entry.previousValue ? String(entry.previousValue) : null,
      newValue: String(entry.newValue),
      editedBy: entry.editedBy,
      editedByName: entry.editedByName,
      editedAt: new Date(),
      notes: entry.notes,
    } as any);

    console.log(`[AuditLog] Logged change for ${entry.fieldName} (${entry.month}/${entry.year})`);
  } catch (error) {
    console.error("[AuditLog] Failed to save audit log:", error);
    // Não lançar erro - auditoria não deve quebrar a operação principal
  }
}

/**
 * Busca histórico de edições para um indicador específico
 */
export async function getAuditHistory(
  companyId: string,
  year: number,
  month: number,
  fieldName?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[AuditLog] Database not available");
    return [];
  }

  try {
    const conditions = [
      eq(indicatorAuditLog.companyId, companyId),
      eq(indicatorAuditLog.year, year),
      eq(indicatorAuditLog.month, month),
    ];

    if (fieldName) {
      conditions.push(eq(indicatorAuditLog.fieldName, fieldName));
    }

    const result = await db
      .select()
      .from(indicatorAuditLog)
      .where(and(...conditions))
      .orderBy(indicatorAuditLog.editedAt);

    return result;
  } catch (error) {
    console.error("[AuditLog] Failed to fetch audit history:", error);
    return [];
  }
}

/**
 * Busca todas as edições de um usuário
 */
export async function getUserAuditHistory(userId: string, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[AuditLog] Database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(indicatorAuditLog)
      .where(eq(indicatorAuditLog.editedBy, userId))
      .orderBy(indicatorAuditLog.editedAt)
      .limit(limit);

    return result;
  } catch (error) {
    console.error("[AuditLog] Failed to fetch user audit history:", error);
    return [];
  }
}
