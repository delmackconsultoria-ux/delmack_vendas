import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./authRouter";
import { router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  // TODO: add feature routers here
});

export type AppRouter = typeof appRouter;

