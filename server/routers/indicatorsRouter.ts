import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getCompanySales,
  getBrokerSales,
  getCompanyHistoricalSales,
  getBrokerHistoricalSales,
} from "../db";

/**
 * Router para cálculo de indicadores de vendas
 * Integra dados de sales (vendas atuais) + historicalSales (vendas históricas)
 */
export const indicatorsRouter = router({
  /**
   * Calcula todos os indicadores para o período selecionado
   */
  calculate: protectedProcedure
    .input(
      z.object({
        month: z.string().optional(), // "1" a "12" ou "all"
        year: z.string().optional(), // "2024", "2025" ou "all"
      })
    )
    .query(async ({ ctx, input }) => {
      const { month, year } = input;
      const companyId = ctx.user.companyId;
      if (!companyId) throw new Error("Company ID not found");
      
      const isBroker = ctx.user.role === "broker";
      const brokerId = isBroker ? ctx.user.id : undefined;

      // Buscar vendas atuais
      const currentSalesData = isBroker
        ? await getBrokerSales(brokerId!)
        : await getCompanySales(companyId);

      // Buscar vendas históricas
      const historicalSalesData = isBroker
        ? await getBrokerHistoricalSales(companyId, ctx.user.name || "")
        : await getCompanyHistoricalSales(companyId);

      // Filtrar por mês/ano
      const filterByDate = (date: Date | null) => {
        if (!date) return false;
        const d = new Date(date);
        if (year && year !== "all" && d.getFullYear() !== parseInt(year)) return false;
        if (month && month !== "all" && d.getMonth() + 1 !== parseInt(month)) return false;
        return true;
      };

      const filteredCurrentSales = currentSalesData.filter((s: any) => filterByDate(s.saleDate));
      const filteredHistoricalSales = historicalSalesData.filter((h: any) => filterByDate(h.saleDate));

      // Unificar dados
      const allSales = [
        ...filteredCurrentSales.map((s: any) => ({
          id: s.id,
          saleValue: s.saleValue || 0,
          saleDate: s.saleDate,
          listingDate: s.listingDate,
          totalCommission: s.totalCommission || 0,
          status: s.status,
          businessType: s.businessType,
          listingStore: s.listingStore,
          sellingStore: s.sellingStore,
          commissionPaymentDate: s.commissionPaymentDate,
          commissionAmountReceived: s.commissionAmountReceived || 0,
          isHistorical: false,
        })),
        ...filteredHistoricalSales.map(h => ({
          id: h.id,
          saleValue: h.salePrice ? (typeof h.salePrice === 'string' ? parseFloat(h.salePrice) : Number(h.salePrice)) : 0,
          saleDate: h.saleDate,
          listingDate: h.acquisitionDate,
          totalCommission: h.commissionAmount ? (typeof h.commissionAmount === 'string' ? parseFloat(h.commissionAmount) : Number(h.commissionAmount)) : 0,
          status: "commission_paid",
          businessType: h.businessType,
          listingStore: h.acquisitionStore,
          sellingStore: h.saleStore,
          commissionPaymentDate: h.saleDate, // Histórico já está pago
          commissionAmountReceived: h.commissionAmount ? (typeof h.commissionAmount === 'string' ? parseFloat(h.commissionAmount) : Number(h.commissionAmount)) : 0,
          isHistorical: true,
        })),
      ];

      // Calcular indicadores
      const totalSales = allSales.length;
      const totalSalesValue = allSales.reduce((sum, s) => sum + s.saleValue, 0);
      const totalCommissionValue = allSales.reduce((sum, s) => sum + s.totalCommission, 0);
      
      // Vendas canceladas
      const cancelledSales = filteredCurrentSales.filter((s: any) => s.status === "cancelled");
      const cancelledCount = cancelledSales.length;
      const cancelledValue = cancelledSales.reduce((sum: number, s: any) => sum + (s.saleValue || 0), 0);
      
      // Comissões
      const paidCommissions = allSales.filter(s => 
        s.status === "commission_paid" && s.commissionAmountReceived > 0
      );
      const paidCommissionValue = paidCommissions.reduce((sum, s) => sum + s.commissionAmountReceived, 0);
      
      const pendingCommissions = filteredCurrentSales.filter((s: any) => 
        ["sale", "manager_review", "finance_review"].includes(s.status)
      );
      const pendingCommissionValue = pendingCommissions.reduce((sum: number, s: any) => sum + (s.totalCommission || 0), 0);
      
      // Tempo médio de venda (angariação → venda)
      const salesWithDates = allSales.filter(s => s.saleDate && s.listingDate);
      let avgSaleDays = 0;
      if (salesWithDates.length > 0) {
        const totalDays = salesWithDates.reduce((sum: number, s: any) => {
          const days = Math.floor(
            (new Date(s.saleDate!).getTime() - new Date(s.listingDate!).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0);
        avgSaleDays = Math.round(totalDays / salesWithDates.length);
      }
      
      // Prazo médio de recebimento (venda → pagamento)
      const paidSalesWithDates = paidCommissions.filter(s => s.saleDate && s.commissionPaymentDate);
      let avgPaymentDays = 0;
      if (paidSalesWithDates.length > 0) {
        const totalDays = paidSalesWithDates.reduce((sum: number, s: any) => {
          const days = Math.floor(
            (new Date(s.commissionPaymentDate!).getTime() - new Date(s.saleDate!).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0);
        avgPaymentDays = Math.round(totalDays / paidSalesWithDates.length);
      }
      
      // Valor médio do imóvel
      const avgPropertyValue = totalSales > 0 ? totalSalesValue / totalSales : 0;
      
      // % Comissão média
      const avgCommissionPercent = totalSalesValue > 0 ? (totalCommissionValue / totalSalesValue) * 100 : 0;
      
      // Negócios por tipo
      const prontosSales = allSales.filter(s => s.businessType === "Prontos");
      const lancamentosSales = allSales.filter(s => s.businessType === "Lançamentos");
      
      // Negócios por parceria
      const internosSales = allSales.filter(s => 
        s.listingStore === "Baggio" && s.sellingStore === "Baggio"
      );
      const redeSales = allSales.filter(s => 
        (s.listingStore === "Baggio" && s.sellingStore === "Rede UNA") ||
        (s.listingStore === "Rede UNA" && s.sellingStore === "Baggio")
      );
      const parceriaExternaSales = allSales.filter(s => 
        s.listingStore === "Outros" || s.sellingStore === "Outros"
      );
      
      // Negócios de 1 a 1 milhão
      const salesBetween1M = allSales.filter(s => 
        s.saleValue >= 1000000 && s.saleValue <= 1000000
      );

      return {
        totalSales,
        totalSalesValue,
        totalCommissionValue,
        cancelledCount,
        cancelledValue,
        paidCommissionValue,
        pendingCommissionValue,
        avgSaleDays,
        avgPaymentDays,
        avgPropertyValue,
        avgCommissionPercent,
        prontosCount: prontosSales.length,
        prontosValue: prontosSales.reduce((sum, s) => sum + s.saleValue, 0),
        lancamentosCount: lancamentosSales.length,
        lancamentosValue: lancamentosSales.reduce((sum, s) => sum + s.saleValue, 0),
        internosCount: internosSales.length,
        redeCount: redeSales.length,
        parceriaExternaCount: parceriaExternaSales.length,
        salesBetween1MCount: salesBetween1M.length,
      };
    }),
});
