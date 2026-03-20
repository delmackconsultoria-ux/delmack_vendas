import { describe, it, expect } from 'vitest';

/**
 * Simular o comportamento do react-number-format com máscara de reais
 * Entrada: números digitados sequencialmente
 * Saída: valor formatado como "R$ X.XXX,XX"
 */

function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function parseNumericInput(digits: string): number {
  // Simula o comportamento do react-number-format
  // Cada dígito é adicionado à direita, criando um número inteiro
  // Depois o react-number-format converte para decimal com 2 casas
  const numValue = parseInt(digits, 10) || 0;
  // Divide por 100 para obter o valor em reais (centavos para reais)
  return numValue / 100;
}

describe('React Number Format - Máscara de Reais', () => {
  it('digita 8 → R$ 0,08', () => {
    const value = parseNumericInput('8');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('0,08');
  });

  it('digita 89 → R$ 0,89', () => {
    const value = parseNumericInput('89');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('0,89');
  });

  it('digita 893 → R$ 8,93', () => {
    const value = parseNumericInput('893');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('8,93');
  });

  it('digita 8931 → R$ 89,31', () => {
    const value = parseNumericInput('8931');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('89,31');
  });

  it('digita 89312 → R$ 893,12', () => {
    const value = parseNumericInput('89312');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('893,12');
  });

  it('digita 893121 → R$ 8.931,21', () => {
    const value = parseNumericInput('893121');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('8.931,21');
  });

  it('digita 8931217 → R$ 89.312,17', () => {
    const value = parseNumericInput('8931217');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('89.312,17');
  });

  it('digita 89312171 → R$ 893.121,71', () => {
    const value = parseNumericInput('89312171');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('893.121,71');
  });

  it('digita 893121710 → R$ 8.931.217,10', () => {
    const value = parseNumericInput('893121710');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('8.931.217,10');
  });

  it('digita 8931217106 → R$ 89.312.171,06', () => {
    const value = parseNumericInput('8931217106');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('89.312.171,06');
  });

  it('digita 89312171069 → R$ 893.121.710,69', () => {
    const value = parseNumericInput('89312171069');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('893.121.710,69');
  });

  it('digita 893121710694 → R$ 8.931.217.106,94', () => {
    const value = parseNumericInput('893121710694');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('8.931.217.106,94');
  });

  it('digita 8931217106942 → R$ 89.312.171.069,42', () => {
    const value = parseNumericInput('8931217106942');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('89.312.171.069,42');
  });

  it('digita 89312171069421 → R$ 893.121.710.694,21', () => {
    const value = parseNumericInput('89312171069421');
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('893.121.710.694,21');
  });

  // Testes adicionais com separadores
  it('digita 0,10 (com vírgula) → R$ 0,10', () => {
    // Simula entrada com separador decimal
    const value = 0.10;
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('0,10');
  });

  it('digita 1.234,56 (com ponto e vírgula) → R$ 1.234,56', () => {
    // Simula entrada com separadores de milhares e decimal
    const value = 1234.56;
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('1.234,56');
  });

  it('digita 100,00 → R$ 100,00', () => {
    const value = 100.00;
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('100,00');
  });

  it('digita 1.000,00 → R$ 1.000,00', () => {
    const value = 1000.00;
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('1.000,00');
  });

  it('digita 10.000,00 → R$ 10.000,00', () => {
    const value = 10000.00;
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('10.000,00');
  });

  it('digita 100.000,00 → R$ 100.000,00', () => {
    const value = 100000.00;
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('100.000,00');
  });

  it('digita 1.000.000,00 → R$ 1.000.000,00', () => {
    const value = 1000000.00;
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('1.000.000,00');
  });

  it('digita 10.000.000,00 → R$ 10.000.000,00', () => {
    const value = 10000000.00;
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('10.000.000,00');
  });

  it('digita 100.000.000,00 → R$ 100.000.000,00', () => {
    const value = 100000000.00;
    const formatted = formatCurrencyBRL(value);
    expect(formatted).toContain('100.000.000,00');
  });
});
