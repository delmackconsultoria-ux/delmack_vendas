// Serviço de integração com API Properfy
const PROPERFY_API_URL = process.env.PROPERFY_API_URL || 'https://sandbox.properfy.com.br/api';
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || '';

export interface ProperfyProperty {
  id: number;
  reference: string;
  address: string;
  city: string;
  state: string;
  district: string;
  postalCode: string;
  propertyType: string;
  value: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  description: string;
}

export interface ProperfySearchResult {
  success: boolean;
  property?: ProperfyProperty;
  error?: string;
}

function translatePropertyType(type: string): string {
  const types: Record<string, string> = {
    'APARTMENT': 'Apartamento',
    'HOUSE': 'Casa',
    'LAND': 'Terreno',
    'COMMERCIAL': 'Comercial',
    'RURAL': 'Rural',
    'CONDO': 'Condomínio',
    'OFFICE': 'Sala Comercial',
    'WAREHOUSE': 'Galpão',
    'STORE': 'Loja',
  };
  return types[type] || type;
}

export async function searchPropertyByReference(reference: string): Promise<ProperfySearchResult> {
  if (!PROPERFY_API_TOKEN) {
    return {
      success: false,
      error: 'API Properfy não configurada. Preencha os dados manualmente.'
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
          return { success: false, error: 'Token de acesso Properfy inválido ou expirado' };
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
          property: {
            id: property.id,
            reference: property.chrReference || property.chrInnerReference || reference,
            address: `${property.chrAddressStreet || ''}, ${property.chrAddressNumber || 'S/N'}`,
            city: property.chrAddressCity || '',
            state: property.chrAddressState || '',
            district: property.chrAddressDistrict || '',
            postalCode: property.chrAddressPostalCode || '',
            propertyType: translatePropertyType(property.chrType || ''),
            value: property.dcmSale || 0,
            area: property.dcmAreaTotal || 0,
            bedrooms: property.intBedrooms || 0,
            bathrooms: property.intBathrooms || 0,
            parkingSpaces: property.intGarage || 0,
            description: property.txtDescription || ''
          }
        };
      }

      // Se não há mais páginas, parar
      if (page >= (data.last_page || 1)) break;
    }

    return {
      success: false,
      error: 'Imóvel não encontrado no Properfy. Preencha os dados manualmente.'
    };

  } catch (error) {
    console.error('Erro ao buscar imóvel no Properfy:', error);
    return {
      success: false,
      error: 'Erro ao conectar com Properfy. Preencha os dados manualmente.'
    };
  }
}
