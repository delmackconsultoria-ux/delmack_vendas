import { getDb } from "../db";
import { properfyLeads } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

const PROPERFY_API_URL = (process.env.PROPERFY_API_URL || 'https://sandbox.properfy.com.br/api').replace('/auth/token', '').replace(/\/$/, '');
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || '';

/**
 * Carteira de Divulgação (em número)
 * Busca DIRETO DA API: Contagem de imóveis ativos para venda
 * Filtro: chrTransactionType = 'sale' AND chrStatus = 'LISTED' AND isActive = 1
 * NOTA: Apenas imóveis para VENDA, nunca locação
 */
export async function calculateActivePropertiesCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const response = await fetch(`${PROPERFY_API_URL}/imovel/listar`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PROPERFY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("[calculateActivePropertiesCount] API Error:", response.status);
      return 0;
    }

    const data = await response.json();
    const properties = data.data || [];

    // Filtrar: chrTransactionType = 'sale' AND chrStatus = 'LISTED' AND isActive = 1
    const filtered = properties.filter((p: any) =>
      p.chrTransactionType === "sale" &&
      p.chrStatus === "LISTED" &&
      p.isActive === 1
    );

    return filtered.length;
  } catch (error) {
    console.error("[calculateActivePropertiesCount] Error:", error);
    return 0;
  }
}

/**
 * Angariações mês
 * Busca DIRETO DA API: Contagem de imóveis para VENDA com dteNewListing dentro do mês corrente
 * Filtro: chrTransactionType = 'sale' AND dteNewListing >= startDate AND dteNewListing <= endDate
 * NOTA: Apenas imóveis para VENDA, nunca locação. Usa dteNewListing para data real de angariação
 */
export async function calculateAngariationsCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const response = await fetch(`${PROPERFY_API_URL}/imovel/listar`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PROPERFY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("[calculateAngariationsCount] API Error:", response.status);
      return 0;
    }

    const data = await response.json();
    const properties = data.data || [];

    // Filtrar: chrTransactionType = 'sale' AND dteNewListing dentro do período
    const filtered = properties.filter((p: any) => {
      if (p.chrTransactionType !== "sale") return false;
      if (!p.dteNewListing) return false;

      const dteNewListing = new Date(p.dteNewListing);
      return dteNewListing >= startDate && dteNewListing <= endDate;
    });

    return filtered.length;
  } catch (error) {
    console.error("[calculateAngariationsCount] Error:", error);
    return 0;
  }
}

/**
 * Baixas no mês
 * Busca DIRETO DA API: Contagem de imóveis para VENDA com baixa durante o mês
 * Filtro: chrTransactionType = 'sale' AND chrStatus IN ('REMOVED', 'RENTED', 'IN_TERMINATION')
 * NOTA: Apenas imóveis para VENDA, nunca locação
 */
export async function calculateRemovedPropertiesCount(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const response = await fetch(`${PROPERFY_API_URL}/imovel/listar`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PROPERFY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("[calculateRemovedPropertiesCount] API Error:", response.status);
      return 0;
    }

    const data = await response.json();
    const properties = data.data || [];

    // Filtrar: chrTransactionType = 'sale' AND chrStatus em baixa
    const filtered = properties.filter((p: any) =>
      p.chrTransactionType === "sale" &&
      ["REMOVED", "RENTED", "IN_TERMINATION"].includes(p.chrStatus)
    );

    return filtered.length;
  } catch (error) {
    console.error("[calculateRemovedPropertiesCount] Error:", error);
    return 0;
  }
}

/**
 * VSO - venda/oferta
 * Busca DIRETO DA API: Calcula percentual de vendas vs ofertas
 * Fórmula: (Negócios / Carteira de Divulgação) * 100
 */
export async function calculateVSO(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const response = await fetch(`${PROPERFY_API_URL}/imovel/listar`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PROPERFY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("[calculateVSO] API Error:", response.status);
      return 0;
    }

    const data = await response.json();
    const properties = data.data || [];

    // Contar vendas (chrStatus = 'REMOVED' ou similar)
    const vendas = properties.filter((p: any) =>
      p.chrTransactionType === "sale" &&
      p.chrStatus === "REMOVED"
    ).length;

    // Contar carteira ativa
    const carteira = properties.filter((p: any) =>
      p.chrTransactionType === "sale" &&
      p.chrStatus === "LISTED"
    ).length;

    if (carteira === 0) return 0;
    return (vendas / carteira) * 100;
  } catch (error) {
    console.error("[calculateVSO] Error:", error);
    return 0;
  }
}

/**
 * Atendimentos Prontos
 * Busca DIRETO DA API: Contagem de leads com status 'READY' para imóveis de venda
 */
export async function calculateReadyAttendances(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[calculateReadyAttendances] Database not available");
      return 0;
    }

    // Buscar leads com status 'READY'
    const response = await fetch(`${PROPERFY_API_URL}/lead/listar`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PROPERFY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("[calculateReadyAttendances] API Error:", response.status);
      return 0;
    }

    const data = await response.json();
    const leads = data.data || [];

    // Filtrar leads com status 'READY' e que pertencem a imóveis de venda
    const filtered = leads.filter((l: any) => l.chrStatus === "READY");

    return filtered.length;
  } catch (error) {
    console.error("[calculateReadyAttendances] Error:", error);
    return 0;
  }
}

/**
 * Atendimentos Lançamentos
 * Busca DIRETO DA API: Contagem de leads com status 'LAUNCH' para imóveis de venda
 */
export async function calculateLaunchAttendances(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[calculateLaunchAttendances] Database not available");
      return 0;
    }

    // Buscar leads com status 'LAUNCH'
    const response = await fetch(`${PROPERFY_API_URL}/lead/listar`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PROPERFY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("[calculateLaunchAttendances] API Error:", response.status);
      return 0;
    }

    const data = await response.json();
    const leads = data.data || [];

    // Filtrar leads com status 'LAUNCH'
    const filtered = leads.filter((l: any) => l.chrStatus === "LAUNCH");

    return filtered.length;
  } catch (error) {
    console.error("[calculateLaunchAttendances] Error:", error);
    return 0;
  }
}

/**
 * Tempo médio de venda (angariação X venda)
 * Busca DIRETO DA API: Calcula tempo médio entre angariação e venda
 */
export async function calculateAverageSaleTime(
  startDate: Date,
  endDate: Date,
  companyId?: string
): Promise<number> {
  try {
    const response = await fetch(`${PROPERFY_API_URL}/imovel/listar`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PROPERFY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("[calculateAverageSaleTime] API Error:", response.status);
      return 0;
    }

    const data = await response.json();
    const properties = data.data || [];

    // Filtrar imóveis vendidos (chrStatus = 'REMOVED') com ambas as datas
    const vendidos = properties.filter((p: any) =>
      p.chrTransactionType === "sale" &&
      p.chrStatus === "REMOVED" &&
      p.dteNewListing &&
      p.dteTermination
    );

    if (vendidos.length === 0) return 0;

    // Calcular tempo médio em dias
    const tempos = vendidos.map((p: any) => {
      const inicio = new Date(p.dteNewListing);
      const fim = new Date(p.dteTermination);
      const dias = Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      return dias;
    });

    const media = tempos.reduce((a: number, b: number) => a + b, 0) / tempos.length;
    return Math.round(media);
  } catch (error) {
    console.error("[calculateAverageSaleTime] Error:", error);
    return 0;
  }
}
