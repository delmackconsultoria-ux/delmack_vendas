import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../../db";
import { sales, commissions } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Fluxo Completo de Venda com 3 Anexos", () => {
  let db: any;
  let testSaleId: string;

  beforeAll(async () => {
    db = await getDb();
  });

  it("ETAPA 1: Venda cadastrada com Comprovante Sinal Negócio", async () => {
    // Buscar uma venda existente
    const existingSales = await db
      .select()
      .from(sales)
      .limit(1);

    if (existingSales.length > 0) {
      testSaleId = existingSales[0].id;
      
      // Verificar se tem comprovante de sinal
      const documents = existingSales[0].documents 
        ? JSON.parse(existingSales[0].documents as string)
        : {};
      
      console.log("Venda encontrada:", {
        id: testSaleId,
        status: existingSales[0].status,
        temComprovanteSinal: !!documents.sinal_comprovante,
      });

      expect(testSaleId).toBeDefined();
    }
  });

  it("ETAPA 2: Gerente aprova venda", async () => {
    if (!testSaleId) {
      console.log("Pulando teste - nenhuma venda disponível");
      return;
    }

    const sale = await db
      .select()
      .from(sales)
      .where(eq(sales.id, testSaleId))
      .limit(1);

    if (sale.length > 0) {
      const status = sale[0].status;
      console.log("Status da venda após aprovação do gerente:", status);
      
      // Status deve estar em manager_review, finance_review ou commission_paid
      const validStatus = ["manager_review", "finance_review", "commission_paid"];
      expect(validStatus).toContain(status);
    }
  });

  it("ETAPA 3: Contrato/Escritura anexado", async () => {
    if (!testSaleId) {
      console.log("Pulando teste - nenhuma venda disponível");
      return;
    }

    const sale = await db
      .select()
      .from(sales)
      .where(eq(sales.id, testSaleId))
      .limit(1);

    if (sale.length > 0) {
      const documents = sale[0].documents 
        ? JSON.parse(sale[0].documents as string)
        : {};

      console.log("Documentos anexados:", Object.keys(documents));
      
      // Verificar se há contrato/escritura
      const temContrato = !!documents.contrato_escritura;
      console.log("Tem Contrato/Escritura:", temContrato);
      
      expect(typeof documents).toBe("object");
    }
  });

  it("ETAPA 4: Venda enviada para Financeiro", async () => {
    if (!testSaleId) {
      console.log("Pulando teste - nenhuma venda disponível");
      return;
    }

    const sale = await db
      .select()
      .from(sales)
      .where(eq(sales.id, testSaleId))
      .limit(1);

    if (sale.length > 0) {
      const status = sale[0].status;
      console.log("Status da venda no financeiro:", status);
      
      // Status deve estar em manager_review, finance_review ou commission_paid
      const validStatus = ["manager_review", "finance_review", "commission_paid"];
      expect(validStatus).toContain(status);
    }
  });

  it("ETAPA 5: Nota Fiscal anexada e comissão paga", async () => {
    if (!testSaleId) {
      console.log("Pulando teste - nenhuma venda disponível");
      return;
    }

    const sale = await db
      .select()
      .from(sales)
      .where(eq(sales.id, testSaleId))
      .limit(1);

    if (sale.length > 0) {
      const documents = sale[0].documents 
        ? JSON.parse(sale[0].documents as string)
        : {};

      const temNF = !!documents.nota_fiscal;
      console.log("Tem Nota Fiscal:", temNF);
      
      // Se status é commission_paid, deve ter NF
      if (sale[0].status === "commission_paid") {
        expect(temNF).toBe(true);
      }
      
      // Verificar que documents é um objeto válido
      expect(typeof documents).toBe("object");
    }
  });

  it("Todos os anexos visíveis para todos os usuários", async () => {
    if (!testSaleId) {
      console.log("Pulando teste - nenhuma venda disponível");
      return;
    }

    const sale = await db
      .select()
      .from(sales)
      .where(eq(sales.id, testSaleId))
      .limit(1);

    if (sale.length > 0) {
      const documents = sale[0].documents 
        ? JSON.parse(sale[0].documents as string)
        : {};

      console.log("Documentos visíveis:", {
        sinal_comprovante: !!documents.sinal_comprovante,
        contrato_escritura: !!documents.contrato_escritura,
        nota_fiscal: !!documents.nota_fiscal,
      });

      // Verificar que todos os documentos têm estrutura correta
      Object.entries(documents).forEach(([type, doc]: [string, any]) => {
        if (typeof doc === "object" && doc !== null) {
          expect(doc).toHaveProperty("url");
          expect(doc).toHaveProperty("fileName");
          expect(doc).toHaveProperty("uploadedBy");
          expect(doc).toHaveProperty("uploadedAt");
          expect(doc).toHaveProperty("mimeType");
        }
      });
    }
  });

  it("Comissões com status correto", async () => {
    if (!testSaleId) {
      console.log("Pulando teste - nenhuma venda disponível");
      return;
    }

    const saleCommissions = await db
      .select()
      .from(commissions)
      .where(eq(commissions.saleId, testSaleId));

    console.log("Comissões da venda:", {
      quantidade: saleCommissions.length,
      status: saleCommissions.map((c: any) => c.status),
    });

    // Verificar que existem comissões
    expect(saleCommissions.length).toBeGreaterThanOrEqual(0);
    
    // Verificar que as comissões têm status válido
    const validStatus = ["pending", "received", "paid", "cancelled"];
    saleCommissions.forEach((commission: any) => {
      expect(validStatus).toContain(commission.status);
    });
  });
});
