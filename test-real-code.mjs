const PROPERFY_API_URL = (process.env.PROPERFY_API_URL || '').replace('/auth/token', '').replace(/\/$/, '');
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || '';

console.log('=== TESTE COM CÓDIGO REAL DA API ===\n');

async function testRealCode() {
  try {
    // Buscar primeiro imóvel da API
    const response = await fetch(`${PROPERFY_API_URL}/property/property?page=1&size=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`❌ Erro HTTP: ${response.status}`);
      return;
    }

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const firstProperty = data.data[0];
      
      console.log('📋 Primeiro imóvel da API:');
      console.log('  chrReference:', firstProperty.chrReference);
      console.log('  chrInnerReference:', firstProperty.chrInnerReference);
      console.log('  Endereço:', firstProperty.chrAddressStreet, firstProperty.chrAddressNumber);
      console.log('  CEP:', firstProperty.chrAddressCityCode || firstProperty.chrAddressPostalCode);
      console.log('');
      
      // Testar busca com o código real
      const testCode = firstProperty.chrReference || firstProperty.chrInnerReference;
      console.log(`🔎 Testando busca com código real: ${testCode}\n`);
      
      // Simular busca normalizada (como no código)
      const searchNorm = testCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const ref = (firstProperty.chrReference || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const innerRef = (firstProperty.chrInnerReference || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      console.log('Comparação:');
      console.log('  Busca normalizada:', searchNorm);
      console.log('  chrReference normalizado:', ref);
      console.log('  chrInnerReference normalizado:', innerRef);
      console.log('');
      
      const matchExact = ref === searchNorm || innerRef === searchNorm;
      const matchPartial = ref.includes(searchNorm) || innerRef.includes(searchNorm);
      
      console.log('Resultado:');
      console.log('  Match exato:', matchExact ? '✅ SIM' : '❌ NÃO');
      console.log('  Match parcial:', matchPartial ? '✅ SIM' : '❌ NÃO');
      
      if (matchExact || matchPartial) {
        console.log('\n✅ SUCESSO! A lógica de busca está funcionando corretamente!');
      } else {
        console.log('\n❌ FALHA! A lógica de busca não está funcionando.');
      }
    }
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testRealCode().then(() => process.exit(0));
