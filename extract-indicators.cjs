const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function extractIndicatorsFromExcel(filePath) {
  console.log(`\n📄 Processando ${path.basename(filePath)}...`);
  
  const workbook = XLSX.readFile(filePath);
  
  // Procurar aba "Indicadores"
  const indicatorsSheet = workbook.Sheets['Indicadores'];
  if (!indicatorsSheet) {
    console.log('   ⚠️  Aba "Indicadores" não encontrada');
    return null;
  }

  // Converter para array de arrays
  const data = XLSX.utils.sheet_to_json(indicatorsSheet, { header: 1 });
  
  // Primeira linha tem os headers
  const headers = data[0];
  console.log('   Headers:', headers);

  // Extrair indicadores (linhas 1 em diante)
  const indicators = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const indicatorName = row[0];
    if (!indicatorName) continue;

    // Extrair valores das colunas
    const metaMensal = row[1];
    const mediaAnual = row[2];
    const percentual = row[3];
    const campoComprido = row[4];
    const vilaIzabel = row[5];
    const total = row[6];
    
    // Valores mensais (colunas 7 em diante)
    const monthlyValues = {};
    for (let j = 7; j < headers.length; j++) {
      const monthName = headers[j];
      if (monthName && MONTHS.includes(monthName)) {
        monthlyValues[monthName] = row[j] || 0;
      }
    }

    indicators[indicatorName] = {
      metaMensal,
      mediaAnual,
      percentual,
      campoComprido,
      vilaIzabel,
      total,
      monthlyValues
    };
  }

  console.log(`   ✅ Extraídos ${Object.keys(indicators).length} indicadores`);
  return indicators;
}

async function main() {
  console.log('🚀 Extraindo indicadores dos 12 Excel files de 2024...\n');

  const excelDir = '/home/ubuntu/historico2024';
  const files = fs.readdirSync(excelDir)
    .filter(f => f.endsWith('.xlsx'))
    .sort();

  const allData = {};

  for (const file of files) {
    const filePath = path.join(excelDir, file);
    
    // Extrair mês do nome do arquivo (ex: "01 Relatório_Jan_2024.xlsx" -> "Janeiro")
    const monthMatch = file.match(/_(Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)_/);
    if (!monthMatch) {
      console.log(`⚠️  Não foi possível identificar o mês em: ${file}`);
      continue;
    }

    const monthAbbr = monthMatch[1];
    const monthMap = {
      'Jan': 'Janeiro', 'Fev': 'Fevereiro', 'Mar': 'Março', 'Abr': 'Abril',
      'Mai': 'Maio', 'Jun': 'Junho', 'Jul': 'Julho', 'Ago': 'Agosto',
      'Set': 'Setembro', 'Out': 'Outubro', 'Nov': 'Novembro', 'Dez': 'Dezembro'
    };
    const monthName = monthMap[monthAbbr];

    const indicators = extractIndicatorsFromExcel(filePath);
    if (indicators) {
      allData[monthName] = indicators;
    }
  }

  // Salvar dados extraídos em JSON
  const outputPath = '/home/ubuntu/delmack_real_estate/indicators-2024.json';
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  
  console.log(`\n✅ Dados extraídos e salvos em: ${outputPath}`);
  console.log(`   Total de meses processados: ${Object.keys(allData).length}`);
  
  // Mostrar exemplo de um indicador
  const firstMonth = Object.keys(allData)[0];
  const firstIndicator = Object.keys(allData[firstMonth])[0];
  console.log(`\n📊 Exemplo de indicador extraído:`);
  console.log(`   Mês: ${firstMonth}`);
  console.log(`   Indicador: ${firstIndicator}`);
  console.log(`   Dados:`, JSON.stringify(allData[firstMonth][firstIndicator], null, 2));
}

main().catch(console.error);
