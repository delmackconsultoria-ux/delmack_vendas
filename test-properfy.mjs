const PROPERFY_API_URL = (process.env.PROPERFY_API_URL || '').replace('/auth/token', '').replace(/\/$/, '');
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || '';

console.log('=== TESTE API PROPERFY ===');
console.log('URL:', PROPERFY_API_URL);
console.log('Token configurado:', !!PROPERFY_API_TOKEN);
console.log('');

async function testSearch(searchTerm) {
  try {
    console.log(`Buscando: ${searchTerm}`);
    
    const response = await fetch(`${PROPERFY_API_URL}/property/property?page=1&size=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log('Resposta:', text.substring(0, 200));
      return;
    }

    const data = await response.json();
    console.log(`✅ API respondeu: ${data.total || 0} imóveis totais`);
    console.log(`Página ${data.current_page}/${data.last_page}`);
    
    // Buscar o imóvel específico
    const searchNorm = searchTerm.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const found = data.data?.find(p => {
      const ref = (p.chrReference || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const innerRef = (p.chrInnerReference || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return ref === searchNorm || innerRef === searchNorm || ref.includes(searchNorm) || innerRef.includes(searchNorm);
    });

    if (found) {
      console.log('✅ IMÓVEL ENCONTRADO:');
      console.log(JSON.stringify({
        chrReference: found.chrReference,
        chrInnerReference: found.chrInnerReference,
        chrAddressStreet: found.chrAddressStreet,
        chrAddressNumber: found.chrAddressNumber,
        chrAddressPostalCode: found.chrAddressPostalCode,
        chrAddressCity: found.chrAddressCity,
      }, null, 2));
    } else {
      console.log('❌ Imóvel NÃO encontrado na primeira página');
      console.log('Primeiros 3 imóveis da API:');
      data.data?.slice(0, 3).forEach((p, i) => {
        console.log(`${i+1}. Ref: ${p.chrReference} | Inner: ${p.chrInnerReference} | End: ${p.chrAddressStreet}`);
      });
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testSearch('BG96074001').then(() => process.exit(0));
