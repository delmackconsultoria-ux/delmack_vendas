// Buscar a referência BG96375002 em todas as páginas

const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN;
const BASE_URL = 'https://sandbox.properfy.com.br/api';

async function searchAllPages(searchRef) {
  console.log('Buscando:', searchRef);
  
  let totalFound = 0;
  let allRefs = [];
  
  for (let page = 1; page <= 10; page++) {
    const response = await fetch(BASE_URL + `/property/property?page=${page}&size=100`, {
      headers: {
        'Authorization': 'Bearer ' + PROPERFY_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`Página ${page}: erro ${response.status}`);
      break;
    }
    
    const data = await response.json();
    const count = data.data?.length || 0;
    totalFound += count;
    
    // Coletar todas as referências
    data.data?.forEach(p => {
      allRefs.push({
        ref: p.chrReference,
        inner: p.chrInnerReference
      });
    });
    
    // Buscar a referência específica
    const found = data.data?.find(p => 
      p.chrReference?.toUpperCase().includes(searchRef.toUpperCase()) ||
      p.chrInnerReference?.toUpperCase().includes(searchRef.toUpperCase())
    );
    
    if (found) {
      console.log(`\\n*** ENCONTRADO na página ${page}! ***`);
      console.log('Ref:', found.chrReference);
      console.log('Inner:', found.chrInnerReference);
      console.log('Endereço:', found.chrAddressStreet, found.chrAddressNumber);
      console.log('Cidade:', found.chrAddressCity, found.chrAddressState);
      return found;
    }
    
    console.log(`Página ${page}: ${count} imóveis`);
    
    if (page >= (data.last_page || 1)) {
      console.log('Última página alcançada');
      break;
    }
  }
  
  console.log(`\\nTotal de imóveis verificados: ${totalFound}`);
  console.log('\\nTodas as referências encontradas:');
  allRefs.slice(0, 20).forEach((r, i) => {
    console.log(`${i+1}. ${r.ref} / ${r.inner}`);
  });
  
  return null;
}

try {
  await searchAllPages('BG96375002');
  console.log('\\n---\\n');
  await searchAllPages('BG96911001');
} catch (e) {
  console.error('Error:', e.message);
}
