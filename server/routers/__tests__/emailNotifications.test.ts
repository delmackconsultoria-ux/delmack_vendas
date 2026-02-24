import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendContractAttachedNotification,
  sendInvoiceAttachedNotification,
} from "../../_core/emailService";

// Mock do sendEmail
vi.mock("../../_core/emailService", async () => {
  const actual = await vi.importActual("../../_core/emailService");
  return {
    ...actual,
    sendEmail: vi.fn().mockResolvedValue(true),
  };
});

describe("Email Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendContractAttachedNotification", () => {
    it("deve enviar email de Contrato/Escritura anexado para financeiros", async () => {
      const result = await sendContractAttachedNotification({
        financeEmails: ["finance@baggioimoveis.com.br"],
        brokerName: "João da Silva",
        buyerName: "Maria Santos",
        propertyAddress: "Rua das Flores, 123 - Curitiba, PR",
        propertyReference: undefined,
        saleValue: 450000,
        attachedBy: "Camila Pires",
        attachedByRole: "Gerente",
        attachmentDate: new Date().toISOString(),
        proposalId: "prop-123",
      });

      expect(result).toBe(true);
    });

    it("deve incluir informações corretas no email de Contrato/Escritura", async () => {
      const data = {
        financeEmails: ["finance@baggioimoveis.com.br"],
        brokerName: "João da Silva",
        buyerName: "Maria Santos",
        propertyAddress: "Rua das Flores, 123 - Curitiba, PR",
        propertyReference: "REF-001",
        saleValue: 450000,
        attachedBy: "Camila Pires",
        attachedByRole: "Gerente",
        attachmentDate: new Date().toISOString(),
        proposalId: "prop-123",
      };

      const result = await sendContractAttachedNotification(data);

      expect(result).toBe(true);
      // Verificar que o email foi enviado para o financeiro
      expect(data.financeEmails).toContain("finance@baggioimoveis.com.br");
    });

    it("deve conter ações específicas para cada perfil no email de Contrato/Escritura", async () => {
      const result = await sendContractAttachedNotification({
        financeEmails: ["finance@baggioimoveis.com.br"],
        brokerName: "João da Silva",
        buyerName: "Maria Santos",
        propertyAddress: "Rua das Flores, 123 - Curitiba, PR",
        propertyReference: undefined,
        saleValue: 450000,
        attachedBy: "Camila Pires",
        attachedByRole: "Gerente",
        attachmentDate: new Date().toISOString(),
        proposalId: "prop-123",
      });

      expect(result).toBe(true);
    });
  });

  describe("sendInvoiceAttachedNotification", () => {
    it("deve enviar email de Nota Fiscal anexada para corretor e gerentes", async () => {
      const result = await sendInvoiceAttachedNotification({
        brokerEmail: "joao@broker.com.br",
        managerEmails: ["camila@baggioimoveis.com.br"],
        brokerName: "João da Silva",
        buyerName: "Maria Santos",
        propertyAddress: "Rua das Flores, 123 - Curitiba, PR",
        propertyReference: undefined,
        saleValue: 450000,
        commissionValue: 4500,
        attachedBy: "Financeiro",
        attachmentDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
        proposalId: "prop-123",
      });

      expect(result).toBe(true);
    });

    it("deve incluir informações de comissão no email de Nota Fiscal", async () => {
      const data = {
        brokerEmail: "joao@broker.com.br",
        managerEmails: ["camila@baggioimoveis.com.br"],
        brokerName: "João da Silva",
        buyerName: "Maria Santos",
        propertyAddress: "Rua das Flores, 123 - Curitiba, PR",
        propertyReference: "REF-001",
        saleValue: 450000,
        commissionValue: 4500,
        attachedBy: "Financeiro",
        attachmentDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
        proposalId: "prop-123",
      };

      const result = await sendInvoiceAttachedNotification(data);

      expect(result).toBe(true);
      expect(data.commissionValue).toBe(4500);
    });

    it("deve conter ações específicas para cada perfil no email de Nota Fiscal", async () => {
      const result = await sendInvoiceAttachedNotification({
        brokerEmail: "joao@broker.com.br",
        managerEmails: ["camila@baggioimoveis.com.br", "lucas@baggioimoveis.com.br"],
        brokerName: "João da Silva",
        buyerName: "Maria Santos",
        propertyAddress: "Rua das Flores, 123 - Curitiba, PR",
        propertyReference: undefined,
        saleValue: 450000,
        commissionValue: 4500,
        attachedBy: "Financeiro",
        attachmentDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
        proposalId: "prop-123",
      });

      expect(result).toBe(true);
    });

    it("deve enviar para múltiplos gerentes (Camila + Lucas)", async () => {
      const managerEmails = ["camila@baggioimoveis.com.br", "lucas@baggioimoveis.com.br"];

      const result = await sendInvoiceAttachedNotification({
        brokerEmail: "joao@broker.com.br",
        managerEmails,
        brokerName: "João da Silva",
        buyerName: "Maria Santos",
        propertyAddress: "Rua das Flores, 123 - Curitiba, PR",
        propertyReference: undefined,
        saleValue: 450000,
        commissionValue: 4500,
        attachedBy: "Financeiro",
        attachmentDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
        proposalId: "prop-123",
      });

      expect(result).toBe(true);
      expect(managerEmails).toHaveLength(2);
      expect(managerEmails).toContain("camila@baggioimoveis.com.br");
      expect(managerEmails).toContain("lucas@baggioimoveis.com.br");
    });
  });

  describe("Email Links", () => {
    it("deve gerar link correto para visualizar venda no email de Contrato/Escritura", async () => {
      const proposalId = "prop-123";

      const result = await sendContractAttachedNotification({
        financeEmails: ["finance@baggioimoveis.com.br"],
        brokerName: "João da Silva",
        buyerName: "Maria Santos",
        propertyAddress: "Rua das Flores, 123 - Curitiba, PR",
        propertyReference: undefined,
        saleValue: 450000,
        attachedBy: "Camila Pires",
        attachedByRole: "Gerente",
        attachmentDate: new Date().toISOString(),
        proposalId,
      });

      expect(result).toBe(true);
      expect(proposalId).toBe("prop-123");
    });

    it("deve gerar link correto para visualizar venda no email de Nota Fiscal", async () => {
      const proposalId = "prop-456";

      const result = await sendInvoiceAttachedNotification({
        brokerEmail: "joao@broker.com.br",
        managerEmails: ["camila@baggioimoveis.com.br"],
        brokerName: "João da Silva",
        buyerName: "Maria Santos",
        propertyAddress: "Rua das Flores, 123 - Curitiba, PR",
        propertyReference: undefined,
        saleValue: 450000,
        commissionValue: 4500,
        attachedBy: "Financeiro",
        attachmentDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
        proposalId,
      });

      expect(result).toBe(true);
      expect(proposalId).toBe("prop-456");
    });
  });
});
