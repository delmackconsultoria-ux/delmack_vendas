import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatFieldName, formatAction } from "../salesHistoryService";

describe("Sales History Service", () => {
  describe("formatFieldName", () => {
    it("should format known field names correctly", () => {
      expect(formatFieldName("saleValue")).toBe("Valor da Venda");
      expect(formatFieldName("buyerName")).toBe("Nome do Comprador");
      expect(formatFieldName("buyerCpfCnpj")).toBe("CPF/CNPJ do Comprador");
      expect(formatFieldName("status")).toBe("Status");
      expect(formatFieldName("businessType")).toBe("Tipo de Negócio");
    });

    it("should return the original field name for unknown fields", () => {
      expect(formatFieldName("unknownField")).toBe("unknownField");
      expect(formatFieldName("customField")).toBe("customField");
    });
  });

  describe("formatAction", () => {
    it("should format known actions correctly", () => {
      expect(formatAction("create")).toBe("Criação");
      expect(formatAction("update")).toBe("Atualização");
      expect(formatAction("delete")).toBe("Exclusão");
      expect(formatAction("status_change")).toBe("Mudança de Status");
      expect(formatAction("approval")).toBe("Aprovação");
      expect(formatAction("rejection")).toBe("Rejeição");
    });

    it("should return the original action for unknown actions", () => {
      expect(formatAction("unknownAction")).toBe("unknownAction");
    });
  });
});
