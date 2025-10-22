/**
 * Serviço de validação de CEP via ViaCEP
 */

export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export interface CepValidationResult {
  success: boolean;
  data?: CepData;
  error?: string;
}

/**
 * Buscar dados de CEP via ViaCEP
 */
export async function searchCep(cep: string): Promise<CepValidationResult> {
  try {
    // Remover caracteres especiais
    const cleanCep = cep.replace(/\D/g, "");

    // Validar formato (deve ter 8 dígitos)
    if (cleanCep.length !== 8) {
      return {
        success: false,
        error: "CEP inválido. Deve conter 8 dígitos",
      };
    }

    // Buscar no ViaCEP
    const response = await fetch(
      `https://viacep.com.br/ws/${cleanCep}/json/`
    );

    if (!response.ok) {
      return {
        success: false,
        error: "Erro ao buscar CEP",
      };
    }

    const data = await response.json();

    // Verificar se retornou erro (CEP não encontrado)
    if (data.erro) {
      return {
        success: false,
        error: "CEP não encontrado",
      };
    }

    return {
      success: true,
      data: data as CepData,
    };
  } catch (error) {
    console.error("[CepService] Erro ao validar CEP:", error);
    return {
      success: false,
      error: "Erro ao validar CEP",
    };
  }
}

/**
 * Formatar CEP para exibição
 */
export function formatCep(cep: string): string {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return cep;
  return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
}

/**
 * Validar formato de CEP
 */
export function isValidCepFormat(cep: string): boolean {
  const cleanCep = cep.replace(/\D/g, "");
  return cleanCep.length === 8;
}

