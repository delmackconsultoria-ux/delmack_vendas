/**
 * Router tRPC para gerenciar vendas e comissões
 * Suporta todos os campos do formulário expandido de vendas
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sales, commissions, properties, companies, users } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { calculateCommission } from "./commissionService";
import { searchPropertyByReference, searchPropertyByCEP, searchPropertyByAddress, smartSearch } from "./services/properfyService";
import { storagePut, storageGet } from "./storage";
import { logSaleCreation, getSaleHistory } from "./salesHistoryService";

// Zod schema para validação de entrada
const createSaleSchema = z.object({
  // Property Information
  propertyType: z.enum(["baggio", "external"]),
  propertyReference: z.string().optional(),
  propertyAddress: z.string().optional(),
  propertyNumber: z.string().optional(),
  propertyComplement: z.string().optional(),
  propertyNeighborhood: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyState: z.string().max(2).optional(),
  propertyZipCode: z.string().optional(),
  advertisementValue: z.number().optional(),
  condominiumName: z.string().optional(),
  
  // Property Details
  typeOfProperty: z.string().optional(),
  bedrooms: z.number().optional(),
  costPerM2: z.number().optional(),
  privateArea: z.number().optional(),
  totalArea: z.number().optional(),
  propertyAge: z.number().optional(),

  // Sale Information
  saleDate: z.string().datetime(),
  angariationDate: z.string().datetime().optional(),
  saleValue: z.number().optional(),
  expectedPaymentDate: z.string().datetime().optional(),

  // Buyer Information
  buyerName: z.string().optional(),
  buyerCpfCnpj: z.string().optional(),
  buyerPhone: z.string().optional(),
  clientOrigin: z.string().optional(),
  paymentMethod: z.string().optional(),
  financedValue: z.number().optional(),

  // Seller Information
  sellerName: z.string().optional(),
  sellerCpfCnpj: z.string().optional(),
  sellerPhone: z.string().optional(),

  // Additional Info
  cartoryBank: z.string().optional(),
  despachante: z.string().optional(),
  investmentType: z.string().optional(),

  // Commission Information
  brokerAngariadorType: z.enum(["internal", "external"]).optional(),
  brokerAngariador: z.string().optional(),
  brokerAngariadorName: z.string().optional(),
  brokerAngariadorCreci: z.string().optional(),
  brokerAngariadorEmail: z.string().optional(),
  brokerVendedorType: z.enum(["internal", "external"]).optional(),
  brokerVendedor: z.string().optional(),
  brokerVendedorName: z.string().optional(),
  brokerVendedorCreci: z.string().optional(),
  brokerVendedorEmail: z.string().optional(),
  businessType: z.string().min(1, "Tipo de negócio é obrigatório"),
  
  // Commissions
  totalCommission: z.number().optional(),
  totalCommissionPercent: z.number().optional(),
  angariadorCommission: z.number().optional(),
  vendedorCommission: z.number().optional(),
  realEstateCommission: z.number().optional(),
  baggioCommission: z.number().optional(),
  
  // Status
  status: z.enum(["draft", "pending", "sale", "manager_review", "finance_review", "commission_paid", "cancelled"]).optional(),

  // Observations
  observations: z.string().optional(),
});

export const salesRouter = router({
  /**
   * Busca inteligente de imóvel no Properfy (referência, endereço ou CEP)
   */
  searchProperty: protectedProcedure
    .input(z.object({ 
      reference: z.string().min(1),
      searchType: z.enum(['auto', 'reference', 'address', 'cep']).optional()
    }))
    .query(async ({ input }) => {
      // Se tipo específico foi solicitado, usar busca específica
      if (input.searchType === 'cep') {
        return await searchPropertyByCEP(input.reference);
      }
      if (input.searchType === 'address') {
        return await searchPropertyByAddress(input.reference);
      }
      if (input.searchType === 'reference') {
        return await searchPropertyByReference(input.reference);
      }
      // Busca inteligente automática
      return await smartSearch(input.reference);
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
        const commissionData = calculateCommission(input.businessType, input.saleValue || 0);

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
            address: input.propertyAddress || '',
            zipCode: input.propertyZipCode || null,
            neighborhood: input.propertyNeighborhood || null,
            city: input.propertyCity || '',
            state: input.propertyState || '',
            number: input.propertyNumber || null,
            complement: input.propertyComplement || null,
            advertisementValue: input.advertisementValue
              ? input.advertisementValue.toString()
              : null,
          });
        }

        // Criar venda com todos os campos
        await db.insert(sales).values({
          id: saleId,
          companyId: ctx.user.companyId || "1",
          propertyId: finalPropertyId,
          buyerName: input.buyerName || '',
          buyerCpfCnpj: input.buyerCpfCnpj || null,
          buyerPhone: input.buyerPhone || null,
          saleDate: new Date(input.saleDate),
          angariationDate: input.angariationDate ? new Date(input.angariationDate) : null,
          saleValue: (input.saleValue || 0).toString(),
          clientOrigin: input.clientOrigin || null,
          paymentMethod: input.paymentMethod || null,
          brokerAngariador: input.brokerAngariador,
          brokerVendedor: input.brokerVendedor || ctx.user.id,
          businessType: input.businessType,
          status: input.status || "pending",
          observation: input.observations || null,
          proposalDocumentUrl: null,
          // Novos campos do documento Word
          condominiumName: input.condominiumName || null,
          advertisementValue: input.advertisementValue?.toString() || null,
          totalCommission: input.totalCommission?.toString() || commissionData.totalCommissionValue.toString(),
          totalCommissionPercent: input.totalCommissionPercent?.toString() || (commissionData.totalCommissionPercentage * 100).toString(),
          angariadorCommission: input.angariadorCommission?.toString() || commissionData.angariadorValue.toString(),
          vendedorCommission: input.vendedorCommission?.toString() || commissionData.vendedorValue.toString(),
          baggioCommission: input.baggioCommission?.toString() || null,
          expectedPaymentDate: input.expectedPaymentDate ? new Date(input.expectedPaymentDate) : null,
          brokerAngariadorType: input.brokerAngariadorType || null,
          brokerAngariadorName: input.brokerAngariadorName || null,
          brokerAngariadorCreci: input.brokerAngariadorCreci || null,
          brokerAngariadorEmail: input.brokerAngariadorEmail || null,
          brokerVendedorType: input.brokerVendedorType || null,
          brokerVendedorName: input.brokerVendedorName || null,
          brokerVendedorCreci: input.brokerVendedorCreci || null,
          brokerVendedorEmail: input.brokerVendedorEmail || null,
          realEstateCommission: input.realEstateCommission?.toString() || null,
          // Campos adicionais
          propertyType: input.typeOfProperty || null,
          bedrooms: input.bedrooms || null,
          costPerM2: input.costPerM2?.toString() || null,
          privateArea: input.privateArea?.toString() || null,
          totalArea: input.totalArea?.toString() || null,
          propertyAge: input.propertyAge || null,
          financedValue: input.financedValue?.toString() || null,
          sellerName: input.sellerName || null,
          sellerCpfCnpj: input.sellerCpfCnpj || null,
          sellerPhone: input.sellerPhone || null,
          cartoryBank: input.cartoryBank || null,
          despachante: input.despachante || null,
          investmentType: input.investmentType || null,
        });

        // Criar comissões automaticamente para angariador e vendedor
        const commissionIds: string[] = [];

        // Comissão do Angariador (se houver valor e corretor interno)
        if (commissionData.angariadorValue > 0 && input.brokerAngariador && input.brokerAngariadorType === "internal") {
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

        // Comissão do Vendedor (se houver valor e corretor interno)
        if (commissionData.vendedorValue > 0 && input.brokerVendedor && input.brokerVendedorType === "internal") {
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

        // Registrar no histórico de auditoria
        await logSaleCreation(
          saleId,
          ctx.user.companyId || "1",
          ctx.user.id,
          ctx.user.name || "Usuário",
          {
            buyerName: input.buyerName,
            sellerName: input.sellerName,
            saleValue: input.saleValue,
            businessType: input.businessType,
            propertyAddress: input.propertyAddress,
          }
        );

        // Enviar notificação por email
        try {
          const [company] = await db.select().from(companies).where(eq(companies.id, ctx.user.companyId || "1")).limit(1);
          const notificationContent = `
**Nova Proposta Registrada**

**Comprador:** ${input.buyerName}
**Vendedor:** ${input.sellerName || 'N/A'}
**Endereço:** ${input.propertyAddress}, ${input.propertyCity}/${input.propertyState}
**Valor da Venda:** R$ ${(input.saleValue || 0).toLocaleString('pt-BR')}
**Tipo de Negócio:** ${input.businessType}
**Comissão Total:** R$ ${commissionData.totalCommissionValue.toLocaleString('pt-BR')}
**Registrado por:** ${ctx.user.name || 'Usuário'}
**Data:** ${new Date().toLocaleDateString('pt-BR')}
          `.trim();
          
          await notifyOwner({ title: `Nova Proposta - ${input.buyerName}`, content: notificationContent });
          
          // Se a empresa tiver email de notificação configurado, enviar também
          if (company?.notificationEmail) {
            await notifyOwner({ title: `Nova Proposta - ${input.buyerName}`, content: notificationContent });
          }
        } catch (notifyError) {
          console.error("[Sales Router] Erro ao enviar notificação:", notifyError);
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
  getSaleById: protectedProcedure
    .input(z.object({ saleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(sales).where(and(eq(sales.id, input.saleId), eq(sales.companyId, ctx.user.companyId || "1"))).limit(1);
      if (!result.length) return null;
      const sale = result[0];
      const prop = await db.select().from(properties).where(eq(properties.id, sale.propertyId || "")).limit(1);
      return { ...sale, property: prop[0] || null };
    }),

  updateSale: protectedProcedure
    .input(z.object({
      saleId: z.string(),
      buyerName: z.string().optional(),
      buyerCpfCnpj: z.string().optional(),
      buyerPhone: z.string().optional(),
      sellerName: z.string().optional(),
      sellerCpfCnpj: z.string().optional(),
      sellerPhone: z.string().optional(),
      saleValue: z.string().optional(),
      saleDate: z.date().optional(),
      businessType: z.string().optional(),
      observation: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const sale = await db.select().from(sales).where(eq(sales.id, input.saleId)).limit(1);
      if (!sale.length) throw new Error("Venda não encontrada");
      
      // Apenas rascunhos podem ser editados por corretor
      if (ctx.user.role === "broker" && sale[0].status !== "draft") {
        throw new Error("Apenas rascunhos podem ser editados");
      }
      
      const { saleId, ...updateData } = input;
      await db.update(sales).set({ ...updateData, updatedAt: new Date() }).where(eq(sales.id, saleId));
      
      return { success: true, message: "Proposta atualizada" };
    }),

  listMySales: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const companyId = ctx.user.companyId;
      if (!companyId) {
        // Retornar array vazio se usuário não tem empresa - sem erro na UI
        return { sales: [] };
      }

      // SEMPRE filtrar por companyId primeiro para isolamento de dados
      // Corretores veem apenas suas vendas da empresa
      // Gerentes/Financeiro/Viewer veem todas as vendas da empresa
      let result;

      if (ctx.user.role === "broker") {
        // Corretor vê vendas onde é vendedor OU angariador OU criador (brokerVendedor vazio)
        const allSales = await db.select().from(sales).where(eq(sales.companyId, companyId));
        result = allSales.filter(s => 
          s.brokerVendedor === ctx.user.id || 
          s.brokerAngariador === ctx.user.id ||
          (!s.brokerVendedor && s.status === 'draft')
        );
      } else {
        // manager, finance, viewer, admin - veem todas as vendas da empresa
        result = await db.select().from(sales)
          .where(eq(sales.companyId, companyId));
      }

      return { sales: result };
    } catch (error) {
      console.error("[Sales Router] Erro ao listar vendas:", error);
      return { sales: [] }; // Retornar array vazio em caso de erro
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
        return []; // Retornar array vazio sem erro na UI
      }

      const result: any = await db
        .select()
        .from(sales)
        .where(eq(sales.companyId, ctx.user.companyId || "1"));

      return result;
    } catch (error) {
      console.error("[Sales Router] Erro ao listar todas as vendas:", error);
      return []; // Retornar array vazio em caso de erro
    }
  }),

  /**
   * Atualizar status da venda
   */
  updateSaleStatus: protectedProcedure
    .input(
      z.object({
        saleId: z.string(),
        status: z.enum(["draft", "pending", "sale", "manager_review", "finance_review", "commission_paid", "cancelled"]),
        observation: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verificar permissões por role e status
        const currentSale = await db.select().from(sales).where(eq(sales.id, input.saleId)).limit(1);
        if (!currentSale.length) throw new Error("Venda não encontrada");
        
        const currentStatus = currentSale[0].status;
        
        // Corretor pode: draft/pending->sale, draft/pending/sale->cancelled
        if (ctx.user.role === "broker") {
          const allowed = (["draft", "pending"].includes(currentStatus || "") && ["sale", "cancelled"].includes(input.status)) ||
                          (currentStatus === "sale" && input.status === "cancelled");
          if (!allowed) throw new Error("Permissão negada");
        }
        // Gerente pode: draft/pending->sale, sale->manager_review, manager_review->finance_review, *->cancelled
        else if (ctx.user.role === "manager") {
          const allowed = (["draft", "pending"].includes(currentStatus || "") && ["sale", "cancelled"].includes(input.status)) ||
                          (currentStatus === "sale" && ["manager_review", "cancelled"].includes(input.status)) ||
                          (currentStatus === "manager_review" && ["finance_review", "cancelled"].includes(input.status)) ||
                          input.status === "cancelled";
          if (!allowed) throw new Error("Permissão negada");
        }
        // Financeiro pode: finance_review->commission_paid, finance_review->cancelled
        else if (ctx.user.role === "finance") {
          const allowed = currentStatus === "finance_review" && ["commission_paid", "cancelled"].includes(input.status);
          if (!allowed) throw new Error("Permissão negada");
        } else {
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
        if (input.status === "commission_paid") {
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
        } else if (ctx.user.role === "manager" || ctx.user.role === "finance" || ctx.user.role === "viewer") {
          // Gerentes, financeiro e viewer veem comissões da empresa
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
   * Obter histórico de alterações de uma venda (auditoria)
   */
  getSaleHistory: protectedProcedure
    .input(z.object({ saleId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // Gerentes, financeiro, admin e viewer podem ver histórico
        if (ctx.user.role !== "manager" && ctx.user.role !== "finance" && ctx.user.role !== "admin" && ctx.user.role !== "viewer") {
          throw new Error("Permissão negada para visualizar histórico");
        }

        const history = await getSaleHistory(input.saleId);
        return history;
      } catch (error) {
        console.error("[Sales Router] Erro ao obter histórico:", error);
        throw new Error("Erro ao obter histórico da venda");
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
      } else if (ctx.user.role === "manager" || ctx.user.role === "finance" || ctx.user.role === "viewer") {
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

