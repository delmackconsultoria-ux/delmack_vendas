// Usar fetch nativo do Node.js 18+

const API_URL = process.env.PROPERFY_API_URL || "https://adm.baggioimoveis.com.br/api";
const API_TOKEN = process.env.PROPERFY_API_TOKEN || "";

async function listPipelines() {
  console.log("🔍 Listando todos os pipelines e cards...\n");
  console.log(`API URL: ${API_URL}`);
  console.log(`Token length: ${API_TOKEN.length}\n`);
  
  const pipelineStats = {};
  
  try {
    // Buscar todos os cards
    let page = 1;
    let totalCards = 0;
    let allCards = [];
    
    while (page <= 100) {
      const url = `${API_URL}/crm/card?page=${page}&size=500`;
      console.log(`📡 Fetching page ${page}...`);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 120000,
      });
      
      if (!response.ok) {
        console.error(`❌ Error: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        console.log(`✅ Parado na página ${page} (sem mais dados)`);
        break;
      }
      
      console.log(`✅ Page ${page}: ${data.length} cards`);
      allCards.push(...data);
      totalCards += data.length;
      
      page++;
      
      // Delay entre requisições
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Total de cards: ${totalCards}\n`);
    
    // Agrupar por pipeline
    for (const card of allCards) {
      const pipelineId = card.fkPipeline;
      const pipelineName = card.chrTitle || `Pipeline ${pipelineId}`;
      
      if (!pipelineStats[pipelineId]) {
        pipelineStats[pipelineId] = {
          name: pipelineName,
          count: 0,
          sampleCards: []
        };
      }
      
      pipelineStats[pipelineId].count++;
      
      // Guardar 3 exemplos de cards
      if (pipelineStats[pipelineId].sampleCards.length < 3) {
        pipelineStats[pipelineId].sampleCards.push({
          id: card.id,
          title: card.chrTitle,
          type: card.chrType,
          lead: card.fkLead
        });
      }
    }
    
    // Exibir resultados ordenados por quantidade
    console.log("📋 PIPELINES ENCONTRADOS:\n");
    console.log("┌─────────────────────────────────────────────────────┐");
    console.log("│ Pipeline ID │ Nome                  │ Quantidade    │");
    console.log("├─────────────────────────────────────────────────────┤");
    
    const sortedPipelines = Object.entries(pipelineStats)
      .sort((a, b) => b[1].count - a[1].count);
    
    for (const [pipelineId, stats] of sortedPipelines) {
      const id = String(pipelineId).padEnd(11);
      const name = (stats.name || `Pipeline ${pipelineId}`).substring(0, 20).padEnd(21);
      const count = String(stats.count).padEnd(13);
      console.log(`│ ${id} │ ${name} │ ${count} │`);
    }
    
    console.log("└─────────────────────────────────────────────────────┘\n");
    
    // Mostrar IDs esperados
    console.log("🎯 IDs ESPERADOS NO CÓDIGO:");
    console.log("  - VENDAS LANÇAMENTOS: 20");
    console.log("  - VENDAS PRONTOS: 21");
    console.log("  - ANGARIAÇÃO DE VENDAS: 24");
    console.log("  - LEADS FOR YOU: 49\n");
    
    // Verificar quais IDs estão presentes
    const expectedIds = [20, 21, 24, 49];
    const foundIds = Object.keys(pipelineStats).map(Number);
    const missingIds = expectedIds.filter(id => !foundIds.includes(id));
    const extraIds = foundIds.filter(id => !expectedIds.includes(id));
    
    if (missingIds.length > 0) {
      console.log(`⚠️ IDs ESPERADOS NÃO ENCONTRADOS: ${missingIds.join(", ")}`);
    }
    
    if (extraIds.length > 0) {
      console.log(`ℹ️ IDs EXTRAS ENCONTRADOS: ${extraIds.join(", ")}`);
    }
    
    if (missingIds.length === 0 && extraIds.length === 0) {
      console.log(`✅ Todos os IDs esperados foram encontrados!`);
    }
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

listPipelines();
