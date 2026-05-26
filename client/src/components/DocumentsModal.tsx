import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Document {
  url: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  mimeType: string;
}

interface DocumentsModalProps {
  open: boolean;
  onClose: () => void;
  documents: Record<string, Document> | null;
  saleId: string;
  canUpload?: boolean;
  onUpload?: (documentType: string, file: File) => Promise<void>;
  proposalDocumentUrl?: string | null; // URL do Anexo de Proposta salvo pelo corretor
  sinalComprovanteUrl?: string | null; // URL do Comprovante de Sinal salvo pelo corretor
}

const DOCUMENT_TYPES: Record<string, string> = {
  sinal_comprovante: "Comprovante de Sinal de Negócio",
  contrato_escritura: "Contrato/Escritura",
  nota_fiscal: "Nota Fiscal",
  proposta: "Proposta de Compra",
  outro: "Outro Documento",
};

export function DocumentsModal({ open, onClose, documents, saleId, canUpload = false, onUpload, proposalDocumentUrl, sinalComprovanteUrl }: DocumentsModalProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handleFileSelect = async (documentType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUpload) return;

    // Validação de formato
    const allowedFormats = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedFormats.includes(file.type)) {
      toast.error("Formato de arquivo inválido", {
        description: "Apenas arquivos PDF, JPG, JPEG e PNG são permitidos.",
      });
      event.target.value = ""; // Limpa o input
      return;
    }

    // Validação de tamanho (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB em bytes
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande", {
        description: "O arquivo deve ter no máximo 5MB.",
      });
      event.target.value = ""; // Limpa o input
      return;
    }

    setUploading(documentType);
    try {
      await onUpload(documentType, file);
      toast.success("Documento anexado com sucesso!");
    } catch (error) {
      toast.error("Erro ao anexar documento", {
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setUploading(null);
      event.target.value = ""; // Limpa o input
    }
  };

  // Usa a URL direta agora que a rota /api/uploads é pública e não exige cookie
  const getDirectUrl = (url: string) => {
    // Data URLs (base64) não devem receber query string
    if (url.startsWith('data:')) return url;
    const cleanUrl = url.split('?')[0];
    const urlWithCacheBust = cleanUrl + '?t=' + Date.now();
    return urlWithCacheBust.startsWith('/') ? window.location.origin + urlWithCacheBust : urlWithCacheBust;
  };

  const handlePreview = (url: string, fileName: string) => {
    // Para garantir compatibilidade com Windows 8.1 / Chrome antigo,
    // abrimos a imagem em uma nova aba em vez de tentar renderizar no modal
    const directUrl = getDirectUrl(url);
    window.open(directUrl, '_blank');
  };

  const handleDownload = (url: string, fileName: string) => {
    const directUrl = getDirectUrl(url);
    const link = document.createElement('a');
    link.href = directUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documentos Anexados</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {Object.entries(DOCUMENT_TYPES).map(([type, label]) => {
              // Para 'proposta', usar proposalDocumentUrl como fallback se não houver doc no JSON
              let doc = documents?.[type];
              if (!doc && type === 'sinal_comprovante' && sinalComprovanteUrl) {
                const isImage = sinalComprovanteUrl.startsWith('data:image');
                const ext = isImage ? 'jpg' : 'pdf';
                doc = {
                  url: sinalComprovanteUrl,
                  fileName: `comprovante_sinal.${ext}`,
                  uploadedBy: 'Corretor',
                  uploadedAt: new Date().toISOString(),
                  mimeType: isImage ? 'image/jpeg' : 'application/pdf',
                };
              }
              if (!doc && type === 'proposta' && proposalDocumentUrl) {
                // Remover query string (?t=...) do nome do arquivo
                const rawFileName = proposalDocumentUrl.split('/').pop() || 'proposta';
                const fileName = rawFileName.split('?')[0];
                doc = {
                  url: proposalDocumentUrl,
                  fileName,
                  uploadedBy: 'Corretor',
                  uploadedAt: new Date().toISOString(),
                  mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                };
              }
              
              return (
                <div key={type} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{label}</h3>
                    {canUpload && !doc && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect(type, e)}
                          disabled={uploading === type}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={uploading === type}
                          asChild
                        >
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading === type ? "Enviando..." : "Anexar"}
                          </span>
                        </Button>
                      </label>
                    )}
                  </div>

                  {doc ? (
                    <div className="bg-background rounded p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{doc.fileName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Enviado em {new Date(doc.uploadedAt).toLocaleString("pt-BR")}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingPreview}
                          onClick={() => handlePreview(doc.url, doc.fileName)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {loadingPreview ? "Carregando..." : "Visualizar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(doc.url, doc.fileName)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Nenhum documento anexado</div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview removido: a visualização agora abre em nova aba para garantir compatibilidade */}
    </>
  );
}
