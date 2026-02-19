import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as salesIndicators from "../indicators/salesIndicators";
import * as properfyIndicators from "../indicators/properfyIndicators";
import fs from "fs";
import path from "path";

// Carregar dados históricos de 2024 se existirem
const indicatorsDataPath = path.join(process.cwd(), "indicators-2024.json");
let historicalData: any = {};

try {
  if (fs.existsSync(indicatorsDataPath)) {
    const fileContent = fs.readFileSync(indicatorsDataPath, "utf-8");
    historicalData = JSON.parse(fileContent);
    console.log("[Indicators] Dados históricos de 2024 carregados");
  }
} catch (error) {
  console.error("[Indicators] Erro ao carregar dados históricos:", error);
}

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

      // Se for 2024, tentar carregar dados históricos primeiro
      if (year === 2024 && historicalData[MONTH_NAMES[month - 1]]) {
        const monthData = historicalData[MONTH_NAMES[month - 1]];
        // Retornar dados históricos (meses fechados)
        return {
          isHistorical: true,
          period: `${MONTH_NAMES[month - 1]}/2024`,
          ...monthData,
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
      if (input.year === 2024 && historicalData) {
        return {
          success: true,
          hasData: true,
          year: input.year,
          data: historicalData,
        };
      }
      return {
        success: false,
        hasData: false,
        message: `Dados não disponíveis para ${input.year}`,
      };
    }),

  /**
   * Obter evolução mensal de um indicador específico (compatibilidade com frontend antigo)
   */
  getMonthlyEvolution: publicProcedure
    .input(
      z.object({
        indicatorName: z.string(),
        year: z.number().optional(),
      })
    )
    .query(({ input }) => {
      const { indicatorName, year = 2024 } = input;

      if (year !== 2024 || !historicalData) {
        return {
          success: false,
          monthlyData: [],
        };
      }

      const monthlyData: any[] = [];

      MONTH_NAMES.forEach((monthName) => {
        const monthData = historicalData[monthName];
        if (!monthData || !monthData[indicatorName]) {
          monthlyData.push({
            month: monthName,
            value: 0,
          });
          return;
        }

        const indicator = monthData[indicatorName];
        const value = indicator.total || 0;

        monthlyData.push({
          month: monthName,
          value: Number(value),
        });
      });

      return {
        success: true,
        indicatorName,
        monthlyData,
      };
    }),
});
