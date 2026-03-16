/**
 * Router tRPC para gerenciar vendas e comissões
 * Suporta todos os campos do formulário expandido de vendas
 */

console.log('[salesRouter] Módulo carregado! Versão:', new Date().toISOString());

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sales, commissions, properties, companies, users, type InsertSale } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { calculateCommission } from "./commissionService";
import { searchPropertyByReference, searchPropertyByCEP, searchPropertyByAddress, smartSearch, ProperfySearchResult } from "./services/properfyService";
import { storagePut, storageGet } from "./storage";
import { logSaleCreation, getSaleHistory, logSaleUpdate } from "./salesHistoryService";

import { sendNewSaleNotification, sendSaleApprovedNotification, sendSaleRejectedNotification, sendCommissionPaidNotification } from "./_core/emailService";

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
  saleType: z.enum(["lancamento", "pronto"]).optional(),
  responsible: z.string().optional(),
  invoiceNumber: z.string().optional(),

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
  
  // New Fields (Excel Migration)
  listingStore: z.string().optional(), // Loja Angariadora
  sellingStore: z.string().optional(), // Loja Vendedora
  team: z.string().optional(), // Equipe
  region: z.string().optional(), // Região
  deedStatus: z.string().optional(), // Status de Escrituração
  managementResponsible: z.string().optional(), // Gestão/Responsável
  bankName: z.string().optional(), // Banco
  financedAmount: z.number().optional(), // Valor Financiado
  bankReturnPercentage: z.number().optional(), // % Retorno Bancário
  downPaymentPercentage: z.number().optional(), // Percentual da Entrada
  contractNumber: z.string().optional(), // Número do Contrato
  contractSignatureDate: z.string().datetime().optional(), // Data de Assinatura do Contrato
  portfolioStatus: z.string().optional(), // Situação Carteira

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
  
  // Commissions (Sistema Antigo - manter para compatibilidade)
  totalCommission: z.number().optional(),
  totalCommissionPercent: z.number().optional(),
  angariadorCommission: z.number().optional(),
  vendedorCommission: z.number().optional(),
  realEstateCommission: z.number().optional(),
  baggioCommission: z.number().optional(),
  
  // Sistema de Comissionamento Automático (12/02/2026)
  tipoComissao: z.string().optional(),
  porcentagemComissao: z.string().optional(),
  comissaoTotal: z.string().optional(),
  comissaoAngariador: z.string().optional(),
  comissaoCoordenador: z.string().optional(),
  comissaoVendedor: z.string().optional(),
  comissaoImobiliaria: z.string().optional(),
  comissaoParceira: z.string().optional(),
  comissaoAutonomo: z.string().optional(),
  // Bonificações
  possuiBonificacao: z.boolean().optional(),
  tipoBonificacao: z.string().optional(),
  valorBonificacao: z.string().optional(),
  descricaoBonificacao: z.string().optional(),
  comissaoBonificacaoCorretor: z.string().optional(),
  comissaoBonificacaoImobiliaria: z.string().optional(),
  
  // Sinal de Negócio (16/02/2026)
  sinalNegocio: z.enum(["Baggio", "Outra"]).optional(),
  sinalNegocioEmpresa: z.string().optional(),
  sinalNegocioValor: z.number().optional(),
  sinalNegocioDataPagamento: z.string().datetime().optional(),
  sinalNegocioComprovanteUrl: z.string().optional(),
  
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
    .query(async ({ input, ctx }) => {
      const timestamp = new Date().toISOString();
      console.log(`\n========== [Server ${timestamp}] searchProperty INICIADO ==========`);
      console.log('[Server] Input:', JSON.stringify({ 
        reference: input.reference, 
        searchType: input.searchType,
        user: ctx.user?.name 
      }, null, 2));
      
      try {
        console.log('[Server] Determinando tipo de busca...');
        
        let result: ProperfySearchResult;
        
        // SEMPRE tentar busca por referência primeiro (banco local)
        console.log('[Server] Tentando busca por referência no banco local...');
        result = await searchPropertyByReference(input.reference);
        
        // Se não encontrar e searchType for específico, tentar busca alternativa
        if (!result.success) {
          if (input.searchType === 'cep') {
            console.log('[Server] Fallback: Chamando searchPropertyByCEP...');
            result = await searchPropertyByCEP(input.reference);
          } else if (input.searchType === 'address') {
            console.log('[Server] Fallback: Chamando searchPropertyByAddress...');
            result = await searchPropertyByAddress(input.reference);
          }
        }
        
        console.log('[Server] Busca concluída! Success:', result.success);
        console.log('========== [Server] searchProperty FINALIZADO ==========\n');
        return result;
        
      } catch (error: any) {
        console.error('[Server] ERRO na busca Properfy:', error);
        console.error('[Server] Stack:', error.stack);
        
        return {
          success: false,
          error: 'Erro ao buscar imóvel. Preencha os dados manualmente.',
          searchType: input.searchType || 'auto'
        };
      }
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
        const saleData: Partial<InsertSale> = {
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
          saleType: input.saleType || null,
          responsible: input.responsible || null,
          invoiceNumber: input.invoiceNumber || null,
          // New Fields (Excel Migration)
          listingStore: input.listingStore || null,
          sellingStore: input.sellingStore || null,
          team: input.team || null,
          region: input.region || null,
          deedStatus: input.deedStatus || null,
          managementResponsible: input.managementResponsible || null,
          bankName: input.bankName || null,
          financedAmount: input.financedAmount?.toString() || null,
          bankReturnPercentage: input.bankReturnPercentage?.toString() || null,
          bankReturnAmount: input.financedAmount && input.bankReturnPercentage 
            ? (input.financedAmount * (input.bankReturnPercentage / 100)).toString()
            : null,
          downPaymentPercentage: input.downPaymentPercentage?.toString() || null,
          contractNumber: input.contractNumber || null,
          contractSignatureDate: input.contractSignatureDate ? new Date(input.contractSignatureDate) : null,
          portfolioStatus: input.portfolioStatus || null,
          // Sistema de Comissionamento Automático (12/02/2026)
          tipoComissao: input.tipoComissao as any,
          porcentagemComissao: input.porcentagemComissao || null,
          comissaoTotal: input.comissaoTotal || null,
          comissaoAngariador: input.comissaoAngariador || null,
          comissaoCoordenador: input.comissaoCoordenador || null,
          comissaoVendedor: input.comissaoVendedor || null,
          comissaoImobiliaria: input.comissaoImobiliaria || null,
          comissaoParceira: input.comissaoParceira || null,
          comissaoAutonomo: input.comissaoAutonomo || null,
          // Bonificações
          possuiBonificacao: input.possuiBonificacao || false,
          tipoBonificacao: input.tipoBonificacao as any,
          valorBonificacao: input.valorBonificacao || null,
          descricaoBonificacao: input.descricaoBonificacao || null,
          comissaoBonificacaoCorretor: input.comissaoBonificacaoCorretor || null,
          comissaoBonificacaoImobiliaria: input.comissaoBonificacaoImobiliaria || null,
          // Sinal de Negócio (16/02/2026)
          sinalNegocio: input.sinalNegocio as any,
          sinalNegocioEmpresa: input.sinalNegocioEmpresa || null,
          sinalNegocioValor: input.sinalNegocioValor?.toString() || null,
          sinalNegocioDataPagamento: input.sinalNegocioDataPagamento ? new Date(input.sinalNegocioDataPagamento) : null,
          sinalNegocioComprovanteUrl: input.sinalNegocioComprovanteUrl || null,
        };
        
        await db.insert(sales).values(saleData as any);

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

        // Enviar notificação por email para gerentes e corretor
        try {
          // Buscar emails dos gerentes da empresa
          const managers = await db
            .select()
            .from(users)
            .where(
              and(
                eq(users.companyId, ctx.user.companyId || "1"),
                eq(users.role, "manager")
              )
            );
          
          const managerEmails = managers
            .map(m => m.email)
            .filter((email): email is string => !!email);

          if (managerEmails.length > 0 || ctx.user.email) {
            await sendNewSaleNotification({
              managerEmails,
              brokerEmail: ctx.user.email || "",
              brokerName: ctx.user.name || "Corretor",
              buyerName: input.buyerName || "N/A",
              sellerName: input.sellerName || "N/A",
              propertyAddress: `${input.propertyAddress || ""}, ${input.propertyCity || ""}/${input.propertyState || ""}`,
              propertyReference: input.propertyReference,
              saleValue: input.saleValue || 0,
              saleDate: input.saleDate,
              proposalId: saleId,
              createdAt: new Date().toISOString(),
            });
          }

          // Notificação interna para o owner
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
        } catch (notifyError) {
          console.error("[Sales Router] Erro ao enviar notificação:", notifyError);
        }

        // Verificar progresso de meta e enviar notificações automáticas
        // TODO: Implementar notificações de meta quando goalNotificationService estiver disponível

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
      changeReason: z.string().optional(), // Motivo da alteração
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
      
      const { saleId, changeReason, ...updateData } = input;
      const oldSale = sale[0];
      
      // Detectar campos alterados para auditoria
      const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
      
      if (updateData.buyerName !== undefined && updateData.buyerName !== oldSale.buyerName) {
        changes.push({ field: 'buyerName', oldValue: oldSale.buyerName, newValue: updateData.buyerName });
      }
      if (updateData.buyerCpfCnpj !== undefined && updateData.buyerCpfCnpj !== oldSale.buyerCpfCnpj) {
        changes.push({ field: 'buyerCpfCnpj', oldValue: oldSale.buyerCpfCnpj, newValue: updateData.buyerCpfCnpj });
      }
      if (updateData.buyerPhone !== undefined && updateData.buyerPhone !== oldSale.buyerPhone) {
        changes.push({ field: 'buyerPhone', oldValue: oldSale.buyerPhone, newValue: updateData.buyerPhone });
      }
      if (updateData.sellerName !== undefined && updateData.sellerName !== oldSale.sellerName) {
        changes.push({ field: 'sellerName', oldValue: oldSale.sellerName, newValue: updateData.sellerName });
      }
      if (updateData.sellerCpfCnpj !== undefined && updateData.sellerCpfCnpj !== oldSale.sellerCpfCnpj) {
        changes.push({ field: 'sellerCpfCnpj', oldValue: oldSale.sellerCpfCnpj, newValue: updateData.sellerCpfCnpj });
      }
      if (updateData.sellerPhone !== undefined && updateData.sellerPhone !== oldSale.sellerPhone) {
        changes.push({ field: 'sellerPhone', oldValue: oldSale.sellerPhone, newValue: updateData.sellerPhone });
      }
      if (updateData.saleValue !== undefined && updateData.saleValue !== oldSale.saleValue) {
        changes.push({ field: 'saleValue', oldValue: oldSale.saleValue, newValue: updateData.saleValue });
      }
      if (updateData.saleDate !== undefined && updateData.saleDate?.getTime() !== oldSale.saleDate?.getTime()) {
        changes.push({ field: 'saleDate', oldValue: oldSale.saleDate, newValue: updateData.saleDate });
      }
      if (updateData.businessType !== undefined && updateData.businessType !== oldSale.businessType) {
        changes.push({ field: 'businessType', oldValue: oldSale.businessType, newValue: updateData.businessType });
      }
      if (updateData.observation !== undefined && updateData.observation !== oldSale.observation) {
        changes.push({ field: 'observation', oldValue: oldSale.observation, newValue: updateData.observation });
      }
      
      // Atualizar venda
      await db.update(sales).set({ ...updateData, updatedAt: new Date() }).where(eq(sales.id, saleId));
      
      // Registrar alterações no histórico
      if (changes.length > 0) {
        await logSaleUpdate(
          saleId,
          oldSale.companyId || '',
          ctx.user.id,
          ctx.user.name || 'Usuário',
          changes,
          changeReason || 'Edição manual da venda'
        );
      }
      
      return { success: true, message: "Proposta atualizada" };
    }),

  /**
   * Atualizar previsão de recebimento (permitido para broker, manager, finance)
   */
  updateExpectedPaymentDate: protectedProcedure
    .input(z.object({
      saleId: z.string(),
      expectedPaymentDate: z.string().datetime(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verificar se venda existe
      const sale = await db.select().from(sales).where(eq(sales.id, input.saleId)).limit(1);
      if (!sale.length) throw new Error("Venda não encontrada");
      
      // Permitido para broker, manager e finance em qualquer status
      if (!['broker', 'manager', 'finance'].includes(ctx.user.role)) {
        throw new Error("Permissão negada");
      }
      
      // Atualizar data
      await db.update(sales).set({ 
        expectedPaymentDate: new Date(input.expectedPaymentDate),
        updatedAt: new Date() 
      }).where(eq(sales.id, input.saleId));
      
      // Registrar no histórico
      await logSaleUpdate(
        input.saleId,
        sale[0].companyId || '',
        ctx.user.id,
        ctx.user.name || 'Usuário',
        [{
          field: 'expectedPaymentDate',
          oldValue: sale[0].expectedPaymentDate,
          newValue: new Date(input.expectedPaymentDate),
        }],
        'Atualização manual da previsão de recebimento'
      );
      
      return { success: true, message: "Previsão de recebimento atualizada" };
    }),

  listMySales: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const companyId = ctx.user.companyId;
      console.log('[DEBUG listMySales] Usuário:', ctx.user.name, 'Role:', ctx.user.role, 'CompanyId:', companyId);
      
      if (!companyId) {
        console.log('[DEBUG listMySales] Usuário sem companyId - retornando vazio');
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
        console.log('[DEBUG listMySales] Corretor - Total de vendas da empresa:', allSales.length);
        result = allSales.filter(s => 
          s.brokerVendedor === ctx.user.id || 
          s.brokerAngariador === ctx.user.id ||
          (!s.brokerVendedor && s.status === 'draft')
        );
        console.log('[DEBUG listMySales] Corretor - Vendas filtradas para o corretor:', result.length);
      } else {
        // manager, finance, viewer, admin - veem todas as vendas da empresa
        result = await db.select().from(sales)
          .where(eq(sales.companyId, companyId));
        console.log('[DEBUG listMySales] Gerente/Financeiro/Viewer - Total de vendas:', result.length);
        if (result.length > 0) {
          console.log('[DEBUG listMySales] Exemplo de venda:', {
            id: result[0].id,
            buyerName: result[0].buyerName,
            saleDate: result[0].saleDate,
            saleValue: result[0].saleValue,
            companyId: result[0].companyId
          });
        }
      }

      console.log('[DEBUG listMySales] Retornando', result.length, 'vendas');
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
          // Validar se há comprovante de pagamento
          const currentSaleData = currentSale[0];
          const documents = currentSaleData.documents ? JSON.parse(currentSaleData.documents as string) : {};
          
          if (!documents.comprovante_pagamento) {
            throw new Error("Comprovante de pagamento é obrigatório para marcar como comissão paga");
          }
          
          await db
            .update(commissions)
            .set({
              status: "paid",
              paymentDate: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(commissions.saleId, input.saleId));
        }

        // Enviar emails de aprovação/reprovação
        try {
          const sale = currentSale[0];
          const property = await db.select().from(properties).where(eq(properties.id, sale.propertyId)).limit(1);
          
          // Buscar corretor, gerente e financeiro envolvidos
          const broker = sale.brokerVendedor ? await db.select().from(users).where(eq(users.id, sale.brokerVendedor)).limit(1) : [];
          const managers = await db.select().from(users).where(
            and(
              eq(users.companyId, ctx.user.companyId || "1"),
              eq(users.role, "manager")
            )
          );
          const finance = await db.select().from(users).where(
            and(
              eq(users.companyId, ctx.user.companyId || "1"),
              eq(users.role, "finance")
            )
          );

          const brokerEmail = broker[0]?.email;
          const managerEmails = managers.map(m => m.email).filter((e): e is string => !!e);
          const financeEmails = finance.map(f => f.email).filter((e): e is string => !!e);

          // Email de aprovação (manager_review ou finance_review)
          if (input.status === "manager_review" || input.status === "finance_review") {
            const recipients = [];
            if (brokerEmail) recipients.push(brokerEmail);
            if (input.status === "manager_review") recipients.push(...financeEmails);
            if (input.status === "finance_review") recipients.push(...managerEmails);

            if (recipients.length > 0) {
              await sendSaleApprovedNotification({
                recipients,
                brokerName: broker[0]?.name || "Corretor",
                buyerName: sale.buyerName || "N/A",
                propertyAddress: property[0]?.address || "N/A",
                propertyReference: property[0]?.propertyReference || undefined,
                saleValue: parseFloat(sale.saleValue || "0"),
                approvedBy: ctx.user.name || "Usuário",
                approvedByRole: ctx.user.role === "manager" ? "Gerente" : "Financeiro",
                approvedAt: new Date().toISOString(),
                comment: input.observation,
                proposalId: sale.id,
              });
            }
          }

          // Email de comissão paga
          if (input.status === "commission_paid") {
            const recipients = [];
            if (brokerEmail) recipients.push(brokerEmail);
            recipients.push(...managerEmails, ...financeEmails);

            if (recipients.length > 0) {
              await sendCommissionPaidNotification({
                brokerEmail: brokerEmail || "",
                managerEmail: managerEmails[0] || "",
                financeEmail: financeEmails[0] || "",
                brokerName: broker[0]?.name || "Corretor",
                buyerName: sale.buyerName || "N/A",
                propertyAddress: property[0]?.address || "N/A",
                propertyReference: property[0]?.propertyReference || undefined,
                saleValue: parseFloat(sale.saleValue || "0"),
                commissionValue: 0, // Será calculado depois
                paidBy: ctx.user.name || "Usuário",
                paidAt: new Date().toISOString(),
                paymentMethod: "transferencia",
                bankName: "",
                proposalId: sale.id,
              });
            }
          }

          // Email de reprovação (cancelled)
          if (input.status === "cancelled" && input.observation) {
            const recipients = [];
            if (brokerEmail) recipients.push(brokerEmail);
            recipients.push(...managerEmails, ...financeEmails);

            if (recipients.length > 0) {
              await sendSaleRejectedNotification({
                recipients,
                brokerName: broker[0]?.name || "Corretor",
                buyerName: sale.buyerName || "N/A",
                propertyAddress: property[0]?.address || "N/A",
                propertyReference: property[0]?.propertyReference || undefined,
                saleValue: parseFloat(sale.saleValue || "0"),
                rejectedBy: ctx.user.name || "Usuário",
                rejectedByRole: ctx.user.role === "manager" ? "Gerente" : "Financeiro",
                rejectedAt: new Date().toISOString(),
                reason: input.observation,
                proposalId: sale.id,
              });
            }
          }
        } catch (emailError) {
          console.error("[Sales Router] Erro ao enviar email:", emailError);
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

  /**
   * Obter vendas por responsável (Lucas/Camila)
   */
  getSalesByResponsible: protectedProcedure
    .input(
      z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { user } = ctx;
        if (!user.companyId) {
          throw new Error("Usuário não está vinculado a uma empresa");
        }

        // Construir filtro de data
        let dateFilter = `YEAR(saleDate) = ${input.year}`;
        if (input.month) {
          dateFilter += ` AND MONTH(saleDate) = ${input.month}`;
        }

        // Buscar vendas de Lucas (Lançamento)
        const lucasQuery = `
          SELECT 
            COUNT(*) as quantity,
            COALESCE(SUM(saleValue), 0) as totalVGV
          FROM sales
          WHERE companyId = ? 
            AND ${dateFilter}
            AND saleType = 'lancamento'
            AND responsible = 'Lucas'
            AND status != 'cancelled'
        `;

        // Buscar vendas de Camila (Pronto)
        const camilaQuery = `
          SELECT 
            COUNT(*) as quantity,
            COALESCE(SUM(saleValue), 0) as totalVGV
          FROM sales
          WHERE companyId = ? 
            AND ${dateFilter}
            AND saleType = 'pronto'
            AND responsible = 'Camila'
            AND status != 'cancelled'
        `;

        const lucasResult: any = await db.execute(lucasQuery);
        const camilaResult: any = await db.execute(camilaQuery);

        const lucasData = (lucasResult as any)[0] || { quantity: 0, totalVGV: 0 };
        const camilaData = (camilaResult as any)[0] || { quantity: 0, totalVGV: 0 };

        return {
          lucas: {
            quantity: parseInt(lucasData.quantity) || 0,
            totalVGV: parseFloat(lucasData.totalVGV) || 0,
          },
          camila: {
            quantity: parseInt(camilaData.quantity) || 0,
            totalVGV: parseFloat(camilaData.totalVGV) || 0,
          },
          total: {
            quantity: (parseInt(lucasData.quantity) || 0) + (parseInt(camilaData.quantity) || 0),
            totalVGV: (parseFloat(lucasData.totalVGV) || 0) + (parseFloat(camilaData.totalVGV) || 0),
          },
        };
      } catch (error) {
        console.error("[Sales Router] Erro ao obter vendas por responsável:", error);
        throw new Error("Erro ao obter vendas por responsável");
      }
    }),

  /**
   * Registrar pagamento de comissão
   */
  registerCommissionPayment: protectedProcedure
    .input(
      z.object({
        saleId: z.string(),
        commissionPaymentDate: z.string().datetime(),
        commissionAmountReceived: z.number(),
        commissionPaymentBank: z.string().optional(),
        commissionPaymentMethod: z.string().optional(),
        commissionPaymentObservations: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Atualizar venda com dados de pagamento
        await db
          .update(sales)
          .set({
            commissionPaymentDate: new Date(input.commissionPaymentDate),
            commissionAmountReceived: input.commissionAmountReceived.toString(),
            commissionPaymentBank: input.commissionPaymentBank || null,
            commissionPaymentMethod: input.commissionPaymentMethod || null,
            commissionPaymentObservations: input.commissionPaymentObservations || null,
            status: "commission_paid", // Atualizar status para "Comissão Paga"
          })
          .where(eq(sales.id, input.saleId));

        // Atualizar status das comissões relacionadas
        await db
          .update(commissions)
          .set({
            status: "paid",
            paymentDate: new Date(input.commissionPaymentDate),
          })
          .where(eq(commissions.saleId, input.saleId));

        // Enviar email de comissão paga para corretor + gerente + financeiro
        try {
          const sale = await db.select().from(sales).where(eq(sales.id, input.saleId)).limit(1);
          if (sale.length > 0) {
            const property = await db.select().from(properties).where(eq(properties.id, sale[0].propertyId)).limit(1);
            const broker = sale[0].brokerVendedor ? await db.select().from(users).where(eq(users.id, sale[0].brokerVendedor)).limit(1) : [];
            const managers = await db.select().from(users).where(
              and(
                eq(users.companyId, ctx.user.companyId || "1"),
                eq(users.role, "manager")
              )
            );

            const brokerEmail = broker[0]?.email || "";
            const managerEmail = managers[0]?.email || "";
            const financeEmail = ctx.user.email || "";

            if (brokerEmail && managerEmail && financeEmail) {
              await sendCommissionPaidNotification({
                brokerEmail,
                managerEmail,
                financeEmail,
                brokerName: broker[0]?.name || "Corretor",
                buyerName: sale[0].buyerName || "N/A",
                propertyAddress: property[0]?.address || "N/A",
                propertyReference: property[0]?.propertyReference || undefined,
                saleValue: parseFloat(sale[0].saleValue || "0"),
                commissionValue: input.commissionAmountReceived,
                paidBy: ctx.user.name || "Financeiro",
                paidAt: input.commissionPaymentDate,
                paymentMethod: input.commissionPaymentMethod || "N/A",
                bankName: input.commissionPaymentBank || "N/A",
                proposalId: sale[0].id,
              });
            }
          }
        } catch (emailError) {
          console.error("[Sales Router] Erro ao enviar email de comissão paga:", emailError);
        }

        return {
          success: true,
          message: "Pagamento de comissão registrado com sucesso",
        };
      } catch (error) {
        console.error("[Sales Router] Erro ao registrar pagamento:", error);
        throw new Error("Erro ao registrar pagamento de comissão");
      }
    }),

  /**
   * Upload de documento (comprovante de sinal, NF, etc.) para S3
   * Retorna URL do documento armazenado
   */
  uploadDocument: protectedProcedure
    .input(z.object({
      saleId: z.string(),
      documentType: z.enum(["sinal_comprovante", "contrato_escritura", "nota_fiscal", "proposta", "comprovante_pagamento", "outro"]),
      fileName: z.string(),
      fileData: z.string(), // Base64 encoded file
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Validação de formato (backend)
        const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
        if (!allowedMimeTypes.includes(input.mimeType)) {
          throw new Error("Formato de arquivo inválido. Apenas PDF, JPG, JPEG e PNG são permitidos.");
        }

        // Converter base64 para Buffer
        const fileBuffer = Buffer.from(input.fileData, "base64");

        // Validação de tamanho (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB em bytes
        if (fileBuffer.length > maxSize) {
          throw new Error("Arquivo muito grande. O tamanho máximo é 5MB.");
        }

        // Verificar se venda existe e usuário tem permissão
        const sale = await db.select().from(sales).where(eq(sales.id, input.saleId)).limit(1);
        if (sale.length === 0) {
          throw new Error("Venda não encontrada");
        }

        // Verificar permissão (corretor só pode fazer upload em suas próprias vendas)
        if (ctx.user.role === "broker" && 
            sale[0].brokerVendedor !== ctx.user.id && 
            sale[0].brokerAngariador !== ctx.user.id) {
          throw new Error("Sem permissão para fazer upload nesta venda");
        }

        // Fazer upload para S3
        const s3Key = `sales/${input.saleId}/${input.documentType}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(s3Key, fileBuffer, input.mimeType);

        // Atualizar campo documents no banco (JSON)
        const currentDocuments = sale[0].documents ? JSON.parse(sale[0].documents as string) : {};
        
        // Se for comprovante de pagamento, validar que está sendo feito por Finance ou Manager
        if (input.documentType === "comprovante_pagamento" && ctx.user.role !== "finance" && ctx.user.role !== "manager") {
          throw new Error("Apenas Financeiro e Gerente podem fazer upload de comprovante de pagamento");
        }
        
        currentDocuments[input.documentType] = {
          url,
          fileName: input.fileName,
          uploadedBy: ctx.user.id,
          uploadedAt: new Date().toISOString(),
          mimeType: input.mimeType,
        };

        await db
          .update(sales)
          .set({ documents: JSON.stringify(currentDocuments) })
          .where(eq(sales.id, input.saleId));

        return {
          success: true,
          url,
          message: "Documento enviado com sucesso",
        };
      } catch (error) {
        console.error("[Sales Router] Erro ao fazer upload de documento:", error);
        throw new Error("Erro ao fazer upload de documento");
      }
    }),

  /**
   * Verificar e enviar notificações de progresso de meta
   * Chamado após cada venda registrada
   */
  checkGoalNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const { user } = ctx;
      if (!user.companyId) {
        return { success: false, message: "Usuário não vinculado a empresa" };
      }

      // TODO: Implementar verificação de notificações de meta
      return { 
        success: true, 
        message: "Notificações verificadas" 
      };
    } catch (error) {
      console.error("[Sales Router] Erro ao verificar notificações:", error);
      return { success: false, message: "Erro ao verificar notificações" };
    }
  }),
});

