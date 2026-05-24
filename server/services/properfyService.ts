// Serviço de integração com API Properfy com CACHE
// Suporta busca por referência, endereço ou CEP
import { getDb } from '../db';
console.log('[properfyService] Módulo carregado - Versão com CACHE otimizado');
import { properfyProperties } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const envUrl = process.env.PROPERFY_API_URL || 'https://adm.baggioimoveis.com.br/api/';
const PROPERFY_API_URL = envUrl.replace('/auth/token', '').replace(/\/$/, '');
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_KEY || process.env.PROPERFY_API_TOKEN || '';

const USE_MOCK = false;

// ============ CACHE SYSTEM ============
interface CacheEntry {
  data: any[];
  timestamp: number;
  ttl: number; // em ms
}

const propertyCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora
const REFERENCE_INDEX: Map<string, any> = new Map(); // Índice rápido por referência

function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

function getCachedProperties(): any[] | null {
  const cached = propertyCache.get('all_properties');
  if (cached && isCacheValid(cached)) {
    console.log('[Cache] ✅ Retornando propriedades do cache');
    return cached.data;
  }
  return null;
}

function setCachedProperties(properties: any[]): void {
  propertyCache.set('all_properties', {
    data: properties,
    timestamp: Date.now(),
    ttl: CACHE_TTL,
  });
  
  // Construir índice de referências
  REFERENCE_INDEX.clear();
  for (const prop of properties) {
    const ref = prop.chrDocument || prop.chrReference || prop.chrInnerReference;
    if (ref) {
      REFERENCE_INDEX.set(ref.toUpperCase(), prop);
    }
  }
  console.log(`[Cache] 📊 Índice construído com ${REFERENCE_INDEX.size} referências`);
}

function getPropertyByReferenceFromIndex(reference: string): any | null {
  return REFERENCE_INDEX.get(reference.toUpperCase()) || null;
}

// ============ INTERFACES ============
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
  pricePerSqm: number;
  propertyAge: number;
  angariationDate?: string; // Data de angariação (dteNewListing)
}

export interface ProperfySearchResult {
  success: boolean;
  property?: ProperfyProperty;
  properties?: ProperfyProperty[];
  error?: string;
  searchType?: 'reference' | 'address' | 'cep' | 'auto';
  fromCache?: boolean;
}

