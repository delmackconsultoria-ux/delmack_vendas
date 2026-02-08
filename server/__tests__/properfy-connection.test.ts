/**
 * Teste de conexão com a API da Properfy
 * Valida se as credenciais estão corretas e se a API está acessível
 */

import { describe, it, expect } from 'vitest';

const PROPERFY_API_URL = process.env.PROPERFY_API_URL || '';
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || '';

describe('Properfy API Connection', () => {
  it('deve ter credenciais configuradas', () => {
    expect(PROPERFY_API_URL).toBeTruthy();
    expect(PROPERFY_API_TOKEN).toBeTruthy();
    expect(PROPERFY_API_URL).toContain('baggioimoveis.com.br');
  });

  it('deve conectar com a API e buscar primeira página', async () => {
    const response = await fetch(`${PROPERFY_API_URL}/property/property?page=1&size=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = await response.json();
    
    // Validar estrutura da resposta
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    
    // Se houver imóveis, validar estrutura
    if (data.data.length > 0) {
      const firstProperty = data.data[0];
      console.log('✅ Primeiro imóvel encontrado:', {
        chrDocument: firstProperty.chrDocument,
        chrReference: firstProperty.chrReference,
        chrAddressStreet: firstProperty.chrAddressStreet
      });
      
      expect(firstProperty).toHaveProperty('id');
    }
    
    console.log(`✅ API conectada com sucesso! Total de imóveis: ${data.total || 0}`);
  }, 15000); // Timeout de 15s para requisição HTTP
});
