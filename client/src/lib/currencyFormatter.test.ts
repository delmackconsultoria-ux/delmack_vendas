import { describe, it, expect } from 'vitest';
import { formatWhileTyping, parseCurrencyInput, formatArea, parseAreaInput } from './currencyFormatter';

describe('Currency Formatter', () => {
  describe('formatWhileTyping - Formatação de Moeda', () => {
    it('deve formatar número simples com pontos de milhar', () => {
      expect(formatWhileTyping('1234')).toBe('1.234');
    });

    it('deve formatar número com vírgula decimal', () => {
      expect(formatWhileTyping('1234,56')).toBe('1.234,56');
    });

    it('deve formatar número grande com múltiplos pontos de milhar', () => {
      expect(formatWhileTyping('1234567,89')).toBe('1.234.567,89');
    });

    it('deve remover caracteres inválidos', () => {
      expect(formatWhileTyping('R$ 1.234,56')).toBe('1.234,56');
    });

    it('deve limitar decimal a 2 dígitos', () => {
      expect(formatWhileTyping('1234,567')).toBe('1.234,56');
    });

    it('deve retornar vazio para entrada vazia', () => {
      expect(formatWhileTyping('')).toBe('');
    });

    it('deve formatar número como tipo number', () => {
      expect(formatWhileTyping(1234.56)).toBe('1.234,56');
    });

    it('deve formatar 54545432 como 54.545.432', () => {
      expect(formatWhileTyping('54545432')).toBe('54.545.432');
    });

    it('deve formatar 54545432,43 como 54.545.432,43', () => {
      expect(formatWhileTyping('54545432,43')).toBe('54.545.432,43');
    });
  });

  describe('parseCurrencyInput - Parse de Moeda', () => {
    it('deve converter formatado para número', () => {
      expect(parseCurrencyInput('1.234,56')).toBe(1234.56);
    });

    it('deve converter sem formatação para número', () => {
      expect(parseCurrencyInput('1234,56')).toBe(1234.56);
    });

    it('deve retornar 0 para entrada vazia', () => {
      expect(parseCurrencyInput('')).toBe(0);
    });

    it('deve converter valor grande', () => {
      expect(parseCurrencyInput('1.234.567,89')).toBe(1234567.89);
    });

    it('deve remover caracteres inválidos', () => {
      expect(parseCurrencyInput('R$ 1.234,56')).toBe(1234.56);
    });
  });

  describe('formatArea - Formatação de Área', () => {
    it('deve formatar número simples com vírgula decimal', () => {
      expect(formatArea('12050')).toBe('120,50');
    });

    it('deve formatar número com vírgula decimal já presente', () => {
      expect(formatArea('120,50')).toBe('120,50');
    });

    it('deve formatar 5370 como 53,70', () => {
      expect(formatArea('5370')).toBe('53,70');
    });

    it('deve remover pontos de milhar (não deve ter em área)', () => {
      expect(formatArea('1.234,56')).toBe('1234,56');
    });

    it('deve remover caracteres inválidos', () => {
      expect(formatArea('120,50m²')).toBe('120,50');
    });

    it('deve limitar decimal a 2 dígitos', () => {
      expect(formatArea('120,567')).toBe('120,56');
    });

    it('deve retornar vazio para entrada vazia', () => {
      expect(formatArea('')).toBe('');
    });

    it('deve formatar número como tipo number', () => {
      expect(formatArea(120.50)).toBe('120,50');
    });

    it('deve não adicionar pontos de milhar em 12050', () => {
      expect(formatArea('12050')).toBe('120,50');
      expect(formatArea('12050')).not.toContain('.');
    });
  });

  describe('parseAreaInput - Parse de Área', () => {
    it('deve converter formatado para número', () => {
      expect(parseAreaInput('120,50')).toBe(120.50);
    });

    it('deve converter sem formatação para número', () => {
      expect(parseAreaInput('12050')).toBe(12050);
    });

    it('deve retornar 0 para entrada vazia', () => {
      expect(parseAreaInput('')).toBe(0);
    });

    it('deve remover caracteres inválidos', () => {
      expect(parseAreaInput('120,50m²')).toBe(120.50);
    });

    it('deve converter 5370 para 53,70', () => {
      expect(parseAreaInput('53,70')).toBe(53.70);
    });
  });

  describe('Casos de Uso Reais', () => {
    it('Moeda: Valor da Venda 54545432,43', () => {
      const input = '54545432,43';
      const formatted = formatWhileTyping(input);
      const parsed = parseCurrencyInput(formatted);
      expect(formatted).toBe('54.545.432,43');
      expect(parsed).toBe(54545432.43);
    });

    it('Área: Área Privativa 5370', () => {
      const input = '5370';
      const formatted = formatArea(input);
      const parsed = parseAreaInput(formatted);
      expect(formatted).toBe('53,70');
      expect(parsed).toBe(53.70);
    });

    it('Área: Área Total 15000', () => {
      const input = '15000';
      const formatted = formatArea(input);
      const parsed = parseAreaInput(formatted);
      expect(formatted).toBe('150,00');
      expect(parsed).toBe(150.00);
    });

    it('Moeda: Custo por m² 1500,00', () => {
      const input = '1500,00';
      const formatted = formatWhileTyping(input);
      const parsed = parseCurrencyInput(formatted);
      expect(formatted).toBe('1.500,00');
      expect(parsed).toBe(1500.00);
    });
  });
});
