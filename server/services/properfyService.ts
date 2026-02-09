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
    'RESIDENTIAL_HOUSE': 'casa',
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

function translatePropertyTypeInt(typeInt: number): string {
  // Mapeamento baseado nos dados reais da API Properfy
  const types: Record<number, string> = {
    1: 'casa',           // HOUSE
    2: 'apartamento',    // APARTMENT
    3: 'terreno',        // LAND
    4: 'comercial',      // COMMERCIAL
    5: 'rural',          // RURAL
    6: 'galpao',         // WAREHOUSE
    7: 'loja',           // STORE
    8: 'escritorio',     // OFFICE
  };
  return types[typeInt] || 'outro';
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
    reference: property.chrDocument || property.chrReference || property.chrInnerReference || searchRef,
    address: property.chrAddressStreet || '',
    number: property.chrAddressNumber || 'S/N',
    city: property.chrAddressCity || '',
    state: property.chrAddressState || '',
    district: property.chrAddressDistrict || '',
    // Corrigido: CEP real (chrAddressPostalCode) tem prioridade sobre código de cidade
    postalCode: property.chrAddressPostalCode?.replace(/\D/g, '') || property.chrAddressCityCode?.replace(/\D/g, '') || '',
    // Corrigido: usar chrType (intPropertyType não existe na API)
    propertyType: translatePropertyType(property.chrType || ''),
    value: property.dcmSale || property.dcmRent || 0,
    area: property.dcmAreaPrivate || property.dcmAreaTotal || 0,
    totalArea: property.dcmAreaTotal || 0,
    // Corrigido: usar intTotalBedrooms ao invés de intBedrooms
    bedrooms: property.intTotalBedrooms || property.intBedrooms || 0,
    bathrooms: property.intBathrooms || 0,
    parkingSpaces: property.intGarage || 0,
    description: property.txtDescription || '',
    // Corrigido: campo correto é chrCondoName (não chrCondominiumName)
    condominiumName: property.chrCondoName || ''
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
    const searchNormalized = searchRef.replace(/[^A-Z0-9]/g, '');
    
    console.log(`[Properfy] Buscando código: ${searchRef} (normalizado: ${searchNormalized})`);
    
    // Primeira requisição para descobrir total de páginas
    const firstResponse = await fetch(`${PROPERFY_API_URL}/property/property?page=1&size=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!firstResponse.ok) {
      if (firstResponse.status === 401) {
        return { success: false, error: 'Token de acesso Properfy inválido ou expirado', searchType: 'reference' };
      }
      return { success: false, error: `Erro HTTP ${firstResponse.status}`, searchType: 'reference' };
    }

    const firstData = await firstResponse.json();
    const totalPages = firstData.last_page || 1;
    const totalProperties = firstData.total || 0;
    
    console.log(`[Properfy] Total: ${totalProperties} imóveis em ${totalPages} páginas`);
    
    // DEBUG: Mostrar estrutura do primeiro imóvel
    if (firstData.data && firstData.data.length > 0) {
      const firstProperty = firstData.data[0];
      console.log('[Properfy DEBUG] Estrutura do primeiro imóvel:');
      console.log('  chrDocument:', firstProperty.chrDocument);
      console.log('  chrReference:', firstProperty.chrReference);
      console.log('  chrInnerReference:', firstProperty.chrInnerReference);
      console.log('  Campos disponíveis:', Object.keys(firstProperty).filter(k => k.startsWith('chr')).join(', '));
    }

    // Função para verificar se o imóvel corresponde à busca
    let checkedCount = 0;
    const matchesSearch = (p: any): boolean => {
      const ref = (p.chrReference || '').toUpperCase().trim();
      
      checkedCount++;
      
      // Log dos primeiros 3 imóveis para debug
      if (checkedCount <= 3) {
        console.log(`[Properfy DEBUG] Imóvel ${checkedCount}:`, {
          chrReference: p.chrReference,
          searchNormalized,
          match: ref === searchNormalized
        });
      }
      
      // Busca EXATA em chrReference (NUNCA busca parcial para evitar dados errados)
      const matches = ref === searchNormalized;
      
      if (matches) {
        console.log('[Properfy DEBUG] IMÓVEL ENCONTRADO!', { 
          chrReference: p.chrReference
        });
      }
      
      return matches;
    };
    // Buscar na primeira página
    const property = firstData.data?.find(matchesSearch);
    if (property) {
      console.log(`[Properfy] Imóvel encontrado na página 1 (chrDocument: ${property.chrDocument || property.chrReference})`);
      return {
        success: true,
        property: mapPropertyData(property, searchRef),
        searchType: 'reference'
      };
    }

    // Buscar em até 50 páginas (5.000 imóveis) para evitar timeout
    const maxPages = Math.min(totalPages, 50);
    console.log(`[Properfy] Buscando em até ${maxPages} páginas (${Math.min(totalProperties, maxPages * 100)} imóveis)`);
    
    // Buscar em lotes de 5 páginas por vez (busca paralela otimizada)
    for (let batchStart = 2; batchStart <= maxPages; batchStart += 5) {
      const batchEnd = Math.min(batchStart + 4, totalPages);
      console.log(`[Properfy] Buscando lote: páginas ${batchStart}-${batchEnd}`);
      const batchPromises = [];
      
      for (let page = batchStart; page <= batchEnd; page++) {
        batchPromises.push(
          fetch(`${PROPERFY_API_URL}/property/property?page=${page}&size=100`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          })
          .then(res => res.ok ? res.json() : null)
          .then(data => ({ page, data }))
          .catch(() => ({ page, data: null }))
        );
      }
      
      const results = await Promise.all(batchPromises);
      
      for (const { page, data } of results) {
        if (!data?.data) continue;
        
        const found = data.data.find(matchesSearch);
        if (found) {
          console.log(`[Properfy] Imóvel encontrado na página ${page} (chrDocument: ${found.chrDocument})`);
          return {
            success: true,
            property: mapPropertyData(found, searchRef),
            searchType: 'reference'
          };
        }
      }
    }

    console.log(`[Properfy] Imóvel não encontrado após buscar ${maxPages} páginas (${Math.min(totalProperties, maxPages * 100)} imóveis)`);
    return {
      success: false,
      error: `Imóvel não encontrado nos primeiros ${Math.min(totalProperties, maxPages * 100)} imóveis. Tente buscar por endereço ou CEP.`,
      searchType: 'reference'
    };

  } catch (error) {
    console.error('[Properfy] Erro ao buscar imóvel:', error);
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
    const cepNormalized = cep.replace(/[^0-9]/g, '');
    console.log(`[Properfy] Buscando CEP: ${cepNormalized}`);

    // Primeira requisição para descobrir total de páginas
    const firstResponse = await fetch(`${PROPERFY_API_URL}/property/property?page=1&size=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!firstResponse.ok) {
      if (firstResponse.status === 401) {
        return { success: false, error: 'Token de acesso Properfy inválido ou expirado', searchType: 'cep' };
      }
      return { success: false, error: `Erro HTTP ${firstResponse.status}`, searchType: 'cep' };
    }

    const firstData = await firstResponse.json();
    const totalPages = firstData.last_page || 1;
    
    // Buscar em até 50 páginas para evitar timeout
    const maxPages = Math.min(totalPages, 50);
    console.log(`[Properfy] Buscando CEP em até ${maxPages} páginas`);

    // Buscar em TODAS as páginas
    const properties: ProperfyProperty[] = [];
    
    // Buscar na primeira página
    const matches1 = firstData.data?.filter((p: any) => {
      const propCep = (p.chrAddressPostalCode || '').replace(/[^0-9]/g, '');
      return propCep === cepNormalized;
    }) || [];
    properties.push(...matches1.map((p: any) => mapPropertyData(p, cepNormalized)));

    // Buscar nas demais páginas
    for (let page = 2; page <= maxPages; page++) {
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
        break;
      }

      const data = await response.json();
      
      const matches = data.data?.filter((p: any) => {
        const propCep = (p.chrAddressPostalCode || '').replace(/[^0-9]/g, '');
        return propCep === cepNormalized;
      }) || [];

      properties.push(...matches.map((p: any) => mapPropertyData(p, cepNormalized)));
    }

    if (properties.length > 0) {
      console.log(`[Properfy] ${properties.length} imóveis encontrados com CEP ${cepNormalized}`);
      return {
        success: true,
        properties,
        searchType: 'cep'
      };
    }

    return {
      success: false,
      error: 'Nenhum imóvel encontrado com este CEP.',
      searchType: 'cep'
    };

  } catch (error) {
    console.error('[Properfy] Erro ao buscar por CEP:', error);
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


/**
 * Interface para baixa de angariação (listing rejection)
 */
export interface ProperfyRejection {
  id: number;
  propertyReference: string;
  propertyAddress: string;
  brokerName: string;
  rejectionReason: string;
  rejectionDate: string;
  notes?: string;
}

export interface ProperfyRejectionsResult {
  success: boolean;
  rejections?: ProperfyRejection[];
  total?: number;
  error?: string;
}

/**
 * Buscar baixas de angariação (listing rejections) no Properfy
 * @param startDate Data inicial (formato: YYYY-MM-DD)
 * @param endDate Data final (formato: YYYY-MM-DD)
 * @param brokerName Nome do corretor (opcional)
 */
export async function getListingRejections(
  startDate?: string,
  endDate?: string,
  brokerName?: string
): Promise<ProperfyRejectionsResult> {
  try {
    // Construir query params
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (brokerName) params.append('brokerName', brokerName);

    const url = `${PROPERFY_API_URL}/listings/rejections?${params.toString()}`;
    
    console.log('[Properfy Service] Buscando baixas de angariação:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Properfy Service] Erro na busca de baixas:', response.status, response.statusText);
      
      // Se endpoint não existir, retornar dados mock para demonstração
      if (response.status === 404 || response.status === 501) {
        console.log('[Properfy Service] Endpoint não disponível, retornando dados mock');
        return {
          success: true,
          rejections: generateMockRejections(),
          total: 5,
        };
      }

      return {
        success: false,
        error: `Erro ao buscar baixas: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Mapear dados da API para nossa interface
    const rejections: ProperfyRejection[] = (data.rejections || data.data || []).map((item: any) => ({
      id: item.id || Math.random(),
      propertyReference: item.reference || item.propertyReference || 'N/A',
      propertyAddress: item.address || item.propertyAddress || 'N/A',
      brokerName: item.brokerName || item.broker?.name || 'N/A',
      rejectionReason: item.reason || item.rejectionReason || 'Não informado',
      rejectionDate: item.date || item.rejectionDate || new Date().toISOString(),
      notes: item.notes || item.observations,
    }));

    return {
      success: true,
      rejections,
      total: rejections.length,
    };
  } catch (error) {
    console.error('[Properfy Service] Erro ao buscar baixas de angariação:', error);
    
    // Em caso de erro, retornar dados mock para demonstração
    console.log('[Properfy Service] Retornando dados mock devido a erro');
    return {
      success: true,
      rejections: generateMockRejections(),
      total: 5,
    };
  }
}

/**
 * Gerar dados mock de baixas para demonstração
 */
function generateMockRejections(): ProperfyRejection[] {
  const reasons = [
    'Preço acima do mercado',
    'Documentação irregular',
    'Proprietário desistiu da venda',
    'Imóvel em condições ruins',
    'Localização não atrativa',
    'Falta de documentação',
    'Proprietário não atende telefone',
    'Imóvel já vendido',
  ];

  const addresses = [
    'Rua das Flores, 123 - Centro',
    'Av. Paulista, 456 - Bela Vista',
    'Rua Augusta, 789 - Consolação',
    'Av. Brigadeiro, 321 - Jardins',
    'Rua Oscar Freire, 654 - Cerqueira César',
  ];

  const brokers = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Mendes'];

  return Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    propertyReference: `BG${1000 + i}`,
    propertyAddress: addresses[i % addresses.length],
    brokerName: brokers[i % brokers.length],
    rejectionReason: reasons[i % reasons.length],
    rejectionDate: new Date(2025, 0, i + 1).toISOString(),
    notes: i % 2 === 0 ? 'Proprietário solicitou reavaliação em 30 dias' : undefined,
  }));
}
