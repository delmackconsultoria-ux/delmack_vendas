import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import fs from "fs";
import path from "path";

// Carregar dados extraídos do Excel
const indicatorsDataPath = path.join(process.cwd(), "indicators-2024.json");
let indicatorsData: any = {};

try {
  if (fs.existsSync(indicatorsDataPath)) {
    const fileContent = fs.readFileSync(indicatorsDataPath, "utf-8");
    indicatorsData = JSON.parse(fileContent);
    console.log("[Indicators] Dados carregados:", Object.keys(indicatorsData).length, "meses");
  } else {
    console.warn("[Indicators] Arquivo indicators-2024.json não encontrado");
  }
} catch (error) {
  console.error("[Indicators] Erro ao carregar indicators-2024.json:", error);
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const indicatorsRouter = router({
  /**
   * Obter todos os indicadores de um mês específico
   */
  getByMonth: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12).optional(),
        year: z.number().min(2020).max(2030).optional(),
      })
    )
    .query(async ({ input }) => {
      const { month, year } = input;

      // Se ano não for 2024, retornar vazio (só temos dados de 2024)
      if (year && year !== 2024) {
        return {
          success: false,
          message: "Dados disponíveis apenas para 2024",
          indicators: {},
        };
      }

      // Se mês não especificado, retornar dados anuais (soma de todos os meses)
      if (!month) {
        // Calcular totais anuais
        const annualIndicators: any = {};
        
        MONTH_NAMES.forEach(monthName => {
          const monthData = indicatorsData[monthName];
          if (!monthData) return;

          Object.keys(monthData).forEach(indicatorName => {
            if (!annualIndicators[indicatorName]) {
              annualIndicators[indicatorName] = {
                total: 0,
                metaMensal: monthData[indicatorName].metaMensal,
                mediaAnual: monthData[indicatorName].mediaAnual,
              };
            }

            const value = monthData[indicatorName].total || 0;
            annualIndicators[indicatorName].total += value;
          });
        });

        return {
          success: true,
          indicators: annualIndicators,
          period: "Ano completo 2024",
        };
      }

      // Obter dados do mês específico
      const monthName = MONTH_NAMES[month - 1];
      const monthData = indicatorsData[monthName];

      if (!monthData) {
        return {
          success: false,
          message: `Dados não encontrados para ${monthName}/2024`,
          indicators: {},
        };
      }

      return {
        success: true,
        indicators: monthData,
        period: `${monthName}/2024`,
      };
    }),

  /**
   * Obter evolução mensal de um indicador específico
   */
  getMonthlyEvolution: protectedProcedure
    .input(
      z.object({
        indicatorName: z.string(),
        year: z.number().min(2020).max(2030).optional(),
      })
    )
    .query(({ input }) => {
      let { indicatorName, year = 2024 } = input;

      // Mapeamento de nomes da UI para nomes no JSON
      const indicatorNameMapping: Record<string, string> = {
        "Negócios no mês (valor)": "Negócios no mês",
        "Comissão Pendente": "Comissão Pendentes Final do mês",
        "Carteira de Divulgação (em número)": "Carteira de Divulgação ( em número)",
        "VSO - venda/oferta": "VSO - venda /oferta",
        "Baixas no mês (quantidade)": "Baixas no mês (em quantidade)",
      };

      // Aplicar mapeamento se existir
      const mappedName = indicatorNameMapping[indicatorName] || indicatorName;
      indicatorName = mappedName;

      if (year !== 2024) {
        return {
          success: false,
          message: "Dados disponíveis apenas para 2024",
          monthlyData: [],
        };
      }

      const monthlyData: any[] = [];

      MONTH_NAMES.forEach((monthName, index) => {
        const monthData = indicatorsData[monthName];
        if (!monthData || !monthData[indicatorName]) {
          monthlyData.push({
            month: monthName,
            value: 0,
            prontos: 0,
            lancamentos: 0,
            todos: 0,
          });
          return;
        }

        const indicator = monthData[indicatorName];
        const value = indicator.total || indicator.mediaAnual || 0;

        monthlyData.push({
          month: monthName,
          value: Number(value),
          prontos: 0, // TODO: Adicionar se houver dados por tipo
          lancamentos: 0,
          todos: Number(value),
        });
      });

      return {
        success: true,
        indicatorName,
        monthlyData,
      };
    }),

  /**
   * Listar anos com dados históricos disponíveis
   */
  listAvailableYears: publicProcedure.query(() => {
    const fs = require('fs');
    const path = require('path');
    const years: number[] = [];

    // Verificar quais arquivos indicators-YYYY.json existem
    const files = fs.readdirSync(path.join(__dirname, '../..'));
    files.forEach((file: string) => {
      const match = file.match(/^indicators-(\d{4})\.json$/);
      if (match) {
        years.push(parseInt(match[1]));
      }
    });

    return {
      success: true,
      years: years.sort((a, b) => b - a), // Ordenar decrescente (mais recente primeiro)
    };
  }),

  /**
   * Obter dados consolidados de um ano específico
   */
  getYearData: publicProcedure
    .input(
      z.object({
        year: z.number().min(2020).max(2030),
      })
    )
    .query(({ input }) => {
      const { year } = input;
      const fs = require('fs');
      const path = require('path');

      try {
        const filePath = path.join(__dirname, '../..', `indicators-${year}.json`);
        if (!fs.existsSync(filePath)) {
          return {
            success: false,
            message: `Dados históricos não disponíveis para ${year}`,
            hasData: false,
          };
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return {
          success: true,
          hasData: true,
          year,
          data,
        };
      } catch (error) {
        return {
          success: false,
          message: `Erro ao carregar dados de ${year}`,
          hasData: false,
        };
      }
    }),

  /**
   * Obter lista de todos os meses disponíveis
   */
  getAvailableMonths: protectedProcedure.query(() => {
    const months = Object.keys(indicatorsData).map(monthName => {
      const monthIndex = MONTH_NAMES.indexOf(monthName);
      return {
        month: monthIndex + 1,
        year: 2024,
        name: monthName,
      };
    });

    return {
      success: true,
      months,
    };
  }),
});
