import { CronJob } from "cron";
import { getDb } from "../db";
import { indicatorSnapshots } from "../../drizzle/schema";
import * as salesIndicators from "../indicators/salesIndicators";
import * as properfyIndicators from "../indicators/properfyIndicators";
import * as manualDataHelper from "../indicators/manualDataHelper";
import { v4 as uuid } from "uuid";

interface IndicatorData {
  name: string;
  value: string | number;
  unit: "currency" | "units" | "percentage" | "days" | "ratio";
}

/**
 * Job para salvar snapshot mensal de todos os indicadores
 * Roda no último dia de cada mês às 23:59
 * Salva os valores de TODOS os 24 indicadores para auditoria e contabilização
 */
export function initializeIndicatorSnapshotScheduler() {
  // Roda no último dia de cada mês às 23:59
  // Expressão cron: 59 23 L * * (último dia do mês às 23:59)
  // Como cron não suporta "L" (last day), usamos job diário que verifica se é último dia
  const job = new CronJob(
    "0 23 * * *", // Roda todo dia às 23:00
    async () => {
      console.log("[IndicatorSnapshot] Verificando se é último dia do mês...");
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Se amanhã é primeiro dia do mês, então hoje é último dia
      const isLastDayOfMonth = tomorrow.getDate() === 1;
      
      if (!isLastDayOfMonth) {
        console.log("[IndicatorSnapshot] Não é último dia do mês, pulando...");
        return;
      }
      
      console.log("[IndicatorSnapshot] ⏰ Iniciando snapshot mensal...");
      
      try {
        const db = await getDb();
        if (!db) {
          console.error("[IndicatorSnapshot] Database not available");
          return;
        }
        
        // Pegar todas as empresas (assumindo que há apenas uma por enquanto)
        // Em produção, isso deveria iterar por todas as empresas
        const companyId = "company_1766331506068"; // TODO: Iterar por todas as empresas
        
        // Data do mês
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const monthStr = `${year}-${String(month).padStart(2, "0")}`;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Último dia do mês
        
        // Mês anterior para VSO
        const prevMonthStart = new Date(year, month - 2, 1);
        const prevMonthEnd = new Date(year, month - 1, 0);
        
        console.log(`[IndicatorSnapshot] Calculando indicadores para ${monthStr}...`);
        
        // ===== INDICADORES DO SISTEMA DE VENDAS =====
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
        
        // ===== INDICADORES DO PROPERFY =====
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
        
        // ===== INDICADORES MANUAIS =====
        const manualData = await manualDataHelper.getManualData(
          companyId,
          year,
          month
        );
        
        // Array com todos os indicadores
        const indicators: IndicatorData[] = [
          // Sistema de Vendas
          { name: "Negócios no mês (valor)", value: salesValue.value, unit: "currency" },
          { name: "Negócios no mês (unidades)", value: salesCount, unit: "units" },
          { name: "Vendas Canceladas", value: cancelledSales, unit: "units" },
          { name: "VSO - venda/oferta", value: vso, unit: "percentage" },
          { name: "Comissão Recebida", value: commissionReceived, unit: "currency" },
          { name: "Comissão Vendida", value: commissionSold, unit: "currency" },
          { name: "Comissão Pendente Final do mês", value: commissionPending, unit: "currency" },
          { name: "% comissão vendida", value: percentCommission, unit: "percentage" },
          { name: "Negócios acima de 1 milhão", value: salesAbove1M, unit: "units" },
          { name: "Prazo médio recebimento de venda", value: avgPaymentDays, unit: "days" },
          { name: "% Com cancelada / com pendente", value: percentCancelledPending, unit: "percentage" },
          { name: "Negócios na Rede", value: salesUNA, unit: "units" },
          { name: "Negócios Internos", value: salesInternal, unit: "units" },
          { name: "Negócios Parceria Externa", value: salesExternalPartner, unit: "units" },
          { name: "Negócios Lançamentos", value: salesLaunch, unit: "units" },
          { name: "Valor médio do imóvel de venda", value: avgPropertyValue, unit: "currency" },
          
          // Properfy
          { name: "Carteira de Divulgação (em número)", value: activeProperties, unit: "units" },
          { name: "Angariações mês", value: angariations, unit: "units" },
          { name: "Baixas no mês (em quantidade)", value: removedProperties, unit: "units" },
          { name: "Número de atendimentos Prontos", value: readyAttendances, unit: "units" },
          { name: "Número de atendimentos Lançamentos", value: launchAttendances, unit: "units" },
          { name: "Tempo médio de venda ang X venda", value: averageSaleTime, unit: "days" },
          
          // Manuais
          { name: "Despesa Geral", value: manualData.despesaGeral, unit: "currency" },
          { name: "Despesa com Impostos", value: manualData.despesaImpostos, unit: "currency" },
          { name: "Fundo Inovação", value: manualData.fundoInovacao, unit: "currency" },
          { name: "Resultado Sócios", value: manualData.resultadoSocios, unit: "currency" },
          { name: "Fundo Emergencial", value: manualData.fundoEmergencial, unit: "currency" },
        ];
        
        // Salvar cada indicador como uma linha
        const snapshots = indicators.map((indicator) => ({
          id: uuid(),
          companyId,
          month: monthStr,
          indicatorName: indicator.name,
          value: String(indicator.value),
          unit: indicator.unit,
          createdAt: new Date(),
        }));
        
        // Inserir em batch
        await db.insert(indicatorSnapshots).values(snapshots);
        
        console.log(`[IndicatorSnapshot] ✅ Snapshot salvo com sucesso!`);
        console.log(`  - Período: ${monthStr}`);
        console.log(`  - Data: ${endDate.toLocaleDateString("pt-BR")}`);
        console.log(`  - Total de indicadores: ${snapshots.length}`);
        console.log(`  - Atendimentos Prontos: ${readyAttendances}`);
        console.log(`  - Atendimentos Lançamentos: ${launchAttendances}`);
        
      } catch (error) {
        console.error("[IndicatorSnapshot] ❌ Erro ao salvar snapshot:", error);
      }
    },
    null,
    true, // Inicia o job imediatamente
    "America/Sao_Paulo" // Timezone
  );
  
  console.log("[IndicatorSnapshot] ✅ Job de snapshot mensal inicializado");
  return job;
}
