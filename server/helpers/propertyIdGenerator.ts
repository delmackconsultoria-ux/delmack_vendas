/**
 * Property ID Generator - Regras de Referência
 * 
 * Implementa as regras de geração de propertyId conforme definido em:
 * REGRAS_EXTRACAO_DADOS.md
 * 
 * Regras:
 * 1. Se tem REFERÊNCIA (REF: 97292001) → propertyId = 97292001
 * 2. Se é "S REF" → propertyId = SRBG000001 (sequencial por company)
 * 3. Cada imóvel único tem um propertyId único
 */

import { getDb } from "../db";
import { properties } from "../../drizzle/schema";
import { eq, and, like } from "drizzle-orm";

export interface PropertyIdGeneratorInput {
  referencia: string; // "REF: 97292001" ou "S REF"
  imovel: string; // "REF: 97292001 Rua Paranavaí, 2632"
  companyId: string; // "company_baggio_001"
}

export interface PropertyIdGeneratorOutput {
  propertyId: string; // "97292001" ou "SRBG000001"
  propertyReference: string; // "97292001" ou "S REF"
  isNewProperty: boolean; // true se precisa criar, false se já existe
}

/**
 * Extrai a referência conforme regra
 */
export function extractReferencia(referenciaRaw: string): string {
  if (!referenciaRaw) {
    return "S REF";
  }

  const ref = String(referenciaRaw).trim();

  // Se é "S REF" ou começa com "S REF"
  if (ref.toUpperCase() === "S REF" || ref.toUpperCase().startsWith("S REF")) {
    return "S REF";
  }

  // Se começa com "REF:" → extrair número
  if (ref.startsWith("REF:")) {
    const parts = ref.split(/\s+/);
    if (parts.length > 1) {
      return parts[1];
    }
  }

  // Se é só número
  if (/^\d+$/.test(ref)) {
    return ref;
  }

  return ref;
}

/**
 * Gera o próximo sequencial para S REF
 */
async function getNextSRSequential(companyId: string): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Procurar todas as properties com propertyId começando com SRBG
  const existingProperties = await db
    .select()
    .from(properties)
    .where(
      and(
        eq(properties.companyId, companyId),
        like(properties.id, "SRBG%")
      )
    );

  if (existingProperties.length === 0) {
    return 1;
  }

  // Extrair números dos IDs existentes
  const numbers = existingProperties
    .map((p) => {
      const match = p.id.match(/SRBG(\d+)/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter((n) => n > 0);

  const maxNumber = Math.max(...numbers);
  return maxNumber + 1;
}

/**
 * Gera o propertyId conforme regras
 */
export async function generatePropertyId(
  input: PropertyIdGeneratorInput
): Promise<PropertyIdGeneratorOutput> {
  const referencia = extractReferencia(input.referencia);

  // CASO 1: Com Referência (REF: 97292001)
  if (referencia !== "S REF") {
    return {
      propertyId: referencia,
      propertyReference: referencia,
      isNewProperty: true, // Assumir que é novo (verificar no banco se necessário)
    };
  }

  // CASO 2: Sem Referência (S REF)
  const nextSequential = await getNextSRSequential(input.companyId);
  const propertyId = `SRBG${String(nextSequential).padStart(6, "0")}`;

  return {
    propertyId,
    propertyReference: "S REF",
    isNewProperty: true,
  };
}

/**
 * Verifica se uma property já existe
 */
export async function propertyExists(
  propertyId: string,
  companyId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  const result = await db
    .select()
    .from(properties)
    .where(
      and(
        eq(properties.id, propertyId),
        eq(properties.companyId, companyId)
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Cria uma nova property
 */
export async function createProperty(
  propertyId: string,
  companyId: string,
  propertyReference: string,
  address: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verificar se já existe
  const exists = await propertyExists(propertyId, companyId);
  if (exists) {
    console.log(`Property ${propertyId} já existe`);
    return;
  }

  // Criar nova property
  await db.insert(properties).values({
    id: propertyId,
    companyId,
    propertyReference,
    address,
  });

  console.log(`Property ${propertyId} criada com sucesso`);
}

/**
 * Exemplo de uso em um tRPC procedure
 */
export const exampleUsage = `
// No seu tRPC procedure para criar uma venda:

import { generatePropertyId, createProperty } from "./helpers/propertyIdGenerator";

export const createSaleProcedure = protectedProcedure
  .input(z.object({
    referencia: z.string(), // "REF: 97292001" ou "S REF"
    imovel: z.string(),
    saleDate: z.string(),
    saleValue: z.number(),
    // ... outros campos
  }))
  .mutation(async ({ input, ctx }) => {
    // 1. Gerar propertyId conforme regras
    const propertyIdResult = await generatePropertyId({
      referencia: input.referencia,
      imovel: input.imovel,
      companyId: ctx.user.companyId,
    });

    // 2. Criar property se for nova
    if (propertyIdResult.isNewProperty) {
      await createProperty(
        propertyIdResult.propertyId,
        ctx.user.companyId,
        propertyIdResult.propertyReference,
        input.imovel
      );
    }

    // 3. Criar sale com o propertyId gerado
    const sale = await db.insert(sales).values({
      propertyId: propertyIdResult.propertyId,
      saleDate: input.saleDate,
      saleValue: input.saleValue,
      // ... outros campos
    });

    return { success: true, propertyId: propertyIdResult.propertyId };
  });
`;
