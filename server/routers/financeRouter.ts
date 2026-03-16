import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { commissions, users, sales } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const financeRouter = router({
  /**
   * Obter resumo financeiro do mês atual
   * Retorna:
   * - Comissão à receber (pending + received)
   * - Comissão recebida (paid)
   * - VGV (Valor Geral de Vendas)
   * - Detalhamento por gerente
   * 
   * Permissões: finance (vê todos os corretores), manager (vê apenas sua equipe), broker (vê apenas suas comissões)
   */
  getMonthlyFinanceSummary: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        month: z.number().min(1).max(12).optional(),
        year: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Usar mês/ano atual se não fornecido
      const now = new Date();
      const month = input.month || now.getMonth() + 1;
      const year = input.year || now.getFullYear();

      // Calcular primeiro e último dia do mês
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      // 1. COMISSÃO À RECEBER (pending + received)
      // Se o usuário é finance, vê todas as comissões da empresa
      // Se é manager, vê apenas comissões dos seus corretores
      // Se é broker, vê apenas suas próprias comissões
      let commissionsQuery = db
        .select()
        .from(commissions)
        .where(eq(commissions.companyId, input.companyId));

      let allCommissions = await commissionsQuery;

      // Filtrar por permissão do usuário
      if (ctx.user.role === "broker") {
        // Broker vê apenas suas próprias comissões
        allCommissions = allCommissions.filter((c) => c.brokerId === ctx.user.id);
      } else if (ctx.user.role === "manager") {
        // Manager vê apenas comissões dos seus corretores
        const managedBrokers = await db
          .select()
          .from(users)
          .where(eq(users.managerId, ctx.user.id));
        const managedBrokerIds = new Set(managedBrokers.map((b) => b.id));
        allCommissions = allCommissions.filter((c) => managedBrokerIds.has(c.brokerId));
      }
      // Se é finance, vê todas (sem filtro)

      const pendingCommissions = allCommissions.filter(
        (c) => c.status === "pending" || c.status === "received"
      );
      const paidCommissions = allCommissions.filter((c) => c.status === "paid");

      // 2. BUSCAR VENDAS DO MÊS PARA VGV
      const monthSales = await db
        .select()
        .from(sales)
        .where(
          and(
            eq(sales.companyId, input.companyId),
            gte(sales.saleDate, firstDay),
            lte(sales.saleDate, lastDay)
          )
        );

      const vgv = monthSales.reduce((sum, sale) => {
        const value = typeof sale.saleValue === "string" 
          ? parseFloat(sale.saleValue) 
          : (sale.saleValue || 0);
        return sum + value;
      }, 0);

      // 3. CALCULAR TOTAIS
      const totalCommissionsToPay = pendingCommissions.reduce((sum, c) => {
        const value = typeof c.commissionValue === "string"
          ? parseFloat(c.commissionValue)
          : (c.commissionValue || 0);
        return sum + value;
      }, 0);

      const totalCommissionsPaid = paidCommissions.reduce((sum, c) => {
        const value = typeof c.commissionValue === "string"
          ? parseFloat(c.commissionValue)
          : (c.commissionValue || 0);
        return sum + value;
      }, 0);

      // 4. BUSCAR BROKERS PARA SABER SE É MANAGER OU BROKER
      const allBrokerIds = new Set([
        ...pendingCommissions.map((c) => c.brokerId),
        ...paidCommissions.map((c) => c.brokerId),
      ]);

      const brokerMap = new Map();
      for (const brokerId of Array.from(allBrokerIds)) {
        const broker = await db
          .select()
          .from(users)
          .where(eq(users.id, brokerId))
          .limit(1);
        if (broker.length > 0) {
          brokerMap.set(brokerId, broker[0]);
        }
      }

      // Se finance, adicionar todos os brokers da empresa ao mapa (para filtro de corretores)
      if (ctx.user.role === "finance") {
        const allBrokers = await db
          .select()
          .from(users)
          .where(eq(users.companyId, input.companyId));
        allBrokers.forEach((broker) => {
          if (!brokerMap.has(broker.id)) {
            brokerMap.set(broker.id, broker);
          }
        });
      }

      // 5. SEPARAR COMISSÕES POR TIPO (Baggio vs Corretores)
      let baggioCommissionsToPay = 0;
      let brokerCommissionsToPay = 0;

      pendingCommissions.forEach((c) => {
        const broker = brokerMap.get(c.brokerId);
        const value = typeof c.commissionValue === "string"
          ? parseFloat(c.commissionValue)
          : (c.commissionValue || 0);

        if (broker?.role === "manager") {
          baggioCommissionsToPay += value;
        } else {
          brokerCommissionsToPay += value;
        }
      });

      let baggioCommissionsPaid = 0;
      let brokerCommissionsPaid = 0;

      paidCommissions.forEach((c) => {
        const broker = brokerMap.get(c.brokerId);
        const value = typeof c.commissionValue === "string"
          ? parseFloat(c.commissionValue)
          : (c.commissionValue || 0);

        if (broker?.role === "manager") {
          baggioCommissionsPaid += value;
        } else {
          brokerCommissionsPaid += value;
        }
      });

      // 6. DETALHAMENTO POR GERENTE (para comissões pagas da Baggio)
      // Se finance, mostrar detalhamento por gerente
      // Se manager, mostrar apenas sua equipe
      // Se broker, não mostrar detalhamento
      const baggioManagerBreakdown: Record<string, number> = {};

      if (ctx.user.role !== "broker") {
        for (const commission of paidCommissions) {
          const broker = brokerMap.get(commission.brokerId);
          if (broker?.role === "manager") {
            const managerName = broker.name || "Desconhecido";
            const value = typeof commission.commissionValue === "string"
              ? parseFloat(commission.commissionValue)
              : (commission.commissionValue || 0);

            baggioManagerBreakdown[managerName] =
              (baggioManagerBreakdown[managerName] || 0) + value;
          }
        }
      }

      return {
        period: `${month}/${year}`,
        currentMonth: month === now.getMonth() + 1 && year === now.getFullYear(),

        // Comissão à Receber (pending + received)
        commissionsToPay: {
          total: totalCommissionsToPay,
          brokers: brokerCommissionsToPay,
          baggio: baggioCommissionsToPay,
          count: pendingCommissions.length,
        },

        // Comissão Recebida (paid)
        commissionsPaid: {
          total: totalCommissionsPaid,
          brokers: brokerCommissionsPaid,
          baggio: baggioCommissionsPaid,
          count: paidCommissions.length,
          managerBreakdown: baggioManagerBreakdown,
        },

        // VGV (Valor Geral de Vendas)
        vgv: {
          total: vgv,
          count: monthSales.length,
          average: monthSales.length > 0 ? vgv / monthSales.length : 0,
        },
      };
    }),

  /**
   * Obter comissões pendentes/recebidas com detalhes
   * 
   * Permissões: finance (vê todos), manager (vê sua equipe), broker (vê suas comissões)
   */
  getCommissionsToPay: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        month: z.number().min(1).max(12).optional(),
        year: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      const month = input.month || now.getMonth() + 1;
      const year = input.year || now.getFullYear();

      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      // Buscar comissões pending + received
      const allCommissions = await db
        .select()
        .from(commissions)
        .where(eq(commissions.companyId, input.companyId));

      let commissionsToPay = allCommissions.filter(
        (c) => c.status === "pending" || c.status === "received"
      );

      // Filtrar por permissão do usuário
      if (ctx.user.role === "broker") {
        // Broker vê apenas suas próprias comissões
        commissionsToPay = commissionsToPay.filter((c) => c.brokerId === ctx.user.id);
      } else if (ctx.user.role === "manager") {
        // Manager vê apenas comissões dos seus corretores
        const managedBrokers = await db
          .select()
          .from(users)
          .where(eq(users.managerId, ctx.user.id));
        const managedBrokerIds = new Set(managedBrokers.map((b) => b.id));
        commissionsToPay = commissionsToPay.filter((c) => managedBrokerIds.has(c.brokerId));
      }
      // Se é finance, vê todas (sem filtro)

      // Buscar detalhes de brokers
      const brokerIds = new Set(commissionsToPay.map((c) => c.brokerId));
      const brokersMap = new Map();

      for (const brokerId of Array.from(brokerIds)) {
        const broker = await db
          .select()
          .from(users)
          .where(eq(users.id, brokerId))
          .limit(1);
        if (broker.length > 0) {
          brokersMap.set(brokerId, broker[0]);
        }
      }

      return commissionsToPay.map((c) => ({
        id: c.id,
        saleId: c.saleId,
        brokerId: c.brokerId,
        brokerName: brokersMap.get(c.brokerId)?.name || "Desconhecido",
        type: c.type,
        value: typeof c.commissionValue === "string"
          ? parseFloat(c.commissionValue)
          : c.commissionValue,
        percentage: typeof c.commissionPercentage === "string"
          ? parseFloat(c.commissionPercentage)
          : c.commissionPercentage,
        status: c.status,
        createdAt: c.createdAt,
      }));
    }),

  /**
   * Obter comissões pagas com detalhes
   * 
   * Permissões: finance (vê todos), manager (vê sua equipe), broker (vê suas comissões)
   */
  getCommissionsPaid: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        month: z.number().min(1).max(12).optional(),
        year: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      const month = input.month || now.getMonth() + 1;
      const year = input.year || now.getFullYear();

      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      // Buscar comissões paid
      const allCommissions = await db
        .select()
        .from(commissions)
        .where(eq(commissions.companyId, input.companyId));

      let commissionsPaid = allCommissions.filter((c) => c.status === "paid");

      // Filtrar por permissão do usuário
      if (ctx.user.role === "broker") {
        // Broker vê apenas suas próprias comissões
        commissionsPaid = commissionsPaid.filter((c) => c.brokerId === ctx.user.id);
      } else if (ctx.user.role === "manager") {
        // Manager vê apenas comissões dos seus corretores
        const managedBrokers = await db
          .select()
          .from(users)
          .where(eq(users.managerId, ctx.user.id));
        const managedBrokerIds = new Set(managedBrokers.map((b) => b.id));
        commissionsPaid = commissionsPaid.filter((c) => managedBrokerIds.has(c.brokerId));
      }
      // Se é finance, vê todas (sem filtro)

      // Buscar detalhes de brokers
      const brokerIds = new Set(commissionsPaid.map((c) => c.brokerId));
      const brokersMap = new Map();

      for (const brokerId of Array.from(brokerIds)) {
        const broker = await db
          .select()
          .from(users)
          .where(eq(users.id, brokerId))
          .limit(1);
        if (broker.length > 0) {
          brokersMap.set(brokerId, broker[0]);
        }
      }

      return commissionsPaid.map((c) => ({
        id: c.id,
        saleId: c.saleId,
        brokerId: c.brokerId,
        brokerName: brokersMap.get(c.brokerId)?.name || "Desconhecido",
        brokerRole: brokersMap.get(c.brokerId)?.role || "unknown",
        type: c.type,
        value: typeof c.commissionValue === "string"
          ? parseFloat(c.commissionValue)
          : c.commissionValue,
        percentage: typeof c.commissionPercentage === "string"
          ? parseFloat(c.commissionPercentage)
          : c.commissionPercentage,
        status: c.status,
        paymentDate: c.paymentDate,
        createdAt: c.createdAt,
      }));
    }),
});
