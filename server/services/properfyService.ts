// Serviço de integração com API Properfy
// Suporta busca por referência, endereço ou CEP
// Usar URL base de produção (remover /auth/token se presente no env)
const envUrl = process.env.PROPERFY_API_URL || 'https://sandbox.properfy.com.br/api';
const PROPERFY_API_URL = envUrl.replace('/auth/token', '').replace(/\/$/, '');
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || '';

export interface ProperfyProperty {
  id: number;
  reference: string;
  address: string;
  number: string;
  city: string;
  state: string;
  district: string;
  postalCode: string;
  propertyType: string;
  value: number;
  area: number;
  totalArea: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  description: string;
  condominiumName: string;
}

export interface ProperfySearchResult {
  success: boolean;
  property?: ProperfyProperty;
  properties?: ProperfyProperty[];
  error?: string;
  searchType?: 'reference' | 'address' | 'cep';
}

function translatePropertyType(type: string): string {
  const types: Record<string, string> = {
    'APARTMENT': 'apartamento',
    'HOUSE': 'casa',
    'LAND': 'terreno',
    'COMMERCIAL': 'comercial',
    'RURAL': 'rural',
    'CONDO': 'apartamento',
    'OFFICE': 'comercial',
    'WAREHOUSE': 'comercial',
    'STORE': 'comercial',
  };
  return types[type?.toUpperCase()] || 'outro';
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function mapPropertyData(property: any, searchRef: string): ProperfyProperty {
  return {
    id: property.id,
    reference: property.chrReference || property.chrInnerReference || searchRef,
    address: property.chrAddressStreet || '',
    number: property.chrAddressNumber || 'S/N',
    city: property.chrAddressCity || '',
    state: property.chrAddressState || '',
    district: property.chrAddressDistrict || '',
    postalCode: property.chrAddressPostalCode?.replace(/\D/g, '') || '',
    propertyType: translatePropertyType(property.chrType || ''),
    value: property.dcmSale || property.dcmRent || 0,
    area: property.dcmAreaPrivate || property.dcmAreaTotal || 0,
    totalArea: property.dcmAreaTotal || 0,
    bedrooms: property.intBedrooms || 0,
    bathrooms: property.intBathrooms || 0,
    parkingSpaces: property.intGarage || 0,
    description: property.txtDescription || '',
    condominiumName: property.chrCondominiumName || property.chrCondominium || ''
  };
}

/**
 * Busca imóvel por referência (código interno ou externo)
 */
export async function searchPropertyByReference(reference: string): Promise<ProperfySearchResult> {
  if (!PROPERFY_API_TOKEN) {
    return {
      success: false,
      error: 'API Properfy não configurada. Preencha os dados manualmente.',
      searchType: 'reference'
    };
  }

  try {
    const searchRef = reference.toUpperCase().trim();
    
    // Buscar nas primeiras 5 páginas (até 500 imóveis)
    for (let page = 1; page <= 5; page++) {
      const response = await fetch(`${PROPERFY_API_URL}/property/property?page=${page}&size=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Token de acesso Properfy inválido ou expirado', searchType: 'reference' };
        }
        continue;
      }

      const data = await response.json();
      
      // Buscar por referência exata ou parcial
      const property = data.data?.find((p: any) => 
        p.chrReference?.toUpperCase() === searchRef ||
        p.chrInnerReference?.toUpperCase() === searchRef ||
        p.chrReference?.toUpperCase().includes(searchRef) ||
        p.chrInnerReference?.toUpperCase().includes(searchRef)
      );

      if (property) {
        return {
          success: true,
          property: mapPropertyData(property, searchRef),
          searchType: 'reference'
        };
      }

      // Se não há mais páginas, parar
      if (page >= (data.last_page || 1)) break;
    }

    return {
      success: false,
      error: 'Imóvel não encontrado por referência. Tente buscar por endereço ou CEP.',
      searchType: 'reference'
    };

  } catch (error) {
    console.error('Erro ao buscar imóvel por referência:', error);
    return {
      success: false,
      error: 'Erro ao conectar com Properfy. Preencha os dados manualmente.',
      searchType: 'reference'
    };
  }
}

/**
 * Busca imóveis por CEP
 */
export async function searchPropertyByCEP(cep: string): Promise<ProperfySearchResult> {
  if (!PROPERFY_API_TOKEN) {
    return {
      success: false,
      error: 'API Properfy não configurada. Preencha os dados manualmente.',
      searchType: 'cep'
    };
  }

  try {
    const cleanCep = cep.replace(/\D/g, '');
    const foundProperties: ProperfyProperty[] = [];
    
    // Buscar nas primeiras 5 páginas
    for (let page = 1; page <= 5; page++) {
      const response = await fetch(`${PROPERFY_API_URL}/property/property?page=${page}&size=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Token de acesso Properfy inválido ou expirado', searchType: 'cep' };
        }
        continue;
      }

      const data = await response.json();
      
      // Buscar por CEP
      const matches = data.data?.filter((p: any) => {
        const propCep = p.chrAddressPostalCode?.replace(/\D/g, '') || '';
        return propCep === cleanCep;
      }) || [];

      foundProperties.push(...matches.map((p: any) => mapPropertyData(p, cleanCep)));

      if (page >= (data.last_page || 1)) break;
    }

    if (foundProperties.length > 0) {
      return {
        success: true,
        property: foundProperties[0],
        properties: foundProperties,
        searchType: 'cep'
      };
    }

    return {
      success: false,
      error: 'Nenhum imóvel encontrado com este CEP. Tente buscar por referência ou endereço.',
      searchType: 'cep'
    };

  } catch (error) {
    console.error('Erro ao buscar imóvel por CEP:', error);
    return {
      success: false,
      error: 'Erro ao conectar com Properfy. Preencha os dados manualmente.',
      searchType: 'cep'
    };
  }
}

