import { CronJob } from "cron";
import { getDb } from "../db";
import { monthlyIndicatorsSnapshot, companies } from "../../drizzle/schema";
import * as salesIndicators from "../indicators/salesIndicators";
import * as properfyIndicators from "../indicators/properfyIndicators";
import * as manualDataHelper from "../indicators/manualDataHelper";
import { v4 as uuid } from "uuid";
import { eq, and } from "drizzle-orm";

/**
 * Job para salvar snapshot mensal de todos os indicadores
 * Roda no último dia de cada mês às 23:00
 * Salva os valores de TODOS os indicadores na tabela monthlyIndicatorsSnapshot
 * para que os dados históricos fiquem congelados e disponíveis nos meses seguintes.
 */
export function initializeIndicatorSnapshotScheduler() {
  // Roda todo dia às 23:00 e verifica se é o último dia do mês
  const job = new CronJob(
    "0 23 * * *",
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
        
        // Buscar todas as empresas ativas
        const allCompanies = await db.select({ id: companies.id, name: companies.name }).from(companies);
        
        if (!allCompanies || allCompanies.length === 0) {
          console.warn("[IndicatorSnapshot] Nenhuma empresa encontrada");
          return;
        }
        
        // Data do mês atual
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Último dia do mês
        
        // Mês anterior para VSO
        const prevMonthStart = new Date(year, month - 2, 1);
        const prevMonthEnd = new Date(year, month - 1, 0);
        
        console.log(`[IndicatorSnapshot] Calculando indicadores para ${year}-${String(month).padStart(2, "0")}...`);
        console.log(`[IndicatorSnapshot] Empresas a processar: ${allCompanies.length}`);
        
        for (const company of allCompanies) {
          const companyId = company.id;
          console.log(`[IndicatorSnapshot] Processando empresa: ${company.name} (${companyId})`);
          
          try {
            // Verificar se já existe snapshot para este mês/empresa (evitar duplicatas)
            const existing = await db
              .select({ id: monthlyIndicatorsSnapshot.id })
              .from(monthlyIndicatorsSnapshot)
              .where(
                and(
                  eq(monthlyIndicatorsSnapshot.companyId, companyId),
                  eq(monthlyIndicatorsSnapshot.year, year),
                  eq(monthlyIndicatorsSnapshot.month, month)
                )
              )
              .limit(1);
            
            if (existing.length > 0) {
              console.log(`[IndicatorSnapshot] Snapshot já existe para ${company.name} em ${year}-${month}, pulando...`);
              continue;
            }
            
            // ===== INDICADORES DO SISTEMA DE VENDAS =====
            const salesValue = await salesIndicators.calculateSalesValueMonth(companyId, startDate, endDate);
            const salesCount = await salesIndicators.calculateSalesCountMonth(companyId, startDate, endDate);
            const cancelledSales = await salesIndicators.calculateCancelledSalesCount(companyId, startDate, endDate);
            const commissionReceived = await salesIndicators.calculateCommissionReceived(companyId, startDate, endDate);
            const commissionSold = await salesIndicators.calculateCommissionSold(companyId, startDate, endDate);
            const commissionPending = await salesIndicators.calculateCommissionPending(companyId, startDate, endDate);
            const percentCommission = await salesIndicators.calculatePercentCommissionSold(companyId, startDate, endDate);
            const salesAbove1M = await salesIndicators.calculateSalesAbove1M(companyId, startDate, endDate);
            const avgPaymentDays = await salesIndicators.calculateAvgPaymentDays(companyId, startDate, endDate);
            const percentCancelledPending = await salesIndicators.calculatePercentCancelledPending(companyId, startDate, endDate);
            const avgPropertyValue = await salesIndicators.calculateAvgPropertyValue(companyId, startDate, endDate);
            const salesUNA = await salesIndicators.calculateSalesUNA(companyId, startDate, endDate);
            const salesInternal = await salesIndicators.calculateSalesInternal(companyId, startDate, endDate);
            const salesExternalPartner = await salesIndicators.calculateSalesExternalPartner(companyId, startDate, endDate);
            const salesLaunch = await salesIndicators.calculateSalesLaunch(companyId, startDate, endDate);
            
            // ===== INDICADORES DO PROPERFY =====
            const activeProperties = await properfyIndicators.calculateActivePropertiesCount(startDate, endDate, companyId);
            const angariations = await properfyIndicators.calculateAngariationsCount(startDate, endDate, companyId);
            const removedProperties = await properfyIndicators.calculateRemovedPropertiesCount(startDate, endDate, companyId);
            const vso = month >= 3 ? await properfyIndicators.calculateVSO(startDate, endDate, companyId) : 0;
            const readyAttendances = await properfyIndicators.calculateReadyAttendancesFromCards(startDate, endDate);
            const launchAttendances = await properfyIndicators.calculateLaunchAttendancesFromCards(startDate, endDate);
            const averageSaleTime = await properfyIndicators.calculateAverageSaleTime(startDate, endDate, companyId);
            
            // ===== INDICADORES MANUAIS =====
            const manualData = await manualDataHelper.getManualData(companyId, year, month);
            
            // Inserir snapshot na tabela correta
            await db.insert(monthlyIndicatorsSnapshot).values({
              id: uuid(),
              companyId,
              year,
              month,
              // Sistema de Vendas
              negociosValor: String(salesValue.value),
              negociosUnidades: salesCount,
              vendidosCancelados: cancelledSales,
              comissaoRecebida: String(commissionReceived),
              comissaoVendida: String(commissionSold),
              comissaoPendente: String(commissionPending),
              percentualComissaoVendida: String(percentCommission),
              negociosAcima1M: salesAbove1M,
              prazoMedioRecebimento: avgPaymentDays,
              percentualCanceladaPendente: String(percentCancelledPending),
              valorMedioImovel: String(avgPropertyValue),
              negociosRede: salesUNA,
              negociosInternos: salesInternal,
              negociosParceriaExterna: salesExternalPartner,
              negociosLancamentos: salesLaunch,
              // Properfy
              carteiraAtiva: activeProperties,
              angariacesMes: angariations,
              baixasMes: removedProperties,
              vsoVendaOferta: String(vso),
              atendimentosProntos: readyAttendances,
              atendimentosLancamentos: launchAttendances,
              // Manuais
              despesaGeral: String(manualData.despesaGeral || 0),
              despesaImpostos: String(manualData.despesaImpostos || 0),
              fundoInovacao: String(manualData.fundoInovacao || 0),
              resultadoSocios: String(manualData.resultadoSocios || 0),
              fundoEmergencial: String(manualData.fundoEmergencial || 0),
            });
            
            console.log(`[IndicatorSnapshot] ✅ Snapshot salvo: ${company.name} - ${year}-${String(month).padStart(2, "0")}`);
            console.log(`  - Carteira Ativa: ${activeProperties}`);
            console.log(`  - Angariações: ${angariations}`);
            console.log(`  - Baixas: ${removedProperties}`);
            console.log(`  - Negócios: ${salesCount} (R$ ${salesValue.value})`);
            
          } catch (companyError) {
            console.error(`[IndicatorSnapshot] ❌ Erro ao processar empresa ${company.name}:`, companyError);
          }
        }
        
        console.log(`[IndicatorSnapshot] ✅ Snapshot mensal concluído para ${allCompanies.length} empresa(s)`);
        
      } catch (error) {
        console.error("[IndicatorSnapshot] ❌ Erro geral no snapshot:", error);
      }
    },
    null,
    true, // Inicia o job imediatamente
    "America/Sao_Paulo" // Timezone
  );
  
  console.log("[IndicatorSnapshot] ✅ Job de snapshot mensal inicializado (roda às 23:00, salva no último dia do mês)");
  return job;
}
