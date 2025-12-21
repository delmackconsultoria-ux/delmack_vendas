const PROPERFY_API_URL = process.env.PROPERFY_API_URL || 'https://sandbox.properfy.com.br/api';
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || '';

console.log('URL:', PROPERFY_API_URL);
console.log('Token exists:', !!PROPERFY_API_TOKEN);
console.log('Token length:', PROPERFY_API_TOKEN?.length);

try {
  const response = await fetch(PROPERFY_API_URL + '/property/property?page=1&size=10', {
    headers: {
      'Authorization': 'Bearer ' + PROPERFY_API_TOKEN,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Data count:', data.data?.length);
  
  if (data.data?.length > 0) {
    console.log('\\nPrimeiros 3 imóveis:');
    data.data.slice(0, 3).forEach((p, i) => {
      console.log(`${i+1}. Ref: ${p.chrReference}, Inner: ${p.chrInnerReference}, Rua: ${p.chrAddressStreet}`);
    });
    
    // Buscar pela referência BG96375002
    console.log('\\nBuscando BG96375002...');
    const found = data.data.find(p => 
      p.chrReference?.toUpperCase().includes('BG96375002') ||
      p.chrInnerReference?.toUpperCase().includes('BG96375002')
    );
    console.log('Encontrado:', found ? 'SIM' : 'NÃO');
  }
  
  console.log('Response keys:', Object.keys(data));
} catch (e) {
  console.error('Error:', e.message);
}
