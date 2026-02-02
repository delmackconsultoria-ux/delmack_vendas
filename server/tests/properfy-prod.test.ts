import { describe, it, expect } from 'vitest';

/**
 * Teste de validação das credenciais de produção Properfy
 */

const PROPERFY_EMAIL = process.env.PROPERFY_EMAIL || '';
const PROPERFY_PASSWORD = process.env.PROPERFY_PASSWORD || '';
const PROPERFY_API_URL = (process.env.PROPERFY_API_URL || '').replace(/\/$/, '');

describe('Properfy Production Credentials', () => {
  it('should have all required credentials', () => {
    expect(PROPERFY_EMAIL, 'PROPERFY_EMAIL não configurado').toBeTruthy();
    expect(PROPERFY_PASSWORD, 'PROPERFY_PASSWORD não configurado').toBeTruthy();
    expect(PROPERFY_API_URL, 'PROPERFY_API_URL não configurado').toBeTruthy();
    
    console.log('\n✅ Credenciais configuradas:');
    console.log('Email:', PROPERFY_EMAIL);
    console.log('URL:', PROPERFY_API_URL);
  });

  it('should authenticate with production API', async () => {
    console.log('\n🔐 Testando autenticação...');
    
    // Tentar diferentes endpoints possíveis
    const endpoints = [
      `${PROPERFY_API_URL}/auth/token`,
      `${PROPERFY_API_URL}/api/auth/token`,
      `https://${PROPERFY_API_URL}/auth/token`,
      `https://${PROPERFY_API_URL}/api/auth/token`
    ];

    let success = false;
    let token = '';

    for (const endpoint of endpoints) {
      try {
        console.log(`\nTentando: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            vrcEmail: PROPERFY_EMAIL,
            vrcPass: PROPERFY_PASSWORD
          })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        
        // Log da resposta para debug
        const text = await response.text();
        console.log(`Resposta: ${text.substring(0, 200)}`);

        if (response.ok) {
          const data = JSON.parse(text);
          if (data.token) {
            token = data.token;
            success = true;
            console.log(`✅ Autenticação bem-sucedida!`);
            console.log(`Token: ${token.substring(0, 30)}...`);
            break;
          }
        }
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
      }
    }

    expect(success, 'Nenhum endpoint de autenticação funcionou').toBe(true);
    expect(token).toBeTruthy();
  }, 30000);
});