/**
 * Busca imóveis por endereço (rua, bairro ou cidade)
 */
export async function searchPropertyByAddress(address: string): Promise<ProperfySearchResult> {
  if (!PROPERFY_API_TOKEN) {
    return {
      success: false,
      error: 'API Properfy não configurada. Preencha os dados manualmente.',
      searchType: 'address'
    };
  }

  try {
    const searchTerm = normalizeString(address);
    const foundProperties: ProperfyProperty[] = [];
    
    // Buscar nas primeiras 5 páginas
    for (let page = 1; page <= 5; page++) {
      const response = await fetch(`${PROPERFY_API_URL}/property/property?page=${page}&size=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Token de acesso Properfy inválido ou expirado', searchType: 'address' };
        }
        continue;
      }

      const data = await response.json();
      
      // Buscar por endereço (rua, bairro, cidade)
      const matches = data.data?.filter((p: any) => {
        const street = normalizeString(p.chrAddressStreet || '');
        const district = normalizeString(p.chrAddressDistrict || '');
        const city = normalizeString(p.chrAddressCity || '');
        const condominium = normalizeString(p.chrCondominiumName || p.chrCondominium || '');
        
        return street.includes(searchTerm) || 
               district.includes(searchTerm) || 
               city.includes(searchTerm) ||
               condominium.includes(searchTerm) ||
               searchTerm.includes(street) ||
               searchTerm.includes(district);
      }) || [];

      foundProperties.push(...matches.map((p: any) => mapPropertyData(p, address)));

      if (page >= (data.last_page || 1)) break;
    }

    if (foundProperties.length > 0) {
      return {
        success: true,
        property: foundProperties[0],
        properties: foundProperties,
        searchType: 'address'
      };
    }

    return {
      success: false,
      error: 'Nenhum imóvel encontrado com este endereço. Tente buscar por referência ou CEP.',
      searchType: 'address'
    };

  } catch (error) {
    console.error('Erro ao buscar imóvel por endereço:', error);
    return {
      success: false,
      error: 'Erro ao conectar com Properfy. Preencha os dados manualmente.',
      searchType: 'address'
    };
  }
}

/**
 * Busca inteligente - detecta automaticamente o tipo de busca
 * - Se for número com 8 dígitos: CEP
 * - Se for código alfanumérico curto: Referência
 * - Caso contrário: Endereço
 */
export async function smartSearch(query: string): Promise<ProperfySearchResult> {
  const cleanQuery = query.trim();
  
  // Detectar CEP (8 dígitos numéricos)
  const cepMatch = cleanQuery.replace(/\D/g, '');
  if (cepMatch.length === 8) {
    const result = await searchPropertyByCEP(cepMatch);
    if (result.success) return result;
  }
  
  // Detectar referência (código curto, geralmente alfanumérico)
  if (cleanQuery.length <= 20 && /^[A-Za-z0-9\-_]+$/.test(cleanQuery)) {
    const result = await searchPropertyByReference(cleanQuery);
    if (result.success) return result;
  }
  
  // Busca por endereço
  const addressResult = await searchPropertyByAddress(cleanQuery);
  if (addressResult.success) return addressResult;
  
  // Se nenhuma busca funcionou, tentar referência como fallback
  const refResult = await searchPropertyByReference(cleanQuery);
  if (refResult.success) return refResult;
  
  return {
    success: false,
    error: 'Imóvel não encontrado. Verifique a referência, endereço ou CEP e tente novamente.'
  };
}
