/**
 * Teste de busca local Properfy
 * Valida que a busca usa banco local e retorna dados corretos
 */

import { describe, it, expect } from 'vitest';
import { searchPropertyByReference } from '../services/properfyService';

describe('Properfy Local Search', () => {
  it('deve buscar imóvel BG97142005 no banco local com dados corretos', async () => {
    const result = await searchPropertyByReference('BG97142005');
    
    // Validar que encontrou o imóvel
    expect(result.success).toBe(true);
    expect(result.property).toBeDefined();
    
    if (result.property) {
      // Validar referência
      expect(result.property.reference).toBe('BG97142005');
      
      // Log dos dados de quartos para análise
      console.log('\n=== DADOS DE QUARTOS ===');
      console.log('bedrooms (retornado):', result.property.bedrooms);
      
      // Validar que tem quartos (valor > 0)
      expect(result.property.bedrooms).toBeGreaterThan(0);
      
      // Validar que bairro foi preenchido
      expect(result.property.district).toBeTruthy();
      expect(result.property.district.length).toBeGreaterThan(0);
      
      // Validar que tem valor
      expect(result.property.value).toBeGreaterThan(0);
      
      // Validar que tem área
      expect(result.property.area).toBeGreaterThan(0);
      
      // Validar que custo por m² foi calculado
      expect(result.property.pricePerSqm).toBeGreaterThan(0);
      
      // Validar que endereço foi preenchido
      expect(result.property.address).toBeTruthy();
      expect(result.property.city).toBeTruthy();
      expect(result.property.state).toBeTruthy();
      expect(result.property.postalCode).toBeTruthy();
      
      console.log('✅ Imóvel encontrado com sucesso!');
      console.log('Referência:', result.property.reference);
      console.log('Quartos:', result.property.bedrooms);
      console.log('Bairro:', result.property.district);
      console.log('Valor:', result.property.value);
      console.log('Custo/m²:', result.property.pricePerSqm);
    }
  });

  it('deve buscar rapidamente (< 1 segundo)', async () => {
    const startTime = Date.now();
    const result = await searchPropertyByReference('BG97142005');
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(1000); // Deve ser < 1 segundo
    
    console.log(`⚡ Busca completada em ${duration}ms`);
  });
});
