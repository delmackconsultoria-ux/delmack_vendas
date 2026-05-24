/**
 * Validação de Arquivos para Upload
 * Utilizado em NewProposal.tsx e ProposalDetail.tsx
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const FILE_VALIDATION_CONFIG = {
  // Comprovante de Sinal (Baggio)
  SINAL_COMPROVANTE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    displayName: 'Comprovante de Sinal de Negócio',
  },
  // Documento de Venda (proposalFile)
  PROPOSAL_DOCUMENT: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    displayName: 'Documento de Venda',
  },
  // Documentos do Modal (sinal_comprovante, contrato_escritura, nota_fiscal, proposta, outro)
  MODAL_DOCUMENTS: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    displayName: 'Documento',
  },
};

/**
 * Valida um arquivo contra configuração específica
 */
export function validateFile(
  file: File,
  config: typeof FILE_VALIDATION_CONFIG[keyof typeof FILE_VALIDATION_CONFIG]
): FileValidationResult {
  // Validar tamanho
  if (file.size > config.maxSize) {
    const maxSizeMB = config.maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `${config.displayName} não pode exceder ${maxSizeMB}MB. Tamanho atual: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    };
  }

  // Validar tipo MIME
  if (!config.allowedTypes.includes(file.type)) {
    const allowedFormats = config.allowedExtensions.join(', ').toUpperCase();
    return {
      isValid: false,
      error: `Formato de arquivo inválido. Formatos aceitos: ${allowedFormats}`,
    };
  }

  // Validar extensão
  const fileName = file.name.toLowerCase();
  const hasValidExtension = config.allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    const allowedFormats = config.allowedExtensions.join(', ').toUpperCase();
    return {
      isValid: false,
      error: `Extensão de arquivo inválida. Extensões aceitas: ${allowedFormats}`,
    };
  }

  return { isValid: true };
}

/**
 * Converte arquivo para base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
