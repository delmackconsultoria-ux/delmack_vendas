/**
 * Router tRPC para upload de NF (Nota Fiscal)
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sales } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { eq } from "drizzle-orm";

export const uploadInvoiceRouter = router({
  /**
   * Upload de NF (Nota Fiscal) para S3
   */
  uploadInvoice: protectedProcedure
    .input(
      z.object({
        saleId: z.string(),
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verificar permissões - apenas finance pode fazer upload de NF
        if (ctx.user.role !== "finance") {
          throw new Error("Apenas financeiro pode fazer upload de NF");
        }

        // Verificar se venda existe
        const sale = await db.select().from(sales).where(eq(sales.id, input.saleId)).limit(1);
        if (!sale.length) throw new Error("Venda não encontrada");

        // Converter base64 para buffer
        const buffer = Buffer.from(input.fileData, "base64");

        // Upload para S3
        const key = `invoices/${input.saleId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);

        // Atualizar campo documents da venda com JSON
        const currentDocuments = sale[0].documents ? JSON.parse(sale[0].documents) : {};
        const invoiceDoc = {
          type: "invoice",
          fileName: input.fileName,
          url,
          mimeType: input.mimeType,
          uploadedBy: ctx.user.id,
          uploadedByName: ctx.user.name,
          uploadedAt: new Date().toISOString(),
        };

        // Adicionar ou substituir documento de invoice
        currentDocuments.invoice = invoiceDoc;

        // Salvar no banco
        await db
          .update(sales)
          .set({
            documents: JSON.stringify(currentDocuments),
            updatedAt: new Date(),
          })
          .where(eq(sales.id, input.saleId));

        return {
          success: true,
          message: "NF enviada com sucesso",
          invoice: invoiceDoc,
        };
      } catch (error) {
        console.error("[Upload Invoice Router] Erro ao fazer upload de NF:", error);
        throw new Error(error instanceof Error ? error.message : "Erro ao fazer upload de NF");
      }
    }),

  /**
   * Obter NF de uma venda
   */
  getInvoice: protectedProcedure
    .input(
      z.object({
        saleId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verificar se venda existe
        const sale = await db.select().from(sales).where(eq(sales.id, input.saleId)).limit(1);
        if (!sale.length) throw new Error("Venda não encontrada");

        // Verificar permissões
        if (ctx.user.role === "broker" && ctx.user.id !== sale[0].brokerVendedor) {
          throw new Error("Permissão negada");
        }

        // Obter documento de invoice
        const documents = sale[0].documents ? JSON.parse(sale[0].documents) : {};
        const invoice = documents.invoice || null;

        return {
          success: true,
          invoice,
        };
      } catch (error) {
        console.error("[Upload Invoice Router] Erro ao obter NF:", error);
        throw new Error(error instanceof Error ? error.message : "Erro ao obter NF");
      }
    }),

  /**
   * Deletar NF de uma venda
   */
  deleteInvoice: protectedProcedure
    .input(
      z.object({
        saleId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verificar permissões - apenas finance pode deletar NF
        if (ctx.user.role !== "finance") {
          throw new Error("Apenas financeiro pode deletar NF");
        }

        // Verificar se venda existe
        const sale = await db.select().from(sales).where(eq(sales.id, input.saleId)).limit(1);
        if (!sale.length) throw new Error("Venda não encontrada");

        // Remover documento de invoice
        const currentDocuments = sale[0].documents ? JSON.parse(sale[0].documents) : {};
        delete currentDocuments.invoice;

        // Salvar no banco
        await db
          .update(sales)
          .set({
            documents: JSON.stringify(currentDocuments),
            updatedAt: new Date(),
          })
          .where(eq(sales.id, input.saleId));

        return {
          success: true,
          message: "NF deletada com sucesso",
        };
      } catch (error) {
        console.error("[Upload Invoice Router] Erro ao deletar NF:", error);
        throw new Error(error instanceof Error ? error.message : "Erro ao deletar NF");
      }
    }),
});
