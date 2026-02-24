import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as salesIndicators from "../indicators/salesIndicators";
import * as properfyIndicators from "../indicators/properfyIndicators";
import { getDb } from "../db";
import { indicatorGoals } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

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
      const { indicatorName, year, businessType = 'todos', companyId } = input;

      if (year === 2024 && historicalData) {
        const monthlyData: any[] = [];
        let total = 0;
        let count = 0;

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
          const value = Number(indicator.total || 0);

          monthlyData.push({
            month: monthName,
            value,
          });

          total += value;
          count++;
        });

        const average = count > 0 ? total / count : 0;
        const values = monthlyData.map(m => m.value).filter(v => v > 0);
        const maximum = values.length > 0 ? Math.max(...values) : 0;
        const minimum = values.length > 0 ? Math.min(...values) : 0;

        const last3 = monthlyData.slice(-3).reduce((sum, m) => sum + m.value, 0);
        const prev3 = monthlyData.slice(-6, -3).reduce((sum, m) => sum + m.value, 0);
        const trend = prev3 > 0 ? ((last3 - prev3) / prev3) * 100 : 0;

        return {
          success: true,
          indicatorName,
          businessType,
          monthlyData,
          statistics: {
            total,
            average,
            maximum,
            minimum,
            trend: parseFloat(trend.toFixed(1)),
          },
        };
      }

      if ((year === 2025 || year === 2026) && companyId) {
        try {
          const db = await getDb();
          if (!db) return { success: false, monthlyData: [], statistics: { total: 0, average: 0, maximum: 0, minimum: 0, trend: 0 } };
          const { sales: yearSales } = await salesIndicators.getSalesForYear(companyId, year, businessType);
          const monthMap = new Map<number, any[]>();
          yearSales.forEach((sale: any) => {
            const month = new Date(sale.saleDate).getMonth() + 1;
            if (!monthMap.has(month)) monthMap.set(month, []);
            monthMap.get(month)!.push(sale);
          });
          const monthlyData: any[] = [];
          let total = 0, count = 0;
          for (let month = 1; month <= 12; month++) {
            const monthSales = monthMap.get(month) || [];
            const value = monthSales.reduce((sum: number, s: any) => sum + (s.saleValue || 0), 0);
            monthlyData.push({ month: MONTH_NAMES[month - 1], monthNumber: month, value, salesCount: monthSales.length, sales: monthSales });
            if (value > 0) { total += value; count++; }
          }
          const values = monthlyData.map(m => m.value).filter(v => v > 0);
          const average = count > 0 ? total / count : 0;
          const maximum = values.length > 0 ? Math.max(...values) : 0;
          const minimum = values.length > 0 ? Math.min(...values) : 0;
          const last3 = monthlyData.slice(-3).reduce((sum, m) => sum + m.value, 0);
          const prev3 = monthlyData.slice(-6, -3).reduce((sum, m) => sum + m.value, 0);
          const trend = prev3 > 0 ? ((last3 - prev3) / prev3) * 100 : 0;
          return { success: true, indicatorName, businessType, year, monthlyData, statistics: { total, average, maximum, minimum, trend: parseFloat(trend.toFixed(1)) } };
        } catch (error) {
          console.error('[Indicators] Erro ao buscar dados de', year, ':', error);
          return { success: false, monthlyData: [], statistics: { total: 0, average: 0, maximum: 0, minimum: 0, trend: 0 } };
        }
      }
      return {
        success: false,
        monthlyData: [],
        statistics: {
          total: 0,
          average: 0,
          maximum: 0,
          minimum: 0,
          trend: 0,
        },
        message: `Dados nao disponiveis para ${year}`,
      };
    }),

  /**
   * Obter metas de indicadores para um ano
   */
  getGoals: protectedProcedure
    .input(
      z.object({
        year: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { year } = input;
      const db = await getDb();
      if (!db) return { goals: [] };

      try {
        const goals = await db
          .select()
          .from(indicatorGoals)
          .where(
            and(
              eq(indicatorGoals.companyId, ctx.user?.companyId || ""),
              eq(indicatorGoals.year, year)
            )
          );

        return { goals };
      } catch (error) {
        console.error("[Indicators] Erro ao buscar metas:", error);
        return { goals: [] };
      }
    }),

  /**
   * Atualizar meta de um indicador (apenas gerentes)
   */
  updateGoal: protectedProcedure
    .input(
      z.object({
        indicatorName: z.string(),
        monthlyGoal: z.number(),
        year: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Apenas gerentes e admins podem atualizar metas
      if (!['manager', 'admin', 'superadmin'].includes(ctx.user?.role || '')) {
        throw new Error('Apenas gerentes podem atualizar metas');
      }

      const { indicatorName, monthlyGoal, year } = input;
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      try {
        // Buscar meta existente
        const existing = await db
          .select()
          .from(indicatorGoals)
          .where(
            and(
              eq(indicatorGoals.companyId, ctx.user?.companyId || ""),
              eq(indicatorGoals.indicatorName, indicatorName),
              eq(indicatorGoals.year, year)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Atualizar existente
          await db
            .update(indicatorGoals)
            .set({
              monthlyGoal: monthlyGoal.toString(),
              annualAverage: (monthlyGoal * 12).toString(),
              updatedAt: new Date(),
            })
            .where(eq(indicatorGoals.id, existing[0].id));
        } else {
          // Criar novo
          const newGoal: any = {
            id: `goal-${uuid()}`,
            companyId: ctx.user?.companyId || "",
            indicatorName,
            year,
            monthlyGoal: monthlyGoal.toString(),
            annualAverage: (monthlyGoal * 12).toString(),
            createdBy: ctx.user?.id || 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await db.insert(indicatorGoals).values(newGoal);
        }

        return { success: true, message: 'Meta atualizada com sucesso' };
      } catch (error) {
        console.error('[Indicators] Erro ao atualizar meta:', error);
        throw error;
      }
    }),
});
