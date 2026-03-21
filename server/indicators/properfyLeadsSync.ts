import { getDb } from "../db";
import { properfyLeads, properfyProperties } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";

/**
 * Sincronizar leads do Properfy
 * Busca dados da API do Properfy e armazena localmente
 */
export async function syncProperfyLeads() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    console.log("[ProperfyLeadsSync] Iniciando sincronização de leads...");

    // Buscar leads da API do Properfy
    const leads = await fetchLeadsFromPropertyfy();
    
    if (!leads || leads.length === 0) {
      console.log("[ProperfyLeadsSync] Nenhum lead encontrado no Properfy");
      return { total: 0, inserted: 0, updated: 0 };
    }

    let inserted = 0;
    let updated = 0;

    // Processar cada lead
    for (const lead of leads) {
      const leadId = lead.id || uuid();
      
      // Verificar se o lead já existe
      const existing = await db
        .select()
        .from(properfyLeads)
        .where(eq(properfyLeads.leadId, lead.leadId || leadId))
        .limit(1);

      const leadData = {
        id: leadId,
        propertyId: lead.propertyId || null,
        leadId: lead.leadId || leadId,
        leadName: lead.name || lead.leadName || null,
        leadEmail: lead.email || lead.leadEmail || null,
        leadPhone: lead.phone || lead.leadPhone || null,
        leadType: (lead.type === "pronto" ? "ready" : 
                   lead.type === "lançamento" ? "launch" : 
                   "other") as "ready" | "launch" | "other",
        status: lead.status || "active",
        createdAt: lead.createdAt ? new Date(lead.createdAt) : new Date(),
        updatedAt: lead.updatedAt ? new Date(lead.updatedAt) : new Date(),
      };

      if (existing.length > 0) {
        // Atualizar lead existente
        await db
          .update(properfyLeads)
          .set(leadData)
          .where(eq(properfyLeads.leadId, lead.leadId || leadId));
        updated++;
      } else {
        // Inserir novo lead
        await db.insert(properfyLeads).values(leadData);
        inserted++;
      }
    }

    console.log(
      `[ProperfyLeadsSync] Sincronização concluída: ${inserted} inseridos, ${updated} atualizados`
    );
    return { total: leads.length, inserted, updated };
  } catch (error) {
    console.error("[ProperfyLeadsSync] Erro na sincronização:", error);
    throw error;
  }
}

/**
 * Buscar leads da API do Properfy
 * Integração com endpoint /api/crm/lead
 */
async function fetchLeadsFromPropertyfy(): Promise<any[]> {
  try {
    // Usar as credenciais do Properfy do ambiente
    const apiUrl = process.env.PROPERFY_API_URL || "https://api.properfy.com.br";
    const apiToken = process.env.PROPERFY_API_TOKEN;
    const email = process.env.PROPERFY_EMAIL;
    const password = process.env.PROPERFY_PASSWORD;

    if (!apiToken || !email || !password) {
      console.warn("[ProperfyLeadsSync] Credenciais do Properfy não configuradas");
      return [];
    }

    // Buscar leads do Properfy
    const response = await fetch(`${apiUrl}/api/crm/lead`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        "X-Email": email,
        "X-Password": password,
      },
    });

    if (!response.ok) {
      console.error(
        `[ProperfyLeadsSync] Erro ao buscar leads: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data = await response.json();
    
    // Normalizar resposta do Properfy
    const leads = Array.isArray(data) ? data : data.leads || data.data || [];
    
    console.log(`[ProperfyLeadsSync] ${leads.length} leads encontrados no Properfy`);
    return leads;
  } catch (error) {
    console.error("[ProperfyLeadsSync] Erro ao buscar leads do Properfy:", error);
    return [];
  }
}

/**
 * Calcular número de atendimentos prontos
 * Contagem de leads vinculados a imóveis prontos para VENDA
 * Filtra apenas leads de imóveis com chrTransactionType = 'sale'
 */
export async function calculateReadyAttendances(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const { properfyProperties } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const result = await db
      .select({ count: sql<number>`COUNT(${properfyLeads.id})` })
      .from(properfyLeads)
      .innerJoin(properfyProperties, eq(properfyLeads.propertyId, properfyProperties.id))
      .where(
        sql`${properfyLeads.leadType} = 'ready' 
            AND ${properfyLeads.createdAt} >= ${startDate}
            AND ${properfyLeads.createdAt} <= ${endDate}
            AND ${properfyProperties.chrTransactionType} = 'sale'`
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[ProperfyLeadsSync] Erro ao calcular atendimentos prontos:", error);
    return 0;
  }
}

/**
 * Calcular número de atendimentos lançamentos
 * Contagem de leads vinculados a lançamentos para VENDA
 * Filtra apenas leads de imóveis com chrTransactionType = 'sale'
 */
export async function calculateLaunchAttendances(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const { properfyProperties } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const result = await db
      .select({ count: sql<number>`COUNT(${properfyLeads.id})` })
      .from(properfyLeads)
      .innerJoin(properfyProperties, eq(properfyLeads.propertyId, properfyProperties.id))
      .where(
        sql`${properfyLeads.leadType} = 'launch' 
            AND ${properfyLeads.createdAt} >= ${startDate}
            AND ${properfyLeads.createdAt} <= ${endDate}
            AND ${properfyProperties.chrTransactionType} = 'sale'`
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[ProperfyLeadsSync] Erro ao calcular atendimentos lançamentos:", error);
    return 0;
  }
}
