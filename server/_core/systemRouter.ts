import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router, protectedProcedure } from "./trpc";
import { syncAllProperties } from "../services/properfySyncService";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  /**
   * Sincronização manual da base Properfy
   * Disponível para gerentes e financeiro
   */
  syncPropertyfyNow: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Apenas gerentes e financeiro podem sincronizar
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'manager' && ctx.user.role !== 'finance') {
        return {
          success: false,
          message: 'Apenas gerentes e financeiro podem sincronizar a base Properfy',
          stats: null
        };
      }

      console.log(`[ProperfySync] Sincronização manual iniciada por ${ctx.user.name} (${ctx.user.role})`);
      
      const result = await syncAllProperties();
      
      console.log(`[ProperfySync] Sincronização manual concluída: ${result.message}`);
      
      return result;
    }),
});
