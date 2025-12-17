import { mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, int, boolean } from "drizzle-orm/mysql-core";
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
  role: mysqlEnum("role", ["superadmin", "admin", "manager", "broker", "finance"]).default("broker").notNull(),
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

/**
 * Companies/Imobiliárias table
 */
export const companies = mysqlTable("companies", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
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
  clientOrigin: varchar("clientOrigin", { length: 255 }), // Origin of client (Zap, Website, etc)
  paymentMethod: varchar("paymentMethod", { length: 255 }), // Payment method (À vista, Financiado, etc)
  brokerAngariador: varchar("brokerAngariador", { length: 64 }), // Broker who sourced the property
  brokerVendedor: varchar("brokerVendedor", { length: 64 }), // Broker who closed the sale
  businessType: varchar("businessType", { length: 255 }), // Type of business (Venda Interna, Parceria, etc)
  status: mysqlEnum("status", ["pending", "received", "paid", "cancelled"]).default("pending").notNull(),
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
  action: mysqlEnum("action", ["create", "update", "delete", "activate", "deactivate", "login", "reset_password", "block_user", "unblock_user"]).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ActionLog = typeof actionLogs.$inferSelect;
export type InsertActionLog = typeof actionLogs.$inferInsert;
