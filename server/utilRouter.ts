/**
 * Router tRPC para utilitários (CEP, upload, etc)
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { searchCep, formatCep } from "./cepService";
import { storagePut } from "./storage";

export const utilRouter = router({
  /**
   * Buscar dados de CEP
   */
  searchCep: publicProcedure
    .input(z.object({ cep: z.string() }))
    .query(async ({ input }) => {
      try {
        const result = await searchCep(input.cep);

        if (!result.success) {
          throw new Error(result.error);
        }

        return {
          success: true,
          data: {
            cep: formatCep(result.data!.cep),
            address: result.data!.logradouro,
            neighborhood: result.data!.bairro,
            city: result.data!.localidade,
            state: result.data!.uf,
          },
        };
      } catch (error) {
        console.error("[Util Router] Erro ao buscar CEP:", error);
        return {
          success: false,
          error: "Erro ao buscar CEP",
        };
      }
    }),

  /**
   * Upload de documento
   */
  uploadDocument: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // base64
        fileType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validar tipo de arquivo
        const allowedTypes = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedTypes.includes(input.fileType)) {
          throw new Error("Tipo de arquivo não permitido");
        }

        // Converter base64 para buffer
        const buffer = Buffer.from(input.fileData, "base64");

        // Validar tamanho (máximo 10MB)
        if (buffer.length > 10 * 1024 * 1024) {
          throw new Error("Arquivo muito grande. Máximo 10MB");
        }

        // Upload para S3
        const { url } = await storagePut(
          `documents/${ctx.user.id}/${Date.now()}-${input.fileName}`,
          buffer,
          input.fileType
        );

        return {
          success: true,
          url: url,
          fileName: input.fileName,
        };
      } catch (error) {
        console.error("[Util Router] Erro ao fazer upload:", error);
        throw new Error("Erro ao fazer upload do documento");
      }
    }),

  /**
   * Validar email
   */
  validateEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(({ input }) => {
      // Validação básica já é feita pelo Zod
      return {
        success: true,
        email: input.email,
      };
    }),

  /**
   * Validar telefone
   */
  validatePhone: publicProcedure
    .input(z.object({ phone: z.string() }))
    .query(({ input }) => {
      try {
        // Remover caracteres especiais
        const cleanPhone = input.phone.replace(/\D/g, "");

        // Validar se tem entre 10 e 11 dígitos
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          return {
            success: false,
            error: "Telefone inválido",
          };
        }

        // Formatar telefone
        let formatted = "";
        if (cleanPhone.length === 10) {
          formatted = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
        } else {
          formatted = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
        }

        return {
          success: true,
          phone: formatted,
          cleanPhone: cleanPhone,
        };
      } catch (error) {
        return {
          success: false,
          error: "Erro ao validar telefone",
        };
      }
    }),

  /**
   * Validar CPF/CNPJ
   */
  validateCpfCnpj: publicProcedure
    .input(z.object({ value: z.string() }))
    .query(({ input }) => {
      try {
        const cleanValue = input.value.replace(/\D/g, "");

        // Verificar se é CPF (11 dígitos) ou CNPJ (14 dígitos)
        if (cleanValue.length === 11) {
          // Validação básica de CPF
          if (/^(\d)\1{10}$/.test(cleanValue)) {
            return {
              success: false,
              error: "CPF inválido",
            };
          }

          // Formatar CPF
          const formatted = `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9)}`;

          return {
            success: true,
            type: "cpf",
            value: formatted,
            cleanValue: cleanValue,
          };
        } else if (cleanValue.length === 14) {
          // Validação básica de CNPJ
          if (/^(\d)\1{13}$/.test(cleanValue)) {
            return {
              success: false,
              error: "CNPJ inválido",
            };
          }

          // Formatar CNPJ
          const formatted = `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5, 8)}/${cleanValue.slice(8, 12)}-${cleanValue.slice(12)}`;

          return {
            success: true,
            type: "cnpj",
            value: formatted,
            cleanValue: cleanValue,
          };
        } else {
          return {
            success: false,
            error: "CPF ou CNPJ inválido",
          };
        }
      } catch (error) {
        return {
          success: false,
          error: "Erro ao validar CPF/CNPJ",
        };
      }
    }),
});

