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
 * Ex: "5000,5" → "5.000,50" (formato brasileiro completo)
 */
export function formatWhileTyping(value: string): string {
  // Converte para número se for string numérica pura (vindo da API)
  const numValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
  
  if (isNaN(numValue)) return value.toString();
  
  // Formata com pontos de milhar e vírgula decimal
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
