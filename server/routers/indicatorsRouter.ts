import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as salesIndicators from "../indicators/salesIndicators";
import * as properfyIndicators from "../indicators/properfyIndicators";
import * as properfyLeadsSync from "../indicators/properfyLeadsSync";
import { getDb } from "../db";
import { indicatorGoals } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const indicatorsRouter = router({
  /**
   * Obter todos os indicadores em tempo real para um período
   * Busca dados de sales apenas - usa status 'commission_paid' para diferenciar histórico
   */
  getRealtimeIndicators: publicProcedure
    .input(
      z.object({
        companyId: z.string(),
        year: z.number(),
        month: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { companyId, year, month } = input;

      // Calcular datas do mês
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      // Mês anterior para VSO
      const prevMonthStart = new Date(year, month - 2, 1);
      const prevMonthEnd = new Date(year, month - 1, 0);

      try {
        // Indicadores do Sistema de Vendas
        const salesValue = await salesIndicators.calculateSalesValueMonth(
          companyId,
          startDate,
          endDate
        );
        const salesCount = await salesIndicators.calculateSalesCountMonth(
          companyId,
          startDate,
          endDate
        );
        const cancelledSales = await salesIndicators.calculateCancelledSalesCount(
          companyId,
          startDate,
          endDate
        );
        const commissionReceived = await salesIndicators.calculateCommissionReceived(
          companyId,
          startDate,
          endDate
        );
        const commissionSold = await salesIndicators.calculateCommissionSold(
          companyId,
          startDate,
          endDate
        );
        const commissionPending = await salesIndicators.calculateCommissionPending(
          companyId,
          startDate,
          endDate
        );
        const percentCommission = await salesIndicators.calculatePercentCommissionSold(
          companyId,
          startDate,
          endDate
        );
        const salesAbove1M = await salesIndicators.calculateSalesAbove1M(
          companyId,
          startDate,
          endDate
        );
        const avgPaymentDays = await salesIndicators.calculateAvgPaymentDays(
          companyId,
          startDate,
          endDate
        );
        const percentCancelledPending = await salesIndicators.calculatePercentCancelledPending(
          companyId,
          startDate,
          endDate
        );
        const avgPropertyValue = await salesIndicators.calculateAvgPropertyValue(
          companyId,
          startDate,
          endDate
        );
        const salesUNA = await salesIndicators.calculateSalesUNA(
          companyId,
          startDate,
          endDate
        );
        const salesInternal = await salesIndicators.calculateSalesInternal(
          companyId,
          startDate,
          endDate
        );
        const salesExternalPartner = await salesIndicators.calculateSalesExternalPartner(
          companyId,
          startDate,
          endDate
        );
        const salesLaunch = await salesIndicators.calculateSalesLaunch(
          companyId,
          startDate,
          endDate
        );

        // Indicadores do Properfy
        const activeProperties = await properfyIndicators.calculateActivePropertiesCount(
          startDate,
          endDate
        );
        const angariations = await properfyIndicators.calculateAngariationsCount(
          startDate,
          endDate
        );
        const removedProperties = await properfyIndicators.calculateRemovedPropertiesCount(
          startDate,
          endDate
        );
        const prevMonthActiveProperties = await properfyIndicators.calculateActivePropertiesCount(
          prevMonthStart,
          prevMonthEnd
        );
        const vso = await properfyIndicators.calculateVSO(
          salesCount,
          prevMonthActiveProperties
        );
        const readyAttendances = await properfyIndicators.calculateReadyAttendances(
          startDate,
          endDate
        );
        const launchAttendances = await properfyIndicators.calculateLaunchAttendances(
          startDate,
          endDate
        );

        return {
          isHistorical: false,
          period: `${MONTH_NAMES[month - 1]}/${year}`,
          // Sistema de Vendas
          negociosValor: salesValue.value,
          negociosUnidades: salesCount,
          vendidosCancelados: cancelledSales,
          comissaoRecebida: commissionReceived,
          comissaoVendida: commissionSold,
          comissaoPendente: commissionPending,
          percentualComissaoVendida: percentCommission,
          negociosAcima1M: salesAbove1M,
          prazoMedioRecebimento: avgPaymentDays,
          percentualCanceladaPendente: percentCancelledPending,
          valorMedioImovel: avgPropertyValue,
          negociosRede: salesUNA,
          negociosInternos: salesInternal,
          negociosParceriaExterna: salesExternalPartner,
          negociosLancamentos: salesLaunch,

          // Properfy
          carteiraAtiva: activeProperties,
          angariacesMes: angariations,
          baixasMes: removedProperties,
          vsoVendaOferta: vso,
          atendimentosProntos: readyAttendances,
          atendimentosLancamentos: launchAttendances,

          // Manuais (valores padrão - devem ser preenchidos manualmente)
          despesaGeral: 0,
          despesaImpostos: 0,
          fundoInovacao: 0,
          resultadoSocios: 0,
          fundoEmergencial: 0,
        };
      } catch (error) {
        console.error("[Indicators] Erro ao calcular indicadores:", error);
        throw error;
      }
    }),

  /**
   * Obter metas de indicadores
   */
  getIndicatorGoals: publicProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ input }) => {
      // TODO: Implementar busca de metas do banco
      return {
        negociosValor: 100000,
        negociosUnidades: 10,
        vendidosCancelados: 0,
        comissaoRecebida: 50000,
        comissaoVendida: 75000,
        comissaoPendente: 25000,
        percentualComissaoVendida: 5,
        negociosAcima1M: 2,
        prazoMedioRecebimento: 30,
        percentualCanceladaPendente: 10,
        valorMedioImovel: 500000,
        negociosRede: 3,
        negociosInternos: 4,
        negociosParceriaExterna: 2,
        negociosLancamentos: 1,
        carteiraAtiva: 100,
        angariacesMes: 10,
        baixasMes: 5,
        vsoVendaOferta: 10,
        atendimentosProntos: 20,
        atendimentosLancamentos: 5,
      };
    }),

  /**
   * Listar anos com dados históricos disponíveis
   */
  listAvailableYears: publicProcedure.query(() => {
    return {
      success: true,
      years: [2024, 2025, 2026],
    };
  }),

  /**
   * Obter dados consolidados de um ano específico
   */
  getYearData: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(({ input }) => {
      return {
        success: true,
        hasData: true,
        year: input.year,
        message: "Dados históricos disponíveis no banco de dados",
      };
    }),

  /**
   * Obter evolução mensal de um indicador específico
   */
  getMonthlyEvolution: publicProcedure
    .input(
      z.object({
        indicatorName: z.string(),
        year: z.number().optional(),
        companyId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { indicatorName, year = 2024, companyId } = input;

      const monthlyData: any[] = [];

      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        try {
          let value = 0;

          // Calcular o valor do indicador para o mês
          switch (indicatorName) {
            case "negociosValor":
              const salesVal = await salesIndicators.calculateSalesValueMonth(
                companyId,
                startDate,
                endDate
              );
              value = salesVal.value;
              break;
            case "negociosUnidades":
              value = await salesIndicators.calculateSalesCountMonth(
                companyId,
                startDate,
                endDate
              );
              break;
            case "comissaoRecebida":
              value = await salesIndicators.calculateCommissionReceived(
                companyId,
                startDate,
                endDate
              );
              break;
            case "comissaoVendida":
              value = await salesIndicators.calculateCommissionSold(
                companyId,
                startDate,
                endDate
              );
              break;
            default:
              value = 0;
          }

          monthlyData.push({
            month: MONTH_NAMES[month - 1],
            value,
          });
        } catch (error) {
          console.error(
            `[Indicators] Erro ao calcular ${indicatorName} para ${month}/${year}:`,
            error
          );
          monthlyData.push({
            month: MONTH_NAMES[month - 1],
            value: 0,
          });
        }
      }

      return {
        success: true,
        indicatorName,
        year,
        data: monthlyData,
      };
    }),

  /**
   * Sincronizar propriedades e leads do Properfy
   */
  syncProperfy: protectedProcedure.mutation(async () => {
    try {
      // Trigger manual sync de leads
      const result = await properfyLeadsSync.syncProperfyLeads();
      return {
        success: true,
        message: "Sincronização de leads iniciada",
        result,
      };
    } catch (error) {
      console.error("[Indicators] Erro ao sincronizar Properfy:", error);
      return {
        success: false,
        message: "Erro ao sincronizar",
        error: String(error),
      };
    }
  }),
});
