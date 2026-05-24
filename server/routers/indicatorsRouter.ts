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
import { indicatorGoals, monthlyIndicators } from "../../drizzle/schema";
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
        const readyAttendances = await properfyIndicators.calculateReadyAttendancesFromCards(
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

        // Buscar dados históricos da tabela monthlyIndicators
        // SE existirem dados históricos importados, eles têm PRIORIDADE sobre os cálculos dinâmicos
        // NOTA: Usando SQL raw pois o schema Drizzle de monthlyIndicators usa month varchar (legado)
        // mas a tabela real no banco tem year int e month int com todos os campos de indicadores
        const db2 = await getDb();
        let historicalData: any = null;
        if (db2) {
          const rows = await db2.execute(
            sql`SELECT * FROM \`monthlyIndicators\` WHERE \`companyId\` = ${companyId} AND \`year\` = ${year} AND \`month\` = ${month} LIMIT 1`
          );
          const rowsArray = rows[0] as any[];
          if (rowsArray && rowsArray.length > 0) historicalData = rowsArray[0];
        }

        // Se há dados históricos importados, usá-los como fonte primária para TODOS os campos
        if (historicalData) {
          return {
            isHistorical: true,
            period: `${MONTH_NAMES[month - 1]}/${year}`,
            negociosValor: Number(historicalData.negociosValor) || 0,
            negociosUnidades: historicalData.negociosUnidades || 0,
            vendidosCancelados: historicalData.vendidosCancelados || 0,
            vsoVendaOferta: Number(historicalData.vsoVendaOferta) || 0,
            comissaoRecebida: Number(historicalData.comissaoRecebida) || 0,
            comissaoVendida: Number(historicalData.comissaoVendida) || 0,
            comissaoPendente: Number(historicalData.comissaoPendente) || 0,
            percentualComissaoVendida: Number(historicalData.percentualComissaoVendida) || 0,
            negociosAcima1M: historicalData.negociosAcima1M || 0,
            prazoMedioRecebimento: historicalData.prazoMedioRecebimento || 0,
            percentualCanceladaPendente: Number(historicalData.percentualCanceladaPendente) || 0,
            valorMedioImovel: Number(historicalData.valorMedioImovel) || 0,
            negociosRede: historicalData.negociosRede || 0,
            negociosInternos: historicalData.negociosInternos || 0,
            negociosParceriaExterna: historicalData.negociosParceriaExterna || 0,
            negociosLancamentos: historicalData.negociosLancamentos || 0,
            carteiraAtiva: historicalData.carteiraAtiva || 0,
            angariacesMes: historicalData.angariacesMes || 0,
            baixasMes: historicalData.baixasMes || 0,
            atendimentosProntos: historicalData.atendimentosProntos || 0,
            atendimentosLancamentos: historicalData.atendimentosLancamentos || 0,
            tempoMedioVendaAngVenda: 0,
            despesaGeral: Number(historicalData.despesaGeral) || manualData.despesaGeral,
            despesaImpostos: Number(historicalData.despesaImpostos) || manualData.despesaImpostos,
            fundoInovacao: Number(historicalData.fundoInovacao) || manualData.fundoInovacao,
            resultadoSocios: Number(historicalData.resultadoSocios) || manualData.resultadoSocios,
            fundoEmergencial: Number(historicalData.fundoEmergencial) || manualData.fundoEmergencial,
          };
        }

        // Sem dados históricos: usar cálculo dinâmico (mês atual ou meses sem importação)
        const finalCarteiraAtiva = activeProperties > 0 ? activeProperties : 0;
        const finalAngariacesMes = angariations > 0 ? angariations : 0;
        const finalBaixasMes = removedProperties > 0 ? removedProperties : 0;
        const finalAtendimentosProntos = readyAttendances > 0 ? readyAttendances : 0;
        const finalAtendimentosLancamentos = launchAttendances > 0 ? launchAttendances : 0;

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
          carteiraAtiva: finalCarteiraAtiva,
          angariacesMes: finalAngariacesMes,
          baixasMes: finalBaixasMes,
          vsoVendaOferta: vso,
          atendimentosProntos: finalAtendimentosProntos,
          atendimentosLancamentos: finalAtendimentosLancamentos,
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

          // Indicadores do Properfy - para o mês corrente e meses anteriores com dados
          const today = new Date();
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth() + 1;
          // Incluir mês atual e todos os meses passados do ano (dados já sincronizados no banco)
          const isCurrentOrPastMonth = (year < currentYear) || (year === currentYear && month <= currentMonth);
          
          let activeProperties = 0;
          let angariations = 0;
          let removedProperties = 0;
          let prevMonthActiveProperties = 0;
          let vso = 0;
          let readyAttendances = 0;
          let launchAttendances = 0;
          let averageSaleTime = 0;
          
          // Buscar dados do Properfy para mês atual e meses passados (dados já estão no banco local)
          if (isCurrentOrPastMonth) {
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
            readyAttendances = await properfyIndicators.calculateReadyAttendancesFromCards(
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
          // Se for mês futuro, todos os indicadores Properfy = 0

          // Buscar dados manuais salvos para este mês
          const manualData = await manualDataHelper.getManualData(
            companyId,
            year,
            month
          );

          // Buscar dados históricos da tabela monthlyIndicators
          // SE existirem dados históricos importados, eles têm PRIORIDADE
          // NOTA: Usando SQL raw pois o schema Drizzle de monthlyIndicators usa month varchar (legado)
          const db3 = await getDb();
          let historicalMonthData: any = null;
          if (db3) {
            const histRows = await db3.execute(
              sql`SELECT * FROM \`monthlyIndicators\` WHERE \`companyId\` = ${companyId} AND \`year\` = ${year} AND \`month\` = ${month} LIMIT 1`
            );
            const histRowsArray = histRows[0] as any[];
            if (histRowsArray && histRowsArray.length > 0) historicalMonthData = histRowsArray[0];
          }

          if (historicalMonthData) {
            monthlyData.push({
              month,
              negociosValor: Number(historicalMonthData.negociosValor) || 0,
              negociosUnidades: historicalMonthData.negociosUnidades || 0,
              vendidosCancelados: historicalMonthData.vendidosCancelados || 0,
              vsoVendaOferta: Number(historicalMonthData.vsoVendaOferta) || 0,
              comissaoRecebida: Number(historicalMonthData.comissaoRecebida) || 0,
              comissaoVendida: Number(historicalMonthData.comissaoVendida) || 0,
              comissaoPendente: Number(historicalMonthData.comissaoPendente) || 0,
              percentualComissaoVendida: Number(historicalMonthData.percentualComissaoVendida) || 0,
              negociosAcima1M: historicalMonthData.negociosAcima1M || 0,
              prazoMedioRecebimento: historicalMonthData.prazoMedioRecebimento || 0,
              percentualCanceladaPendente: Number(historicalMonthData.percentualCanceladaPendente) || 0,
              valorMedioImovel: Number(historicalMonthData.valorMedioImovel) || 0,
              negociosRede: historicalMonthData.negociosRede || 0,
              negociosInternos: historicalMonthData.negociosInternos || 0,
              negociosParceriaExterna: historicalMonthData.negociosParceriaExterna || 0,
              negociosLancamentos: historicalMonthData.negociosLancamentos || 0,
              carteiraAtiva: historicalMonthData.carteiraAtiva || 0,
              angariacesMes: historicalMonthData.angariacesMes || 0,
              baixasMes: historicalMonthData.baixasMes || 0,
              atendimentosProntos: historicalMonthData.atendimentosProntos || 0,
              atendimentosLancamentos: historicalMonthData.atendimentosLancamentos || 0,
              tempoMedioVendaAngVenda: 0,
              despesaGeral: Number(historicalMonthData.despesaGeral) || manualData.despesaGeral,
              despesaImpostos: Number(historicalMonthData.despesaImpostos) || manualData.despesaImpostos,
              fundoInovacao: Number(historicalMonthData.fundoInovacao) || manualData.fundoInovacao,
              resultadoSocios: Number(historicalMonthData.resultadoSocios) || manualData.resultadoSocios,
              fundoEmergencial: Number(historicalMonthData.fundoEmergencial) || manualData.fundoEmergencial,
            });
          } else {
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
          }
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
   * Obter dados do Properfy para um período
   * Retorna: Carteira de Divulgação, Angariações, Baixas
   */
  getProperfyData: publicProcedure
    .input(
      z.object({
       