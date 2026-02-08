/**
 * Teste de busca de imóveis por referência na API da Properfy
 */

import { describe, it, expect } from 'vitest';
import { searchPropertyByReference } from '../services/properfyService';

describe('Properfy Property Search', () => {
  it('deve buscar imóvel por referência existente', async () => {
    // Usar a primeira referência que encontramos: TESTESETORTI
    const result = await searchPropertyByReference('TESTESETORTI');
    
    console.log('Resultado da busca:', result);
    
    expect(result.success).toBe(true);
    expect(result.property).toBeDefined();
    
    if (result.property) {
      expect(result.property.reference).toBe('TESTESETORTI');
      expect(result.property.address).toBeTruthy();
      console.log('✅ Imóvel encontrado:', {
        reference: result.property.reference,
        address: result.property.address,
        city: result.property.city,
        value: result.property.value
      });
    }
  }, 30000); // Timeout de 30s para busca completa

  it('deve retornar erro para referência inexistente', async () => {
    const result = await searchPropertyByReference('NAOEXISTE999');
    
    console.log('Resultado da busca (inexistente):', result);
    
    // Pode retornar success=false ou success=true sem property
    if (!result.success) {
      expect(result.error).toBeTruthy();
    } else {
      expect(result.property).toBeUndefined();
    }
    
    console.log('✅ Tratamento de referência inexistente OK');
  }, 30000);
});
