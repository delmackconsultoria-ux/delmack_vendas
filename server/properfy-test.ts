/**
 * Teste simples da integração Properfy
 * Este arquivo testa se o serviço Properfy está gerando dados mock corretamente
 */

import { createProperfyService } from "./properfy";

async function testProperfyService() {
  console.log("=== Testando Serviço Properfy ===\n");

  // Criar serviço com mock data ativado
  const properfy = createProperfyService({ useMockData: true });

  // Testar busca por referência
  console.log("1. Buscando imóvel BG66206001...");
  const property = await properfy.getPropertyByReference("BG66206001");
  console.log("Resultado:", JSON.stringify(property, null, 2));

  // Testar health check
  console.log("\n2. Verificando saúde da conexão...");
  const isHealthy = await properfy.healthCheck();
  console.log("Saúde:", isHealthy);

  // Testar listagem
  console.log("\n3. Listando imóveis...");
  const list = await properfy.listProperties(1, 5);
  console.log("Total de imóveis:", list?.total);
  console.log("Primeira página:", list?.data?.length, "imóveis");
}

// Executar teste
testProperfyService().catch(console.error);

