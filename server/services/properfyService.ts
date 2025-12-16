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

export async function searchPropertyByReference(reference: string): Promise<ProperfySearchResult> {
  if (!PROPERFY_API_TOKEN) {
    return {
      success: false,
      error: 'API Properfy não configurada. Preencha os dados manualmente.'
    };
  }

  try {
    // Tentar diferentes endpoints possíveis
    const endpoints = [
      `${PROPERFY_API_URL}/crm/business-property?reference=${reference}`,
      `${PROPERFY_API_URL}/property?reference=${reference}`,
      `${PROPERFY_API_URL}/properties?reference=${reference}`,
      `${PROPERFY_API_URL}/imovel?reference=${reference}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Tentar extrair dados do imóvel de diferentes formatos de resposta
          const property = Array.isArray(data) ? data[0] : data;
          
          if (property && (property.id || property.reference)) {
            return {
              success: true,
              property: {
                id: property.id || property.intId,
                reference: property.reference || property.chrReference || reference,
                address: property.address || property.chrAddress || property.chrAddressStreet || '',
                city: property.city || property.chrAddressCity || '',
                state: property.state || property.chrAddressState || '',
                district: property.district || property.chrAddressDistrict || '',
                postalCode: property.postalCode || property.chrAddressPostalCode || '',
                propertyType: property.propertyType || property.chrType || 'Apartamento',
                value: property.value || property.dblValue || 0,
                area: property.area || property.dblArea || 0,
                bedrooms: property.bedrooms || property.intBedrooms || 0,
                bathrooms: property.bathrooms || property.intBathrooms || 0,
                parkingSpaces: property.parkingSpaces || property.intParkingSpaces || 0,
                description: property.description || property.txtDescription || ''
              }
            };
          }
        }
      } catch {
        // Tentar próximo endpoint
        continue;
      }
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
