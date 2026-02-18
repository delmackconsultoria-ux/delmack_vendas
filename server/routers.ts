import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./authRouter";
import { properfyRouter } from "./properfyRouter";
import { salesRouter } from "./salesRouter";
import { utilRouter } from "./utilRouter";
import { notificationRouter } from "./notificationRouter";
import { companyRouter } from "./companyRouter";
import { brokersRouter } from "./brokersRouter";
import { superadminRouter } from "./routers/superadminRouter";
import { goalsRouter } from "./routers/goalsRouter";
import { monthlyIndicatorsRouter } from "./routers/monthlyIndicatorsRouter";
import { reportsRouter } from "./routers/reportsRouter";
import { historicalSalesRouter } from "./routers/historicalSalesRouter";
import { indicatorsRouter } from "./routers/indicatorsRouter";
import { dashboardRouter } from "./routers/dashboardRouter";
import { auditRouter } from "./routers/auditRouter";
import { router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  properfy: properfyRouter,
  sales: salesRouter,
  util: utilRouter,
  notification: notificationRouter,
  company: companyRouter,
  brokers: brokersRouter,
  superadmin: superadminRouter,
  goals: goalsRouter,
  monthlyIndicators: monthlyIndicatorsRouter,
  reports: reportsRouter,
  historicalSales: historicalSalesRouter,
  indicators: indicatorsRouter,
  dashboard: dashboardRouter,
  audit: auditRouter,
  // TODO: add feature routers here
});

export type AppRouter = typeof appRouter;

