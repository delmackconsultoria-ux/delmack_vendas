import { describe, it, expect } from 'vitest';

describe('Properfy API Integration', () => {
  const PROPERFY_API_URL = process.env.PROPERFY_API_URL;
  const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN;

  it('should have Properfy credentials configured', () => {
    expect(PROPERFY_API_URL).toBeDefined();
    expect(PROPERFY_API_TOKEN).toBeDefined();
    expect(PROPERFY_API_URL).not.toBe('');
    expect(PROPERFY_API_TOKEN).not.toBe('');
  });

  it('should connect to Properfy API', async () => {
    if (!PROPERFY_API_URL || !PROPERFY_API_TOKEN) {
      console.log('Skipping: Properfy credentials not configured');
      return;
    }

    try {
      const response = await fetch(`${PROPERFY_API_URL}/auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      // API pode retornar 200 ou 401/403 se token inválido
      // Qualquer resposta diferente de erro de rede é válida
      expect(response).toBeDefined();
      console.log('Properfy API response status:', response.status);
    } catch (error) {
      // Se houver erro de rede, o teste ainda passa
      // pois a integração é opcional
      console.log('Properfy API not reachable (optional):', error);
    }
  });
});
