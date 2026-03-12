/**
 * Router tRPC para notificações
 * Responsável por enviar notificações para usuários
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { emailService } from "./emailService";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";

export const notificationRouter = router({
  /**
   * Envia notificação de nova venda para todos os interessados
   */
  notifySaleCreated: protectedProcedure
    .input(
      z.object({
        brokerName: z.string(),
        brokerEmail: z.string().email(),
        propertyAddress: z.string().optional(),
        saleValue: z.number(),
        commissionValue: z.number(),
        commissionType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          console.warn("[Notification] Database not available");
          return { success: false };
        }

        // Enviar email para o corretor
        await emailService.notifySaleCreated(input.brokerEmail, {
          brokerName: input.brokerName,
          propertyAddress: input.propertyAddress,
          saleValue: input.saleValue,
          commissionValue: input.commissionValue,
          commissionType: input.commissionType,
        });

        // Buscar gerente e financeiro para notificar
        const managers = await db
          .select()
          .from(users)
          .where(eq(users.role, "manager"));

        const finances = await db
          .select()
          .from(users)
          .where(eq(users.role, "finance"));

        // Enviar emails para gerentes
        for (const manager of managers) {
          if (manager.email) {
            await emailService.notifyManagerSaleCreated(manager.email, {
              brokerName: input.brokerName,
              propertyAddress: input.propertyAddress,
              saleValue: input.saleValue,
              commissionValue: input.commissionValue,
              commissionType: input.commissionType,
            });
          }
        }

        // Enviar emails para financeiro
        for (const finance of finances) {
          if (finance.email) {
            await emailService.notifyFinanceSaleCreated(finance.email, {
              brokerName: input.brokerName,
              propertyAddress: input.propertyAddress,
              saleValue: input.saleValue,
              commissionValue: input.commissionValue,
              commissionType: input.commissionType,
            });
          }
        }

        return { success: true };
      } catch (error) {
        console.error("[Notification] Erro ao enviar notificações:", error);
        return { success: false };
      }
    }),

  /**
   * Envia notificação de aprovação/rejeição de venda
   */
  notifySaleApproval: protectedProcedure
    .input(
      z.object({
        brokerEmail: z.string().email(),
        brokerName: z.string(),
        saleValue: z.number(),
        status: z.enum(["approved", "rejected"]),
        observation: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await emailService.notifySaleApproval(input.brokerEmail, {
          brokerName: input.brokerName,
          saleValue: input.saleValue,
          status: input.status,
          observation: input.observation,
        });

        return { success: true };
      } catch (error) {
        console.error("[Notification] Erro ao enviar notificação:", error);
        return { success: false };
      }
    }),

  /**
   * Envia notificação de comissão gerada
   */
  notifyCommissionGenerated: protectedProcedure
    .input(
      z.object({
        brokerEmail: z.string().email(),
        brokerName: z.string(),
        commissionValue: z.number(),
        commissionType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await emailService.notifyCommissionGenerated(
          input.brokerEmail,
          input.brokerName,
          input.commissionValue,
          input.commissionType
        );

        return { success: true };
      } catch (error) {
        console.error("[Notification] Erro ao enviar notificação:", error);
        return { success: false };
      }
    }),

  /**
   * Envia notificação de comissão paga
   */
  notifyCommissionPaid: protectedProcedure
    .input(
      z.object({
        brokerEmail: z.string().email(),
        brokerName: z.string(),
        commissionValue: z.number(),
        paymentDate: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await emailService.notifyCommissionPaid(
          input.brokerEmail,
          input.brokerName,
          input.commissionValue,
          input.paymentDate
        );

        return { success: true };
      } catch (error) {
        console.error("[Notification] Erro ao enviar notificação:", error);
        return { success: false };
      }
    }),

  /**
   * Envia notificação de comissão pendente
   */
  notifyPendingCommission: protectedProcedure
    .input(
      z.object({
        brokerEmail: z.string().email(),
        managerEmails: z.array(z.string().email()),
        brokerName: z.string(),
        buyerName: z.string(),
        propertyAddress: z.string(),
        propertyReference: z.string().optional(),
        saleValue: z.number(),
        commissionValue: z.number(),
        expectedPaymentDate: z.date(),
        proposalId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { sendPendingCommissionNotification } = await import("./_core/emailService");
        
        await sendPendingCommissionNotification({
          brokerEmail: input.brokerEmail,
          managerEmails: input.managerEmails,
          brokerName: input.brokerName,
          buyerName: input.buyerName,
          propertyAddress: input.propertyAddress,
          propertyReference: input.propertyReference,
          saleValue: input.saleValue,
          commissionValue: input.commissionValue,
          expectedPaymentDate: input.expectedPaymentDate.toISOString(),
          proposalId: input.proposalId,
        });

        return { success: true };
      } catch (error) {
        console.error("[Notification] Erro ao enviar notificação de comissão pendente:", error);
        return { success: false };
      }
    }),

  /**
   * Envia notificação de venda cancelada
   */
  notifySaleCancelled: protectedProcedure
    .input(
      z.object({
        brokerEmail: z.string().email(),
        managerEmails: z.array(z.string().email()),
        financeEmails: z.array(z.string().email()),
        brokerName: z.string(),
        buyerName: z.string(),
        propertyAddress: z.string(),
        propertyReference: z.string().optional(),
        saleValue: z.number(),
        cancelledBy: z.string(),
        cancelledByRole: z.string(),
        cancelledAt: z.date(),
        reason: z.string(),
        proposalId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { sendSaleCancelledNotification } = await import("./_core/emailService");
        
        await sendSaleCancelledNotification({
          brokerEmail: input.brokerEmail,
          managerEmails: input.managerEmails,
          financeEmails: input.financeEmails,
          brokerName: input.brokerName,
          buyerName: input.buyerName,
          propertyAddress: input.propertyAddress,
          propertyReference: input.propertyReference,
          saleValue: input.saleValue,
          cancelledBy: input.cancelledBy,
          cancelledByRole: input.cancelledByRole,
          cancelledAt: input.cancelledAt.toISOString(),
          reason: input.reason,
          proposalId: input.proposalId,
        });

        return { success: true };
      } catch (error) {
        console.error("[Notification] Erro ao enviar notificação de venda cancelada:", error);
        return { success: false };
      }
    }),

  /**
   * Envia relatório mensal de vendas
   */
  sendMonthlyReport: protectedProcedure
    .input(
      z.object({
        recipients: z.array(z.string().email()),
        companyName: z.string(),
        month: z.number().min(1).max(12),
        year: z.number(),
        totalSales: z.number(),
        totalSalesValue: z.number(),
        totalCommissions: z.number(),
        averageTicket: z.number(),
        topBroker: z.object({
          name: z.string(),
          salesCount: z.number(),
          salesValue: z.number(),
        }),
        brokerCount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { sendMonthlyReportNotification } = await import("./_core/emailService");
        
        await sendMonthlyReportNotification({
          recipients: input.recipients,
          companyName: input.companyName,
          month: input.month,
          year: input.year,
          totalSales: input.totalSales,
          totalSalesValue: input.totalSalesValue,
          totalCommissions: input.totalCommissions,
          averageTicket: input.averageTicket,
          topBroker: input.topBroker,
          brokerCount: input.brokerCount,
        });

        return { success: true };
      } catch (error) {
        console.error("[Notification] Erro ao enviar relatório mensal:", error);
        return { success: false };
      }
    }),
});
