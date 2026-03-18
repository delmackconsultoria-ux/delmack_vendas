import { eq, and } from "drizzle-orm";
import { goals, type Goal } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Mapeamento de nomes de indicadores para colunas do banco
 */
const indicatorColumnMap: Record<string, keyof Goal> = {
  "Negócios no mês": "businessMonth",
  "Vendas Canceladas": "cancelledSales",
  "VSO Ratio": "vsoRatio",
  "Comissão Recebida": "commissionReceived",
  "Comissão Vendida": "commissionSold",
  "Comissão Pendente": "commissionPending",
  "Divulgação Portfólio": "portfolioDisclosure",
  "Prospecção no mês": "prospectingMonth",
  "Remoções no mês": "removalsMonth",
  "Percentual Comissão": "commissionPercentage",
  "Negócios acima de 1M": "businessOver1m",
  "Chamadas Prontas": "readyCalls",
  "Chamadas Lançamento": "launchCalls",
  "Tempo Médio Recebimento": "avgReceiptTime",
  "Ratio Canceladas Pendentes": "cancelledPendingRatio",
  "Tempo Médio Venda": "avgSaleTime",
  "Valor Médio Imóvel": "avgPropertyValue",
  "Negócios Rede": "networkBusiness",
  "Negócios Internos": "internalBusiness",
  "Parcerias Externas": "externalPartnership",
  "Negócios Lançamento": "launchBusiness",
  "Despesa Geral": "generalExpense",
  "Despesa com Impostos": "taxExpense",
  "Fundo Inovação": "innovationFund",
  "Resultado Sócios": "partnersResult",
  "Fundo Emergencial": "emergencyFund",
};

/**
 * Buscar ou criar metas para um gerente e ano
 */
export async function getOrCreateGoals(managerId: string, companyId: string, year: number): Promise<Goal> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(goals)
    .where(and(
      eq(goals.managerId, managerId),
      eq(goals.companyId, companyId),
      eq(goals.year, year)
    ))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Criar nova meta
  const newGoal: Goal = {
    id: `goal_${Date.now()}`,
    managerId,
    companyId,
    year,
    businessMonth: null,
    cancelledSales: null,
    vsoRatio: null,
    commissionReceived: null,
    commissionSold: null,
    commissionPending: null,
    portfolioDisclosure: null,
    prospectingMonth: null,
    removalsMonth: null,
    commissionPercentage: null,
    businessOver1m: null,
    readyCalls: null,
    launchCalls: null,
    avgReceiptTime: null,
    cancelledPendingRatio: null,
    avgSaleTime: null,
    avgPropertyValue: null,
    networkBusiness: null,
    internalBusiness: null,
    externalPartnership: null,
    launchBusiness: null,
    generalExpense: null,
    taxExpense: null,
    innovationFund: null,
    partnersResult: null,
    emergencyFund: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(goals).values(newGoal);
  return newGoal;
}

/**
 * Buscar metas com indicadores
 */
export async function getGoalsWithIndicators(managerId: string, companyId: string, year: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const goalsData = await db
    .select()
    .from(goals)
    .where(and(
      eq(goals.managerId, managerId),
      eq(goals.companyId, companyId),
      eq(goals.year, year)
    ));

  if (goalsData.length === 0) return null;

  const goal = goalsData[0];

  // Converter colunas para objeto de indicadores
  const indicators: Record<string, number | null> = {};
  for (const [indicatorName, columnName] of Object.entries(indicatorColumnMap)) {
    const value = goal[columnName];
    indicators[indicatorName] = value ? parseFloat(value.toString()) : null;
  }

  return {
    goal,
    indicators,
  };
}

/**
 * Salvar indicadores de meta
 */
export async function saveGoalIndicators(
  goalId: string,
  indicators: Record<string, number | null>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Converter indicadores para colunas
  const updateData: Record<string, any> = {};
  for (const [indicatorName, value] of Object.entries(indicators)) {
    const columnName = indicatorColumnMap[indicatorName];
    if (columnName) {
      updateData[columnName] = value;
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("Nenhum indicador válido para salvar");
  }

  await db
    .update(goals)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(goals.id, goalId));
}

/**
 * Buscar meta por ID
 */
export async function getGoalById(goalId: string): Promise<Goal | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(goals)
    .where(eq(goals.id, goalId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
