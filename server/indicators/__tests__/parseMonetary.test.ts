import { describe, it, expect } from 'vitest';

// Função para converter locale brasileiro para número
const parseMonetaryValue = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  const str = value.trim();
  
  // Se é apenas números SEM separador decimal, interpretar como centavos
  // "8" -> 0.08, "88" -> 0.88, "888" -> 8.88
  if (!isNaN(Number(str)) && !str.includes(',') && !str.includes('.')) {
    return Number(str) / 100;
  }
  
  // Remover "R$" e espaços
  let cleanStr = str.replace(/R\$/g, '').trim();
  
  // Remover pontos (separador de milhares) e substituir vírgula por ponto
  const normalized = cleanStr
    .replace(/\./g, '') // Remove pontos (1.234 -> 1234)
    .replace(/,/g, '.'); // Substitui vírgula por ponto (1234,56 -> 1234.56)
  
  const parsed = parseFloat(normalized);
  return !isNaN(parsed) ? parsed : 0;
};

// Função para formatar número como moeda
const formatCurrencyDisplay = (value: number): string => {
  if (value === 0) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

describe('parseMonetaryValue', () => {
  describe('Entrada com apenas números (centavos)', () => {
    it('digita "8" -> 0.08', () => {
      expect(parseMonetaryValue('8')).toBe(0.08);
    });

    it('digita "9" -> 0.09', () => {
      expect(parseMonetaryValue('9')).toBe(0.09);
    });

    it('digita "99" -> 0.99', () => {
      expect(parseMonetaryValue('99')).toBe(0.99);
    });

    it('digita "888" -> 8.88', () => {
      expect(parseMonetaryValue('888')).toBe(8.88);
    });

    it('digita "8888" -> 88.88', () => {
      expect(parseMonetaryValue('8888')).toBe(88.88);
    });

    it('digita "100" -> 1.00', () => {
      expect(parseMonetaryValue('100')).toBe(1.00);
    });

    it('digita "1000" -> 10.00', () => {
      expect(parseMonetaryValue('1000')).toBe(10.00);
    });

    it('digita "10" -> 0.10', () => {
      expect(parseMonetaryValue('10')).toBe(0.10);
    });
  });

  describe('Entrada com vírgula (locale brasileiro)', () => {
    it('digita "0,10" -> 0.10', () => {
      expect(parseMonetaryValue('0,10')).toBe(0.10);
    });

    it('digita "0,08" -> 0.08', () => {
      expect(parseMonetaryValue('0,08')).toBe(0.08);
    });

    it('digita "0,99" -> 0.99', () => {
      expect(parseMonetaryValue('0,99')).toBe(0.99);
    });

    it('digita "10,00" -> 10.00', () => {
      expect(parseMonetaryValue('10,00')).toBe(10.00);
    });

    it('digita "100,00" -> 100.00', () => {
      expect(parseMonetaryValue('100,00')).toBe(100.00);
    });

    it('digita "1.000,00" -> 1000.00', () => {
      expect(parseMonetaryValue('1.000,00')).toBe(1000.00);
    });

    it('digita "10.000,00" -> 10000.00', () => {
      expect(parseMonetaryValue('10.000,00')).toBe(10000.00);
    });

    it('digita "100.000,00" -> 100000.00', () => {
      expect(parseMonetaryValue('100.000,00')).toBe(100000.00);
    });

    it('digita "1.000.000,00" -> 1000000.00', () => {
      expect(parseMonetaryValue('1.000.000,00')).toBe(1000000.00);
    });

    it('digita "10.000.000,00" -> 10000000.00', () => {
      expect(parseMonetaryValue('10.000.000,00')).toBe(10000000.00);
    });

    it('digita "100.000.000,00" -> 100000000.00', () => {
      expect(parseMonetaryValue('100.000.000,00')).toBe(100000000.00);
    });
  });

  describe('Entrada com R$ (formatada)', () => {
    it('digita "R$ 0,10" -> 0.10', () => {
      expect(parseMonetaryValue('R$ 0,10')).toBe(0.10);
    });

    it('digita "R$ 0,99" -> 0.99', () => {
      expect(parseMonetaryValue('R$ 0,99')).toBe(0.99);
    });

    it('digita "R$ 10,00" -> 10.00', () => {
      expect(parseMonetaryValue('R$ 10,00')).toBe(10.00);
    });

    it('digita "R$ 1.000,00" -> 1000.00', () => {
      expect(parseMonetaryValue('R$ 1.000,00')).toBe(1000.00);
    });

    it('digita "R$ 100.000,00" -> 100000.00', () => {
      expect(parseMonetaryValue('R$ 100.000,00')).toBe(100000.00);
    });

    it('digita "R$ 1.000.000,00" -> 1000000.00', () => {
      expect(parseMonetaryValue('R$ 1.000.000,00')).toBe(1000000.00);
    });

    it('digita "R$ 10.000.000,00" -> 10000000.00', () => {
      expect(parseMonetaryValue('R$ 10.000.000,00')).toBe(10000000.00);
    });

    it('digita "R$ 100.000.000,00" -> 100000000.00', () => {
      expect(parseMonetaryValue('R$ 100.000.000,00')).toBe(100000000.00);
    });
  });

  describe('Casos especiais', () => {
    it('digita "" (vazio) -> 0', () => {
      expect(parseMonetaryValue('')).toBe(0);
    });

    it('digita "   " (espaços) -> 0', () => {
      expect(parseMonetaryValue('   ')).toBe(0);
    });

    it('digita "0" -> 0', () => {
      expect(parseMonetaryValue('0')).toBe(0);
    });

    it('digita "00" -> 0', () => {
      expect(parseMonetaryValue('00')).toBe(0);
    });

    it('digita "000" -> 0', () => {
      expect(parseMonetaryValue('000')).toBe(0);
    });

    it('digita "R$ 0,00" -> 0', () => {
      expect(parseMonetaryValue('R$ 0,00')).toBe(0);
    });
  });
});

describe('formatCurrencyDisplay', () => {
  const normalizeSpace = (str: string) => str.replace(/\u00A0/g, ' ');
  
  describe('Formatação de valores', () => {
    it('0.08 -> "R$ 0,08"', () => {
      expect(normalizeSpace(formatCurrencyDisplay(0.08))).toBe('R$ 0,08');
    });

    it('0.09 -> "R$ 0,09"', () => {
      expect(normalizeSpace(formatCurrencyDisplay(0.09))).toBe('R$ 0,09');
    });

    it('0.99 -> "R$ 0,99"', () => {
      expect(normalizeSpace(formatCurrencyDisplay(0.99))).toBe('R$ 0,99');
    });

    it('10 -> "R$ 10,00"', () => {
      expect(normalizeSpace(formatCurrencyDisplay(10))).toBe('R$ 10,00');
    });

    it('100 -> "R$ 100,00"', () => {
      expect(normalizeSpace(formatCurrencyDisplay(100))).toBe('R$ 100,00');
    });

    it('1000 -> "R$ 1.000,00"', () => {
      expect(normalizeSpace(formatCurrencyDisplay(1000))).toBe('R$ 1.000,00');
    });

    it('10000 -> "R$ 10.000,00"', () => {
      expect(normalizeSpace(formatCurrencyDisplay(10000))).toBe('R$ 10.000,00');
    });

    it('100000 -> "R$ 100.000,00"', () => {
      expect(normalizeSpace(formatCurrencyDisplay(100000))).toBe('R$ 100.000,00');
    });

    it('1000000 -> "R$ 1.000.000,00"', () => {
      expect(normalizeSpace(formatCurrencyDisplay(1000000))).toBe('R$ 1.000.000,00');
    });

    it('10000000 -> "R$ 10.000.000,00"', () => {
      expect(normalizeSpace(formatCurrencyDisplay(10000000))).toBe('R$ 10.000.000,00');
    });

    it('100000000 -> "R$ 100.000.000,00"', () => {
      expect(normalizeSpace(formatCurrencyDisplay(100000000))).toBe('R$ 100.000.000,00');
    });
  });

  describe('Casos especiais', () => {
    it('0 -> "" (vazio)', () => {
      expect(formatCurrencyDisplay(0)).toBe('');
    });
  });
});

  describe('Fluxo completo (parseMonetaryValue -> formatCurrencyDisplay)', () => {
  const normalizeSpace = (str: string) => str.replace(/\u00A0/g, ' ');
  
  describe('Entrada de centavos', () => {
    it('digita "8" -> 0.08 -> "R$ 0,08"', () => {
      const parsed = parseMonetaryValue('8');
      const formatted = formatCurrencyDisplay(parsed);
      expect(normalizeSpace(formatted)).toBe('R$ 0,08');
    });

    it('digita "99" -> 0.99 -> "R$ 0,99"', () => {
      const parsed = parseMonetaryValue('99');
      const formatted = formatCurrencyDisplay(parsed);
      expect(normalizeSpace(formatted)).toBe('R$ 0,99');
    });

    it('digita "888" -> 8.88 -> "R$ 8,88"', () => {
      const parsed = parseMonetaryValue('888');
      const formatted = formatCurrencyDisplay(parsed);
      expect(normalizeSpace(formatted)).toBe('R$ 8,88');
    });
  });

  describe('Entrada com vírgula', () => {
    it('digita "0,10" -> 0.10 -> "R$ 0,10"', () => {
      const parsed = parseMonetaryValue('0,10');
      const formatted = formatCurrencyDisplay(parsed);
      expect(normalizeSpace(formatted)).toBe('R$ 0,10');
    });

    it('digita "10,00" -> 10.00 -> "R$ 10,00"', () => {
      const parsed = parseMonetaryValue('10,00');
      const formatted = formatCurrencyDisplay(parsed);
      expect(normalizeSpace(formatted)).toBe('R$ 10,00');
    });

    it('digita "100,00" -> 100.00 -> "R$ 100,00"', () => {
      const parsed = parseMonetaryValue('100,00');
      const formatted = formatCurrencyDisplay(parsed);
      expect(normalizeSpace(formatted)).toBe('R$ 100,00');
    });

    it('digita "1.000,00" -> 1000.00 -> "R$ 1.000,00"', () => {
      const parsed = parseMonetaryValue('1.000,00');
      const formatted = formatCurrencyDisplay(parsed);
      expect(normalizeSpace(formatted)).toBe('R$ 1.000,00');
    });

    it('digita "1.000.000,00" -> 1000000.00 -> "R$ 1.000.000,00"', () => {
      const parsed = parseMonetaryValue('1.000.000,00');
      const formatted = formatCurrencyDisplay(parsed);
      expect(normalizeSpace(formatted)).toBe('R$ 1.000.000,00');
    });
  });
});
