/**
 * Formata valor numérico para exibição com vírgula decimal
 * Ex: 5000.50 → "5000,50"
 */
export function formatCurrencyInput(value: string): string {
  // Remove tudo exceto números e ponto
  const cleaned = value.replace(/[^\d.]/g, '');
  // Substitui ponto por vírgula para exibição
  return cleaned.replace('.', ',');
}

/**
 * Converte valor formatado com vírgula para número
 * Ex: "5000,50" → 5000.50
 */
export function parseCurrencyInput(value: string): number {
  // Remove tudo exceto números e vírgula
  const cleaned = value.replace(/[^\d,]/g, '');
  // Substitui vírgula por ponto para parsing
  const normalized = cleaned.replace(',', '.');
  return parseFloat(normalized) || 0;
}

/**
 * Formata valor durante digitação (permite vírgula)
 * Ex: "5000,5" → "5000,5" (mantém formato durante digitação)
 */
export function formatWhileTyping(value: string): string {
  // Permite apenas números e uma vírgula
  let cleaned = value.replace(/[^\d,]/g, '');
  
  // Garante apenas uma vírgula
  const parts = cleaned.split(',');
  if (parts.length > 2) {
    cleaned = parts[0] + ',' + parts.slice(1).join('');
  }
  
  // Limita casas decimais a 2
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + ',' + parts[1].substring(0, 2);
  }
  
  return cleaned;
}
