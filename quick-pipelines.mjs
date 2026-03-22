const API_URL = process.env.PROPERFY_API_URL || "https://adm.baggioimoveis.com.br/api";
const API_TOKEN = process.env.PROPERFY_API_TOKEN || "";

async function quickPipelineCheck() {
  console.log("🔍 Verificando pipelines nos primeiros cards...\n");
  
  try {
    const url = `${API_URL}/crm/card?page=1&size=500`;
    console.log(`📡 Fetching: ${url.substring(0, 80)}...\n`);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error(`❌ Response is not an array`);
      return;
    }
    
    console.log(`✅ Recebidos ${data.length} cards\n`);
    
    // Agrupar por pipeline
    const pipelines = {};
    
    for (const card of data) {
      const pipelineId = card.fkPipeline;
      if (!pipelines[pipelineId]) {
        pipelines[pipelineId] = {
          count: 0,
          samples: []
        };
      }
      pipelines[pipelineId].count++;
      
      if (pipelines[pipelineId].samples.length < 2) {
        pipelines[pipelineId].samples.push({
          id: card.id,
          title: card.chrTitle,
          type: card.chrType
        });
      }
    }
    
    // Exibir resultados
    console.log("📋 PIPELINES ENCONTRADOS NOS PRIMEIROS 500 CARDS:\n");
    console.log("┌──────────────┬──────────┬────────────────────────────┐");
    console.log("│ Pipeline ID  │ Quantity │ Sample Cards               │");
    console.log("├──────────────┼──────────┼────────────────────────────┤");
    
    const sorted = Object.entries(pipelines).sort((a, b) => b[1].count - a[1].count);
    
    for (const [pipelineId, stats] of sorted) {
      const id = String(pipelineId).padEnd(12);
      const count = String(stats.count).padEnd(8);
      const samples = stats.samples.map(s => `${s.id}`).join(", ");
      console.log(`│ ${id} │ ${count} │ ${samples.padEnd(26)} │`);
    }
    
    console.log("└──────────────┴──────────┴────────────────────────────┘\n");
    
    // Verificar IDs esperados
    const expectedIds = [20, 21, 24, 49];
    const foundIds = Object.keys(pipelines).map(Number);
    
    console.log("🎯 VERIFICAÇÃO DE IDs ESPERADOS:");
    for (const id of expectedIds) {
      if (foundIds.includes(id)) {
        console.log(`  ✅ Pipeline ${id}: ${pipelines[id].count} cards`);
      } else {
        console.log(`  ❌ Pipeline ${id}: NÃO ENCONTRADO`);
      }
    }
    
    console.log("\n📊 TOTAL DE PIPELINES ÚNICOS:", Object.keys(pipelines).length);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

quickPipelineCheck();
