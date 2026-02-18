import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { salesHistory } from "../../drizzle/schema";
import { desc, sql } from "drizzle-orm";

/**
 * Router para histórico de alterações (audit trail)
 */
export const auditRouter = router({
  /**
   * Listar histórico de alterações com filtros
   */
  listAuditLogs: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        userId: z.string().optional(),
        action: z.enum(["create", "update", "delete", "status_change", "approval", "rejection"]).optional(),
        saleId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate, userId, action, saleId, limit, offset } = input;

      // Buscar todos os logs da empresa usando SQL raw
      const allLogs = await db
        .select()
        .from(salesHistory)
        .where(sql`${salesHistory.companyId} = ${ctx.user.companyId}`)
        .orderBy(desc(salesHistory.createdAt));

      // Aplicar filtros manualmente
      let filteredLogs = allLogs;

      if (startDate) {
        const startDateObj = new Date(startDate);
        filteredLogs = filteredLogs.filter(log => log.createdAt && log.createdAt >= startDateObj);
      }

      if (endDate) {
        const endDateObj = new Date(endDate);
        filteredLogs = filteredLogs.filter(log => log.createdAt && log.createdAt <= endDateObj);
      }

      if (userId) {
        filteredLogs = filteredLogs.filter(log => log.changedBy === userId);
      }

      if (action) {
        filteredLogs = filteredLogs.filter(log => log.action === action);
      }

      if (saleId) {
        filteredLogs = filteredLogs.filter(log => log.saleId === saleId);
      }

      const total = filteredLogs.length;
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);

      return {
        logs: paginatedLogs,
        total,
        hasMore: total > offset + limit,
      };
    }),

  /**
   * Buscar histórico de uma venda específica
   */
  getAuditLogsBySale: protectedProcedure
    .input(
      z.object({
        saleId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allLogs = await db
        .select()
        .from(salesHistory)
        .where(sql`${salesHistory.companyId} = ${ctx.user.companyId}`)
        .orderBy(desc(salesHistory.createdAt));

      // Filtrar por saleId manualmente
      const logs = allLogs.filter(log => log.saleId === input.saleId);

      return logs;
    }),

  /**
   * Buscar estatísticas de auditoria (para dashboard)
   */
  getAuditStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let allLogs = await db
        .select()
        .from(salesHistory)
        .where(sql`${salesHistory.companyId} = ${ctx.user.companyId}`);

      // Aplicar filtros de data
      if (input.startDate) {
        const startDateObj = new Date(input.startDate);
        allLogs = allLogs.filter(log => log.createdAt && log.createdAt >= startDateObj);
      }

      if (input.endDate) {
        const endDateObj = new Date(input.endDate);
        allLogs = allLogs.filter(log => log.createdAt && log.createdAt <= endDateObj);
      }

      // Agrupar por tipo de ação
      const statsByAction = allLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Agrupar por usuário
      const statsByUser = allLogs.reduce((acc, log) => {
        const userName = log.changedByName || "Desconhecido";
        acc[userName] = (acc[userName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: allLogs.length,
        byAction: statsByAction,
        byUser: statsByUser,
      };
    }),
});
