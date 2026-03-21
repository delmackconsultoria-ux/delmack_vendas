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
  if (!value) return 0;
  // Remove tudo exceto números, vírgula e ponto
  let cleaned = value.replace(/[^\d,\.]/g, '');
  // Encontra a última vírgula (separador decimal)
  const lastCommaIndex = cleaned.lastIndexOf(',');
  if (lastCommaIndex > -1) {
    // Tem vírgula - substitui por ponto para parsing
    const integerPart = cleaned.substring(0, lastCommaIndex).replace(/\./g, '');
    const decimalPart = cleaned.substring(lastCommaIndex + 1);
    const normalized = `${integerPart}.${decimalPart}`;
    return parseFloat(normalized) || 0;
  } else {
    // Sem vírgula - remove pontos de milhar
    cleaned = cleaned.replace(/\./g, '');
    return parseFloat(cleaned) || 0;
  }
}

/**
 * Formata valor durante digitação (permite vírgula)
 * Ex: "123456" → "1.234,56" (com pontos de milhar E vírgula decimal)
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
  let cleaned = value.toString().replace(/[^\d,\.]/g, '');
  
  // Se estiver vazio, retorna vazio
  if (!cleaned) return '';
  
  // Encontra a última vírgula (separador decimal)
  const lastCommaIndex = cleaned.lastIndexOf(',');
  let integerPart = '';
  let decimalPart = '';
  
  if (lastCommaIndex > -1) {
    // Tem vírgula - separa em parte inteira e decimal
    integerPart = cleaned.substring(0, lastCommaIndex);
    decimalPart = cleaned.substring(lastCommaIndex + 1);
  } else {
    // Sem vírgula - tudo é parte inteira
    integerPart = cleaned;
  }

  // Remove todos os pontos da parte inteira (são pontos de milhar antigos)
  integerPart = integerPart.replace(/\./g, '');
  
  // Se não tem parte inteira, retorna vazio
  if (!integerPart) return '';
  
  // Formata parte inteira com pontos de milhar
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Retorna formatado
  if (decimalPart) {
    // Limita decimal a 2 dígitos e adiciona vírgula
    const limitedDecimal = decimalPart.substring(0, 2);
    return `${integerPart},${limitedDecimal}`;
  }
  
  // Se não tem vírgula digitada, não adiciona (permite digitação livre)
  return integerPart;
}
