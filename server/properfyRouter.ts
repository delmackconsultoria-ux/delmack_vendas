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
 * - Status real do imóvel (disponível, vendido, alugado, etc)
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { createProperfyService } from "./properfy";
import { TRPCError } from "@trpc/server";
import { getListingRejections } from "./services/properfyService";

export const properfyRouter = router({
  /**
   * Busca imóvel por referência no Properfy
   * Usado quando o corretor informa a referência de um imóvel da Baggio
   * 
   * Exemplo: BG66206001
   * 
   * Retorna:
   * - Dados do imóvel
   * - Status real (Disponível, Vendido, Alugado, Em Negociação, etc)
   */
  searchPropertyByReference: protectedProcedure
    .input(
      z.object({
        reference: z
          .string()
          .min(1, "Referência é obrigatória")
          .max(50, "Referência muito longa")
          .transform((val) => val.toUpperCase())
          .refine((val) => /^[A-Z0-9]+$/.test(val), "Referência deve conter apenas letras e números"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log(`[Properfy] Usuário ${ctx.user?.email} buscando imóvel: ${input.reference}`);

        // Cria serviço com credenciais reais de variáveis de ambiente
        const properfy = createProperfyService({ useMockData: false });

        const property = await properfy.getPropertyByReference(input.reference);

        if (!property) {
          return {
            success: false,
            error: "Imóvel não encontrado no Properfy. Verifique a referência e tente novamente.",
            data: null,
          };
        }

        // Verifica se o imóvel está disponível
        const status = property.status || "Desconhecido";
        const isAvailable = status === "Disponível";
        const statusMessage = !isAvailable 
          ? `Este imóvel está ${status.toLowerCase()}. Não é possível registrar uma venda.`
          : null;

        // Retorna apenas dados necessários
        return {
          success: true,
          error: statusMessage,
          isAvailable,
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
            status: property.status || "Desconhecido",
          },
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("[Properfy Router] Erro ao buscar imóvel:", errorMsg);
        
        return {
          success: false,
          error: `Erro ao buscar imóvel: ${errorMsg}. Verifique a referência e tente novamente.`,
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
              status: prop.status || "Desconhecido",
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

        const status = property.status || "Desconhecido";
        const isAvailable = status === "Disponível";
        const statusMessage = !isAvailable 
          ? `Este imóvel está ${status.toLowerCase()}. Não é possível registrar uma venda.`
          : null;

        return {
          success: true,
          error: statusMessage,
          isAvailable,
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
            status: status,
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

  /**
   * Debug: Testar API Properfy e ver resposta bruta
   * Retorna os primeiros imóveis da API para diagnóstico
   */
  debugPropertySearch: protectedProcedure
    .input(
      z.object({
        searchTerm: z.string().min(1),
        searchType: z.enum(["reference", "cep", "address"]),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log(`[Properfy Debug] Buscando: ${input.searchTerm} (tipo: ${input.searchType})`);

        const PROPERFY_API_URL = (process.env.PROPERFY_API_URL || '').replace('/auth/token', '').replace(/\/$/, '');
        const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || '';

        if (!PROPERFY_API_TOKEN) {
          return {
            success: false,
            error: "Token Properfy não configurado",
            debug: { hasToken: false, apiUrl: PROPERFY_API_URL }
          };
        }

        // Buscar primeiros 10 imóveis para debug
        const response = await fetch(`${PROPERFY_API_URL}/property/property?page=1&size=10`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          return {
            success: false,
            error: `API retornou status ${response.status}`,
            debug: {
              status: response.status,
              statusText: response.statusText,
              hasToken: true,
              apiUrl: PROPERFY_API_URL
            }
          };
        }

        const data = await response.json();

        // Buscar imóvel específico
        const searchNormalized = input.searchTerm.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const found = data.data?.find((p: any) => {
          const ref = (p.chrReference || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
          const innerRef = (p.chrInnerReference || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
          const cep = (p.chrAddressPostalCode || '').replace(/[^0-9]/g, '');
          const address = (p.chrAddressStreet || '').toLowerCase();
          
          return ref === searchNormalized || 
                 innerRef === searchNormalized ||
                 cep === searchNormalized ||
                 address.includes(input.searchTerm.toLowerCase());
        });

        return {
          success: true,
          found: !!found,
          foundProperty: found || null,
          debug: {
            totalProperties: data.total || 0,
            currentPage: data.current_page || 1,
            lastPage: data.last_page || 1,
            sampleProperties: (data.data || []).slice(0, 3).map((p: any) => ({
              chrReference: p.chrReference,
              chrInnerReference: p.chrInnerReference,
              chrAddressStreet: p.chrAddressStreet,
              chrAddressPostalCode: p.chrAddressPostalCode,
              chrAddressCity: p.chrAddressCity,
            })),
            searchTerm: input.searchTerm,
            searchNormalized,
            hasToken: true,
            apiUrl: PROPERFY_API_URL
          }
        };
      } catch (error) {
        console.error("[Properfy Debug] Erro:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
          debug: { exception: String(error) }
        };
      }
    }),

  /**
   * Buscar baixas de angariação (listing rejections)
   * Retorna lista de imóveis recusados com motivos
   */
  getListingRejections: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        brokerName: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log(`[Properfy] Usuário ${ctx.user?.email} buscando baixas de angariação`);

        const result = await getListingRejections(
          input.startDate,
          input.endDate,
          input.brokerName
        );

        return result;
      } catch (error) {
        console.error("[Properfy Router] Erro ao buscar baixas:", error);
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar baixas de angariação",
        });
      }
    }),
});

