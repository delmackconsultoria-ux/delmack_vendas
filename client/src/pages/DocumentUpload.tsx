import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Upload, FileCheck, Trash2 } from "lucide-react";
import { useState } from "react";

interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  url: string;
}

export default function DocumentUpload() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      for (const file of Array.from(files)) {
        // Validar tipo de arquivo
        const allowedTypes = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedTypes.includes(file.type)) {
          setError("Tipo de arquivo não permitido. Use PDF, JPG, PNG ou DOC");
          continue;
        }

        // Validar tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError("Arquivo muito grande. Máximo 10MB");
          continue;
        }

        // TODO: Fazer upload para S3 usando storagePut
        // const formData = new FormData();
        // formData.append("file", file);
        // const response = await fetch("/api/upload", {
        //   method: "POST",
        //   body: formData,
        // });
        // const { url } = await response.json();

        // Por enquanto, simular upload
        const mockDoc: UploadedDocument = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          uploadedAt: new Date(),
          url: URL.createObjectURL(file),
        };

        setDocuments([...documents, mockDoc]);
        setSuccess(`Arquivo ${file.name} enviado com sucesso`);
      }
    } catch (err) {
      setError("Erro ao fazer upload do arquivo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Upload de Documentos</h1>
            <p className="text-sm text-slate-600">
              Envie propostas e documentos assinados
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-600">
                <FileCheck className="h-5 w-5" />
                <p>{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Enviar Documentos</CardTitle>
            <CardDescription>
              Formatos aceitos: PDF, JPG, PNG, DOC (máximo 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Área de upload */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-900 font-semibold mb-2">
                Clique para selecionar ou arraste arquivos
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Máximo 10MB por arquivo
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label htmlFor="file-upload">
                <Button
                  asChild
                  disabled={uploading}
                  className="gap-2"
                >
                  <span>
                    <Upload className="h-4 w-4" />
                    {uploading ? "Enviando..." : "Selecionar Arquivos"}
                  </span>
                </Button>
              </label>
            </div>

            {/* Lista de documentos */}
            {documents.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">
                  Documentos Enviados ({documents.length})
                </h3>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {doc.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {formatFileSize(doc.size)} • Enviado em{" "}
                          {doc.uploadedAt.toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, "_blank")}
                          className="gap-2"
                        >
                          <FileCheck className="h-4 w-4" />
                          Visualizar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {documents.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>Nenhum documento enviado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

