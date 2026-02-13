/**
 * Calculadora de Comissões - Sistema Delmack
 * 
 * Baseado na estrutura de comissões da Baggio Imóveis
 * Fonte: COMISSÃOPRONTOS(1)(1).pdf e instruções do usuário
 * 
 * Data: 12/02/2026
 */

export interface CommissionCalculation {
  totalCommission: number;
  brokerAngariador?: number;
  brokerCoordenador?: number;
  brokerVendedor: number;
  imobiliaria: number;
  parceira?: number;
  autonomo?: number;
}

export interface BonusCalculation {
  corretor: number;
  imobiliaria: number;
}

/**
 * Calcula comissões baseado no tipo de negócio
 * 
 * @param tipo - Tipo de comissão (7 opções)
 * @param valorVenda - Valor total da venda
 * @param porcentagemCustom - Porcentagem customizada (opcional, sobrescreve padrão)
 * @returns Objeto com todos os valores de comissão calculados
 */
export function calculateCommission(
  tipo: string,
  valorVenda: number,
  porcentagemCustom?: number
): CommissionCalculation {
  
  // Porcentagens padrão por tipo de negócio
  const porcentagens: Record<string, number> = {
    'Venda Interna': 6,
    'Parceria UNA': 6,
    'Parceria Externa': 6,
    'Lançamentos (sem coordenação)': 4,
    'Lançamentos (com coordenação de produto)': 4,
    'Corretor Autônomo': 6,
    'Imóveis Ebani': 5
  };
  
  const porcentagem = porcentagemCustom || porcentagens[tipo] || 0;
  const totalCommission = valorVenda * (porcentagem / 100);
  
  switch (tipo) {
    case 'Venda Interna':
      // 20% Angariador + 20% Vendedor + 60% Imobiliária
      return {
        totalCommission,
        brokerAngariador: totalCommission * 0.20,
        brokerVendedor: totalCommission * 0.20,
        imobiliaria: totalCommission * 0.60
      };
    
    case 'Parceria UNA':
      // 50% Parceira UNA + 50% Baggio
      // Dentro dos 50% Baggio: 40% Corretor + 60% Imobiliária
      const baseUNA = totalCommission * 0.50;
      return {
        totalCommission,
        brokerVendedor: baseUNA * 0.40, // 20% do total
        imobiliaria: baseUNA * 0.60, // 30% do total
        parceira: totalCommission * 0.50 // 50% do total
      };
    
    case 'Parceria Externa':
      // 60% Baggio + 40% Parceira Externa
      // Dentro dos 60% Baggio: 40% Corretor + 60% Imobiliária
      const baseExterna = totalCommission * 0.60;
      return {
        totalCommission,
        brokerVendedor: baseExterna * 0.40, // 24% do total
        imobiliaria: baseExterna * 0.60, // 36% do total
        parceira: totalCommission * 0.40 // 40% do total
      };
    
    case 'Lançamentos (sem coordenação)':
      // 35% Vendedor + 65% Imobiliária
      return {
        totalCommission,
        brokerVendedor: totalCommission * 0.35,
        imobiliaria: totalCommission * 0.65
      };
    
    case 'Lançamentos (com coordenação de produto)':
      // 10% Coordenador + 30% Vendedor + 60% Imobiliária
      return {
        totalCommission,
        brokerCoordenador: totalCommission * 0.10,
        brokerVendedor: totalCommission * 0.30,
        imobiliaria: totalCommission * 0.60
      };
    
    case 'Corretor Autônomo':
      // 30% Autônomo + 70% Baggio
      // Dentro dos 70% Baggio: 40% Corretor + 60% Imobiliária
      const baseAutonomo = totalCommission * 0.70;
      return {
        totalCommission,
        brokerVendedor: baseAutonomo * 0.40, // 28% do total
        imobiliaria: baseAutonomo * 0.60, // 42% do total
        autonomo: totalCommission * 0.30 // 30% do total
      };
    
    case 'Imóveis Ebani':
      // 10% Angariador + 30% Vendedor + 60% Imobiliária
      return {
        totalCommission,
        brokerAngariador: totalCommission * 0.10,
        brokerVendedor: totalCommission * 0.30,
        imobiliaria: totalCommission * 0.60
      };
    
    default:
      // Fallback: retorna valores zerados
      return {
        totalCommission: 0,
        brokerVendedor: 0,
        imobiliaria: 0
      };
  }
}

/**
 * Calcula bonificação baseado no tipo
 * 
 * @param valorBonus - Valor da bonificação
 * @param tipo - Tipo de bonificação ('Dinheiro' ou 'Material')
 * @returns Objeto com divisão da bonificação
 */
export function calculateBonus(
  valorBonus: number,
  tipo: 'Dinheiro' | 'Material'
): BonusCalculation {
  
  if (tipo === 'Material') {
    // Prêmios materiais: 100% para o corretor
    return {
      corretor: valorBonus,
      imobiliaria: 0
    };
  }
  
  // Prêmios em dinheiro: 50% corretor + 50% imobiliária
  return {
    corretor: valorBonus * 0.50,
    imobiliaria: valorBonus * 0.50
  };
}

/**
 * Retorna a porcentagem padrão para um tipo de comissão
 * 
 * @param tipo - Tipo de comissão
 * @returns Porcentagem padrão (número entre 0-100)
 */
export function getDefaultPercentage(tipo: string): number {
  const porcentagens: Record<string, number> = {
    'Venda Interna': 6,
    'Parceria UNA': 6,
    'Parceria Externa': 6,
    'Lançamentos (sem coordenação)': 4,
    'Lançamentos (com coordenação de produto)': 4,
    'Corretor Autônomo': 6,
    'Imóveis Ebani': 5
  };
  
  return porcentagens[tipo] || 0;
}

/**
 * Retorna a descrição/tooltip para um tipo de comissão
 * 
 * @param tipo - Tipo de comissão
 * @returns Texto descritivo para tooltip
 */
export function getCommissionTooltip(tipo: string): string {
  const tooltips: Record<string, string> = {
    'Venda Interna': 'Venda realizada entre corretor angariador e corretor vendedor vinculados à Baggio Imóveis.',
    'Parceria UNA': 'Venda realizada em parceria entre corretor da imobiliária UNA e corretor da Baggio Imóveis, com divisão do comissionamento entre as imobiliárias conforme regra vigente.',
    'Parceria Externa': 'Venda realizada em parceria entre corretor de imobiliária externa (fora da UNA) e corretor da Baggio Imóveis, com divisão do comissionamento conforme regra estabelecida.',
    'Lançamentos (sem coordenação)': 'Venda de empreendimento em parceria com construtora, realizada por corretor vendedor da imobiliária, com comissão padrão de 4%.',
    'Lançamentos (com coordenação de produto)': 'Venda de empreendimento com participação de corretor coordenador de produto e corretor vendedor, com divisão de comissão conforme regra específica para coordenação.',
    'Corretor Autônomo': 'Venda realizada em parceria com corretor autônomo, profissional independente sem estrutura imobiliária própria, com divisão de comissionamento conforme regra aplicável.',
    'Imóveis Ebani': 'Venda de imóvel de propriedade de Elcio Baggio, com exigência de exclusividade de anúncio na imobiliária e comissão total fixada em 5%.'
  };
  
  return tooltips[tipo] || '';
}
