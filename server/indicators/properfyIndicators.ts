import { getDb } from "../db";
import { properfyProperties } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

/**
 * Carteira de Divulgacao (em numero)
 * Contagem de imoveis ativos para venda
 * Filtro: chrStatus = 'LISTED' AND isActive = 1
 */
export async function calculateActivePropertiesCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
    .from(properfyProperties)
    .where(
      and(
        eq(properfyProperties.chrStatus, "LISTED"),
        eq(properfyProperties.isActive, 1)
      )
    );

  return result[0]?.count || 0;
}

/**
 * Angariaces mes
 * Contagem de imoveis com data de angariacao no mes
 * Campo: dteNewListing
 */
export async function calculateAngariationsCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
    .from(properfyProperties)
    .where(
      and(
        isNotNull(properfyProperties.dteNewListing),
        gte(properfyProperties.dteNewListing, startDate),
        lte(properfyProperties.dteNewListing, endDate)
      )
    );

  return result[0]?.count || 0;
}

/**
 * Baixas no mes
 * Contagem de imoveis removidos (chrStatus != 'LISTED') no mes
 * Campo: dteTermination (data de remocao)
 */
export async function calculateRemovalsCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
    .from(properfyProperties)
    .where(
      and(
        isNotNull(properfyProperties.dteTermination),
        gte(properfyProperties.dteTermination, startDate),
        lte(properfyProperties.dteTermination, endDate)
      )
    );

  return result[0]?.count || 0;
}

/**
 * VSO - Venda/Oferta
 * Percentual de vendas em relacao a carteira anterior
 * Calculo: (vendas no mes / carteira anterior) * 100
 */
export async function calculateVSORatio(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Obter carteira anterior (imoveis ativos antes do mes)
  const portfolioBefore = await db
    .select({ count: sql<number>`COUNT(${properfyProperties.id})` })
    .from(properfyProperties)
    .where(
      and(
        eq(properfyProperties.chrStatus, "LISTED"),
        eq(properfyProperties.isActive, 1),
        lte(properfyProperties.dteNewListing, startDate)
      )
    );

  const portfolioCount = portfolioBefore[0]?.count || 1; // Evita divisao por zero

  // Obter vendas no mes
  const sales = await db.query.raw(
    sql`SELECT COUNT(*) as count FROM sales WHERE saleDate BETWEEN ${startDate} AND ${endDate} AND status = 'sold'`
  );

  const salesCount = (sales[0] as any)?.count || 0;

  // Calcular VSO
  const vso = (salesCount / portfolioCount) * 100;
  return Math.round(vso * 100) / 100; // Arredondar para 2 casas decimais
}

/**
 * Numero de atendimentos Prontos
 * Leads em imoveis prontos (ready)
 */
export async function calculateReadyCalls(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.query.raw(
    sql`SELECT COUNT(*) as count FROM properfyLeads WHERE leadType = 'ready' AND createdAt BETWEEN ${startDate} AND ${endDate}`
  );

  return (result[0] as any)?.count || 0;
}

/**
 * Numero de atendimentos Lancamentos
 * Leads em imoveis lancamentos (launch)
 */
export async function calculateLaunchCalls(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.query.raw(
    sql`SELECT COUNT(*) as count FROM properfyLeads WHERE leadType = 'launch' AND createdAt BETWEEN ${startDate} AND ${endDate}`
  );

  return (result[0] as any)?.count || 0;
}

/**
 * Tempo medio de venda angariada X venda
 * Calcula dias entre data de angariacao (dteNewListing do Properfy) e data de venda (saleDate do Delmack)
 * Usa propertiesCache para conectar as duas tabelas
 */
export async function calculateAverageSaleTime(
  startDate: Date,
  endDate: Date,
  companyId: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calcular tempo medio entre data de angariacao (dteNewListing) e data de venda (saleDate)
  const result = await db.query.raw(
    sql`
      SELECT AVG(DATEDIFF(s.saleDate, pp.dteNewListing)) as avgDays
      FROM properfyProperties pp
      INNER JOIN propertiesCache pc ON pp.chrReference = pc.properfyId
      INNER JOIN sales s ON pc.delmackPropertyId = s.propertyId
      WHERE s.saleDate BETWEEN ${startDate} AND ${endDate}
        AND pp.dteNewListing IS NOT NULL
        AND s.status = 'sold'
    `
  );

  if (!result || result.length === 0) return 0;

  const avgDays = (result[0] as any)?.avgDays;
  return avgDays ? Math.round(avgDays) : 0;
}
