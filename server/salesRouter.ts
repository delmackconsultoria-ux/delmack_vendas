/**
 * Router tRPC para gerenciar vendas e comissões
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sales, commissions } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const salesRouter = router({
  /**
   * Criar nova venda
   */
  createSale: protectedProcedure
    .input(
      z.object({
        propertyType: z.enum(["baggio", "external"]),
        propertyReference: z.string().optional(),
        propertyAddress: z.string().min(1),
        propertyCity: z.string().min(1),
        propertyState: z.string().min(2).max(2),
        propertyZipCode: z.string().optional(),
        propertyValue: z.number().positive(),
        saleValue: z.number().positive(),
        commissionType: z.enum(["angariacao", "venda", "parceria"]),
        buyerName: z.string().min(1),
        buyerEmail: z.string().email(),
        buyerPhone: z.string().optional(),
        observations: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Calcular comissão baseado no tipo
        let commissionPercentage = 5; // padrão
        if (input.commissionType === "angariacao") {
          commissionPercentage = 3;
        } else if (input.commissionType === "parceria") {
          commissionPercentage = 7;
        }

        const commissionValue = (input.saleValue * commissionPercentage) / 100;

        const saleId = uuidv4();
        const commissionId = uuidv4();

        // Criar venda
        await db.insert(sales).values([
          {
            id: saleId,
            companyId: ctx.user.companyId || "1",
            propertyId: uuidv4(), // TODO: vincular com propriedade real
            buyerName: input.buyerName,
            saleValue: input.saleValue.toString(),
            brokerVendedor: ctx.user.id,
            businessType: input.commissionType,
            status: "pending",
            observation: input.observations,
          },
        ]);

        // Criar comissão automaticamente
        await db.insert(commissions).values([
          {
            id: commissionId,
            saleId: saleId,
            companyId: ctx.user.companyId || "1",
            brokerId: ctx.user.id,
            commissionValue: commissionValue.toString(),
            commissionPercentage: commissionPercentage.toString(),
            type: input.commissionType,
            status: "pending",
          },
        ]);

        return {
          success: true,
          saleId: saleId,
          commissionValue: commissionValue,
        };
      } catch (error) {
        console.error("[Sales Router] Erro ao criar venda:", error);
        throw new Error("Erro ao registrar venda");
      }
    }),

  /**
   * Listar vendas do corretor
   */
  listMySales: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(10),
        status: z.enum(["pending", "received", "paid", "cancelled"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // TODO: Implementar paginação e filtros
        const userSales = await db
          .select()
          .from(sales)
          .where(eq(sales.brokerVendedor, ctx.user.id));

        return {
          success: true,
          data: userSales,
          total: userSales.length,
        };
      } catch (error) {
        console.error("[Sales Router] Erro ao listar vendas:", error);
        throw new Error("Erro ao listar vendas");
      }
    }),

  /**
   * Listar todas as vendas (gerente/financeiro)
   */
  listAllSales: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(10),
        status: z.enum(["pending", "received", "paid", "cancelled"]).optional(),
        brokerId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Apenas gerente e financeiro podem ver todas as vendas
        if (ctx.user.role !== "manager" && ctx.user.role !== "finance") {
          throw new Error("Acesso negado");
        }

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // TODO: Implementar paginação e filtros
        const allSales = await db.select().from(sales);

        return {
          success: true,
          data: allSales,
          total: allSales.length,
        };
      } catch (error) {
        console.error("[Sales Router] Erro ao listar vendas:", error);
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
        // Apenas gerente e financeiro podem atualizar status
        if (ctx.user.role !== "manager" && ctx.user.role !== "finance") {
          throw new Error("Acesso negado");
        }

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Atualizar venda
        await db
          .update(sales)
          .set({
            status: input.status,
            observation: input.observation,
            updatedAt: new Date(),
          })
          .where(eq(sales.id, input.saleId));

        // Se recebido, atualizar comissão também
        if (input.status === "received") {
          await db
            .update(commissions)
            .set({
              status: "received",
              updatedAt: new Date(),
            })
            .where(eq(commissions.saleId, input.saleId));
        }

        // Se pago, marcar comissão como paga
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
          message: "Status atualizado com sucesso",
        };
      } catch (error) {
        console.error("[Sales Router] Erro ao atualizar status:", error);
        throw new Error("Erro ao atualizar status");
      }
    }),

  /**
   * Listar comissões
   */
  listCommissions: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(10),
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

        let commissionsList: any[] = [];
        if (ctx.user.role === "broker") {
          commissionsList = await db
            .select()
            .from(commissions)
            .where(eq(commissions.brokerId, ctx.user.id));
        } else {
          commissionsList = await db.select().from(commissions);
        }

        // TODO: Implementar filtros de status e paginação
        const allCommissions = commissionsList;

        return {
          success: true,
          data: allCommissions,
          total: allCommissions.length,
        };
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

      const userCommissions = await db
        .select()
        .from(commissions)
        .where(eq(commissions.brokerId, ctx.user.id));

      const pending = userCommissions
        .filter((c) => c.status === "pending")
        .reduce((sum, c) => {
          const value = typeof c.commissionValue === "string" 
            ? parseFloat(c.commissionValue) 
            : (c.commissionValue || 0);
          return sum + value;
        }, 0);

      const received = userCommissions
        .filter((c) => c.status === "received")
        .reduce((sum, c) => {
          const value = typeof c.commissionValue === "string" 
            ? parseFloat(c.commissionValue) 
            : (c.commissionValue || 0);
          return sum + value;
        }, 0);

      const paid = userCommissions
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => {
          const value = typeof c.commissionValue === "string" 
            ? parseFloat(c.commissionValue) 
            : (c.commissionValue || 0);
          return sum + value;
        }, 0);

      return {
        success: true,
        data: {
          pending,
          received,
          paid,
          total: pending + received + paid,
        },
      };
    } catch (error) {
      console.error("[Sales Router] Erro ao obter resumo:", error);
      throw new Error("Erro ao obter resumo de comissões");
    }
  }),
});

