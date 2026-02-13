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
 * Permite digitação livre de valores grandes (milhões)
 */
export function formatWhileTyping(value: string | number): string {
  // Se for número, formata diretamente
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  // Remove tudo exceto números, vírgula e ponto
  let cleaned = value.toString().replace(/[^\d.,]/g, '');
  
  // Se estiver vazio, retorna vazio
  if (!cleaned) return '';
  
  // Remove pontos de milhar anteriores (mantém apenas vírgula decimal)
  cleaned = cleaned.replace(/\./g, '');
  
  // Separa parte inteira e decimal
  const parts = cleaned.split(',');
  let integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  // Se não tem parte inteira, retorna vazio
  if (!integerPart) return '';
  
  // Formata parte inteira com pontos de milhar
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Retorna formatado
  if (decimalPart) {
    // Limita decimal a 2 dígitos
    return `${integerPart},${decimalPart.substring(0, 2)}`;
  }
  
  return integerPart;
}
