/**
 * Router tRPC para integração com Properfy
 * Expõe endpoints para buscar imóveis da Baggio
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createProperfyService } from "./properfy";

// Credenciais do Properfy (você pode mover para variáveis de ambiente)
const PROPERFY_EMAIL = "victor.macioski@hotmail.com";
const PROPERFY_PASSWORD = "XRWGMYLMMFRF";

export const properfyRouter = router({
  /**
   * Busca imóvel por referência no Properfy
   * Usado quando o corretor informa a referência de um imóvel da Baggio
   */
  searchPropertyByReference: protectedProcedure
    .input(
      z.object({
        reference: z.string().min(1, "Referência é obrigatória"),
      })
    )
    .query(async ({ input }) => {
      try {
        const properfy = createProperfyService(
          PROPERFY_EMAIL,
          PROPERFY_PASSWORD,
          true // sandbox
        );

        const property = await properfy.getPropertyByReference(input.reference);

        if (!property) {
          return {
            success: false,
            error: "Imóvel não encontrado no Properfy",
            data: null,
          };
        }

        return {
          success: true,
          error: null,
          data: {
            id: property.id,
            reference: property.reference,
            address: property.address,
            city: property.city,
            state: property.state,
            zipCode: property.zipCode,
            neighborhood: property.neighborhood,
            number: property.number,
            complement: property.complement,
            type: property.type,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area,
            value: property.value,
          },
        };
      } catch (error) {
        console.error("[Properfy Router] Erro ao buscar imóvel:", error);
        return {
          success: false,
          error: "Erro ao buscar imóvel no Properfy",
          data: null,
        };
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
        size: z.number().int().positive().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const properfy = createProperfyService(
          PROPERFY_EMAIL,
          PROPERFY_PASSWORD,
          true // sandbox
        );

        const result = await properfy.listProperties(input.page, input.size);

        if (!result) {
          return {
            success: false,
            error: "Erro ao listar imóveis",
            data: null,
          };
        }

        return {
          success: true,
          error: null,
          data: {
            currentPage: result.current_page,
            total: result.total,
            perPage: result.per_page,
            lastPage: result.last_page,
            properties: (result.data || []).map((prop) => ({
              id: prop.id,
              reference: prop.reference,
              address: prop.address,
              city: prop.city,
              state: prop.state,
              zipCode: prop.zipCode,
              neighborhood: prop.neighborhood,
              number: prop.number,
              complement: prop.complement,
              type: prop.type,
              bedrooms: prop.bedrooms,
              bathrooms: prop.bathrooms,
              area: prop.area,
              value: prop.value,
            })),
          },
        };
      } catch (error) {
        console.error("[Properfy Router] Erro ao listar imóveis:", error);
        return {
          success: false,
          error: "Erro ao listar imóveis",
          data: null,
        };
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
    .query(async ({ input }) => {
      try {
        const properfy = createProperfyService(
          PROPERFY_EMAIL,
          PROPERFY_PASSWORD,
          true // sandbox
        );

        const property = await properfy.getPropertyById(input.id);

        if (!property) {
          return {
            success: false,
            error: "Imóvel não encontrado",
            data: null,
          };
        }

        return {
          success: true,
          error: null,
          data: {
            id: property.id,
            reference: property.reference,
            address: property.address,
            city: property.city,
            state: property.state,
            zipCode: property.zipCode,
            neighborhood: property.neighborhood,
            number: property.number,
            complement: property.complement,
            type: property.type,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area,
            value: property.value,
          },
        };
      } catch (error) {
        console.error("[Properfy Router] Erro ao buscar imóvel:", error);
        return {
          success: false,
          error: "Erro ao buscar imóvel",
          data: null,
        };
      }
    }),
});

