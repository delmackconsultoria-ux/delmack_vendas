import { getDb } from './server/db.js';
import { properfyProperties } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const db = await getDb();
const result = await db.select().from(properfyProperties).where(eq(properfyProperties.chrReference, 'BG97142005')).limit(1);
console.log('Resultado da busca por BG97142005:', result.length > 0 ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
if (result.length > 0) {
  console.log('\n=== DADOS DO IMÓVEL ===');
  console.log('ID:', result[0].id);
  console.log('Referência:', result[0].chrReference);
  console.log('Tipo:', result[0].chrType);
  console.log('Quartos (intTotalBedrooms):', result[0].intTotalBedrooms);
  console.log('Quartos (intBedrooms):', result[0].intBedrooms);
  console.log('Bairro (chrAddressDistrict):', result[0].chrAddressDistrict);
  console.log('Endereço:', result[0].chrAddressStreet);
  console.log('Número:', result[0].chrAddressNumber);
  console.log('CEP:', result[0].chrAddressPostalCode);
  console.log('Valor:', result[0].dcmSale);
  console.log('Área privativa:', result[0].dcmAreaPrivate);
  console.log('Condomínio:', result[0].chrCondoName);
}
