import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./authRouter";
import { properfyRouter } from "./properfyRouter";
import { salesRouter } from "./salesRouter";
import { utilRouter } from "./utilRouter";
import { notificationRouter } from "./notificationRouter";
import { companyRouter } from "./companyRouter";
import { brokersRouter } from "./brokersRouter";
import { dashboardRouter } from "./dashboardRouter";
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
  dashboard: dashboardRouter,
  // TODO: add feature routers here
});

export type AppRouter = typeof appRouter;

