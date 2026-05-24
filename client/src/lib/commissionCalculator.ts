/**
 * Calculadora de Comissões - Baseado no manual de comissionamento Baggio
 * 
 * Tipos de Negócio:
 * - Venda Interna: 6% total (20% angariador, 20% vendedor, 60% Baggio)
 * - Parceria UNA: 6% total dividido 50/50 entre imobiliárias, corretor recebe 40% dos 50% Baggio
 * - Parceria Externa: 6% total dividido 60/40, corretor recebe 40% dos 60% Baggio
 * - Lançamentos: 4% total (35% vendedor, 65% Baggio)
 * - Parceria Autônomo: 6% total dividido 70/30, corretor recebe 40% dos 70% Baggio
 * - Imóveis Ebani: 5% total (10% angariador, 30% vendedor, 60% Baggio)
 * - Prontos: 6% total (20% angariador, 20% vendedor, 60% Baggio) - mesmo que venda interna
 */

export interface CommissionResult {
  totalCommissionPercent: number;
  totalCommissionValue: number;
  angariadorPercent: number;
  angariadorValue: number;
  vendedorPercent: number;
  vendedorValue: number;
  baggioPercent: number;
  baggioValue: number;
}

export type BusinessType = 
  | "venda_interna" 
  | "parceria_una" 
  | "parceria_externa" 
  | "lancamento" 
  | "parceria_autonomo" 
  | "imoveis_ebani"
  | "prontos";

/**
 * Calcula as comissões baseado no tipo de negócio e valor da venda
 */
export function calculateCommissions(
  saleValue: number,
  businessType: BusinessType,
  customCommissionPercent?: number
): CommissionResult {
  // Percentual total de comissão por tipo de negócio
  const commissionRates: Record<BusinessType, number> = {
    venda_interna: 6,
    parceria_una: 6,
    parceria_externa: 6,
    lancamento: 4,
    parceria_autonomo: 6,
    imoveis_ebani: 5,
    prontos: 6,
  };

  const totalPercent = customCommissionPercent ?? commissionRates[businessType];
  const totalCommissionValue = (saleValue * totalPercent) / 100;

  let angariadorPercent = 0;
  let vendedorPercent = 0;
  let baggioPercent = 0;

  switch (businessType) {
    case "venda_interna":
    case "prontos":
      // 20% angariador, 20% vendedor, 60% Baggio
      angariadorPercent = 20;
      vendedorPercent = 20;
      baggioPercent = 60;
      break;

    case "parceria_una":
      // 50% vai para imobiliária parceira
      // Dos 50% Baggio: 40% corretor (dividido), 60% Baggio
      // Corretor recebe 40% dos 50% = 20% do total
      angariadorPercent = 10; // metade dos 20%
      vendedorPercent = 10;   // metade dos 20%
      baggioPercent = 30;     // 60% dos 50%
      // Nota: 50% vai para a imobiliária parceira (não calculado aqui)
      break;

    case "parceria_externa":
      // 60% Baggio, 40% parceira
      // Dos 60% Baggio: 40% corretor, 60% Baggio
      // Corretor recebe 40% dos 60% = 24% do total
      angariadorPercent = 12; // metade dos 24%
      vendedorPercent = 12;   // metade dos 24%
      baggioPercent = 36;     // 60% dos 60%
      // Nota: 40% vai para a imobiliária parceira (não calculado aqui)
      break;

    case "lancamento":
      // 35% vendedor, 65% Baggio (sem angariador)
      angariadorPercent = 0;
      vendedorPercent = 35;
      baggioPercent = 65;
      break;

    case "parceria_autonomo":
      // 70% Baggio, 30% autônomo
      // Dos 70% Baggio: 40% corretor, 60% Baggio
      // Corretor recebe 40% dos 70% = 28% do total
      angariadorPercent = 14; // metade dos 28%
      vendedorPercent = 14;   // metade dos 28%
      baggioPercent = 42;     // 60% dos 70%
      // Nota: 30% vai para o autônomo (não calculado aqui)
      break;

    case "imoveis_ebani":
      // 10% angariador, 30% vendedor, 60% Baggio
      angariadorPercent = 10;
      vendedorPercent = 30;
      baggioPercent = 60;
      break;
  }

  // Calcular valores em R$
  const angariadorValue = (totalCommissionValue * angariadorPercent) / 100;
  const vendedorValue = (totalCommissionValue * vendedorPercent) / 100;
  const baggioValue = (totalCommissionValue * baggioPercent) / 100;

  return {
    totalCommissionPercent: totalPercent,
    totalCommissionValue,
    angariadorPercent,
    angariadorValue,
    vendedorPercent,
    vendedorValue,
    baggioPercent,
    baggioValue,
  };
}

/**
 * Formata valor em R$
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Retorna descrição do tipo de negócio
 */
export function getBusinessTypeLabel(type: BusinessType): string {
  const labels: Record<BusinessType, string> = {
    venda_interna: "Venda Interna",
    parceria_una: "Parceria UNA",
    parceria_externa: "Parceria Externa",
    lancamento: "Lançamentos",
    parceria_autonomo: "Parceria Autônomo",
    imoveis_ebani: "Imóveis Ebani",
    prontos: "Prontos",
  };
  return labels[type];
}
