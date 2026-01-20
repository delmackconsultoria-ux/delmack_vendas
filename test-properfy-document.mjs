const PROPERFY_API_URL = (process.env.PROPERFY_API_URL || '').replace('/auth/token', '').replace(/\/$/, '');
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || '';

console.log('=== TESTE API PROPERFY (chrDocument) ===');
console.log('URL:', PROPERFY_API_URL);
console.log('Token configurado:', !!PROPERFY_API_TOKEN);
console.log('Buscando código: BG96074001');
console.log('');

async function searchAllPages(searchTerm) {
  try {
    const searchNorm = searchTerm.toUpperCase().replace(/[^A-Z0-9]/g, '');
    console.log(`Código normalizado: ${searchNorm}\n`);
    
    // Primeira página para descobrir total
    const firstResponse = await fetch(`${PROPERFY_API_URL}/property/property?page=1&size=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!firstResponse.ok) {
      console.log(`❌ Erro HTTP: ${firstResponse.status} ${firstResponse.statusText}`);
      return;
    }

    const firstData = await firstResponse.json();
    const totalPages = firstData.last_page || 1;
    console.log(`📊 Total: ${firstData.total || 0} imóveis em ${totalPages} páginas\n`);
    
    // Verificar estrutura do primeiro imóvel
    if (firstData.data && firstData.data.length > 0) {
      const first = firstData.data[0];
      console.log('📋 Estrutura do primeiro imóvel:');
      console.log('  chrDocument:', first.chrDocument);
      console.log('  chrReference:', first.chrReference);
      console.log('  chrInnerReference:', first.chrInnerReference);
      console.log('  chrAddressCityCode:', first.chrAddressCityCode);
      console.log('');
    }
    
    // Buscar em todas as páginas
    console.log(`🔎 Buscando em TODAS as ${totalPages} páginas...\n`);
    
    for (let page = 1; page <= totalPages; page++) {
      if (page % 5 === 0 || page === 1) {
        console.log(`   Verificando página ${page}/${totalPages}...`);
      }
      
      const response = await fetch(`${PROPERFY_API_URL}/property/property?page=${page}&size=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) continue;

      const data = await response.json();
      
      for (const property of data.data || []) {
        // Buscar em chrDocument (campo correto!)
        const docFull = (property.chrDocument || '').toUpperCase();
        const docBeforeDot = docFull.split('.')[0].replace(/[^A-Z0-9]/g, '');
        
        if (docBeforeDot === searchNorm) {
          console.log(`\n✅ IMÓVEL ENCONTRADO na página ${page}!`);
          console.log('');
          console.log('Dados completos:');
          console.log(JSON.stringify({
            chrDocument: property.chrDocument,
            chrReference: property.chrReference,
            chrInnerReference: property.chrInnerReference,
            chrAddressStreet: property.chrAddressStreet,
            chrAddressNumber: property.chrAddressNumber,
            chrAddressCityCode: property.chrAddressCityCode,
            chrAddressPostalCode: property.chrAddressPostalCode,
            chrAddressCity: property.chrAddressCity,
            chrAddressState: property.chrAddressState,
            chrAddressDistrict: property.chrAddressDistrict,
          }, null, 2));
          return;
        }
      }
    }
    
    console.log(`\n❌ Código ${searchTerm} NÃO encontrado em nenhuma das ${totalPages} páginas`);
    console.log('   Verifique se o código está correto ou se o imóvel existe na base Properfy.');
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
    console.error(error);
  }
}

searchAllPages('BG96074001').then(() => process.exit(0));
