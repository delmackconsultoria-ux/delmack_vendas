/**
 * Serviço de Histórico de Vendas para Auditoria
 * Registra todas as alterações feitas em vendas
 */

import { getDb } from "./db";
import { salesHistory } from "../drizzle/schema";
import { v4 as uuidv4 } from "uuid";
import { eq, desc } from "drizzle-orm";

export interface HistoryEntry {
  saleId: string;
  companyId: string;
  changedBy: string;
  changedByName?: string;
  action: "create" | "update" | "delete" | "status_change" | "approval" | "rejection";
  fieldName?: string;
  previousValue?: string;
  newValue?: string;
  changeReason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra uma entrada no histórico de alterações
 */
export async function logSaleChange(entry: HistoryEntry): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[SalesHistory] Database not available");
      return false;
    }

    await db.insert(salesHistory).values({
      id: uuidv4(),
      saleId: entry.saleId,
      companyId: entry.companyId,
      changedBy: entry.changedBy,
      changedByName: entry.changedByName || null,
      action: entry.action,
      fieldName: entry.fieldName || null,
      previousValue: entry.previousValue || null,
      newValue: entry.newValue || null,
      changeReason: entry.changeReason || null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
    });

    return true;
  } catch (error) {
    console.error("[SalesHistory] Error logging change:", error);
    return false;
  }
}

/**
 * Registra criação de uma venda
 */
export async function logSaleCreation(
  saleId: string,
  companyId: string,
  userId: string,
  userName: string,
  saleData: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  return logSaleChange({
    saleId,
    companyId,
    changedBy: userId,
    changedByName: userName,
    action: "create",
    fieldName: "sale",
    newValue: JSON.stringify(saleData),
    ipAddress,
    userAgent,
  });
}

/**
 * Registra atualização de campos de uma venda
 */
export async function logSaleUpdate(
  saleId: string,
  companyId: string,
  userId: string,
  userName: string,
  changes: Array<{ field: string; oldValue: any; newValue: any }>,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Registrar cada campo alterado separadamente
    for (const change of changes) {
      await db.insert(salesHistory).values({
        id: uuidv4(),
        saleId,
        companyId,
        changedBy: userId,
        changedByName: userName,
        action: "update",
        fieldName: change.field,
        previousValue: String(change.oldValue ?? ""),
        newValue: String(change.newValue ?? ""),
        changeReason: reason || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    }

    return true;
  } catch (error) {
    console.error("[SalesHistory] Error logging update:", error);
    return false;
  }
}

/**
 * Registra mudança de status de uma venda
 */
export async function logStatusChange(
  saleId: string,
  companyId: string,
  userId: string,
  userName: string,
  previousStatus: string,
  newStatus: string,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  return logSaleChange({
    saleId,
    companyId,
    changedBy: userId,
    changedByName: userName,
    action: "status_change",
    fieldName: "status",
    previousValue: previousStatus,
    newValue: newStatus,
    changeReason: reason,
    ipAddress,
    userAgent,
  });
}

/**
 * Busca histórico de alterações de uma venda
 */
export async function getSaleHistory(saleId: string): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const history = await db
      .select()
      .from(salesHistory)
      .where(eq(salesHistory.saleId, saleId))
      .orderBy(desc(salesHistory.createdAt));

    return history;
  } catch (error) {
    console.error("[SalesHistory] Error fetching history:", error);
    return [];
  }
}

/**
 * Formata o nome do campo para exibição
 */
export function formatFieldName(fieldName: string): string {
  const fieldLabels: Record<string, string> = {
    saleValue: "Valor da Venda",
    buyerName: "Nome do Comprador",
    buyerCpfCnpj: "CPF/CNPJ do Comprador",
    sellerName: "Nome do Vendedor",
    sellerCpfCnpj: "CPF/CNPJ do Vendedor",
    status: "Status",
    businessType: "Tipo de Negócio",
    paymentMethod: "Forma de Pagamento",
    brokerAngariador: "Corretor Angariador",
    brokerVendedor: "Corretor Vendedor",
    totalCommission: "Comissão Total",
    angariadorCommission: "Comissão Angariador",
    vendedorCommission: "Comissão Vendedor",
    observation: "Observações",
    saleDate: "Data da Venda",
    expectedPaymentDate: "Previsão de Recebimento",
  };
  return fieldLabels[fieldName] || fieldName;
}

/**
 * Formata a ação para exibição
 */
export function formatAction(action: string): string {
  const actionLabels: Record<string, string> = {
    create: "Criação",
    update: "Atualização",
    delete: "Exclusão",
    status_change: "Mudança de Status",
    approval: "Aprovação",
    rejection: "Rejeição",
  };
  return actionLabels[action] || action;
}
