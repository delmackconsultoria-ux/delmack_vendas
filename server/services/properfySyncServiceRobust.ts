import { getDb } from "../db";
import { properfySyncHistory, properfySyncErrors } from "../../drizzle/schema";
import { v4 as uuidv4 } from "uuid";
import { eq, and } from "drizzle-orm";

/**
 * Configuração de retry com backoff exponencial
 */
const RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  multiplier: 2,
  jitterPercent: 10, // ±10% aleatório
};

/**
 * Calcula delay com backoff exponencial e jitter
 */
function calculateBackoffDelay(attemptNumber: number): number {
  const baseDelay = Math.min(
    RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.multiplier, attemptNumber - 1),
    RETRY_CONFIG.maxDelayMs
  );

  // Adicionar jitter aleatório
  const jitterAmount = (baseDelay * RETRY_CONFIG.jitterPercent) / 100;
  const jitter = (Math.random() - 0.5) * 2 * jitterAmount;

  return Math.max(0, baseDelay + jitter);
}

/**
 * Executa função com retry automático
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operationName: string,
  syncHistoryId?: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      console.log(`[${operationName}] Tentativa ${attempt}/${RETRY_CONFIG.maxAttempts}`);
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`[${operationName}] Erro na tentativa ${attempt}:`, lastError.message);

      // Se for a última tentativa, não aguardar
      if (attempt === RETRY_CONFIG.maxAttempts) {
        break;
      }

      // Calcular delay e aguardar
      const delayMs = calculateBackoffDelay(attempt);
      console.log(`[${operationName}] Aguardando ${delayMs.toFixed(0)}ms antes de retry...`);

      // Registrar erro no banco se houver syncHistoryId
      if (syncHistoryId) {
        await recordSyncError(syncHistoryId, null, lastError.message, null, attempt);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(
    `[${operationName}] Falha após ${RETRY_CONFIG.maxAttempts} tentativas: ${lastError?.message}`
  );
}

/**
 * Registra erro de sincronização no banco de dados
 */
export async function recordSyncError(
  syncHistoryId: string,
  recordId: string | null,
  errorMessage: string,
  errorCode: string | null,
  retryCount: number
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(properfySyncErrors).values({
      id: uuidv4(),
      syncHistoryId,
      recordId,
      errorMessage,
      errorCode,
      retryCount,
      nextRetryAt: new Date(Date.now() + calculateBackoffDelay(retryCount)),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[recordSyncError] Erro ao registrar erro:", error);
  }
}

/**
 * Cria registro de sincronização no banco
 */
export async function createSyncHistory(
  syncType: "cards" | "properties" | "leads"
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const syncHistoryId = uuidv4();

  await db.insert(properfySyncHistory).values({
    id: syncHistoryId,
    syncType,
    status: "pending",
    startedAt: new Date(),
    totalRecords: 0,
    processedRecords: 0,
    failedRecords: 0,
    lastPageProcessed: 0,
    nextPageToProcess: 1,
    totalPages: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return syncHistoryId;
}

/**
 * Atualiza status de sincronização
 */
export async function updateSyncHistory(
  syncHistoryId: string,
  updates: {
    status?: "pending" | "in_progress" | "completed" | "failed" | "partial";
    totalRecords?: number;
    processedRecords?: number;
    failedRecords?: number;
    lastPageProcessed?: number;
    nextPageToProcess?: number;
    totalPages?: number;
    errorMessage?: string;
    durationSeconds?: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(properfySyncHistory)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(properfySyncHistory.id, syncHistoryId));
}

/**
 * Marca sincronização como completa
 */
export async function completeSyncHistory(
  syncHistoryId: string,
  durationSeconds: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(properfySyncHistory)
    .set({
      status: "completed",
      completedAt: new Date(),
      durationSeconds,
      updatedAt: new Date(),
    })
    .where(eq(properfySyncHistory.id, syncHistoryId));
}

/**
 * Marca sincronização como falhada
 */
export async function failSyncHistory(
  syncHistoryId: string,
  errorMessage: string,
  durationSeconds: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(properfySyncHistory)
    .set({
      status: "failed",
      completedAt: new Date(),
      errorMessage,
      durationSeconds,
      updatedAt: new Date(),
    })
    .where(eq(properfySyncHistory.id, syncHistoryId));
}

/**
 * Obtém último registro de sincronização bem-sucedida
 */
export async function getLastSuccessfulSync(
  syncType: "cards" | "properties" | "leads"
): Promise<typeof properfySyncHistory.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(properfySyncHistory)
    .where(
      and(
        eq(properfySyncHistory.syncType, syncType),
        eq(properfySyncHistory.status, "completed")
      )
    )
    .orderBy((t) => t.completedAt)
    .limit(1);

  return result[0] || null;
}

/**
 * Obtém sincronização em progresso
 */
export async function getInProgressSync(
  syncType: "cards" | "properties" | "leads"
): Promise<typeof properfySyncHistory.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(properfySyncHistory)
    .where(
      and(
        eq(properfySyncHistory.syncType, syncType),
        eq(properfySyncHistory.status, "in_progress")
      )
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Retoma sincronização interrompida
 */
export async function resumeSync(
  syncHistoryId: string
): Promise<typeof properfySyncHistory.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(properfySyncHistory)
    .where(eq(properfySyncHistory.id, syncHistoryId))
    .limit(1);

  return result[0] || null;
}

/**
 * Valida dados de card antes de salvar
 */
export function validateCardData(card: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar campos obrigatórios
  if (!card.id || typeof card.id !== "number") {
    errors.push("Card ID inválido");
  }

  if (!card.fkPipeline || typeof card.fkPipeline !== "number") {
    errors.push("Pipeline ID inválido");
  }

  // Validar pipeline está na lista permitida
  const allowedPipelines = [20, 21, 24, 49];
  if (!allowedPipelines.includes(card.fkPipeline)) {
    errors.push(`Pipeline ${card.fkPipeline} não está na lista permitida`);
  }

  if (!card.fkTimeline || typeof card.fkTimeline !== "number") {
    errors.push("Timeline ID inválido");
  }

  // Validar data
  if (card.dttRegistered) {
    const date = new Date(card.dttRegistered);
    if (isNaN(date.getTime())) {
      errors.push("Data de registro inválida");
    }
    if (date > new Date()) {
      errors.push("Data de registro não pode ser no futuro");
    }
    if (date < new Date("2020-01-01")) {
      errors.push("Data de registro muito antiga");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitiza string para evitar injeção de SQL
 */
export function sanitizeString(str: string | null | undefined, maxLength: number = 255): string | null {
  if (!str) return null;

  // Remover caracteres de controle
  let sanitized = str.replace(/[\x00-\x1F\x7F]/g, "");

  // Limitar tamanho
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized || null;
}

/**
 * Formata dados de card para inserção no banco
 */
export function formatCardForDatabase(card: any): any {
  return {
    id: card.id,
    pipelineId: card.fkPipeline,
    pipelineName: sanitizeString(card.chrPipelineName),
    timelineId: card.fkTimeline,
    timelineName: sanitizeString(card.chrTimelineName),
    leadId: card.fkLead,
    leadName: sanitizeString(card.chrLeadName),
    leadEmail: sanitizeString(card.chrLeadEmail),
    leadPhone: sanitizeString(card.chrLeadPhone),
    propertyRef: sanitizeString(card.chrPropertyRef),
    cardTitle: sanitizeString(card.chrTitle),
    cardType: sanitizeString(card.chrType),
    createdAt: card.dttRegistered ? new Date(card.dttRegistered) : new Date(),
  };
}
