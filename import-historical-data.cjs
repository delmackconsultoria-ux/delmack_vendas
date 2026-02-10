/**
 * Script para importar dados históricos de Excel files
 * 
 * Uso:
 *   node import-historical-data.cjs <ano> <caminho_para_pasta_com_excel_files>
 * 
 * Exemplo:
 *   node import-historical-data.cjs 2025 /home/ubuntu/upload/Historico2025
 * 
 * O script vai:
 * 1. Ler todos os arquivos .xlsx da pasta
 * 2. Extrair dados da aba "Indicadores" de cada arquivo
 * 3. Consolidar dados mensais
 * 4. Salvar em indicators-YYYY.json
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Validar argumentos
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('❌ Uso: node import-historical-data.cjs <ano> <caminho_para_pasta>');
  console.error('   Exemplo: node import-historical-data.cjs 2025 /home/ubuntu/upload/Historico2025');
  process.exit(1);
}

const year = parseInt(args[0]);
const folderPath = args[1];

if (isNaN(year) || year < 2020 || year > 2030) {
  console.error('❌ Ano inválido. Deve estar entre 2020 e 2030.');
  process.exit(1);
}

if (!fs.existsSync(folderPath)) {
  console.error(`❌ Pasta não encontrada: ${folderPath}`);
  process.exit(1);
}

console.log(`📂 Importando dados históricos de ${year}...`);
console.log(`📁 Pasta: ${folderPath}`);

// Listar arquivos Excel
const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
console.log(`📄 Encontrados ${files.length} arquivos Excel`);

if (files.length === 0) {
  console.error('❌ Nenhum arquivo Excel encontrado na pasta');
  process.exit(1);
}

// Mapeamento de meses (nome do arquivo → nome do mês)
const monthMapping = {
  '01': 'Janeiro',
  '02': 'Fevereiro',
  '03': 'Março',
  '04': 'Abril',
  '05': 'Maio',
  '06': 'Junho',
  '07': 'Julho',
  '08': 'Agosto',
  '09': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro',
};

// Estrutura de dados consolidados
const consolidatedData = {};

// Processar cada arquivo
files.forEach((fileName, index) => {
  console.log(`\n📊 Processando ${index + 1}/${files.length}: ${fileName}`);
  
  try {
    const filePath = path.join(folderPath, fileName);
    const workbook = XLSX.readFile(filePath);
    
    // Verificar se tem aba "Indicadores"
    if (!workbook.SheetNames.includes('Indicadores')) {
      console.warn(`⚠️  Aba "Indicadores" não encontrada em ${fileName}`);
      return;
    }
    
    const sheet = workbook.Sheets['Indicadores'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Detectar mês do arquivo (tentar extrair do nome do arquivo)
    let monthName = null;
    for (const [monthNum, name] of Object.entries(monthMapping)) {
      if (fileName.includes(monthNum) || fileName.toLowerCase().includes(name.toLowerCase())) {
        monthName = name;
        break;
      }
    }
    
    if (!monthName) {
      console.warn(`⚠️  Não foi possível detectar o mês de ${fileName}`);
      return;
    }
    
    console.log(`   Mês detectado: ${monthName}`);
    
    // Extrair indicadores (assumindo que estão na coluna A e valores na coluna H - Total)
    const indicators = {};
    let indicatorCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2) continue;
      
      const indicatorName = row[0];
      const totalValue = row[7]; // Coluna H (índice 7) = Total
      
      if (indicatorName && totalValue !== undefined && totalValue !== '') {
        indicators[indicatorName] = {
          total: parseFloat(totalValue) || 0,
          campoComprido: parseFloat(row[1]) || 0,
          vilaIzabel: parseFloat(row[2]) || 0,
        };
        indicatorCount++;
      }
    }
    
    console.log(`   ✅ ${indicatorCount} indicadores extraídos`);
    
    // Armazenar dados do mês
    consolidatedData[monthName] = indicators;
    
  } catch (error) {
    console.error(`   ❌ Erro ao processar ${fileName}:`, error.message);
  }
});

// Verificar se conseguiu extrair dados
const monthsProcessed = Object.keys(consolidatedData).length;
console.log(`\n📊 Total de meses processados: ${monthsProcessed}/12`);

if (monthsProcessed === 0) {
  console.error('❌ Nenhum dado foi extraído. Verifique a estrutura dos arquivos Excel.');
  process.exit(1);
}

// Transformar dados para formato esperado (com monthlyValues)
const finalData = {};

// Obter lista de todos os indicadores
const allIndicators = new Set();
Object.values(consolidatedData).forEach(monthData => {
  Object.keys(monthData).forEach(indicator => allIndicators.add(indicator));
});

console.log(`\n📈 Total de indicadores únicos: ${allIndicators.size}`);

// Para cada indicador, criar array de valores mensais
allIndicators.forEach(indicatorName => {
  const monthlyValues = [];
  
  ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].forEach(month => {
    const monthData = consolidatedData[month];
    if (monthData && monthData[indicatorName]) {
      monthlyValues.push(monthData[indicatorName].total);
    } else {
      monthlyValues.push(0);
    }
  });
  
  finalData[indicatorName] = {
    name: indicatorName,
    monthlyValues,
  };
});

// Salvar arquivo JSON
const outputPath = path.join(process.cwd(), `indicators-${year}.json`);
fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf-8');

console.log(`\n✅ Dados salvos em: ${outputPath}`);
console.log(`📊 ${allIndicators.size} indicadores × 12 meses = ${allIndicators.size * 12} pontos de dados`);
console.log(`\n🎉 Importação concluída com sucesso!`);
console.log(`\n📝 Próximos passos:`);
console.log(`   1. Verifique o arquivo indicators-${year}.json`);
console.log(`   2. Reinicie o servidor: pnpm dev`);
console.log(`   3. Acesse a página Indicadores e selecione o ano ${year}`);
