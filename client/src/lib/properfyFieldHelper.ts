/**
 * Helper para identificar campos preenchidos automaticamente pela API Properfy
 * Esses campos devem ter background verde claro quando preenchidos
 */

export const PROPERFY_AUTO_FILLED_FIELDS = [
  'typeOfProperty',
  'bedrooms',
  'privateArea',
  'totalArea',
  'costPerM2',
  'propertyAge',
  'propertyAddress',
  'propertyNumber',
  'propertyNeighborhood',
  'propertyCity',
  'propertyState',
  'propertyZipCode',
  'condominiumName',
  'advertisementValue',
] as const;

export type ProperfyAutoFilledField = typeof PROPERFY_AUTO_FILLED_FIELDS[number];

/**
 * Retorna className para campo que pode ser preenchido pela API Properfy
 * @param fieldName Nome do campo
 * @param value Valor atual do campo
 * @param completionStatus Status de completude (para validação de obrigatório)
 * @param attemptedSave Se já tentou salvar (para mostrar erro em vermelho)
 * @param isRequired Se o campo é obrigatório
 */
export function getProperfyFieldClassName(
  fieldName: string,
  value: string | undefined,
  completionStatus?: boolean,
  attemptedSave?: boolean,
  isRequired?: boolean
): string {
  const isAutoFillable = PROPERFY_AUTO_FILLED_FIELDS.includes(fieldName as ProperfyAutoFilledField);
  
  // Se é campo auto-preenchível e tem valor, mostrar verde
  if (isAutoFillable && value && value.trim() !== '') {
    return "bg-green-50 border-green-300";
  }
  
  // Se é obrigatório e tentou salvar sem preencher, mostrar vermelho
  if (isRequired && attemptedSave && !completionStatus) {
    return "bg-red-50 border-red-400";
  }
  
  return "";
}
