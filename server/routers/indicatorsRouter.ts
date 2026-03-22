import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as salesIndicators from "../indicators/salesIndicators";
import * as properfyIndicators from "../indicators/properfyIndicators";
import * as properfyLeadsSync from "../indicators/properfyLeadsSync";
import * as properfySyncService from "../services/properfySyncService";
import * as goalsHelper from "../indicators/goalsHelper";
import * as manualDataHelper from "../indicators/manualDataHelper";
import * as auditLogHelper from "../indicators/auditLogHelper";
import { syncProperfyCards } from "../services/properfyCardsSyncService";
import { getDb } from "../db";
import { indicatorGoals } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { TRPCError } from "@trpc/server";

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

      // Data atual
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      // Calcular datas do mês
      const startDate = new Date(year, month - 1, 1);
      
      // Lógica para endDate:
      // - Se for o mês corrente (atual): usar data atual
      // - Se for mês passado/futuro: usar último dia do mês (congelado)
      let endDate: Date;
      if (year === currentYear && month === currentMonth) {
        // Mês corrente: usar data atual
        endDate = new Date(today);
      } else {
        // Outro mês: usar último dia do mês (congelado)
        endDate = new Date(year, month, 0);
      }
      
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
          endDate,
          companyId
        );
        const angariations = await properfyIndicators.calculateAngariationsCount(
          startDate,
          endDate,
          companyId
        );
        const removedProperties = await properfyIndicators.calculateRemovedPropertiesCount(
          startDate,
          endDate,
          companyId
        );
        const prevMonthActiveProperties = await properfyIndicators.calculateActivePropertiesCount(
          prevMonthStart,
          prevMonthEnd,
          companyId
        );
        const vso = await properfyIndicators.calculateVSO(
          startDate,
          endDate,
          companyId
        );
        const readyAttendances = await properfyIndicators.calculateReadyAttendances(
          startDate,
          endDate
        );
        const launchAttendances = await properfyIndicators.calculateLaunchAttendancesFromCards(
          startDate,
          endDate
        );
        const averageSaleTime = await properfyIndicators.calculateAverageSaleTime(
          startDate,
          endDate,
          companyId
        );

        // Buscar dados manuais salvos para este mês
        const manualData = await manualDataHelper.getManualData(
          companyId,
          year,
          month
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
          tempoMedioVendaAngVenda: averageSaleTime,

          // Manuais
          despesaGeral: manualData.despesaGeral,
          despesaImpostos: manualData.despesaImpostos,
          fundoInovacao: manualData.fundoInovacao,
          resultadoSocios: manualData.resultadoSocios,
          fundoEmergencial: manualData.fundoEmergencial,
        };
      } catch (error) {
        console.error("[Indicators] Erro ao calcular indicadores:", error);
        throw error;
      }
    }),

  /**
   * Obter indicadores de todos os 12 meses de um ano
   */
  getYearIndicators: publicProcedure
    .input(
      z.object({
        companyId: z.string(),
        year: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { companyId, year } = input;
      console.log(`[getYearIndicators] Fetching data for companyId: ${companyId}, year: ${year}`);
      const monthlyData: any[] = [];

      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const prevMonthStart = new Date(year, month - 2, 1);
        const prevMonthEnd = new Date(year, month - 1, 0);

        try {
          console.log(`[getYearIndicators] Processing month ${month} with companyId: ${companyId}`);
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

          // Indicadores do Properfy - APENAS para o mês corrente
          const today = new Date();
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth() + 1;
          const isCurrentMonth = year === currentYear && month === currentMonth;
          
          let activeProperties = 0;
          let angariations = 0;
          let removedProperties = 0;
          let prevMonthActiveProperties = 0;
          let vso = 0;
          let readyAttendances = 0;
          let launchAttendances = 0;
          let averageSaleTime = 0;
          
          // Se for o mês corrente, puxar dados do Properfy
          if (isCurrentMonth) {
            activeProperties = await properfyIndicators.calculateActivePropertiesCount(
              startDate,
              endDate,
              companyId
            );
            angariations = await properfyIndicators.calculateAngariationsCount(
              startDate,
              endDate,
              companyId
            );
            removedProperties = await properfyIndicators.calculateRemovedPropertiesCount(
              startDate,
              endDate,
              companyId
            );
            prevMonthActiveProperties = await properfyIndicators.calculateActivePropertiesCount(
              prevMonthStart,
              prevMonthEnd,
              companyId
            );
            // VSO só é calculado a partir de março (mês 3)
            if (month >= 3) {
              vso = await properfyIndicators.calculateVSO(
                startDate,
                endDate,
                companyId
              );
            }
            readyAttendances = await properfyIndicators.calculateReadyAttendances(
              startDate,
              endDate
            );
            launchAttendances = await properfyIndicators.calculateLaunchAttendancesFromCards(
              startDate,
              endDate
            );
            averageSaleTime = await properfyIndicators.calculateAverageSaleTime(
              startDate,
              endDate,
              companyId
            );
          }
          // Se não for o mês corrente, todos os indicadores Properfy = 0

          // Buscar dados manuais salvos para este mês
          const manualData = await manualDataHelper.getManualData(
            companyId,
            year,
            month
          );

          monthlyData.push({
            month,
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
            tempoMedioVendaAngVenda: averageSaleTime,

            // Manuais
            despesaGeral: manualData.despesaGeral,
            despesaImpostos: manualData.despesaImpostos,
            fundoInovacao: manualData.fundoInovacao,
            resultadoSocios: manualData.resultadoSocios,
            fundoEmergencial: manualData.fundoEmergencial,
          });
        } catch (error) {
          console.error(`[Indicators] Erro ao calcular indicadores para ${month}/${year}:`, error);
          monthlyData.push({
            month,
            negociosValor: 0,
            negociosUnidades: 0,
            vendidosCancelados: 0,
            comissaoRecebida: 0,
            comissaoVendida: 0,
            comissaoPendente: 0,
            percentualComissaoVendida: 0,
            negociosAcima1M: 0,
            prazoMedioRecebimento: 0,
            percentualCanceladaPendente: 0,
            valorMedioImovel: 0,
            negociosRede: 0,
            negociosInternos: 0,
            negociosParceriaExterna: 0,
            negociosLancamentos: 0,
            carteiraAtiva: 0,
            angariacesMes: 0,
            baixasMes: 0,
            vsoVendaOferta: 0,
            atendimentosProntos: 0,
            atendimentosLancamentos: 0,
            tempoMedioVendaAngVenda: 0,
            despesaGeral: 0,
            despesaImpostos: 0,
            fundoInovacao: 0,
            resultadoSocios: 0,
            fundoEmergencial: 0,
          });
        }
      }

      return {
        success: true,
        year,
        monthlyData,
      };
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
      // Sincronizar imóveis, leads e cards
      const propertiesResult = await properfySyncService.syncAllProperties();
      const leadsResult = await properfyLeadsSync.syncProperfyLeads();
      const cardsResult = await syncProperfyCards();
      
      return {
        success: true,
        message: "Sincronização de imóveis, leads e cards concluída",
        properties: propertiesResult,
        leads: leadsResult,
        cards: cardsResult,
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

  /**
   * Obter dados manuais de um mês
   */
  getMonthlyManualData: publicProcedure
    .input(
      z.object({
        companyId: z.string(),
        year: z.number(),
        month: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { companyId, year, month } = input;
      
      // Buscar dados manuais usando manualDataHelper
      const manualData = await manualDataHelper.getManualData(
        companyId,
        year,
        month
      );
      
      return {
        despesaGeral: manualData.despesaGeral,
        despesaImpostos: manualData.despesaImpostos,
        fundoInovacao: manualData.fundoInovacao,
        resultadoSocios: manualData.resultadoSocios,
        fundoEmergencial: manualData.fundoEmergencial,
      };
    }),

  /**
   * Salvar dados manuais de um mês
   */
  saveMonthlyManualData: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        year: z.number(),
        month: z.number(),
        generalExpense: z.number().optional(),
        taxExpense: z.number().optional(),
        innovationFund: z.number().optional(),
        partnerResult: z.number().optional(),
        emergencyFund: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { companyId, year, month, ...data } = input;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      
      const { upsertMonthlyIndicator } = await import('../db');
      await upsertMonthlyIndicator(companyId, monthKey, ctx.user.id, data);
      
      return {
        success: true,
        message: "Dados salvos com sucesso",
      };
    }),

  /**
   * Salvar dados manuais de indicadores (apenas gerentes)
   */
  saveManualData: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        year: z.number(),
        month: z.number(),
        despesaGeral: z.number().default(0),
        despesaImpostos: z.number().default(0),
        fundoInovacao: z.number().default(0),
        resultadoSocios: z.number().default(0),
        fundoEmergencial: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'manager') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas gerentes podem editar dados manuais',
        });
      }

      try {
        await manualDataHelper.saveManualData(
          input.companyId,
          input.year,
          input.month,
          {
            despesaGeral: input.despesaGeral,
            despesaImpostos: input.despesaImpostos,
            fundoInovacao: input.fundoInovacao,
            resultadoSocios: input.resultadoSocios,
            fundoEmergencial: input.fundoEmergencial,
          },
          ctx.user.id,
          ctx.user.name || 'Unknown'
        );

        return {
          success: true,
          message: 'Dados manuais salvos com sucesso',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao salvar dados manuais',
        });
      }
    }),

  /**
   * Obter dados manuais de um mes
   */
  getManualData: publicProcedure
    .input(
      z.object({
        companyId: z.string(),
        year: z.number(),
        month: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const data = await manualDataHelper.getManualData(
          input.companyId,
          input.year,
          input.month
        );

        return {
          success: true,
          data,
        };
      } catch (error) {
        return {
          success: false,
          data: {
            despesaGeral: 0,
            despesaImpostos: 0,
            fundoInovacao: 0,
            resultadoSocios: 0,
            fundoEmergencial: 0,
          },
        };
      }
    }),

  /**
   * Obter anos com historico salvo
   */
  getAvailableYears: publicProcedure
    .input(
      z.object({
        companyId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Buscar anos com dados na tabela monthlyIndicators
        const result = await db.execute(
          sql`SELECT DISTINCT YEAR(createdAt) as year FROM monthlyIndicators WHERE companyId = ${input.companyId} ORDER BY year DESC`
        );

        const years = (result as any[]).map((r: any) => r.year).filter((y: any) => y !== null);
        const currentYear = new Date().getFullYear();
        
        // Sempre incluir o ano atual
        const allYears = Array.from(new Set([currentYear, ...years]));
        
        return allYears.sort((a, b) => b - a);
      } catch (error) {
        console.error('[Indicators] Erro ao buscar anos disponiveis:', error);
        const currentYear = new Date().getFullYear();
        return [currentYear];
      }
    }),

  /**
   * Obter histórico de edições de dados manuais
   */
  getAuditHistory: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        year: z.number(),
        month: z.number(),
        fieldName: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const history = await auditLogHelper.getAuditHistory(
        input.companyId,
        input.year,
        input.month,
        input.fieldName
      );
      return history;
    }),
});
