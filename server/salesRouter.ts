/**
 * Router tRPC para gerenciar vendas e comissões
 * Suporta todos os campos do formulário expandido de vendas
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sales, commissions, properties } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { calculateCommission } from "./commissionService";
import { searchPropertyByReference } from "./services/properfyService";
import { storagePut, storageGet } from "./storage";

// Zod schema para validação de entrada
const createSaleSchema = z.object({
  // Property Information
  propertyType: z.enum(["baggio", "external"]),
  propertyReference: z.string().optional(),
  propertyAddress: z.string().min(1, "Endereço é obrigatório"),
  propertyNumber: z.string().optional(),
  propertyComplement: z.string().optional(),
  propertyNeighborhood: z.string().optional(),
  propertyCity: z.string().min(1, "Cidade é obrigatória"),
  propertyState: z.string().min(2).max(2),
  propertyZipCode: z.string().optional(),
  advertisementValue: z.number().optional(),

  // Sale Information
  saleDate: z.string().datetime(),
  angariationDate: z.string().datetime().optional(),
  saleValue: z.number().positive("Valor da venda deve ser positivo"),

  // Client Information
  buyerName: z.string().min(1, "Nome do comprador é obrigatório"),
  buyerCpfCnpj: z.string().optional(),
  clientOrigin: z.string().optional(),
  paymentMethod: z.string().optional(),

  // Commission Information
  storeAngariador: z.string(),
  storeVendedor: z.string(),
  brokerAngariador: z.string(),
  brokerVendedor: z.string(),
  businessType: z.string().min(1, "Tipo de negócio é obrigatório"),
  walletSituation: z.string().optional(),

  // Observations
  observations: z.string().optional(),
});

export const salesRouter = router({
  /**
   * Buscar imóvel no Properfy por referência
   */
  searchProperty: protectedProcedure
    .input(z.object({ reference: z.string().min(1) }))
    .query(async ({ input }) => {
      const result = await searchPropertyByReference(input.reference);
      return result;
    }),

  /**
   * Upload de anexo (proposta de compra)
   */
  uploadProposalDocument: protectedProcedure
    .input(z.object({
      saleId: z.string(),
      fileName: z.string(),
      fileData: z.string(), // Base64
      contentType: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const buffer = Buffer.from(input.fileData, 'base64');
        const key = `proposals/${ctx.user.companyId || '1'}/${input.saleId}/${input.fileName}`;
        
        const { url } = await storagePut(key, buffer, input.contentType);
        
        // Atualizar venda com URL do documento
        const db = await getDb();
        if (db) {
          await db.update(sales)
            .set({ proposalDocumentUrl: url, updatedAt: new Date() })
            .where(eq(sales.id, input.saleId));
        }
        
        return { success: true, url };
      } catch (error) {
        console.error('[Sales Router] Erro ao fazer upload:', error);
        throw new Error('Erro ao fazer upload do documento');
      }
    }),

  /**
   * Obter URL do documento de proposta
   */
  getProposalDocument: protectedProcedure
    .input(z.object({ saleId: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const sale = await db.select().from(sales).where(eq(sales.id, input.saleId)).limit(1);
        if (!sale.length || !sale[0].proposalDocumentUrl) {
          return { success: false, url: null };
        }
        
        // Gerar URL presigned para download
        const key = sale[0].proposalDocumentUrl.split('/').slice(-3).join('/');
        const { url } = await storageGet(key, 3600); // 1 hora
        
        return { success: true, url };
      } catch (error) {
        console.error('[Sales Router] Erro ao obter documento:', error);
        return { success: false, url: null };
      }
    }),

  /**
   * Criar nova venda com todos os campos
   */
  createSale: protectedProcedure
    .input(createSaleSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verificar permissão: apenas corretores e gerentes podem cadastrar vendas
        if (ctx.user.role !== "broker" && ctx.user.role !== "manager") {
          throw new Error("Permissão negada. Apenas corretores e gerentes podem cadastrar vendas.");
        }

        const saleId = uuidv4();
        const propertyId = uuidv4();

        // Calcular comissão baseado no tipo de negócio
        const commissionData = calculateCommission(input.businessType, input.saleValue);

        // Criar ou atualizar propriedade
        const existingProperty = input.propertyReference
          ? await db.select().from(properties).where(eq(properties.propertyReference, input.propertyReference)).limit(1)
          : null;

        let finalPropertyId = propertyId;

        if (existingProperty && existingProperty.length > 0) {
          finalPropertyId = existingProperty[0].id;
        } else {
          // Criar nova propriedade
          await db.insert(properties).values({
            id: propertyId,
            companyId: ctx.user.companyId || "1",
            propertyReference: input.propertyReference || null,
            isFromBaggio: input.propertyType === "baggio",
            address: input.propertyAddress,
            zipCode: input.propertyZipCode || null,
            neighborhood: input.propertyNeighborhood || null,
            city: input.propertyCity,
            state: input.propertyState,
            number: input.propertyNumber || null,
            complement: input.propertyComplement || null,
            advertisementValue: input.advertisementValue
              ? input.advertisementValue.toString()
              : null,
          });
        }

        // Criar venda
        await db.insert(sales).values({
          id: saleId,
          companyId: ctx.user.companyId || "1",
          propertyId: finalPropertyId,
          buyerName: input.buyerName,
          buyerCpfCnpj: input.buyerCpfCnpj || null,
          saleDate: new Date(input.saleDate),
          angariationDate: input.angariationDate ? new Date(input.angariationDate) : null,
          saleValue: input.saleValue.toString(),
          clientOrigin: input.clientOrigin || null,
          paymentMethod: input.paymentMethod || null,
          brokerAngariador: input.brokerAngariador,
          brokerVendedor: input.brokerVendedor,
          businessType: input.businessType,
          status: "pending",
          observation: input.observations || null,
          proposalDocumentUrl: null,
        });

        // Criar comissões automaticamente para angariador e vendedor
        const commissionIds: string[] = [];

        // Comissão do Angariador (se houver valor)
        if (commissionData.angariadorValue > 0) {
          const angariadorCommissionId = uuidv4();
          commissionIds.push(angariadorCommissionId);

          await db.insert(commissions).values({
            id: angariadorCommissionId,
            saleId: saleId,
            companyId: ctx.user.companyId || "1",
            brokerId: input.brokerAngariador,
            commissionValue: commissionData.angariadorValue.toString(),
            commissionPercentage: (commissionData.angariadorPercentage / 100).toString(),
            type: "angariacao",
            status: "pending",
          });
        }

        // Comissão do Vendedor (se houver valor)
        if (commissionData.vendedorValue > 0) {
          const vendedorCommissionId = uuidv4();
          commissionIds.push(vendedorCommissionId);

          await db.insert(commissions).values({
            id: vendedorCommissionId,
            saleId: saleId,
            companyId: ctx.user.companyId || "1",
            brokerId: input.brokerVendedor,
            commissionValue: commissionData.vendedorValue.toString(),
            commissionPercentage: (commissionData.vendedorPercentage / 100).toString(),
            type: "venda",
            status: "pending",
          });
        }

        return {
          success: true,
          saleId: saleId,
          propertyId: finalPropertyId,
          totalCommission: commissionData.totalCommissionValue,
          commissionBreakdown: {
            angariador: commissionData.angariadorValue,
            vendedor: commissionData.vendedorValue,
            total: commissionData.totalCommissionValue,
          },
          commissionIds: commissionIds,
          message: "Venda registrada com sucesso",
        };
      } catch (error) {
        console.error("[Sales Router] Erro ao criar venda:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro ao registrar venda";
        throw new Error(errorMessage);
      }
    }),

  /**
   * Listar vendas do corretor logado
   */
  listMySales: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Corretores veem apenas suas vendas
      // Gerentes veem todas as vendas da empresa
      let query: any = db.select().from(sales);

      if (ctx.user.role === "broker") {
        query = query.where(eq(sales.brokerVendedor, ctx.user.id));
      } else if (ctx.user.role === "manager") {
        query = query.where(eq(sales.companyId, ctx.user.companyId || "1"));
      }

      const result = await query;
      return result;
    } catch (error) {
      console.error("[Sales Router] Erro ao listar vendas:", error);
      throw new Error("Erro ao listar vendas");
    }
  }),

  /**
   * Listar todas as vendas (apenas para gerentes e financeiro)
   */
  listAllSales: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Apenas gerentes e financeiro podem ver todas as vendas
      if (ctx.user.role !== "manager" && ctx.user.role !== "finance") {
        throw new Error("Permissão negada");
      }

      const result: any = await db
        .select()
        .from(sales)
        .where(eq(sales.companyId, ctx.user.companyId || "1"));

      return result;
    } catch (error) {
      console.error("[Sales Router] Erro ao listar todas as vendas:", error);
      throw new Error("Erro ao listar vendas");
    }
  }),

  /**
   * Atualizar status da venda
   */
  updateSaleStatus: protectedProcedure
    .input(
      z.object({
        saleId: z.string(),
        status: z.enum(["pending", "received", "paid", "cancelled"]),
        observation: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Apenas gerentes e financeiro podem atualizar status
        if (ctx.user.role !== "manager" && ctx.user.role !== "finance") {
          throw new Error("Permissão negada");
        }

        // Atualizar venda
        await db
          .update(sales)
          .set({
            status: input.status,
            observation: input.observation || null,
            updatedAt: new Date(),
          })
          .where(eq(sales.id, input.saleId));

        // Atualizar comissões associadas
        if (input.status === "paid") {
          await db
            .update(commissions)
            .set({
              status: "paid",
              paymentDate: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(commissions.saleId, input.saleId));
        }

        return {
          success: true,
          message: "Status da venda atualizado com sucesso",
        };
      } catch (error) {
        console.error("[Sales Router] Erro ao atualizar status:", error);
        throw new Error("Erro ao atualizar status da venda");
      }
    }),

  /**
   * Listar comissões
   */
  listCommissions: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "received", "paid", "cancelled"]).optional(),
        brokerId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        let query: any = db.select().from(commissions);

        // Filtrar por status se fornecido
        if (input.status) {
          query = query.where(eq(commissions.status, input.status));
        }

        // Corretores veem apenas suas comissões
        if (ctx.user.role === "broker") {
          query = query.where(eq(commissions.brokerId, ctx.user.id));
        } else if (ctx.user.role === "manager" || ctx.user.role === "finance") {
          // Gerentes e financeiro veem comissões da empresa
          query = query.where(eq(commissions.companyId, ctx.user.companyId || "1"));
        }

        const result = await query;
        return result;
      } catch (error) {
        console.error("[Sales Router] Erro ao listar comissões:", error);
        throw new Error("Erro ao listar comissões");
      }
    }),

  /**
   * Obter resumo de comissões
   */
  getCommissionSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let query: any = db.select().from(commissions);

      if (ctx.user.role === "broker") {
        query = query.where(eq(commissions.brokerId, ctx.user.id));
      } else if (ctx.user.role === "manager" || ctx.user.role === "finance") {
        query = query.where(eq(commissions.companyId, ctx.user.companyId || "1"));
      }

      const allCommissions = await query;

      // Calcular resumo
      const summary = {
        total: allCommissions.reduce((sum: number, c: any) => sum + parseFloat(c.commissionValue), 0),
        pending: allCommissions
          .filter((c: any) => c.status === "pending")
          .reduce((sum: number, c: any) => sum + parseFloat(c.commissionValue), 0),
        received: allCommissions
          .filter((c: any) => c.status === "received")
          .reduce((sum: number, c: any) => sum + parseFloat(c.commissionValue), 0),
        paid: allCommissions
          .filter((c: any) => c.status === "paid")
          .reduce((sum: number, c: any) => sum + parseFloat(c.commissionValue), 0),
        count: allCommissions.length,
      };

      return summary;
    } catch (error) {
      console.error("[Sales Router] Erro ao obter resumo de comissões:", error);
      throw new Error("Erro ao obter resumo de comissões");
    }
  }),
});

