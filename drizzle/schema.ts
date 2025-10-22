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
  role: mysqlEnum("role", ["admin", "manager", "broker", "finance"]).default("broker").notNull(),
  companyId: varchar("companyId", { length: 64 }), // Company/Imobiliária reference
  isActive: boolean("isActive").default(true),
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
  logo: text("logo"), // URL to company logo
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
