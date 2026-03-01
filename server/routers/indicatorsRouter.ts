import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as salesIndicators from "../indicators/salesIndicators";
import * as properfyIndicators from "../indicators/properfyIndicators";
import * as historicalIndicators from "../indicators/historicalIndicators";
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

      // Se for período histórico (2024, 2025, fevereiro 2026), buscar de historicalSales
      const isHistoricalPeriod = 
        (year === 2024) || 
        (year === 2025) || 
        (year === 2026 && month <= 2);

      if (isHistoricalPeriod) {
        console.log(`[Indicators] Buscando dados históricos para ${MONTH_NAMES[month - 1]}/${year}`);
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const historicalSalesValue = await historicalIndicators.calculateHistoricalSalesValue(
          companyId,
          startDate,
          endDate
        );
        const historicalSalesCount = await historicalIndicators.calculateHistoricalSalesCount(
          companyId,
          startDate,
          endDate
        );
        const historicalCommissions = await historicalIndicators.calculateHistoricalCommissions(
          companyId,
          startDate,
          endDate
        );
        const historicalAvgValue = await historicalIndicators.calculateHistoricalAvgPropertyValue(
          companyId,
          startDate,
          endDate
        );
        const historicalCommissionPercent = await historicalIndicators.calculateHistoricalCommissionPercent(
          companyId,
          startDate,
          endDate
        );

        console.log(`[Indicators] Dados históricos encontrados: ${historicalSalesCount} vendas, R$ ${historicalSalesValue}`);

        return {
          isHistorical: true,
          period: `${MONTH_NAMES[month - 1]}/${year}`,
          // Sistema de Vendas (histórico)
          negociosValor: historicalSalesValue,
          negociosUnidades: historicalSalesCount,
          vendidosCancelados: 0,
          comissaoRecebida: historicalCommissions,
          comissaoVendida: historicalCommissions,
          comissaoPendente: 0,
          percentualComissaoVendida: historicalCommissionPercent,
          negociosAcima1M: 0,
          prazoMedioRecebimento: 0,
          percentualCanceladaPendente: 0,
          valorMedioImovel: historicalAvgValue,
          negociosRede: 0,
          negociosInternos: 0,
          negociosParceriaExterna: 0,
          negociosLancamentos: 0,

          // Properfy (não disponível em histórico)
          carteiraAtiva: 0,
          angariacesMes: 0,
          baixasMes: 0,
          vsoVendaOferta: 0,
          atendimentosProntos: 0,
          atendimentosLancamentos: 0,

          // Manuais
          despesaGeral: 0,
          despesaImpostos: 0,
          fundoInovacao: 0,
          resultadoSocios: 0,
          fundoEmergencial: 0,
        };
      }

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
        const readyAttendances = await properfyIndicators.calculateReadyAttendances();
        const launchAttendances = await properfyIndicators.calculateLaunchAttendances();

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

        let value = 0;

        // Calcular valor baseado no indicador
        if (indicatorName === "negociosValor") {
          value = await historicalIndicators.calculateHistoricalSalesValue(companyId, startDate, endDate);
        } else if (indicatorName === "negociosUnidades") {
          value = await historicalIndicators.calculateHistoricalSalesCount(companyId, startDate, endDate);
        } else if (indicatorName === "comissaoVendida") {
          value = await historicalIndicators.calculateHistoricalCommissions(companyId, startDate, endDate);
        } else if (indicatorName === "valorMedioImovel") {
          value = await historicalIndicators.calculateHistoricalAvgPropertyValue(companyId, startDate, endDate);
        }

        monthlyData.push({
          month: MONTH_NAMES[month - 1],
          value: Number(value),
        });
      }

      return {
        success: true,
        indicatorName,
        year,
        monthlyData,
      };
    }),

  /**
   * Obter dados historicos de um indicador especifico com filtro por tipo de negocio
   */
  getIndicatorHistory: publicProcedure
    .input(
      z.object({
        indicatorName: z.string(),
        year: z.number(),
        businessType: z.string().optional(),
        companyId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return {
        success: true,
        data: [],
      };
    }),

  /**
   * Salvar meta de indicador
   */
  saveIndicatorGoal: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        indicatorName: z.string(),
        monthlyGoal: z.number().optional(),
        annualAverage: z.number().optional(),
        year: z.number(),
        createdBy: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const id = uuid();
      await db.insert(indicatorGoals).values({
        id,
        companyId: input.companyId,
        indicatorName: input.indicatorName,
        year: input.year,
        monthlyGoal: input.monthlyGoal ? String(input.monthlyGoal) : undefined,
        annualAverage: input.annualAverage ? String(input.annualAverage) : undefined,
        createdBy: input.createdBy,
      });

      return { success: true, id };
    }),
});
