// Testar busca Properfy com credenciais de produção
const envUrl = process.env.PROPERFY_API_URL || 'https://sandbox.properfy.com.br/api';
const PROPERFY_API_URL = envUrl.replace('/auth/token', '').replace(/\/$/, '');
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || '';

console.log('URL Base:', PROPERFY_API_URL);
console.log('Token:', PROPERFY_API_TOKEN.substring(0, 20) + '...');

async function testSearch() {
  try {
    // Buscar primeira página de imóveis
    const response = await fetch(`${PROPERFY_API_URL}/property/property?page=1&size=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('Erro:', text);
      return;
    }

    const data = await response.json();
    console.log('Total de imóveis:', data.total || data.data?.length || 0);
    console.log('Páginas:', data.last_page || 1);
    
    if (data.data && data.data.length > 0) {
      console.log('\n5 primeiros imóveis:');
      data.data.slice(0, 5).forEach((p, i) => {
        console.log(`${i+1}. Ref: ${p.chrReference || p.chrInnerReference || 'N/A'}`);
        console.log(`   Endereço: ${p.chrAddressStreet || 'N/A'}, ${p.chrAddressNumber || 'S/N'}`);
        console.log(`   CEP: ${p.chrAddressPostalCode || 'N/A'}`);
        console.log(`   Cidade: ${p.chrAddressCity || 'N/A'} - ${p.chrAddressState || 'N/A'}`);
        console.log('');
      });
    }

    // Buscar por referência específica BG96375002
    console.log('\n--- Buscando referência BG96375002 ---');
    for (let page = 1; page <= 10; page++) {
      const resp = await fetch(`${PROPERFY_API_URL}/property/property?page=${page}&size=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!resp.ok) continue;
      
      const pageData = await resp.json();
      const found = pageData.data?.find(p => 
        p.chrReference?.includes('BG96375002') || 
        p.chrInnerReference?.includes('BG96375002')
      );
      
      if (found) {
        console.log('ENCONTRADO na página', page);
        console.log('Dados:', JSON.stringify(found, null, 2));
        break;
      }
      
      if (page >= (pageData.last_page || 1)) {
        console.log('Referência BG96375002 não encontrada em', page, 'páginas');
        break;
      }
    }

  } catch (error) {
    console.error('Erro:', error);
  }
}

testSearch();
