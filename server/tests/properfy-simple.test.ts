import { describe, it, expect } from 'vitest';

/**
 * Teste simplificado de autenticação Properfy
 */

const PROPERFY_EMAIL = process.env.PROPERFY_EMAIL || '';
const PROPERFY_PASSWORD = process.env.PROPERFY_PASSWORD || '';
const PROPERFY_API_URL = process.env.PROPERFY_API_URL || '';

describe('Properfy Simple Auth Test', () => {
  it('should authenticate successfully', async () => {
    console.log('\n📋 Configuração:');
    console.log('Email:', PROPERFY_EMAIL);
    console.log('URL:', PROPERFY_API_URL);
    console.log('\n🔐 Testando autenticação...\n');

    const response = await fetch(PROPERFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vrcEmail: PROPERFY_EMAIL,
        vrcPass: PROPERFY_PASSWORD
      })
    });

    console.log('Status:', response.status, response.statusText);
    
    const text = await response.text();
    console.log('Resposta:', text.substring(0, 300));

    expect(response.ok, `Autenticação falhou: ${response.status} - ${text}`).toBe(true);

    const data = JSON.parse(text);
    expect(data).toHaveProperty('token');
    
    console.log('\n✅ Autenticação bem-sucedida!');
    console.log('Token:', data.token.substring(0, 30) + '...');
  }, 15000);
});
