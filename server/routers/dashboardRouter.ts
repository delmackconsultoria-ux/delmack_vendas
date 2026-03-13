import { protectedProcedure, router } from "../_core/trpc";
import {
  calculateMonthlyVGV,
  calculateMonthlySalesCount,
  calculateMonthlyAverageTicket,
  calculateReceivedCommissions,
  calculateActivePortfolio,
} from "../dashboardHelpers";
import * as properfyIndicators from "../indicators/properfyIndicators";

export const dashboardRouter = router({
  getKPIs: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.user.companyId;
    
    if (!companyId) {
      return {
        vgv: 0,
        salesCount: 0,
        averageTicket: 0,
        receivedCommissions: 0,
        activePortfolio: 0,
        carteiraAtiva: 0,
        angariacesMes: 0,
        baixasMes: 0,
      };
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [vgv, salesCount, averageTicket, receivedCommissions, activePortfolio, carteiraAtiva, angariacesMes, baixasMes] = await Promise.all([
      calculateMonthlyVGV(companyId, month, year),
      calculateMonthlySalesCount(companyId, month, year),
      calculateMonthlyAverageTicket(companyId, month, year),
      calculateReceivedCommissions(companyId, month, year),
      calculateActivePortfolio(companyId),
      properfyIndicators.calculateActivePropertiesCount(startDate, endDate, companyId),
      properfyIndicators.calculateAngariationsCount(startDate, endDate, companyId),
      properfyIndicators.calculateRemovedPropertiesCount(startDate, endDate, companyId),
    ]);

    return {
      vgv,
      salesCount,
      averageTicket,
      receivedCommissions,
      activePortfolio,
      carteiraAtiva,
      angariacesMes,
      baixasMes,
    };
  }),
});
