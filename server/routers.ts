import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./authRouter";
import { properfyRouter } from "./properfyRouter";
import { router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  properfy: properfyRouter,
  // TODO: add feature routers here
});

export type AppRouter = typeof appRouter;

