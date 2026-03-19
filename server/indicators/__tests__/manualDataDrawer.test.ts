import { describe, it, expect } from "vitest";

/**
 * Função parseMonetaryValue que está em ManualDataDrawer
 */
function parseMonetaryValue(value: string): number {
  if (!value || value.trim() === "") {
    return 0;
  }

  const str = value.trim();

  if (!isNaN(Number(str)) && !str.includes(",")) {
    return Number(str);
  }

  const normalized = str
    .replace(/\./g, "")
    .replace(/,/g, ".");

  const parsed = parseFloat(normalized);
  return !isNaN(parsed) ? parsed : 0;
}

describe("ManualDataDrawer - parseMonetaryValue", () => {
  it("deve converter '0,10' para 0.1", () => {
    expect(parseMonetaryValue("0,10")).toBe(0.1);
  });

  it("deve converter '0,08' para 0.08", () => {
    expect(parseMonetaryValue("0,08")).toBe(0.08);
  });

  it("deve converter '80,00' para 80", () => {
    expect(parseMonetaryValue("80,00")).toBe(80);
  });

  it("deve converter '1.234,56' para 1234.56", () => {
    expect(parseMonetaryValue("1.234,56")).toBe(1234.56);
  });

  it("deve converter '700.000,00' para 700000", () => {
    expect(parseMonetaryValue("700.000,00")).toBe(700000);
  });

  it("deve converter '9.000,00' para 9000", () => {
    expect(parseMonetaryValue("9.000,00")).toBe(9000);
  });

  it("deve converter '8.000,00' para 8000", () => {
    expect(parseMonetaryValue("8.000,00")).toBe(8000);
  });

  it("deve converter '0.10' para 0.1", () => {
    expect(parseMonetaryValue("0.10")).toBe(0.1);
  });

  it("deve converter '10' para 10", () => {
    expect(parseMonetaryValue("10")).toBe(10);
  });

  it("deve retornar 0 para string vazia", () => {
    expect(parseMonetaryValue("")).toBe(0);
  });

  it("NÃO deve multiplicar por 100: 0,10 deve ser 0.1, não 10", () => {
    expect(parseMonetaryValue("0,10")).not.toBe(10);
    expect(parseMonetaryValue("0,10")).toBe(0.1);
  });

  it("NÃO deve multiplicar por 100: 80 deve ser 80, não 8000", () => {
    expect(parseMonetaryValue("80")).not.toBe(8000);
    expect(parseMonetaryValue("80")).toBe(80);
  });

  it("NÃO deve multiplicar por 100: 700.000,00 deve ser 700000, não 70000000", () => {
    expect(parseMonetaryValue("700.000,00")).not.toBe(70000000);
    expect(parseMonetaryValue("700.000,00")).toBe(700000);
  });

  it("Fluxo completo: 0,10 -> 0.1 (sem multiplicação por 100)", () => {
    const userInput = "0,10";
    const parsed = parseMonetaryValue(userInput);
    expect(parsed).toBe(0.1);
    expect(parsed).not.toBe(10);
  });

  it("Fluxo completo: 80 -> 80 (sem multiplicação por 100)", () => {
    const userInput = "80";
    const parsed = parseMonetaryValue(userInput);
    expect(parsed).toBe(80);
    expect(parsed).not.toBe(8000);
  });

  it("Fluxo completo: 700.000,00 -> 700000 (sem multiplicação por 100)", () => {
    const userInput = "700.000,00";
    const parsed = parseMonetaryValue(userInput);
    expect(parsed).toBe(700000);
    expect(parsed).not.toBe(70000000);
  });

  it("Caso de uso real: 0,80 deve ser 0.8", () => {
    expect(parseMonetaryValue("0,80")).toBe(0.8);
  });

  it("Caso de uso real: 100,00 deve ser 100", () => {
    expect(parseMonetaryValue("100,00")).toBe(100);
  });
});
