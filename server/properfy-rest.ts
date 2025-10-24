/**
 * Endpoint REST simples para buscar imóvel no Properfy
 * Usado como fallback quando tRPC tem problemas
 */

import { Router } from "express";
import { createProperfyService } from "./properfy";

export function createProperfyRestRouter() {
  const router = Router();

  // GET /api/rest/properfy/search?reference=BG66206001
  router.get("/search", async (req, res) => {
    try {
      const { reference } = req.query;

      if (!reference || typeof reference !== "string") {
        return res.status(400).json({ error: "Referência é obrigatória" });
      }

      // Criar serviço com credenciais reais
      const properfy = createProperfyService({ useMockData: false });

      // Buscar imóvel
      const property = await properfy.getPropertyByReference(
        reference.toUpperCase()
      );

      if (!property) {
        return res.status(404).json({ error: "Imóvel não encontrado" });
      }

      return res.json({ success: true, data: property });
    } catch (error) {
      console.error("[Properfy REST] Erro:", error);
      return res.status(500).json({
        error: "Erro ao buscar imóvel",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  return router;
}

