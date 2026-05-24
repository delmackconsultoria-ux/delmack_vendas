/**
 * Helper para gerenciar histórico de observações acumulativas
 * Armazena observações em JSON com informações de status, usuário e data
 */

export interface ObservationEntry {
  timestamp: string; // ISO 8601 format
  userId: string;
  userName: string;
  statusFrom: string;
  statusTo: string;
  text: string;
}

export interface ObservationHistory {
  entries: ObservationEntry[];
}

/**
 * Parse observações do banco (pode ser string JSON ou null)
 */
export function parseObservations(data: string | null | undefined): ObservationHistory {
  if (!data) {
    return { entries: [] };
  }

  try {
    const parsed = JSON.parse(data);
    if (parsed && Array.isArray(parsed.entries)) {
      return parsed;
    }
  } catch (error) {
    console.warn('[ObservationHistory] Erro ao parsear observações:', error);
  }

  return { entries: [] };
}

/**
 * Serializar histórico para armazenar no banco
 */
export function serializeObservations(history: ObservationHistory): string {
  return JSON.stringify(history);
}

/**
 * Adicionar nova observação ao histórico
 */
export function addObservationEntry(
  currentData: string | null | undefined,
  entry: Omit<ObservationEntry, 'timestamp'>
): string {
  const history = parseObservations(currentData);

  const newEntry: ObservationEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  history.entries.push(newEntry);

  return serializeObservations(history);
}

/**
 * Obter observações formatadas para exibição
 */
export function formatObservationsForDisplay(data: string | null | undefined): string {
  const history = parseObservations(data);

  if (history.entries.length === 0) {
    return 'Nenhuma observação registrada';
  }

  return history.entries
    .map((entry) => {
      const date = new Date(entry.timestamp);
      const formattedDate = date.toLocaleString('pt-BR');
      const statusChange = entry.statusFrom !== entry.statusTo 
        ? ` (${entry.statusFrom} → ${entry.statusTo})`
        : '';

      return `[${formattedDate}] ${entry.userName}${statusChange}: ${entry.text}`;
    })
    .join('\n');
}

/**
 * Obter última observação
 */
export function getLastObservation(data: string | null | undefined): ObservationEntry | null {
  const history = parseObservations(data);
  return history.entries.length > 0 ? history.entries[history.entries.length - 1] : null;
}

/**
 * Obter observações por status
 */
export function getObservationsByStatus(
  data: string | null | undefined,
  status: string
): ObservationEntry[] {
  const history = parseObservations(data);
  return history.entries.filter((entry) => entry.statusTo === status);
}
