/**
 * Commission Calculation Service
 * Based on "Manual de Comissionamento" - Baggio Imóveis
 * 
 * Implements commission rules for different business types:
 * - Venda Interna (Internal Sale)
 * - Parceria UNA (UNA Partnership)
 * - Parceria Externa (External Partnership)
 * - Lançamentos (Launches)
 * - Parceria Autônomo (Autonomous Partnership)
 * - Imóveis Ebani (Ebani Properties)
 */

export interface CommissionBreakdown {
  totalCommissionPercentage: number; // Total commission % of sale value
  totalCommissionValue: number; // Total commission amount
  angariadorPercentage: number; // Angariador's % of total commission
  angariadorValue: number; // Angariador's amount
  vendedorPercentage: number; // Vendedor's % of total commission
  vendedorValue: number; // Vendedor's amount
  baggioPart: number; // Baggio's part
  partnerPart: number; // Partner's part (if applicable)
  details: string; // Description of the calculation
}

/**
 * Calculate commission based on business type and sale value
 */
export function calculateCommission(
  businessType: string,
  saleValue: number
): CommissionBreakdown {
  const baseCommission = saleValue;

  switch (businessType.toLowerCase()) {
    case "venda_interna":
      return calculateVendaInterna(baseCommission);

    case "parceria_una":
      return calculateParceriaUna(baseCommission);

    case "parceria_externa":
      return calculateParceriaExterna(baseCommission);

    case "lancamento":
      return calculateLancamento(baseCommission);

    case "parceria_autonomo":
      return calculateParceriaAutonomo(baseCommission);

    case "ebani":
      return calculateEbani(baseCommission);

    case "prontos":
      return calculateProntos(baseCommission);

    default:
      // Default to Venda Interna
      return calculateVendaInterna(baseCommission);
  }
}

/**
 * VENDA INTERNA
 * Realizada entre corretor angariador da Baggio com corretor vendedor da Baggio
 * 
 * Comissão padrão: 6%
 * Divisão:
 * - 20% Corretor Angariador
 * - 20% Corretor Vendedor
 * - 60% Baggio Imóveis
 */
function calculateVendaInterna(saleValue: number): CommissionBreakdown {
  const totalCommissionPercentage = 0.06;
  const totalCommissionValue = saleValue * totalCommissionPercentage;

  const angariadorPercentage = 0.20;
  const vendedorPercentage = 0.20;
  const baggioPercentage = 0.60;

  return {
    totalCommissionPercentage,
    totalCommissionValue,
    angariadorPercentage: angariadorPercentage * 100,
    angariadorValue: totalCommissionValue * angariadorPercentage,
    vendedorPercentage: vendedorPercentage * 100,
    vendedorValue: totalCommissionValue * vendedorPercentage,
    baggioPart: totalCommissionValue * baggioPercentage,
    partnerPart: 0,
    details: "Venda Interna - 6% total (20% Ang, 20% Vend, 60% Baggio)",
  };
}

/**
 * VENDA PARCERIA UNA
 * Parceria realizada entre corretores da imobiliária UNA e corretor da Baggio Imóveis
 * 
 * Comissão padrão: 6%
 * Divisão:
 * - 50% UNA
 * - 50% Baggio
 * 
 * Do lado Baggio (50%):
 * - 40% Corretor Baggio
 * - 60% Baggio Imóveis
 */
function calculateParceriaUna(saleValue: number): CommissionBreakdown {
  const totalCommissionPercentage = 0.06;
  const totalCommissionValue = saleValue * totalCommissionPercentage;

  const baggioShare = totalCommissionValue * 0.50;
  const unaShare = totalCommissionValue * 0.50;

  const angariadorPercentage = 0.40;
  const baggioPercentage = 0.60;

  return {
    totalCommissionPercentage,
    totalCommissionValue,
    angariadorPercentage: angariadorPercentage * 100,
    angariadorValue: baggioShare * angariadorPercentage,
    vendedorPercentage: 0, // Not applicable in UNA partnership
    vendedorValue: 0,
    baggioPart: baggioShare * baggioPercentage,
    partnerPart: unaShare,
    details: "Parceria UNA - 6% total (50% UNA, 50% Baggio: 40% Corretor, 60% Baggio)",
  };
}

/**
 * VENDA PARCERIA EXTERNA
 * Parceria realizada entre corretores de Imobiliária fora da Una e corretor da Baggio Imóveis
 * 
 * Comissão padrão: 6%
 * Divisão:
 * - 60% Baggio
 * - 40% Partner
 * 
 * Do lado Baggio (60%):
 * - 40% Corretor Baggio
 * - 60% Baggio Imóveis
 */