function translatePropertyTypeInt(typeInt: number): string {
  const types: Record<number, string> = {
    1: 'casa',
    2: 'apartamento',
    3: 'terreno',
    4: 'comercial',
    5: 'rural',
    6: 'galpao',
    7: 'loja',
    8: 'escritorio',
    9: 'studio',
    10: 'casa_condominio',
    11: 'terreno_comercial',
  };
  return types[typeInt] || 'outro';
}
function translatePropertyTypeStr(typeStr: string): string {
  const map: Record<string, string> = {
    'APARTMENT': 'apartamento',
    'STUDIO_APARTMENT': 'studio',
    'HOUSE': 'casa',
    'CONDOMINIUM_HOUSE': 'casa_condominio',
    'LAND': 'terreno',
    'COMMERCIAL_LAND': 'terreno_comercial',
    'COMMERCIAL': 'comercial',
    'STORE': 'loja',
    'OFFICE': 'escritorio',
    'WAREHOUSE': 'galpao',
    'RURAL': 'rural',
  };
  return map[typeStr?.toUpperCase()] || 'outro';
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function mapPropertyData(property: any, searchRef: string): ProperfyProperty {
  try {
    // Ensure all numeric values are valid numbers
    const dcmSale = Number(property.dcmSale) || 0;
    const dcmAreaPrivate = Number(property.dcmAreaPrivate) || 0;
    const dcmAreaTotal = Number(property.dcmAreaTotal) || dcmAreaPrivate || 0;
    const intBedrooms = Number(property.intBedrooms) || Number(property.intRooms) || 0;
    const intBathrooms = Number(property.intBathrooms) || 0;
    const intGarages = Number(property.intGarages) || 0;
    const intPropertyAge = Number(property.intPropertyAge) || 0;
    const intPropertyType = Number(property.intPropertyType) || 0;
    
    // Calculate price per sqm safely
    const pricePerSqm = dcmAreaPrivate > 0 ? dcmSale / dcmAreaPrivate : 0;
    
    return {
      id: Number(property.id) || 0,
      reference: String(property.chrDocument || property.chrReference || property.chrInnerReference || searchRef),
      address: String(property.chrAddressStreet || ''),
      number: String(property.chrAddressNumber || 'S/N'),
      city: String(property.chrAddressCity || ''),
      state: String(property.chrAddressState || ''),
      district: String(property.chrAddressNeighborhood || property.chrAddressDistrict || ''),
      postalCode: String(property.chrAddressPostalCode?.replace(/\D/g, '') || property.chrAddressCityCode?.replace(/\D/g, '') || ''),
      propertyType: property.chrPropertyType ? translatePropertyTypeStr(property.chrPropertyType) : translatePropertyTypeInt(intPropertyType),
      value: dcmSale,
      area: dcmAreaPrivate,
      totalArea: dcmAreaTotal,
      bedrooms: intBedrooms,
      bathrooms: intBathrooms,
      parkingSpaces: intGarages,
      description: String(property.chrDescription || ''),
      condominiumName: String(property.chrCondominiumName || ''),
      pricePerSqm: isFinite(pricePerSqm) ? pricePerSqm : 0,
      propertyAge: intPropertyAge,
      angariationDate: property.enlistment?.dteNewListing || property.dteNewListing || undefined,
    };
  } catch (error) {
    console.error('[Properfy] Erro ao mapear dados do imóvel:', error);
    // Return a safe default object
    return {
      id: 0,
      reference: searchRef,
      address: '',
      number: 'S/N',
      city: '',
      state: '',
      district: '',
      postalCode: '',
      propertyType: 'outro',
      value: 0,
      area: 0,
      totalArea: 0,
      bedrooms: 0,
      bathrooms: 0,
      parkingSpaces: 0,
      description: '',
      condominiumName: '',
      pricePerSqm: 0,
      propertyAge: 0,
      angariationDate: undefined,
    };
  }
}

/**
 * Buscar imóvel por referência usando novo endpoint com CACHE
 */
export async function searchByReference(reference: string): Promise<ProperfySearchResult> {
  try {
    const startTime = Date.now();
    console.log('[Properfy] Buscando imóvel por referência:', reference);

    // 1. Tentar buscar no índice de cache primeiro
    const cachedProperty = getPropertyByReferenceFromIndex(reference);
    if (cachedProperty) {
      const property = mapPropertyData(cachedProperty, reference);
      const duration = Date.now() - startTime;
      console.log(`[Properfy] ✅ Imóvel encontrado NO CACHE em ${duration}ms:`, property.reference);
      return {
        success: true,
        property,
        searchType: 'reference',
        fromCache: true,
      };
    }

    // 2. Tentar buscar no cache geral
    let allProperties = getCachedProperties();
    
    // 3. Se não houver cache, buscar da API
    if (!allProperties) {
      console.log('[Properfy] Cache expirado, buscando da API...');
      
      if (!PROPERFY_API_URL || !PROPERFY_API_TOKEN) {
        return {
          success: false,
          error: 'Credenciais do Properfy não configuradas',
        };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': PROPERFY_API_TOKEN,
      };

      const apiStartTime = Date.now();
      const response = await fetch(`${PROPERFY_API_URL}/property/property?page=1&size=1000`, {
        method: 'GET',
        headers,
      });
      const apiDuration = Date.now() - apiStartTime;
      console.log(`[Properfy] API respondeu em ${apiDuration}ms`);

      if (!response.ok) {
        console.error('[Properfy] Erro na resposta:', response.status, response.statusText);
        return {
          success: false,
          error: `Erro ao buscar imóvel: ${response.statusText}`,
        };
      }

      const data = await response.json();
      allProperties = data.data || [];
      console.log('[Properfy] Total de imóveis retornados:', allProperties.length);

      if (!allProperties || allProperties.length === 0) {
        return {
          success: false,
          error: 'Nenhum imóvel encontrado',
        };
      }

      // Salvar no cache
      setCachedProperties(allProperties);
    }

    // 4. Filtrar pela referência no cache
    const foundProperty = allProperties.find((prop: any) => 
      prop.chrDocument === reference || 
      prop.chrReference === reference || 
      prop.chrInnerReference === reference
    );

    if (!foundProperty) {
      console.log('[Properfy] Referência não encontrada:', reference);
      return {
        success: false,
        error: 'Imóvel não encontrado',
      };
    }

    const property = mapPropertyData(foundProperty, reference);
    const duration = Date.now() - startTime;
    console.log(`[Properfy] ✅ Imóvel encontrado em ${duration}ms:`, property.reference);

    return {
      success: true,
      property,
      searchType: 'reference',
      fromCache: false,
    };
  } catch (error) {
    console.error('[Properfy] Erro ao buscar por referência:', error);
    return {
      success: false,
      error: `Erro ao buscar imóvel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Buscar imóvel por endereço
 */
export async function searchByAddress(address: string): Promise<ProperfySearchResult> {
  try {
    console.log('[Properfy] Buscando imóvel por endereço:', address);

    if (!PROPERFY_API_URL || !PROPERFY_API_TOKEN) {
      return {
        success: false,
        error: 'Credenciais do Properfy não configuradas',
      };
    }

    // Tentar usar cache primeiro
    let allProperties = getCachedProperties();
    
    if (!allProperties) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': PROPERFY_API_TOKEN,
      };

      const response = await fetch(`${PROPERFY_API_URL}/property/property?page=1&size=1000`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Erro ao buscar imóvel: ${response.statusText}`,
        };
      }

      const data = await response.json();
      allProperties = data.data || [];

      if (!allProperties || allProperties.length === 0) {
        return {
          success: false,
          error: 'Imóvel não encontrado',
        };
      }

      setCachedProperties(allProperties);
    }

    const normalizedSearch = normalizeString(address);
    const properties = allProperties
      .filter((prop: any) => {
        const propAddress = normalizeString(`${prop.chrAddressStreet} ${prop.chrAddressNumber} ${prop.chrAddressCity}`);
        return propAddress.includes(normalizedSearch);
      })
      .map((prop: any) => mapPropertyData(prop, prop.chrReference));

    if (properties.length === 0) {
      return {
        success: false,
        error: 'Imóvel não encontrado',
      };
    }

    console.log('[Properfy] ✅ Imóveis encontrados:', properties.length);

    return {
      success: true,
      properties,
      searchType: 'address',
    };
  } catch (error) {
    console.error('[Properfy] Erro ao buscar por endereço:', error);
    return {
      success: false,
      error: `Erro ao buscar imóvel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Buscar imóvel por CEP
 */
export async function searchByCep(cep: string): Promise<ProperfySearchResult> {
  try {
    console.log('[Properfy] Buscando imóvel por CEP:', cep);

    if (!PROPERFY_API_URL || !PROPERFY_API_TOKEN) {
      return {
        success: false,
        error: 'Credenciais do Properfy não configuradas',
      };
    }

    // Tentar usar cache primeiro
    let allProperties = getCachedProperties();
    
    if (!allProperties) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': PROPERFY_API_TOKEN,
      };

      const response = await fetch(`${PROPERFY_API_URL}/property/property?page=1&size=1000`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Erro ao buscar imóvel: ${response.statusText}`,
        };
      }

      const data = await response.json();
      allProperties = data.data || [];

      if (!allProperties || allProperties.length === 0) {
        return {
          success: false,
          error: 'Imóvel não encontrado',
        };
      }

      setCachedProperties(allProperties);
    }

    const cleanCEP = cep.replace(/\D/g, '');
    const properties = allProperties
      .filter((prop: any) => {
        const propCEP = (prop.chrAddressPostalCode || '').replace(/\D/g, '');
        return propCEP === cleanCEP;
      })
      .map((prop: any) => mapPropertyData(prop, prop.chrReference));

    if (properties.length === 0) {
      return {
        success: false,
        error: 'Imóvel não encontrado',
      };
    }

    console.log('[Properfy] ✅ Imóveis encontrados:', properties.length);

    return {
      success: true,
      properties,
      searchType: 'cep',
    };
  } catch (error) {
    console.error('[Properfy] Erro ao buscar por CEP:', error);
    return {
      success: false,
      error: `Erro ao buscar imóvel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Busca inteligente
 */
export async function smartSearch(query: string): Promise<ProperfySearchResult> {
  console.log('[Properfy] Iniciando busca inteligente para:', query);

  if (/^[A-Z]{2}\d+$/.test(query)) {
    const result = await searchByReference(query);
    if (result.success) return result;
  }

  if (/^\d{8}$/.test(query)) {
    const result = await searchByCep(query);
    if (result.success) return result;
  }

  const result = await searchByAddress(query);
  return result;
}

/**
 * Limpar cache manualmente
 */
export function clearCache(): void {
  propertyCache.clear();
  REFERENCE_INDEX.clear();
  console.log('[Cache] 🗑️ Cache limpo');
}

/**
 * Pré-carregar cache (útil para inicialização)
 */
export async function preloadCache(): Promise<void> {
  try {
    console.log('[Cache]