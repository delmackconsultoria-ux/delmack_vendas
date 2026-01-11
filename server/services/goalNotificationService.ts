/**
 * Serviço de notificações automáticas de metas
 * Envia alertas quando marcos são atingidos (50%, 75%, 100%)
 * ou quando o progresso está abaixo do esperado
 */

import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { goals } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface GoalProgress {
  year: number;
  month: number;
  goal: number;
  vgvAccumulated: number;
  percentageAchieved: number;
  isOnTrack: boolean;
  expectedProgress: number;
  projectedTotal: number;
  projectedPercentage: number;
  daysRemaining: number;
}

interface NotificationState {
  companyId: string;
  year: number;
  month: number;
  milestone50Sent: boolean;
  milestone75Sent: boolean;
  milestone100Sent: boolean;
  belowExpectedSent: boolean;
}

// Armazenar estado das notificações em memória (em produção, usar banco de dados)
const notificationStates = new Map<string, NotificationState>();

/**
 * Obter chave única para o estado de notificação
 */
function getStateKey(companyId: string, year: number, month: number): string {
  return `${companyId}-${year}-${month}`;
}

/**
 * Obter ou criar estado de notificação
 */
function getNotificationState(companyId: string, year: number, month: number): NotificationState {
  const key = getStateKey(companyId, year, month);
  
  if (!notificationStates.has(key)) {
    notificationStates.set(key, {
      companyId,
      year,
      month,
      milestone50Sent: false,
      milestone75Sent: false,
      milestone100Sent: false,
      belowExpectedSent: false,
    });
  }
  
  return notificationStates.get(key)!;
}

/**
 * Atualizar estado de notificação
 */
function updateNotificationState(state: NotificationState) {
  const key = getStateKey(state.companyId, state.year, state.month);
  notificationStates.set(key, state);
}

/**
 * Formatar valor monetário
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Obter nome do mês
 */
function getMonthName(month: number): string {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return months[month - 1];
}

/**
 * Verificar e enviar notificações de marcos de meta
 */
export async function checkAndNotifyGoalProgress(
  companyId: string,
  progress: GoalProgress
): Promise<void> {
  const state = getNotificationState(companyId, progress.year, progress.month);
  const monthName = getMonthName(progress.month);

  try {
    // Marco 50%
    if (progress.percentageAchieved >= 50 && !state.milestone50Sent) {
      await notifyOwner({
        title: `🎯 Meta de ${monthName}: 50% Atingido!`,
        content: `Parabéns! Você atingiu 50% da meta de vendas.\n\n` +
          `📊 Progresso:\n` +
          `• Meta: ${formatCurrency(progress.goal)}\n` +
          `• VGV Acumulado: ${formatCurrency(progress.vgvAccumulated)}\n` +
          `• Percentual: ${progress.percentageAchieved.toFixed(1)}%\n` +
          `• Projeção: ${formatCurrency(progress.projectedTotal)} (${progress.projectedPercentage.toFixed(1)}%)\n\n` +
          `Continue assim! 💪`
      });
      
      state.milestone50Sent = true;
      updateNotificationState(state);
      console.log(`[Goal Notification] Enviada notificação de 50% para empresa ${companyId}`);
    }

    // Marco 75%
    if (progress.percentageAchieved >= 75 && !state.milestone75Sent) {
      await notifyOwner({
        title: `🎯 Meta de ${monthName}: 75% Atingido!`,
        content: `Excelente trabalho! Você atingiu 75% da meta de vendas.\n\n` +
          `📊 Progresso:\n` +
          `• Meta: ${formatCurrency(progress.goal)}\n` +
          `• VGV Acumulado: ${formatCurrency(progress.vgvAccumulated)}\n` +
          `• Percentual: ${progress.percentageAchieved.toFixed(1)}%\n` +
          `• Faltam: ${formatCurrency(progress.goal - progress.vgvAccumulated)}\n` +
          `• Projeção: ${formatCurrency(progress.projectedTotal)} (${progress.projectedPercentage.toFixed(1)}%)\n\n` +
          `Está quase lá! 🚀`
      });
      
      state.milestone75Sent = true;
      updateNotificationState(state);
      console.log(`[Goal Notification] Enviada notificação de 75% para empresa ${companyId}`);
    }

    // Marco 100%
    if (progress.percentageAchieved >= 100 && !state.milestone100Sent) {
      await notifyOwner({
        title: `🎉 Meta de ${monthName}: 100% ATINGIDA!`,
        content: `PARABÉNS! Você bateu a meta de vendas do mês!\n\n` +
          `📊 Resultado Final:\n` +
          `• Meta: ${formatCurrency(progress.goal)}\n` +
          `• VGV Acumulado: ${formatCurrency(progress.vgvAccumulated)}\n` +
          `• Percentual: ${progress.percentageAchieved.toFixed(1)}%\n` +
          `• Excedente: ${formatCurrency(progress.vgvAccumulated - progress.goal)}\n\n` +
          `Time está de parabéns! 🏆🎊`
      });
      
      state.milestone100Sent = true;
      updateNotificationState(state);
      console.log(`[Goal Notification] Enviada notificação de 100% para empresa ${companyId}`);
    }

    // Alerta: Abaixo do esperado (apenas uma vez por dia)
    if (!progress.isOnTrack && !state.belowExpectedSent && progress.daysRemaining > 0) {
      const difference = progress.expectedProgress - progress.percentageAchieved;
      
      // Só enviar se a diferença for significativa (> 5%)
      if (difference > 5) {
        await notifyOwner({
          title: `⚠️ Atenção: Meta de ${monthName} Abaixo do Esperado`,
          content: `O progresso de vendas está abaixo do esperado para o período.\n\n` +
            `📊 Situação Atual:\n` +
            `• Meta: ${formatCurrency(progress.goal)}\n` +
            `• VGV Acumulado: ${formatCurrency(progress.vgvAccumulated)} (${progress.percentageAchieved.toFixed(1)}%)\n` +
            `• Progresso Esperado: ${progress.expectedProgress.toFixed(1)}%\n` +
            `• Diferença: ${difference.toFixed(1)}% abaixo\n\n` +
            `💡 Ação Necessária:\n` +
            `• Média diária necessária: ${formatCurrency((progress.goal - progress.vgvAccumulated) / Math.max(1, progress.daysRemaining))}\n` +
            `• Dias restantes: ${progress.daysRemaining}\n\n` +
            `Vamos acelerar! 🚀`
        });
        
        state.belowExpectedSent = true;
        updateNotificationState(state);
        console.log(`[Goal Notification] Enviado alerta de progresso abaixo do esperado para empresa ${companyId}`);
      }
    }

    // Resetar flag de "abaixo do esperado" se voltar aos trilhos
    if (progress.isOnTrack && state.belowExpectedSent) {
      state.belowExpectedSent = false;
      updateNotificationState(state);
    }

  } catch (error) {
    console.error("[Goal Notification] Erro ao enviar notificação:", error);
  }
}