function calculateParceriaExterna(saleValue: number): CommissionBreakdown {
  const totalCommissionPercentage = 0.06;
  const totalCommissionValue = saleValue * totalCommissionPercentage;

  const baggioShare = totalCommissionValue * 0.60;
  const partnerShare = totalCommissionValue * 0.40;

  const angariadorPercentage = 0.40;
  const baggioPercentage = 0.60;

  return {
    totalCommissionPercentage,
    totalCommissionValue,
    angariadorPercentage: angariadorPercentage * 100,
    angariadorValue: baggioShare * angariadorPercentage,
    vendedorPercentage: 0, // Not applicable in external partnership
    vendedorValue: 0,
    baggioPart: baggioShare * baggioPercentage,
    partnerPart: partnerShare,
    details: "Parceria Externa - 6% total (60% Baggio: 40% Corretor, 60% Baggio; 40% Partner)",
  };
}

/**
 * VENDA LANÇAMENTOS
 * Parceria realizada entre corretor vendedor e CONSTRUTORAS
 * 
 * Comissão padrão: 4%
 * Divisão:
 * - 35% Corretor Vendedor
 * - 65% Baggio Imóveis
 * 
 * Com Coordenação de Produto:
 * - 10% Coordenador
 * - 30% Corretor Vendedor
 * - 60% Baggio Imóveis
 */
function calculateLancamento(saleValue: number): CommissionBreakdown {
  const totalCommissionPercentage = 0.04;
  const totalCommissionValue = saleValue * totalCommissionPercentage;

  const vendedorPercentage = 0.35;
  const baggioPercentage = 0.65;

  return {
    totalCommissionPercentage,
    totalCommissionValue,
    angariadorPercentage: 0, // Not applicable in launches
    angariadorValue: 0,
    vendedorPercentage: vendedorPercentage * 100,
    vendedorValue: totalCommissionValue * vendedorPercentage,
    baggioPart: totalCommissionValue * baggioPercentage,
    partnerPart: 0,
    details: "Lançamento - 4% total (35% Vendedor, 65% Baggio)",
  };
}

/**
 * VENDA PARCERIA AUTÔNOMO
 * Parceria realizada com corretores autônomos
 * 
 * Comissão padrão: 6%
 * Divisão:
 * - 70% Baggio
 * - 30% Autônomo
 * 
 * Do lado Baggio (70%):
 * - 40% Corretor Baggio
 * - 60% Baggio Imóveis
 */
function calculateParceriaAutonomo(saleValue: number): CommissionBreakdown {
  const totalCommissionPercentage = 0.06;
  const totalCommissionValue = saleValue * totalCommissionPercentage;

  const baggioShare = totalCommissionValue * 0.70;
  const autonomoShare = totalCommissionValue * 0.30;

  const angariadorPercentage = 0.40;
  const baggioPercentage = 0.60;

  return {
    totalCommissionPercentage,
    totalCommissionValue,
    angariadorPercentage: angariadorPercentage * 100,
    angariadorValue: baggioShare * angariadorPercentage,
    vendedorPercentage: 0, // Not applicable
    vendedorValue: 0,
    baggioPart: baggioShare * baggioPercentage,
    partnerPart: autonomoShare,
    details: "Parceria Autônomo - 6% total (70% Baggio: 40% Corretor, 60% Baggio; 30% Autônomo)",
  };
}

/**
 * VENDA IMÓVEIS EBANI
 * Imóveis em que Elcio Baggio é proprietário
 * 
 * Comissão padrão: 5%
 * Divisão:
 * - 10% Corretor Angariador
 * - 30% Corretor Vendedor
 * - 60% Baggio Imóveis
 */
function calculateEbani(saleValue: number): CommissionBreakdown {
  const totalCommissionPercentage = 0.05;
  const totalCommissionValue = saleValue * totalCommissionPercentage;

  const angariadorPercentage = 0.10;
  const vendedorPercentage = 0.30;
  const baggioPercentage = 0.60;

  return {
    totalCommissionPercentage,
    totalCommissionValue,
    angariadorPercentage: angariadorPercentage * 100,
    angariadorValue: totalCommissionValue * angariadorPercentage,
    vendedorPercentage: vendedorPercentage * 100,
    vendedorValue: totalCommissionValue * vendedorPercentage,
    baggioPart: totalCommissionValue * baggioPercentage,
    partnerPart: 0,
    details: "Imóvel Ebani - 5% total (10% Ang, 30% Vend, 60% Baggio)",
  };
}

/**
 * PRONTOS (Simplified version)
 * Similar to Venda Interna but with different percentages
 * 
 * Comissão padrão: 6%
 * Divisão:
 * - 20% Corretor Angariador
 * - 20% Corretor Vendedor
 * - 60% Baggio Imóveis
 */
function calculateProntos(saleValue: number): CommissionBreakdown {
  // Prontos follows the same rules as Venda Interna
  return calculateVendaInterna(saleValue);
}

/**
 * Format commission value as Brazilian currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Format percentage with 1 decimal place
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

