/**
 * Historical Sales Router
 * Endpoints para consultar vendas históricas importadas do Excel (2024 e anteriores)
 * Estas vendas NÃO passam por fluxo de aprovação (status fixo: "commission_paid")
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getCompanyHistoricalSales,
  getBrokerHistoricalSales,
  getHistoricalSaleById,
  countCompanyHistoricalSales,
  countBrokerHistoricalSales,
} from "../db";

export const historicalSalesRouter = router({
  /**
   * List all historical sales for the company
   * Gerente/Financeiro/Visualizador: veem todas
   * Corretor: vê apenas suas próprias
   */
  list: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12).optional(),
        year: z.number().min(2020).max(2030).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      
      if (!user.companyId) {
        throw new Error("Usuário sem empresa vinculada");
      }

      let sales;

      // Corretores veem apenas suas próprias vendas
      if (user.role === "broker") {
        sales = await getBrokerHistoricalSales(user.companyId, user.name || "");
      } else {
        // Gerente, Financeiro, Visualizador veem todas
        sales = await getCompanyHistoricalSales(user.companyId);
      }

      // Filtrar por mês/ano se fornecido
      if (input.month || input.year) {
        sales = sales.filter((sale) => {
          if (!sale.saleDate) return false;
          
          const saleDate = new Date(sale.saleDate);
          
          if (input.month && saleDate.getMonth() + 1 !== input.month) {
            return false;
          }
          
          if (input.year && saleDate.getFullYear() !== input.year) {
            return false;
          }
          
          return true;
        });
      }

      return sales;
    }),

  /**
   * Get a single historical sale by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      
      const sale = await getHistoricalSaleById(input.id);
      
      if (!sale) {
        throw new Error("Venda histórica não encontrada");
      }
      
      // Verificar permissão
      if (sale.companyId !== user.companyId) {
        throw new Error("Acesso negado");
      }
      
      // Corretores só podem ver suas próprias vendas
      if (user.role === "broker") {
        const isOwner =
          sale.acquisitionBrokerName === user.name ||
          sale.saleBrokerName === user.name;
        
        if (!isOwner) {
          throw new Error("Acesso negado");
        }
      }
      
      return sale;
    }),

  /**
   * Count historical sales
   */
  count: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    
    if (!user.companyId) {
      return 0;
    }

    if (user.role === "broker") {
      return countBrokerHistoricalSales(user.companyId, user.name || "");
    }
    
    return countCompanyHistoricalSales(user.companyId);
  }),

  /**
   * Get statistics (total sales value, total commission, etc.)
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    
    if (!user.companyId) {
      return {
        totalSales: 0,
        totalValue: 0,
        totalCommission: 0,
        avgCommissionPercent: 0,
      };
    }

    let sales;
    
    if (user.role === "broker") {
      sales = await getBrokerHistoricalSales(user.companyId, user.name || "");
    } else {
      sales = await getCompanyHistoricalSales(user.companyId);
    }

    const totalSales = sales.length;
    const totalValue = sales.reduce((sum, sale) => sum + Number(sale.salePrice || 0), 0);
    const totalCommission = sales.reduce((sum, sale) => sum + Number(sale.commissionAmount || 0), 0);
    const avgCommissionPercent = totalSales > 0
      ? sales.reduce((sum, sale) => sum + Number(sale.commissionPercentage || 0), 0) / totalSales
      : 0;

    return {
      totalSales,
      totalValue,
      totalCommission,
      avgCommissionPercent,
    };
  }),
});
