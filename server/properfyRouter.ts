/**
 * Router tRPC para integração com Properfy
 * Expõe endpoints para buscar imóveis da Baggio com segurança máxima
 * 
 * Segurança implementada:
 * - Autenticação obrigatória (protectedProcedure)
 * - Validação de entrada com Zod
 * - Tratamento de erros seguro
 * - Rate limiting preparado
 * - Logging de operações
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { createProperfyService } from "./properfy";
import { TRPCError } from "@trpc/server";

export const properfyRouter = router({
  /**
   * Busca imóvel por referência no Properfy
   * Usado quando o corretor informa a referência de um imóvel da Baggio
   * 
   * Exemplo: BG66206001
   */
  searchPropertyByReference: protectedProcedure
    .input(
      z.object({
        reference: z
          .string()
          .min(1, "Referência é obrigatória")
          .max(50, "Referência muito longa")
          .regex(/^[A-Z0-9]+$/, "Referência deve conter apenas letras maiúsculas e números"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log(`[Properfy] Usuário ${ctx.user?.email} buscando imóvel: ${input.reference}`);

        // Cria serviço com credenciais de variáveis de ambiente
        const properfy = createProperfyService();

        const property = await properfy.getPropertyByReference(input.reference);

        if (!property) {
          return {
            success: false,
            error: "Imóvel não encontrado no Properfy",
            data: null,
          };
        }

        // Retorna apenas dados necessários
        return {
          success: true,
          error: null,
          data: {
            id: property.id,
            reference: property.reference || input.reference,
            address: property.address || "",
            city: property.city || "",
            state: property.state || "",
            zipCode: property.zipCode || "",
            neighborhood: property.neighborhood || "",
            number: property.number || "",
            complement: property.complement || "",
            type: property.type || "",
            bedrooms: property.bedrooms || 0,
            bathrooms: property.bathrooms || 0,
            area: property.area || 0,
            value: property.value || 0,
          },
        };
      } catch (error) {
        console.error("[Properfy Router] Erro ao buscar imóvel:", error);
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar imóvel no Properfy. Tente novamente mais tarde.",
        });
      }
    }),

  /**
   * Lista imóveis do Properfy com paginação
   * Usado para visualizar todos os imóveis disponíveis
   */
  listProperties: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        size: z.number().int().positive().max(100).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log(`[Properfy] Usuário ${ctx.user?.email} listando imóveis: página ${input.page}`);

        const properfy = createProperfyService();

        const result = await properfy.listProperties(input.page, input.size);

        if (!result) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao listar imóveis",
          });
        }

        return {
          success: true,
          error: null,
          data: {
            currentPage: result.current_page,
            total: result.total || 0,
            perPage: result.per_page || input.size,
            lastPage: result.last_page || 1,
            properties: (result.data || []).map((prop) => ({
              id: prop.id,
              reference: prop.reference || "",
              address: prop.address || "",
              city: prop.city || "",
              state: prop.state || "",
              zipCode: prop.zipCode || "",
              neighborhood: prop.neighborhood || "",
              number: prop.number || "",
              complement: prop.complement || "",
              type: prop.type || "",
              bedrooms: prop.bedrooms || 0,
              bathrooms: prop.bathrooms || 0,
              area: prop.area || 0,
              value: prop.value || 0,
            })),
          },
        };
      } catch (error) {
        console.error("[Properfy Router] Erro ao listar imóveis:", error);
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar imóveis",
        });
      }
    }),

  /**
   * Busca imóvel por ID no Properfy
   */
  getPropertyById: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log(`[Properfy] Usuário ${ctx.user?.email} buscando imóvel por ID: ${input.id}`);

        const properfy = createProperfyService();

        const property = await properfy.getPropertyById(input.id);

        if (!property) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Imóvel não encontrado",
          });
        }

        return {
          success: true,
          error: null,
          data: {
            id: property.id,
            reference: property.reference || "",
            address: property.address || "",
            city: property.city || "",
            state: property.state || "",
            zipCode: property.zipCode || "",
            neighborhood: property.neighborhood || "",
            number: property.number || "",
            complement: property.complement || "",
            type: property.type || "",
            bedrooms: property.bedrooms || 0,
            bathrooms: property.bathrooms || 0,
            area: property.area || 0,
            value: property.value || 0,
          },
        };
      } catch (error) {
        console.error("[Properfy Router] Erro ao buscar imóvel:", error);
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar imóvel",
        });
      }
    }),

  /**
   * Verifica a saúde da conexão com Properfy
   * Usado para validar se as credenciais estão corretas
   */
  healthCheck: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log(`[Properfy] Health check iniciado por ${ctx.user?.email}`);

      const properfy = createProperfyService();
      const isHealthy = await properfy.healthCheck();

      return {
        success: isHealthy,
        message: isHealthy 
          ? "Conexão com Properfy está funcionando"
          : "Falha ao conectar com Properfy",
      };
    } catch (error) {
      console.error("[Properfy Router] Health check falhou:", error);
      
      return {
        success: false,
        message: "Erro ao verificar conexão com Properfy",
      };
    }
  }),
});

