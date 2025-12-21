const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN;
const BASE_URL = 'https://sandbox.properfy.com.br/api';

async function getExamples() {
  const response = await fetch(BASE_URL + '/property/property?page=1&size=50', {
    headers: {
      'Authorization': 'Bearer ' + PROPERFY_API_TOKEN,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  console.log('=== 5 EXEMPLOS PARA TESTAR ===\n');
  
  data.data?.slice(0, 5).forEach((p, i) => {
    console.log(`${i+1}. REFERÊNCIA: ${p.chrReference}`);
    console.log(`   Endereço: ${p.chrAddressStreet || 'N/A'}, ${p.chrAddressNumber || 'S/N'}`);
    console.log(`   Bairro: ${p.chrAddressDistrict || 'N/A'}`);
    console.log(`   Cidade: ${p.chrAddressCity || 'N/A'} - ${p.chrAddressState || 'N/A'}`);
    console.log(`   CEP: ${p.chrAddressPostalCode || 'N/A'}`);
    console.log('');
  });
}

getExamples().catch(console.error);
