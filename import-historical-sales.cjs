const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');

const COMPANY_ID = 'B I IMOVEIS LTDA';

// Mapeamento de nomes de corretores
const BROKER_NAME_MAP = {
  'Priscilla': 'Priscilla Gomes Ziolkowski',
  'Priscilla Pires': 'Priscilla Pires Andrelle',
  'Odair': 'Odair Adão Ferreira',
  'Camila': 'Camila Pires',
  'Lucas': 'Lucas Baggio',
  'Marcio': 'Marcio Baggio',
  'Carolina': 'Carolina Cardoso',
  'Juliana': 'Juliana Silva',
  'Pedro': 'Pedro Costa',
  'Ana': 'Ana Oliveira',
  'João': 'João Silva',
  'Maria': 'Maria Santos',
};

function normalizeBrokerName(name) {
  if (!name) return null;
  const trimmed = name.trim();
  return BROKER_NAME_MAP[trimmed] || trimmed;
}

function parseExcelDate(excelDate) {
  if (!excelDate) return null;
  if (typeof excelDate === 'string') {
    // Try parsing DD/MM/YYYY format
    const parts = excelDate.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return excelDate;
  }
  // Excel serial date
  const date = XLSX.SSF.parse_date_code(excelDate);
  return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
}

function parseNumber(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  // Remove R$, pontos e vírgulas
  const cleaned = String(value).replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

async function importExcelFile(filePath, connection) {
  console.log(`\n📄 Importando ${path.basename(filePath)}...`);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Primeira aba (GERAL)
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`   Encontradas ${data.length} linhas`);

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    try {
      // Extrair dados da linha
      const propertyRef = row['Código Properfy'] || row['Referência'] || '';
      const saleDate = parseExcelDate(row['Data Venda'] || row['Data da Venda']);
      const acquisitionDate = parseExcelDate(row['Data Angariação'] || row['Data da Angariação']);
      const salePrice = parseNumber(row['Valor Venda'] || row['Valor da Venda']);
      const listingPrice = parseNumber(row['Valor Anúncio'] || row['Valor do Anúncio']);
      const commissionAmount = parseNumber(row['Comissão'] || row['Valor Comissão']);
      const commissionPercentage = parseNumber(row['% Comissão'] || row['Percentual Comissão']);
      
      const acquisitionBroker = normalizeBrokerName(row['Corretor Angariador'] || row['Angariador']);
      const saleBroker = normalizeBrokerName(row['Corretor Vendedor'] || row['Vendedor']);
      
      const businessType = row['Tipo Negócio'] || row['Tipo'] || 'Prontos';
      const acquisitionStore = row['Loja Angariadora'] || 'Baggio';
      const saleStore = row['Loja Vendedora'] || 'Baggio';

      // Validar dados mínimos
      if (!saleDate || salePrice === 0) {
        skipped++;
        continue;
      }

      // Inserir no banco
      const id = `sale_hist_${nanoid(24)}`;
      
      await connection.execute(
        `INSERT INTO historicalSales (
          id, companyId, propertyReference, saleDate, acquisitionDate,
          listingPrice, salePrice, commissionAmount, commissionPercentage,
          acquisitionBrokerName, saleBrokerName, businessType,
          acquisitionStore, saleStore, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id, COMPANY_ID, propertyRef, saleDate, acquisitionDate,
          listingPrice, salePrice, commissionAmount, commissionPercentage,
          acquisitionBroker, saleBroker, businessType,
          acquisitionStore, saleStore, 'commission_paid'
        ]
      );

      imported++;
    } catch (error) {
      console.error(`   Erro na linha:`, error.message);
      skipped++;
    }
  }

  console.log(`   ✅ Importadas: ${imported} | ⏭️  Ignoradas: ${skipped}`);
  return { imported, skipped };
}

async function main() {
  console.log('🚀 Iniciando importação de vendas históricas de 2024...\n');

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  const excelDir = '/home/ubuntu/historico2024';
  const files = fs.readdirSync(excelDir)
    .filter(f => f.endsWith('.xlsx'))
    .sort();

  let totalImported = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const filePath = path.join(excelDir, file);
    const { imported, skipped } = await importExcelFile(filePath, connection);
    totalImported += imported;
    totalSkipped += skipped;
  }

  await connection.end();

  console.log(`\n✅ Importação concluída!`);
  console.log(`   Total importadas: ${totalImported}`);
  console.log(`   Total ignoradas: ${totalSkipped}`);
}

main().catch(console.error);
