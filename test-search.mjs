const PROPERFY_API_URL = (process.env.PROPERFY_API_URL || '').replace('/auth/token', '').replace(/\/$/, '');
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || '';

console.log('TESTE API PROPERFY');
console.log('URL:', PROPERFY_API_URL);
console.log('Token configurado:', !!PROPERFY_API_TOKEN);

async function test() {
  const searchCode = 'BG96074001';
  
  try {
    const response = await fetch(PROPERFY_API_URL + '/property/property?page=1&size=100', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + PROPERFY_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log('Erro HTTP:', response.status);
      return;
    }

    const data = await response.json();
    console.log('Total imoveis:', data.total);
    console.log('Total paginas:', data.last_page);
    
    if (data.data && data.data.length > 0) {
      const first = data.data[0];
      console.log('\nPrimeiro imovel:');
      console.log('chrDocument:', first.chrDocument);
      console.log('chrReference:', first.chrReference);
      console.log('chrInnerReference:', first.chrInnerReference);
    }

    console.log('\nBuscando', searchCode, 'em todas as paginas...');
    
    for (let page = 1; page <= data.last_page; page++) {
      const pageResp = await fetch(PROPERFY_API_URL + '/property/property?page=' + page + '&size=100', {
        headers: {
          'Authorization': 'Bearer ' + PROPERFY_API_TOKEN,
          'Content-Type': 'application/json'
        }
      });
      
      const pageData = await pageResp.json();
      const found = pageData.data?.find(p => {
        const doc = (p.chrDocument || '').toUpperCase();
        const ref = (p.chrReference || '').toUpperCase();
        const inner = (p.chrInnerReference || '').toUpperCase();
        return doc.includes(searchCode) || ref.includes(searchCode) || inner.includes(searchCode);
      });

      if (found) {
        console.log('ENCONTRADO na pagina', page);
        console.log('chrDocument:', found.chrDocument);
        console.log('chrReference:', found.chrReference);
        console.log('Endereco:', found.chrAddressStreet, found.chrAddressNumber);
        return;
      }
    }

    console.log('NAO ENCONTRADO');

  } catch (error) {
    console.log('Erro:', error.message);
  }
}

test().then(() => process.exit(0));
