import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, decimal, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with additional fields for real estate system.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: text("password"), // Hashed password for traditional login
  loginMethod: varchar("loginMethod", { length: 64 }).default("email"),
  role: mysqlEnum("role", ["superadmin", "admin", "manager", "broker", "finance", "viewer"]).default("broker").notNull(),
  managerId: varchar("managerId", { length: 64 }), // Gerente responsável pelo corretor
  companyId: varchar("companyId", { length: 64 }), // Company/Imobiliária reference
  isActive: boolean("isActive").default(true),
  // Segurança de login
  failedLoginAttempts: int("failedLoginAttempts").default(0),
  lockedUntil: timestamp("lockedUntil"),
  // Reset de senha
  resetToken: varchar("resetToken", { length: 128 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserWithCompany = User & { companyName: string | null };

/**
 * Companies/Imobiliárias table
 */
export const companies = mysqlTable("companies", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Razão Social
  tradeName: varchar("tradeName", { length: 255 }), // Nome Fantasia
  cnpj: varchar("cnpj", { length: 20 }).unique(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  logo: text("logo"),
  // Licença
  licenseType: mysqlEnum("licenseType", ["perpetual", "monthly", "quarterly", "semiannual", "annual"]).default("monthly"),
  licenseStartDate: timestamp("licenseStartDate"),
  licenseExpiresAt: timestamp("licenseExpiresAt"),
  // Contrato
  contractResponsible: varchar("contractResponsible", { length: 255 }),
  contractResponsibleEmail: varchar("contractResponsibleEmail", { length: 320 }),
  contractResponsiblePhone: varchar("contractResponsiblePhone", { length: 20 }),
  contractStartDate: timestamp("contractStartDate"),
  contractNotes: text("contractNotes"),
  notificationEmail: varchar("notificationEmail", { length: 320 }), // Email adicional para notificações
  // Status
  isActive: boolean("isActive").default(true),
  totalLogins: int("totalLogins").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Real Estate Properties
 */
export const properties = mysqlTable("properties", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  propertyReference: varchar("propertyReference", { length: 64 }), // Properfy reference
  isFromBaggio: boolean("isFromBaggio").default(false), // Is it from Baggio (Properfy) or external
  address: text("address").notNull(),
  zipCode: varchar("zipCode", { length: 10 }),
  neighborhood: varchar("neighborhood", { length: 255 }),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 2 }),
  number: varchar("number", { length: 20 }),
  complement: text("complement"),
  advertisementValue: decimal("advertisementValue", { precision: 15, scale: 2 }), // Valor de divulgação
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Sales/Vendas
 */
export const sales = mysqlTable("sales", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  propertyId: varchar("propertyId", { length: 64 }).notNull(),
  buyerName: varchar("buyerName", { length: 255 }).notNull(),
  buyerCpfCnpj: varchar("buyerCpfCnpj", { length: 20 }),
  saleDate: timestamp("saleDate"),
  angariationDate: timestamp("angariationDate"),
  saleValue: decimal("saleValue", { precision: 15, scale: 2 }).notNull(),
  clientOrigin: varchar("clientOrigin", { length: 255 }),
  paymentMethod: varchar("paymentMethod", { length: 255 }),
  // Corretor Angariador (interno ou externo)
  brokerAngariador: varchar("brokerAngariador", { length: 64 }),
  brokerAngariadorType: mysqlEnum("brokerAngariadorType", ["internal", "external"]).default("internal"),
  brokerAngariadorName: varchar("brokerAngariadorName", { length: 255 }),
  brokerAngariadorCreci: varchar("brokerAngariadorCreci", { length: 50 }),
  brokerAngariadorEmail: varchar("brokerAngariadorEmail", { length: 320 }),
  // Corretor Vendedor (interno ou externo)
  brokerVendedor: varchar("brokerVendedor", { length: 64 }),
  brokerVendedorType: mysqlEnum("brokerVendedorType", ["internal", "external"]).default("internal"),
  brokerVendedorName: varchar("brokerVendedorName", { length: 255 }),
  brokerVendedorCreci: varchar("brokerVendedorCreci", { length: 50 }),
  brokerVendedorEmail: varchar("brokerVendedorEmail", { length: 320 }),
  businessType: varchar("businessType", { length: 255 }),
  // Status expandido para fluxo de proposta
  status: mysqlEnum("status", ["draft", "pending", "sale", "manager_review", "finance_review", "commission_paid", "cancelled"]).default("draft").notNull(),
  // Quem registrou e quando
  registeredBy: varchar("registeredBy", { length: 64 }),
  registeredByName: varchar("registeredByName", { length: 255 }),
  registeredAt: timestamp("registeredAt").defaultNow(),
  // Comissão da imobiliária
  realEstateCommission: decimal("realEstateCommission", { precision: 15, scale: 2 }),
  observation: text("observation"), // Observation when status changes to received
  proposalDocumentUrl: text("proposalDocumentUrl"), // URL to uploaded proposal document
  propertyType: varchar("propertyType", { length: 255 }), // Tipo do Imóvel
  bedrooms: int("bedrooms"), // Quantidade de Quartos
  costPerM2: decimal("costPerM2", { precision: 15, scale: 2 }), // Custo por m²
  privateArea: decimal("privateArea", { precision: 10, scale: 2 }), // Área Privativa
  totalArea: decimal("totalArea", { precision: 10, scale: 2 }), // Área Total
  propertyAge: int("propertyAge"), // Idade do Imóvel
  investmentType: varchar("investmentType", { length: 255 }), // Investimento ou Moradia
  financedValue: decimal("financedValue", { precision: 15, scale: 2 }), // Valor Financiado
  cartoryBank: varchar("cartoryBank", { length: 255 }), // Cartório/Banco/Consórcio
  despachante: varchar("despachante", { length: 255 }), // Despachante
  sellerName: varchar("sellerName", { length: 255 }), // Nome do Vendedor
  sellerCpfCnpj: varchar("sellerCpfCnpj", { length: 20 }), // CPF/CNPJ do Vendedor
  sellerPhone: varchar("sellerPhone", { length: 20 }), // Telefone do Vendedor
  buyerPhone: varchar("buyerPhone", { length: 20 }), // Telefone do Comprador
  // Novos campos do documento Word
  condominiumName: varchar("condominiumName", { length: 255 }), // Nome do Condomínio
  advertisementValue: decimal("advertisementValue", { precision: 15, scale: 2 }), // Valor de Divulgação
  totalCommission: decimal("totalCommission", { precision: 15, scale: 2 }), // Total da Comissão Fechada
  totalCommissionPercent: decimal("totalCommissionPercent", { precision: 5, scale: 2 }), // % da Comissão
  angariadorCommission: decimal("angariadorCommission", { precision: 15, scale: 2 }), // Comissão Corretor Angariador
  vendedorCommission: decimal("vendedorCommission", { precision: 15, scale: 2 }), // Comissão Corretor Vendedor
  baggioCommission: decimal("baggioCommission", { precision: 15, scale: 2 }), // Comissão Baggio
  expectedPaymentDate: timestamp("expectedPaymentDate"), // Previsão de Recebimento
  // Tipo de Venda e Responsável
  saleType: mysqlEnum("saleType", ["lancamento", "pronto"]),
  responsible: varchar("responsible", { length: 255 }), // Lucas ou Camila
  invoiceNumber: varchar("invoiceNumber", { length: 100 }), // Número da NF
  // Novos campos para migração do Excel
  listingDate: timestamp("listingDate"), // Data da Angariação (vem do Properfy dteNewListing)
  listingStore: varchar("listingStore", { length: 100 }), // Loja Angariadora: Baggio/Rede UNA/Outros
  sellingStore: varchar("sellingStore", { length: 100 }), // Loja Vendedora: Baggio/Rede UNA/Outros
  team: varchar("team", { length: 100 }), // Equipe: TIME PRONTOS, TIME NOVOS, etc.
  region: varchar("region", { length: 100 }), // Região: Campo Comprido/Vila Izabel/Ecoville/Outros
  managementResponsible: varchar("managementResponsible", { length: 100 }), // Camila/Lucas/Marcio/Lucas e Camila
  deedStatus: varchar("deedStatus", { length: 50 }), // Escriturada/A Escriturar/Não se aplica
  bankName: varchar("bankName", { length: 255 }), // Banco: Caixa, Itaú, Bradesco, etc.
  financedAmount: decimal("financedAmount", { precision: 15, scale: 2 }), // Valor Financiado
  bankReturnPercentage: decimal("bankReturnPercentage", { precision: 5, scale: 2 }), // % Retorno Bancário
  bankReturnAmount: decimal("bankReturnAmount", { precision: 15, scale: 2 }), // Valor Retorno (calculado)
  observations: text("observations"), // Observações gerais
  wasRemoved: boolean("wasRemoved").default(false), // Se foi baixado
  // Novos campos adicionados 06/02/2026
  downPaymentPercentage: decimal("downPaymentPercentage", { precision: 5, scale: 2 }), // Percentual da Entrada
  contractNumber: varchar("contractNumber", { length: 100 }), // Número do Contrato
  contractSignatureDate: timestamp("contractSignatureDate"), // Data de Assinatura do Contrato
  portfolioStatus: varchar("portfolioStatus", { length: 100 }), // Situação Carteira
  priceDiscount: decimal("priceDiscount", { precision: 15, scale: 2 }), // Calculado: advertisementValue - saleValue
  listingToSaleDays: int("listingToSaleDays"), // Calculado: dias entre listingDate e saleDate
  // Comissões Recebidas
  commissionPaymentDate: timestamp("commissionPaymentDate"), // Data de Recebimento da Comissão
  commissionAmountReceived: decimal("commissionAmountReceived", { precision: 15, scale: 2 }), // Valor da Comissão Recebida
  commissionPaymentBank: varchar("commissionPaymentBank", { length: 255 }), // Banco Pagador da Comissão
  commissionPaymentMethod: varchar("commissionPaymentMethod", { length: 100 }), // PIX/TED/Boleto/Dinheiro
  commissionPaymentObservations: text("commissionPaymentObservations"), // Observações do pagamento da comissão
  // Sistema de Comissionamento Automático (12/02/2026)
  tipoComissao: mysqlEnum("tipoComissao", [
    "Venda Interna",
    "Parceria UNA",
    "Parceria Externa",
    "Lançamentos (sem coordenação)",
    "Lançamentos (com coordenação de produto)",
    "Corretor Autônomo",
    "Imóveis Ebani"
  ]),
  porcentagemComissao: decimal("porcentagemComissao", { precision: 5, scale: 2 }), // % da comissão total
  comissaoTotal: decimal("comissaoTotal", { precision: 15, scale: 2 }), // Valor total da comissão
  comissaoAngariador: decimal("comissaoAngariador", { precision: 15, scale: 2 }), // Comissão do angariador
  comissaoCoordenador: decimal("comissaoCoordenador", { precision: 15, scale: 2 }), // Comissão do coordenador (se aplicável)
  comissaoVendedor: decimal("comissaoVendedor", { precision: 15, scale: 2 }), // Comissão do vendedor
  comissaoImobiliaria: decimal("comissaoImobiliaria", { precision: 15, scale: 2 }), // Comissão da imobiliária
  comissaoParceira: decimal("comissaoParceira", { precision: 15, scale: 2 }), // Comissão da imobiliária parceira (se aplicável)
  comissaoAutonomo: decimal("comissaoAutonomo", { precision: 15, scale: 2 }), // Comissão do corretor autônomo (se aplicável)
  // Bonificações
  possuiBonificacao: boolean("possuiBonificacao").default(false),
  tipoBonificacao: mysqlEnum("tipoBonificacao", ["Dinheiro", "Material"]),
  valorBonificacao: decimal("valorBonificacao", { precision: 15, scale: 2 }),
  // Sinal de Negócio (16/02/2026)
  sinalNegocio: mysqlEnum("sinalNegocio", ["Baggio", "Outra"]),
  sinalNegocioEmpresa: varchar("sinalNegocioEmpresa", { length: 255 }), // Nome da empresa se "Outra"
  sinalNegocioValor: decimal("sinalNegocioValor", { precision: 15, scale: 2 }), // Valor do sinal
  sinalNegocioDataPagamento: timestamp("sinalNegocioDataPagamento"), // Data do pagamento
  sinalNegocioComprovanteUrl: text("sinalNegocioComprovanteUrl"), // URL do comprovante (se Baggio)
  descricaoBonificacao: text("descricaoBonificacao"),
  comissaoBonificacaoCorretor: decimal("comissaoBonificacaoCorretor", { precision: 15, scale: 2 }),
  comissaoBonificacaoImobiliaria: decimal("comissaoBonificacaoImobiliaria", { precision: 15, scale: 2 }),
  
  // Documentos anexados (JSON: {tipo: {url, fileName, uploadedBy, uploadedAt, mimeType}})
  documents: text("documents"),
  
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

/**
 * Commissions/Comissões
 */
export const commissions = mysqlTable("commissions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  saleId: varchar("saleId", { length: 64 }).notNull(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  brokerId: varchar("brokerId", { length: 64 }).notNull(),
  commissionValue: decimal("commissionValue", { precision: 15, scale: 2 }).notNull(),
  commissionPercentage: decimal("commissionPercentage", { precision: 5, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["angariacao", "venda", "parceria"]).notNull(),
  status: mysqlEnum("status", ["pending", "received", "paid", "cancelled"]).default("pending").notNull(),
  paymentDate: timestamp("paymentDate"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;

/**
 * Commission Rules/Tabela de Comissões
 */
export const commissionRules = mysqlTable("commissionRules", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  businessType: varchar("businessType", { length: 255 }).notNull(), // Type of business
  angariadorPercentage: decimal("angariadorPercentage", { precision: 5, scale: 2 }).notNull(),
  vendedorPercentage: decimal("vendedorPercentage", { precision: 5, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type CommissionRule = typeof commissionRules.$inferSelect;
export type InsertCommissionRule = typeof commissionRules.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  properties: many(properties),
  sales: many(sales),
  commissions: many(commissions),
  commissionRules: many(commissionRules),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  company: one(companies, {
    fields: [properties.companyId],
    references: [companies.id],
  }),
  sales: many(sales),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  company: one(companies, {
    fields: [sales.companyId],
    references: [companies.id],
  }),
  property: one(properties, {
    fields: [sales.propertyId],
    references: [properties.id],
  }),
  commissions: many(commissions),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  sale: one(sales, {
    fields: [commissions.saleId],
    references: [sales.id],
  }),
  company: one(companies, {
    fields: [commissions.companyId],
    references: [companies.id],
  }),
  broker: one(users, {
    fields: [commissions.brokerId],
    references: [users.id],
  }),
}));

export const commissionRulesRelations = relations(commissionRules, ({ one }) => ({
  company: one(companies, {
    fields: [commissionRules.companyId],
    references: [companies.id],
  }),
}));

/**
 * Proposals/Propostas
 */
export const proposals = mysqlTable("proposals", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  propertyReference: varchar("propertyReference", { length: 64 }).notNull(),
  brokerAngariadorId: varchar("brokerAngariadorId", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["proposta", "vendido", "recusado", "outro"]).default("proposta").notNull(),
  customStatus: varchar("customStatus", { length: 255 }), // For "outro" status
  rejectionReason: varchar("rejectionReason", { length: 255 }), // Motivo da recusa
  rejectionDate: timestamp("rejectionDate"),
  rejectionObservation: text("rejectionObservation"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

/**
 * Goals/Metas Anuais - Com 27 indicadores como colunas
 */
export const goals = mysqlTable("goals", {
  id: varchar("id", { length: 64 }).primaryKey(),
  managerId: varchar("managerId", { length: 64 }).notNull(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  year: int("year").notNull(),
  // 27 Indicadores de Metas
  businessMonth: decimal("businessMonth", { precision: 15, scale: 2 }),
  cancelledSales: decimal("cancelledSales", { precision: 15, scale: 2 }),
  vsoRatio: decimal("vsoRatio", { precision: 5, scale: 2 }),
  commissionReceived: decimal("commissionReceived", { precision: 15, scale: 2 }),
  commissionSold: decimal("commissionSold", { precision: 15, scale: 2 }),
  commissionPending: decimal("commissionPending", { precision: 15, scale: 2 }),
  portfolioDisclosure: decimal("portfolioDisclosure", { precision: 15, scale: 2 }),
  prospectingMonth: decimal("prospectingMonth", { precision: 15, scale: 2 }),
  removalsMonth: decimal("removalsMonth", { precision: 15, scale: 2 }),
  commissionPercentage: decimal("commissionPercentage", { precision: 5, scale: 2 }),
  businessOver1m: decimal("businessOver1m", { precision: 15, scale: 2 }),
  readyCalls: decimal("readyCalls", { precision: 15, scale: 2 }),
  launchCalls: decimal("launchCalls", { precision: 15, scale: 2 }),
  avgReceiptTime: decimal("avgReceiptTime", { precision: 10, scale: 2 }),
  cancelledPendingRatio: decimal("cancelledPendingRatio", { precision: 5, scale: 2 }),
  avgSaleTime: decimal("avgSaleTime", { precision: 10, scale: 2 }),
  avgPropertyValue: decimal("avgPropertyValue", { precision: 15, scale: 2 }),
  networkBusiness: decimal("networkBusiness", { precision: 15, scale: 2 }),
  internalBusiness: decimal("internalBusiness", { precision: 15, scale: 2 }),
  externalPartnership: decimal("externalPartnership", { precision: 15, scale: 2 }),
  launchBusiness: decimal("launchBusiness", { precision: 15, scale: 2 }),
  generalExpense: decimal("generalExpense", { precision: 15, scale: 2 }),
  taxExpense: decimal("taxExpense", { precision: 15, scale: 2 }),
  innovationFund: decimal("innovationFund", { precision: 15, scale: 2 }),
  partnersResult: decimal("partnersResult", { precision: 15, scale: 2 }),
  emergencyFund: decimal("emergencyFund", { precision: 15, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

/**
 * Commission History/Histórico de Comissões
 */
export const commissionHistory = mysqlTable("commissionHistory", {
  id: varchar("id", { length: 64 }).primaryKey(),
  commissionId: varchar("commissionId", { length: 64 }).notNull(),
  previousValue: decimal("previousValue", { precision: 15, scale: 2 }),
  newValue: decimal("newValue", { precision: 15, scale: 2 }).notNull(),
  previousStatus: varchar("previousStatus", { length: 64 }),
  newStatus: varchar("newStatus", { length: 64 }).notNull(),
  changedBy: varchar("changedBy", { length: 64 }).notNull(),
  approvedBy: varchar("approvedBy", { length: 64 }), // Approved by finance
  approvalDate: timestamp("approvalDate"),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type CommissionHistory = typeof commissionHistory.$inferSelect;
export type InsertCommissionHistory = typeof commissionHistory.$inferInsert;

/**
 * Property History/Histórico de Imóveis
 */
export const propertyHistory = mysqlTable("propertyHistory", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  propertyReference: varchar("propertyReference", { length: 64 }).notNull(),
  previousValue: decimal("previousValue", { precision: 15, scale: 2 }),
  newValue: decimal("newValue", { precision: 15, scale: 2 }),
  previousStatus: varchar("previousStatus", { length: 255 }),
  newStatus: varchar("newStatus", { length: 255 }),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type PropertyHistory = typeof propertyHistory.$inferSelect;
export type InsertPropertyHistory = typeof propertyHistory.$inferInsert;

/**
 * Bonuses/Bonificações e Prêmios
 */
export const bonuses = mysqlTable("bonuses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  bonusValue: decimal("bonusValue", { precision: 15, scale: 2 }),
  bonusPercentage: decimal("bonusPercentage", { precision: 5, scale: 2 }),
  type: mysqlEnum("type", ["bonificacao", "premio", "outro"]).notNull(),
  linkedTo: mysqlEnum("linkedTo", ["referencia", "equipe", "meta", "nenhum"]).default("nenhum"),
  linkedValue: varchar("linkedValue", { length: 255 }), // Reference, team type, etc
  applicableTo: varchar("applicableTo", { length: 255 }), // Comma-separated broker IDs or "all"
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  isActive: boolean("isActive").default(true),
  createdBy: varchar("createdBy", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Bonus = typeof bonuses.$inferSelect;
export type InsertBonus = typeof bonuses.$inferInsert;

/**
 * Models/Modelos Configuráveis
 */
export const models = mysqlTable("models", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }), // null for global/super admin models
  modelType: mysqlEnum("modelType", ["paymentMethod", "clientOrigin", "carteiraSituation", "teamType", "rejectionReason", "businessType"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false), // Is this a default/suggested model
  isActive: boolean("isActive").default(true),
  createdBy: varchar("createdBy", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Model = typeof models.$inferSelect;
export type InsertModel = typeof models.$inferInsert;

/**
 * Commission Approvals/Aprovações de Comissões
 */
export const commissionApprovals = mysqlTable("commissionApprovals", {
  id: varchar("id", { length: 64 }).primaryKey(),
  commissionId: varchar("commissionId", { length: 64 }).notNull(),
  saleId: varchar("saleId", { length: 64 }).notNull(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["proposta", "enviado_gerente", "aprovado_gerente", "enviado_financeiro", "aprovado_financeiro", "recusado", "pago"]).default("proposta").notNull(),
  sentToManagerAt: timestamp("sentToManagerAt"),
  approvedByManagerAt: timestamp("approvedByManagerAt"),
  approvedByManagerId: varchar("approvedByManagerId", { length: 64 }),
  sentToFinanceAt: timestamp("sentToFinanceAt"),
  approvedByFinanceAt: timestamp("approvedByFinanceAt"),
  approvedByFinanceId: varchar("approvedByFinanceId", { length: 64 }),
  paidAt: timestamp("paidAt"),
  rejectionReason: text("rejectionReason"),
  rejectedAt: timestamp("rejectedAt"),
  rejectedBy: varchar("rejectedBy", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type CommissionApproval = typeof commissionApprovals.$inferSelect;
export type InsertCommissionApproval = typeof commissionApprovals.$inferInsert;

/**
 * Relations for new tables
 */
export const proposalsRelations = relations(proposals, ({ one }) => ({
  company: one(companies, {
    fields: [proposals.companyId],
    references: [companies.id],
  }),
  brokerAngariador: one(users, {
    fields: [proposals.brokerAngariadorId],
    references: [users.id],
  }),
}));

export const bonusesRelations = relations(bonuses, ({ one }) => ({
  company: one(companies, {
    fields: [bonuses.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [bonuses.createdBy],
    references: [users.id],
  }),
}));

export const modelsRelations = relations(models, ({ one }) => ({
  company: one(companies, {
    fields: [models.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [models.createdBy],
    references: [users.id],
  }),
}));

export const commissionApprovalsRelations = relations(commissionApprovals, ({ one }) => ({
  commission: one(commissions, {
    fields: [commissionApprovals.commissionId],
    references: [commissions.id],
  }),
  sale: one(sales, {
    fields: [commissionApprovals.saleId],
    references: [sales.id],
  }),
  company: one(companies, {
    fields: [commissionApprovals.companyId],
    references: [companies.id],
  }),
  approvedByManager: one(users, {
    fields: [commissionApprovals.approvedByManagerId],
    references: [users.id],
  }),
  approvedByFinance: one(users, {
    fields: [commissionApprovals.approvedByFinanceId],
    references: [users.id],
  }),
}));

export const commissionHistoryRelations = relations(commissionHistory, ({ one }) => ({
  changedByUser: one(users, {
    fields: [commissionHistory.changedBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [commissionHistory.approvedBy],
    references: [users.id],
  }),
}));

export const propertyHistoryRelations = relations(propertyHistory, ({ one }) => ({
  company: one(companies, {
    fields: [propertyHistory.companyId],
    references: [companies.id],
  }),
}));

// Update companies relations to include new tables
export const companiesRelationsUpdated = relations(companies, ({ many }) => ({
  users: many(users),
  properties: many(properties),
  sales: many(sales),
  commissions: many(commissions),
  commissionRules: many(commissionRules),
  proposals: many(proposals),
  bonuses: many(bonuses),
  models: many(models),
  commissionApprovals: many(commissionApprovals),
  propertyHistory: many(propertyHistory),
}));


/**
 * Action Logs/Histórico de Ações
 */
export const actionLogs = mysqlTable("actionLogs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }),
  userId: varchar("userId", { length: 64 }).notNull(),
  targetType: mysqlEnum("targetType", ["user", "company", "sale", "commission", "license"]).notNull(),
  targetId: varchar("targetId", { length: 64 }),
  action: mysqlEnum("action", ["create", "update", "delete", "activate", "deactivate", "login", "reset_password", "block_user", "unblock_user", "assign_manager", "assign_company"]).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ActionLog = typeof actionLogs.$inferSelect;
export type InsertActionLog = typeof actionLogs.$inferInsert;


/**
 * Sales History/Histórico de Alterações de Vendas para Auditoria
 */
export const salesHistory = mysqlTable("salesHistory", {
  id: varchar("id", { length: 64 }).primaryKey(),
  saleId: varchar("saleId", { length: 64 }).notNull(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  changedBy: varchar("changedBy", { length: 64 }).notNull(),
  changedByName: varchar("changedByName", { length: 255 }),
  action: mysqlEnum("action", ["create", "update", "delete", "status_change", "approval", "rejection"]).notNull(),
  fieldName: varchar("fieldName", { length: 100 }), // Campo que foi alterado
  previousValue: text("previousValue"), // Valor anterior
  newValue: text("newValue"), // Novo valor
  changeReason: text("changeReason"), // Motivo da alteração
  ipAddress: varchar("ipAddress", { length: 45 }), // IP do usuário
  userAgent: text("userAgent"), // Browser/dispositivo
  createdAt: timestamp("createdAt").defaultNow(),
});

export type SalesHistory = typeof salesHistory.$inferSelect;
export type InsertSalesHistory = typeof salesHistory.$inferInsert;

export const salesHistoryRelations = relations(salesHistory, ({ one }) => ({
  sale: one(sales, {
    fields: [salesHistory.saleId],
    references: [sales.id],
  }),
  company: one(companies, {
    fields: [salesHistory.companyId],
    references: [companies.id],
  }),
  changedByUser: one(users, {
    fields: [salesHistory.changedBy],
    references: [users.id],
  }),
}));


/**
 * Proposal Status Comments/Comentários de Status de Proposta
 */
export const proposalComments = mysqlTable("proposalComments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  saleId: varchar("saleId", { length: 64 }).notNull(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  userName: varchar("userName", { length: 255 }),
  previousStatus: varchar("previousStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ProposalComment = typeof proposalComments.$inferSelect;
export type InsertProposalComment = typeof proposalComments.$inferInsert;

export const proposalCommentsRelations = relations(proposalComments, ({ one }) => ({
  sale: one(sales, {
    fields: [proposalComments.saleId],
    references: [sales.id],
  }),
  user: one(users, {
    fields: [proposalComments.userId],
    references: [users.id],
  }),
}));


/**
 * Monthly Indicators - Indicadores Mensais de Preenchimento Manual
 * Armazena valores mensais de despesas e fundos inseridos por Gerente/Financeiro
 */
export const monthlyIndicators = mysqlTable("monthlyIndicators", {
  id: varchar("id", { length: 64 }).primaryKey(),
  month: varchar("month", { length: 7 }).notNull(), // Format: YYYY-MM
  companyId: varchar("companyId", { length: 64 }).notNull(),
  // Despesas e Fundos
  generalExpense: decimal("generalExpense", { precision: 15, scale: 2 }), // Despesa Geral
  taxExpense: decimal("taxExpense", { precision: 15, scale: 2 }), // Despesa com Impostos
  innovationFund: decimal("innovationFund", { precision: 15, scale: 2 }), // Fundo Inovação
  partnerResult: decimal("partnerResult", { precision: 15, scale: 2 }), // Resultado Sócios
  emergencyFund: decimal("emergencyFund", { precision: 15, scale: 2 }), // Fundo Emergencial
  // Auditoria
  createdBy: varchar("createdBy", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type MonthlyIndicator = typeof monthlyIndicators.$inferSelect;
export type InsertMonthlyIndicator = typeof monthlyIndicators.$inferInsert;

export const monthlyIndicatorsRelations = relations(monthlyIndicators, ({ one }) => ({
  company: one(companies, {
    fields: [monthlyIndicators.companyId],
    references: [companies.id],
  }),
  creator: one(users, {
    fields: [monthlyIndicators.createdBy],
    references: [users.id],
  }),
}));

/**
 * Properties Cache - Cache de Imóveis do Properfy
 * Armazena dados sincronizados do Properfy para consultas rápidas
 */
export const propertiesCache = mysqlTable("propertiesCache", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  properfyId: varchar("properfyId", { length: 64 }).notNull(), // ID do imóvel no Properfy
  delmackPropertyId: varchar("delmackPropertyId", { length: 64 }), // ID do imóvel no Sistema Delmack (para JOIN)
  chrReference: varchar("chrReference", { length: 255 }), // Referência interna
  chrDocument: varchar("chrDocument", { length: 255 }), // Código BG (ex: BG96074001.isnyv.md)
  chrStatus: varchar("chrStatus", { length: 50 }), // LISTED, REMOVED, RENTED, etc.
  dteNewListing: timestamp("dteNewListing"), // Data de angariação
  dteTermination: timestamp("dteTermination"), // Data de baixa
  chrTerminationReason: varchar("chrTerminationReason", { length: 255 }), // Motivo da baixa
  // Dados adicionais para cálculos
  propertyType: varchar("propertyType", { length: 50 }), // Prontos, Lançamentos
  saleValue: decimal("saleValue", { precision: 15, scale: 2 }), // Valor de venda
  // Sincronização
  lastSyncAt: timestamp("lastSyncAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type PropertyCache = typeof propertiesCache.$inferSelect;
export type InsertPropertyCache = typeof propertiesCache.$inferInsert;

export const propertiesCacheRelations = relations(propertiesCache, ({ one }) => ({
  company: one(companies, {
    fields: [propertiesCache.companyId],
    references: [companies.id],
  }),
}));

/**
 * Sale Payment History - Rastreamento de alterações em Previsão de Pagamento
 * Armazena histórico de todas as alterações no campo expectedPaymentDate
 */
export const salePaymentHistory = mysqlTable("salePaymentHistory", {
  id: varchar("id", { length: 64 }).primaryKey(),
  saleId: varchar("saleId", { length: 64 }).notNull(),
  fieldChanged: varchar("fieldChanged", { length: 100 }).notNull(), // "expectedPaymentDate"
  oldValue: text("oldValue"), // Valor anterior (pode ser null na primeira vez)
  newValue: text("newValue").notNull(), // Novo valor
  changedBy: varchar("changedBy", { length: 64 }).notNull(), // ID do usuário que alterou
  changedByName: varchar("changedByName", { length: 255 }), // Nome do usuário
  reason: text("reason"), // Motivo da alteração (opcional)
  createdAt: timestamp("createdAt").defaultNow(),
});

export type SalePaymentHistory = typeof salePaymentHistory.$inferSelect;
export type InsertSalePaymentHistory = typeof salePaymentHistory.$inferInsert;

export const salePaymentHistoryRelations = relations(salePaymentHistory, ({ one }) => ({
  sale: one(sales, {
    fields: [salePaymentHistory.saleId],
    references: [sales.id],
  }),
  changedByUser: one(users, {
    fields: [salePaymentHistory.changedBy],
    references: [users.id],
  }),
}));

/**
 * Properfy Properties Cache - Local copy of Properfy properties for fast search
 * Synced daily from Properfy API at 3 AM
 */
export const properfyProperties = mysqlTable("properfyProperties", {
  id: int("id").primaryKey(),
  
  // Basic info
  chrReference: varchar("chrReference", { length: 100 }).notNull(),
  chrInnerReference: varchar("chrInnerReference", { length: 100 }),
  chrType: varchar("chrType", { length: 50 }),
  chrStatus: varchar("chrStatus", { length: 50 }),
  chrTransactionType: varchar("chrTransactionType", { length: 50 }),
  
  // Areas
  dcmAreaTotal: decimal("dcmAreaTotal", { precision: 10, scale: 2 }),
  dcmAreaPrivate: decimal("dcmAreaPrivate", { precision: 10, scale: 2 }),
  dcmAreaUsable: decimal("dcmAreaUsable", { precision: 10, scale: 2 }),
  dcmAreaBuilt: decimal("dcmAreaBuilt", { precision: 10, scale: 2 }),
  
  // Rooms
  intRooms: int("intRooms"),
  intBedrooms: int("intBedrooms"),
  intSuites: int("intSuites"),
  intBathrooms: int("intBathrooms"),
  intGarage: int("intGarage"),
  
  // Financial
  dcmSale: decimal("dcmSale", { precision: 15, scale: 2 }),
  dcmRentNetValue: decimal("dcmRentNetValue", { precision: 15, scale: 2 }),
  dcmCondoValue: decimal("dcmCondoValue", { precision: 15, scale: 2 }),
  dcmPropertyTax: decimal("dcmPropertyTax", { precision: 15, scale: 2 }),
  
  // Address
  chrAddressPostalCode: varchar("chrAddressPostalCode", { length: 20 }),
  chrAddressStreet: text("chrAddressStreet"),
  chrAddressNumber: varchar("chrAddressNumber", { length: 20 }),
  chrAddressComplement: varchar("chrAddressComplement", { length: 255 }),
  chrAddressNeighborhood: varchar("chrAddressNeighborhood", { length: 255 }),
  chrAddressCity: varchar("chrAddressCity", { length: 255 }),
  chrAddressCityCode: varchar("chrAddressCityCode", { length: 20 }),
  chrAddressState: varchar("chrAddressState", { length: 2 }),
  
  // Condo
  chrCondoName: varchar("chrCondoName", { length: 255 }),
  fkCondo: int("fkCondo"),
  
  // Building info
  intBuiltYear: int("intBuiltYear"),
  intFloors: int("intFloors"),
  
  // Company/Imobiliária
  companyId: varchar("companyId", { length: 64 }), // Baggio company reference
  
  // Indicadores
  chrPurpose: varchar("chrPurpose", { length: 50 }), // SALE, RENT, etc
  isActive: int("isActive").default(1), // 1 = ativo, 0 = inativo
  dteNewListing: timestamp("dteNewListing"), // Data de Angariação
  dteTermination: timestamp("dteTermination"), // Data de Baixa
  
  // Sync metadata
  lastSyncedAt: timestamp("lastSyncedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  // Indexes for fast search
  referenceIdx: index("idx_properfy_reference").on(table.chrReference),
  postalCodeIdx: index("idx_properfy_postal_code").on(table.chrAddressPostalCode),
  cityCodeIdx: index("idx_properfy_city_code").on(table.chrAddressCityCode),
}));

export type ProperfyProperty = typeof properfyProperties.$inferSelect;
export type InsertProperfyProperty = typeof properfyProperties.$inferInsert;

/**
 * Historical Sales (Vendas Históricas 2024 e anteriores)
 * Tabela separada para dados importados do Excel sem campos obrigatórios
 */
export const historicalSales = mysqlTable("historicalSales", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  // Dados do Imóvel
  propertyReference: varchar("propertyReference", { length: 100 }), // Referência Properfy (ex: BG93417004 ou "S REF")
  propertyAddress: text("propertyAddress"), // Endereço completo
  propertyNeighborhood: varchar("propertyNeighborhood", { length: 255 }), // Bairro
  businessType: varchar("businessType", { length: 100 }), // Prontos/Lançamentos
  // Datas
  saleDate: timestamp("saleDate"), // Data da Venda
  acquisitionDate: timestamp("acquisitionDate"), // Data da Angariação
  // Valores
  listingPrice: decimal("listingPrice", { precision: 15, scale: 2 }), // Valor de Divulgação
  salePrice: decimal("salePrice", { precision: 15, scale: 2 }), // Valor Venda
  commissionAmount: decimal("commissionAmount", { precision: 15, scale: 2 }), // Comissão (R$)
  commissionPercentage: decimal("commissionPercentage", { precision: 5, scale: 2 }), // % Comissão
  // Corretores
  acquisitionBrokerName: varchar("acquisitionBrokerName", { length: 255 }), // Angariador
  saleBrokerName: varchar("saleBrokerName", { length: 255 }), // Vendedor
  // Lojas
  acquisitionStore: varchar("acquisitionStore", { length: 100 }), // Loja Angariadora
  saleStore: varchar("saleStore", { length: 100 }), // Loja Vendedora
  // Outros
  clientSource: varchar("clientSource", { length: 255 }), // De onde veio o cliente
  paymentMethod: varchar("paymentMethod", { length: 255 }), // Forma de Pagamento
  // Status (sempre "commission_paid" para histórico)
  status: varchar("status", { length: 50 }).default("commission_paid"),
  // Metadados
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type HistoricalSale = typeof historicalSales.$inferSelect;
export type InsertHistoricalSale = typeof historicalSales.$inferInsert;


/**
 * Indicadores - Snapshot mensal imutável
 * Congela os valores de indicadores no último dia de cada mês
 */
export const monthlyIndicatorsSnapshot = mysqlTable("monthlyIndicatorsSnapshot", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  year: int("year").notNull(),
  month: int("month").notNull(), // 1-12
  
  // Indicadores do Sistema de Vendas (16)
  negociosValor: decimal("negociosValor", { precision: 15, scale: 2 }), // Soma valor vendas
  negociosUnidades: int("negociosUnidades"), // Contagem vendas
  vendidosCancelados: int("vendidosCancelados"), // Vendas canceladas
  comissaoRecebida: decimal("comissaoRecebida", { precision: 15, scale: 2 }), // Comissões pagas
  comissaoVendida: decimal("comissaoVendida", { precision: 15, scale: 2 }), // Comissões geradas
  comissaoPendente: decimal("comissaoPendente", { precision: 15, scale: 2 }), // Comissões pendentes
  percentualComissaoVendida: decimal("percentualComissaoVendida", { precision: 5, scale: 2 }), // % Comissão
  negociosAcima1M: int("negociosAcima1M"), // Vendas >= 1M
  prazoMedioRecebimento: int("prazoMedioRecebimento"), // Dias médios
  percentualCanceladaPendente: decimal("percentualCanceladaPendente", { precision: 5, scale: 2 }), // %
  valorMedioImovel: decimal("valorMedioImovel", { precision: 15, scale: 2 }), // Valor médio
  negociosRede: int("negociosRede"), // Vendas UNA
  negociosInternos: int("negociosInternos"), // Vendas internas
  negociosParceriaExterna: int("negociosParceriaExterna"), // Parcerias externas
  negociosLancamentos: int("negociosLancamentos"), // Lançamentos
  
  // Indicadores do Properfy (5)
  carteiraAtiva: int("carteiraAtiva"), // Imóveis ativos
  angariacesMes: int("angariacesMes"), // Angariações
  baixasMes: int("baixasMes"), // Baixas
  vsoVendaOferta: decimal("vsoVendaOferta", { precision: 5, scale: 2 }), // VSO
  atendimentosProntos: int("atendimentosProntos"), // Atendimentos prontos
  atendimentosLancamentos: int("atendimentosLancamentos"), // Atendimentos lançamentos
  
  // Indicadores Manuais (5)
  despesaGeral: decimal("despesaGeral", { precision: 15, scale: 2 }), // Manual
  despesaImpostos: decimal("despesaImpostos", { precision: 15, scale: 2 }), // Manual
  fundoInovacao: decimal("fundoInovacao", { precision: 15, scale: 2 }), // Manual
  resultadoSocios: decimal("resultadoSocios", { precision: 15, scale: 2 }), // Manual
  fundoEmergencial: decimal("fundoEmergencial", { precision: 15, scale: 2 }), // Manual
  
  // Metadados
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type MonthlyIndicatorsSnapshot = typeof monthlyIndicatorsSnapshot.$inferSelect;
export type InsertMonthlyIndicatorsSnapshot = typeof monthlyIndicatorsSnapshot.$inferInsert;

/**
 * Metas de Indicadores
 * Armazena meta mensal e média anual para cada indicador
 */
export const indicatorGoals = mysqlTable("indicatorGoals", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  indicatorName: varchar("indicatorName", { length: 255 }).notNull(),
  year: int("year").notNull(),
  monthlyGoal: decimal("monthlyGoal", { precision: 15, scale: 2 }),
  annualAverage: decimal("annualAverage", { precision: 15, scale: 2 }),
  createdBy: varchar("createdBy", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type IndicatorGoal = typeof indicatorGoals.$inferSelect;
export type InsertIndicatorGoal = typeof indicatorGoals.$inferInsert;

/**
 * Detalhes de Indicadores
 * Armazena IDs que compuseram cada cálculo para auditoria
 */
export const indicatorDetails = mysqlTable("indicatorDetails", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  snapshotId: varchar("snapshotId", { length: 64 }), // Referência ao snapshot
  indicatorName: varchar("indicatorName", { length: 255 }).notNull(),
  year: int("year").notNull(),
  month: int("month").notNull(),
  relatedIds: text("relatedIds"), // JSON array de IDs que compuseram o cálculo
  createdAt: timestamp("createdAt").defaultNow(),
});

export type IndicatorDetail = typeof indicatorDetails.$inferSelect;
export type InsertIndicatorDetail = typeof indicatorDetails.$inferInsert;

/**
 * Properfy Leads/Atendimentos
 * Sincronizados do endpoint /api/crm/lead do Properfy
 */
export const properfyLeads = mysqlTable("properfyLeads", {
  id: varchar("id", { length: 64 }).primaryKey(),
  propertyId: varchar("propertyId", { length: 64 }), // Referência ao imóvel (properfyProperties.id)
  leadId: varchar("leadId", { length: 64 }).notNull(), // ID do lead no Properfy
  leadName: varchar("leadName", { length: 255 }), // Nome do lead/cliente
  leadEmail: varchar("leadEmail", { length: 320 }), // Email do lead
  leadPhone: varchar("leadPhone", { length: 20 }), // Telefone do lead
  leadType: mysqlEnum("leadType", ["ready", "launch", "other"]).default("other"), // Tipo de imóvel: pronto, lançamento, outro
  status: varchar("status", { length: 64 }).default("active"), // Status do lead: active, converted, lost, etc
  createdAt: timestamp("createdAt"), // Data de criação do lead no Properfy
  updatedAt: timestamp("updatedAt"), // Data de última atualização
  syncedAt: timestamp("syncedAt").defaultNow(), // Data de sincronização com nosso banco
});

export type ProperfyLead = typeof properfyLeads.$inferSelect;
export type InsertProperfyLead = typeof properfyLeads.$inferInsert;


/**
 * Dados Manuais de Indicadores
 * Armazena valores inseridos manualmente pelos gerentes
 * Inclui: Despesa Geral, Despesa com Impostos, Fundo Inovação, Resultado Sócios, Fundo Emergencial
 */
export const indicatorManualData = mysqlTable("indicatorManualData", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  year: int("year").notNull(),
  month: int("month").notNull(),
  
  // Dados manuais (valores padrão = 0)
  despesaGeral: decimal("despesaGeral", { precision: 15, scale: 2 }).default("0"),
  despesaImpostos: decimal("despesaImpostos", { precision: 15, scale: 2 }).default("0"),
  fundoInovacao: decimal("fundoInovacao", { precision: 15, scale: 2 }).default("0"),
  resultadoSocios: decimal("resultadoSocios", { precision: 15, scale: 2 }).default("0"),
  fundoEmergencial: decimal("fundoEmergencial", { precision: 15, scale: 2 }).default("0"),
  
  // Auditoria
  updatedBy: varchar("updatedBy", { length: 64 }).notNull(), // ID do gerente que atualizou
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type IndicatorManualData = typeof indicatorManualData.$inferSelect;
export type InsertIndicatorManualData = typeof indicatorManualData.$inferInsert;


/**
 * Auditoria de Dados Manuais de Indicadores
 * Rastreia todas as edições realizadas nos dados manuais
 * Permite visualizar histórico completo de alterações
 */
export const indicatorAuditLog = mysqlTable("indicatorAuditLog", {
  id: varchar("id", { length: 64 }).primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  year: int("year").notNull(),
  month: int("month").notNull(),
  
  // Campo que foi alterado
  fieldName: varchar("fieldName", { length: 64 }).notNull(), // Ex: "despesaGeral", "despesaImpostos", etc
  
  // Valores antes e depois
  previousValue: decimal("previousValue", { precision: 15, scale: 2 }), // Valor anterior (null se nova criação)
  newValue: decimal("newValue", { precision: 15, scale: 2 }).notNull(), // Novo valor
  
  // Quem fez a alteração
  editedBy: varchar("editedBy", { length: 64 }).notNull(), // ID do usuário que fez a edição
  editedByName: varchar("editedByName", { length: 255 }), // Nome do usuário para referência rápida
  
  // Quando foi alterado
  editedAt: timestamp("editedAt").defaultNow(),
  
  // Observações opcionais
  notes: text("notes"), // Motivo da alteração (opcional)
});

export type IndicatorAuditLog = typeof indicatorAuditLog.$inferSelect;
export type InsertIndicatorAuditLog = typeof indicatorAuditLog.$inferInsert;
