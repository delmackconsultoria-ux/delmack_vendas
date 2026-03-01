import { protectedProcedure, router } from "../_core/trpc";
import {
  calculateMonthlyVGV,
  calculateMonthlySalesCount,
  calculateMonthlyAverageTicket,
  calculateReceivedCommissions,
  calculateActivePortfolio,
} from "../dashboardHelpers";

export const dashboardRouter = router({
  getKPIs: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.user.companyId;
    
    if (!companyId) {
      return {
        vgv: 0,
        salesCount: 0,
        averageTicket: 0,
        receivedCommissions: 0,
      };
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [vgv, salesCount, averageTicket, receivedCommissions, activePortfolio] = await Promise.all([
      calculateMonthlyVGV(companyId, month, year),
      calculateMonthlySalesCount(companyId, month, year),
      calculateMonthlyAverageTicket(companyId, month, year),
      calculateReceivedCommissions(companyId, month, year),
      calculateActivePortfolio(companyId),
    ]);

    return {
      vgv,
      salesCount,
      averageTicket,
      receivedCommissions,
      activePortfolio,
    };
  }),
});