/**
 * Calcular progresso da meta para uma empresa
 */
export async function calculateGoalProgress(
  companyId: string,
  year?: number,
  month?: number
): Promise<GoalProgress | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    // Buscar meta do mês
    const goalResult = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.companyId, companyId),
          eq(goals.year, targetYear),
          eq(goals.month, targetMonth)
        )
      )
      .limit(1);

    const goalValue = goalResult.length > 0 
      ? parseFloat(goalResult[0].teamGoal)
      : 15000000;

    // Calcular VGV acumulado
    const vgvQuery = `
      SELECT COALESCE(SUM(saleValue), 0) as totalVGV
      FROM sales
      WHERE companyId = ?
        AND YEAR(saleDate) = ?
        AND MONTH(saleDate) = ?
        AND status != 'cancelled'
        AND status != 'draft'
    `;

    const vgvResult: any = await db.execute(vgvQuery);
    const vgvAccumulated = parseFloat((vgvResult[0] as any)[0]?.totalVGV || 0);

    const percentageAchieved = (vgvAccumulated / goalValue) * 100;

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const currentDay = targetYear === now.getFullYear() && targetMonth === now.getMonth() + 1
      ? now.getDate()
      : daysInMonth;
    const daysRemaining = daysInMonth - currentDay;

    const expectedProgress = (currentDay / daysInMonth) * 100;
    const isOnTrack = percentageAchieved >= expectedProgress;

    const dailyAverage = currentDay > 0 ? vgvAccumulated / currentDay : 0;
    const projectedTotal = dailyAverage * daysInMonth;
    const projectedPercentage = (projectedTotal / goalValue) * 100;

    return {
      year: targetYear,
      month: targetMonth,
      goal: goalValue,
      vgvAccumulated,
      percentageAchieved,
      isOnTrack,
      expectedProgress,
      projectedTotal,
      projectedPercentage,
      daysRemaining,
    };
  } catch (error) {
    console.error("[Goal Notification] Erro ao calcular progresso:", error);
    return null;
  }
}

/**
 * Limpar estados de notificação de meses anteriores
 */
export function cleanOldNotificationStates() {
  const now = new Date();
  const currentKey = getStateKey("*", now.getFullYear(), now.getMonth() + 1);
  
  notificationStates.forEach((state, key) => {
    // Manter apenas o mês atual e o próximo
    const stateDate = new Date(state.year, state.month - 1);
    const monthsDiff = (now.getFullYear() - state.year) * 12 + (now.getMonth() - (state.month - 1));
    
    if (monthsDiff > 1) {
      notificationStates.delete(key);
      console.log(`[Goal Notification] Removido estado antigo: ${key}`);
    }
  });
}
