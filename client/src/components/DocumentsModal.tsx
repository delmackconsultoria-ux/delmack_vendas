import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Upload, X } from "lucide-react";
import { useState } from "react";

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
}

const DOCUMENT_TYPES: Record<string, string> = {
  sinal_comprovante: "Comprovante de Sinal de Negócio",
  nota_fiscal: "Nota Fiscal",
  proposta: "Proposta de Compra",
  outro: "Outro Documento",
};

export function DocumentsModal({ open, onClose, documents, saleId, canUpload = false, onUpload }: DocumentsModalProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (documentType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUpload) return;

    setUploading(documentType);
    try {
      await onUpload(documentType, file);
    } finally {
      setUploading(null);
    }
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
  };

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
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
              const doc = documents?.[type];
              
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
                    <div className="bg-slate-50 rounded p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium">{doc.fileName}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Enviado em {new Date(doc.uploadedAt).toLocaleString("pt-BR")}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(doc.url)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
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
                    <div className="text-sm text-slate-500">Nenhum documento anexado</div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview */}
      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Visualização do Documento</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreviewUrl(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="w-full h-[70vh]">
              {previewUrl.endsWith(".pdf") ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border rounded"
                  title="Preview do documento"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview do documento"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
