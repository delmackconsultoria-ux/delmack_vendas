import { describe, it, expect } from "vitest";
import { validateCPFOrCNPJ, formatCPF, formatCNPJ, formatPhone, validateCEP, BRAZILIAN_STATES } from "../validators";

describe("Validators", () => {
  describe("validateCPFOrCNPJ", () => {
    it("should validate correct CPF numbers", () => {
      // CPFs válidos (gerados para teste)
      expect(validateCPFOrCNPJ("52998224725")).toBe(true);
      expect(validateCPFOrCNPJ("11144477735")).toBe(true);
    });

    it("should reject invalid CPF numbers", () => {
      expect(validateCPFOrCNPJ("00000000000")).toBe(false);
      expect(validateCPFOrCNPJ("11111111111")).toBe(false);
      expect(validateCPFOrCNPJ("12345678901")).toBe(false);
      expect(validateCPFOrCNPJ("123")).toBe(false);
    });

    it("should validate correct CNPJ numbers", () => {
      // CNPJs válidos (gerados para teste)
      expect(validateCPFOrCNPJ("11222333000181")).toBe(true);
    });

    it("should reject invalid CNPJ numbers", () => {
      expect(validateCPFOrCNPJ("00000000000000")).toBe(false);
      expect(validateCPFOrCNPJ("11111111111111")).toBe(false);
      expect(validateCPFOrCNPJ("12345678901234")).toBe(false);
    });
  });

  describe("formatCPF", () => {
    it("should format CPF correctly", () => {
      expect(formatCPF("52998224725")).toBe("529.982.247-25");
      expect(formatCPF("529")).toBe("529");
      expect(formatCPF("529982")).toBe("529.982");
      expect(formatCPF("52998224")).toBe("529.982.24");
    });

    it("should handle partial CPF input", () => {
      expect(formatCPF("")).toBe("");
      expect(formatCPF("5")).toBe("5");
      expect(formatCPF("52")).toBe("52");
    });
  });

  describe("formatCNPJ", () => {
    it("should format CNPJ correctly", () => {
      expect(formatCNPJ("11222333000181")).toBe("11.222.333/0001-81");
    });

    it("should handle partial CNPJ input", () => {
      expect(formatCNPJ("112223")).toBe("11.222.3");
    });
  });

  describe("formatPhone", () => {
    it("should format phone numbers correctly", () => {
      expect(formatPhone("11999998888")).toBe("(11) 99999-8888");
      expect(formatPhone("1199998888")).toBe("(11) 9999-8888");
    });

    it("should handle partial phone input", () => {
      expect(formatPhone("11")).toBe("(11");
      expect(formatPhone("119")).toBe("(11) 9");
    });
  });

  describe("validateCEP", () => {
    it("should validate correct CEP format", () => {
      expect(validateCEP("01310100")).toBe(true);
      expect(validateCEP("80010000")).toBe(true);
    });

    it("should reject invalid CEP format", () => {
      expect(validateCEP("123")).toBe(false);
      expect(validateCEP("")).toBe(false);
      expect(validateCEP("abcdefgh")).toBe(false);
    });
  });

  describe("BRAZILIAN_STATES", () => {
    it("should have all 27 Brazilian states", () => {
      expect(BRAZILIAN_STATES.length).toBe(27);
    });

    it("should include common states", () => {
      const stateValues = BRAZILIAN_STATES.map(s => s.value);
      expect(stateValues).toContain("SP");
      expect(stateValues).toContain("RJ");
      expect(stateValues).toContain("MG");
      expect(stateValues).toContain("PR");
      expect(stateValues).toContain("RS");
    });
  });
});
