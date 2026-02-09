// Script temporário para debug - buscar imóveis específicos e mostrar TODOS os campos
const PROPERFY_API_URL = 'https://adm.baggioimoveis.com.br/api';
const PROPERFY_API_TOKEN = '1d50451e-89cb-4ad6-8216-0033c1082ec5';

async function debugProperty(reference: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`BUSCANDO IMÓVEL: ${reference}`);
  console.log('='.repeat(80));
  
  try {
    // Buscar em até 10 páginas
    for (let page = 1; page <= 10; page++) {
      const response = await fetch(`${PROPERFY_API_URL}/property/property?page=${page}&size=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PROPERFY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Erro HTTP na página ${page}: ${response.status}`);
        break;
      }

      const data = await response.json();
      
      if (page === 1) {
        console.log('\nESTRUTURA DA RESPOSTA:');
        console.log('Tipo:', typeof data);
        console.log('É array?', Array.isArray(data));
        if (!Array.isArray(data)) {
          console.log('Chaves:', Object.keys(data).slice(0, 15));
        }
      }
      
      // Acessar dados
      let items: any[] = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data.data && Array.isArray(data.data)) {
        items = data.data;
      }
      
      console.log(`Página ${page}: ${items.length} imóveis`);
      
      // Buscar imóvel específico
      const property = items.find(p => p.chrReference === reference);
      
      if (property) {
        console.log(`\n✅ IMÓVEL ENCONTRADO NA PÁGINA ${page}!`);
        console.log('\n' + '='.repeat(80));
        console.log('CAMPOS DE TIPO:');
        console.log('='.repeat(80));
        console.log('chrType:', property.chrType);
        console.log('intPropertyType:', property.intPropertyType);
        console.log('chrPropertyType:', property.chrPropertyType);
        
        console.log('\n' + '='.repeat(80));
        console.log('CAMPOS DE CONDOMÍNIO:');
        console.log('='.repeat(80));
        console.log('chrCondominiumName:', property.chrCondominiumName);
        console.log('chrCondominium:', property.chrCondominium);
        console.log('chrBuildingName:', property.chrBuildingName);
        
        console.log('\n' + '='.repeat(80));
        console.log('CAMPOS chr* COM VALOR:');
        console.log('='.repeat(80));
        Object.keys(property)
          .filter(k => k.startsWith('chr'))
          .sort()
          .forEach(key => {
            const value = property[key];
            if (value !== null && value !== '') {
              console.log(`  ${key}: ${value}`);
            }
          });
          
        console.log('\n' + '='.repeat(80));
        console.log('CAMPOS int* COM VALOR:');
        console.log('='.repeat(80));
        Object.keys(property)
          .filter(k => k.startsWith('int'))
          .sort()
          .forEach(key => {
            const value = property[key];
            if (value !== null && value !== 0) {
              console.log(`  ${key}: ${value}`);
            }
          });
          
        console.log('\n' + '='.repeat(80));
        console.log('CAMPOS dcm* COM VALOR:');
        console.log('='.repeat(80));
        Object.keys(property)
          .filter(k => k.startsWith('dcm'))
          .sort()
          .forEach(key => {
            const value = property[key];
            if (value !== null && value !== 0) {
              console.log(`  ${key}: ${value}`);
            }
          });
        
        return; // Encontrou, pode parar
      }
    }
    
    console.log(`\n❌ IMÓVEL ${reference} NÃO ENCONTRADO nas primeiras 10 páginas`);
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Buscar os dois imóveis reportados
(async () => {
  await debugProperty('BG97087003');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s entre buscas
  await debugProperty('BG97142005');
})();
