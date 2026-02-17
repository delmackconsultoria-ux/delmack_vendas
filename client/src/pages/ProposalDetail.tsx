import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, User, Home, DollarSign, Calendar, Edit, Download, Paperclip, History, ExternalLink, Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DocumentsModal } from "@/components/DocumentsModal";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Rascunho", color: "text-slate-600", bgColor: "bg-slate-100" },
  pending: { label: "Pendente", color: "text-amber-600", bgColor: "bg-amber-100" },
  sale: { label: "Venda", color: "text-blue-600", bgColor: "bg-blue-100" },
  manager_review: { label: "Em análise (Gerente)", color: "text-purple-600", bgColor: "bg-purple-100" },
  finance_review: { label: "Em análise (Financeiro)", color: "text-indigo-600", bgColor: "bg-indigo-100" },
  commission_paid: { label: "Comissão Paga", color: "text-green-600", bgColor: "bg-green-100" },
  cancelled: { label: "Cancelada", color: "text-red-600", bgColor: "bg-red-100" },
};

export default function ProposalDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { data: sale, isLoading, refetch } = trpc.sales.getSaleById.useQuery({ saleId: params.id || "" }, { enabled: !!params.id });
  const { data: history, refetch: refetchHistory } = trpc.sales.getSaleHistory.useQuery({ saleId: params.id || "" }, { enabled: !!params.id });
  const { data: docUrl } = trpc.sales.getProposalDocument.useQuery({ saleId: params.id || "" }, { enabled: !!params.id });
  
  const [editingPaymentDate, setEditingPaymentDate] = useState(false);
  const [newPaymentDate, setNewPaymentDate] = useState("");
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  
  const uploadDocumentMutation = trpc.sales.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar documento");
    },
  });
  
  const handleUploadDocument = async (documentType: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result?.toString().split(",")[1];
      if (!base64) {
        toast.error("Erro ao ler arquivo");
        return;
      }
      
      await uploadDocumentMutation.mutateAsync({
        saleId: params.id || "",
        documentType: documentType as "sinal_comprovante" | "nota_fiscal" | "proposta" | "outro",
        fileName: file.name,
        fileData: base64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };
  
  const updatePaymentDateMutation = trpc.sales.updateExpectedPaymentDate.useMutation({
    onSuccess: () => {
      toast.success("Previsão de recebimento atualizada");
      setEditingPaymentDate(false);
      refetch();
      refetchHistory();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar previsão de recebimento");
    },
  });

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Carregando...</div>;
  if (!sale) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Venda não encontrada</div>;

  const formatCurrency = (value: string | number | null | undefined) => {
    if (!value) return "R$ 0,00";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("pt-BR");
  };

  const canEdit = (user?.role === "broker" && sale.status === "draft") || user?.role === "manager";

  const handleExportPDF = () => {
    const content = `
PROPOSTA DE VENDA - ${sale.property?.propertyReference || "S/R"}
===============================================

STATUS: ${STATUS_CONFIG[sale.status]?.label || sale.status}
DATA: ${formatDate(sale.createdAt)}

IMÓVEL
------
Endereço: ${sale.property?.address || "-"}, ${sale.property?.number || "S/N"}
Bairro: ${sale.property?.neighborhood || "-"}
Cidade/Estado: ${sale.property?.city || "-"}/${sale.property?.state || "-"}
CEP: ${sale.property?.zipCode || "-"}
Condomínio: ${sale.condominiumName || "-"}

COMPRADOR
---------
Nome: ${sale.buyerName || "-"}
CPF/CNPJ: ${sale.buyerCpfCnpj || "-"}
Telefone: ${sale.buyerPhone || "-"}
Origem: ${sale.clientOrigin || "-"}

VENDEDOR
--------
Nome: ${sale.sellerName || "-"}
CPF/CNPJ: ${sale.sellerCpfCnpj || "-"}
Telefone: ${sale.sellerPhone || "-"}

VALORES
-------
Valor da Venda: ${formatCurrency(sale.saleValue)}
Valor Divulgação: ${formatCurrency(sale.advertisementValue)}
Forma Pagamento: ${sale.paymentMethod || "-"}
Comissão Total: ${formatCurrency(sale.totalCommission)} (${sale.totalCommissionPercent || 0}%)
Comissão Angariador: ${formatCurrency(sale.angariadorCommission)}
Comissão Vendedor: ${formatCurrency(sale.vendedorCommission)}

DATAS
-----
Data da Venda: ${formatDate(sale.saleDate)}
Data Angariação: ${formatDate(sale.angariationDate)}
Previsão Recebimento: ${formatDate(sale.expectedPaymentDate)}

OBSERVAÇÕES
-----------
${sale.observation || "Nenhuma observação"}
    `.trim();

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `venda-${sale.property?.propertyReference || params.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Proposta exportada com sucesso!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 pt-24">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => setLocation("/proposals")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" onClick={() => setLocation(`/proposals/edit/${params.id}`)}>
                <Edit className="h-4 w-4 mr-2" /> Editar
              </Button>
            )}
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" /> Exportar
            </Button>
            <Button variant="outline" onClick={() => setDocumentsModalOpen(true)}>
              <Paperclip className="h-4 w-4 mr-2" /> Documentos
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Detalhes da Proposta</h1>
          <Badge className={`${STATUS_CONFIG[sale.status]?.bgColor} ${STATUS_CONFIG[sale.status]?.color} border-0`}>
            {STATUS_CONFIG[sale.status]?.label || sale.status}
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Anexo */}
          {(sale.proposalDocumentUrl || docUrl?.url) && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader><CardTitle className="flex items-center gap-2"><Paperclip className="h-5 w-5" /> Anexo da Proposta</CardTitle></CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => window.open(docUrl?.url || sale.proposalDocumentUrl || "", "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Visualizar Anexo
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Imóvel */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Imóvel</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div><p className="text-sm text-slate-500">Endereço</p><p className="font-medium">{sale.property?.address || "-"}, {sale.property?.number || "S/N"}</p></div>
              <div><p className="text-sm text-slate-500">Bairro</p><p className="font-medium">{sale.property?.neighborhood || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Cidade/Estado</p><p className="font-medium">{sale.property?.city || "-"}/{sale.property?.state || "-"}</p></div>
              <div><p className="text-sm text-slate-500">CEP</p><p className="font-medium">{sale.property?.zipCode || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Referência</p><p className="font-medium">{sale.property?.propertyReference || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Condomínio</p><p className="font-medium">{sale.condominiumName || "-"}</p></div>
            </CardContent>
          </Card>

          {/* Comprador */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Comprador</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div><p className="text-sm text-slate-500">Nome</p><p className="font-medium">{sale.buyerName || "-"}</p></div>
              <div><p className="text-sm text-slate-500">CPF/CNPJ</p><p className="font-medium">{sale.buyerCpfCnpj || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Telefone</p><p className="font-medium">{sale.buyerPhone || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Origem</p><p className="font-medium">{sale.clientOrigin || "-"}</p></div>
            </CardContent>
          </Card>

          {/* Vendedor */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Vendedor</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div><p className="text-sm text-slate-500">Nome</p><p className="font-medium">{sale.sellerName || "-"}</p></div>
              <div><p className="text-sm text-slate-500">CPF/CNPJ</p><p className="font-medium">{sale.sellerCpfCnpj || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Telefone</p><p className="font-medium">{sale.sellerPhone || "-"}</p></div>
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Valores e Comissões</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div><p className="text-sm text-slate-500">Valor da Venda</p><p className="font-bold text-lg text-green-600">{formatCurrency(sale.saleValue)}</p></div>
              <div><p className="text-sm text-slate-500">Valor Divulgação</p><p className="font-medium">{formatCurrency(sale.advertisementValue)}</p></div>
              <div><p className="text-sm text-slate-500">Forma Pagamento</p><p className="font-medium">{sale.paymentMethod || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Comissão Total</p><p className="font-medium">{formatCurrency(sale.totalCommission)} ({sale.totalCommissionPercent || 0}%)</p></div>
              <div><p className="text-sm text-slate-500">Comissão Angariador</p><p className="font-medium">{formatCurrency(sale.angariadorCommission)}</p></div>
              <div><p className="text-sm text-slate-500">Comissão Vendedor</p><p className="font-medium">{formatCurrency(sale.vendedorCommission)}</p></div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Datas</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div><p className="text-sm text-slate-500">Data da Venda</p><p className="font-medium">{formatDate(sale.saleDate)}</p></div>
              <div><p className="text-sm text-slate-500">Data Angariação</p><p className="font-medium">{formatDate(sale.angariationDate)}</p></div>
              <div>
                <p className="text-sm text-slate-500">Previsão Recebimento</p>
                {editingPaymentDate ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="date"
                      value={newPaymentDate}
                      onChange={(e) => setNewPaymentDate(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        if (!newPaymentDate) {
                          toast.error("Selecione uma data");
                          return;
                        }
                        const isoDate = new Date(newPaymentDate + 'T12:00:00').toISOString();
                        updatePaymentDateMutation.mutate({
                          saleId: sale.id,
                          expectedPaymentDate: isoDate,
                        });
                      }}
                      disabled={updatePaymentDateMutation.isPending}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setEditingPaymentDate(false);
                        setNewPaymentDate("");
                      }}
                    >
                      <X className="h-4 w-4 text-slate-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{formatDate(sale.expectedPaymentDate)}</p>
                    {['broker', 'manager', 'finance'].includes(user?.role || '') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          const currentDate = sale.expectedPaymentDate 
                            ? new Date(sale.expectedPaymentDate).toISOString().split('T')[0]
                            : new Date().toISOString().split('T')[0];
                          setNewPaymentDate(currentDate);
                          setEditingPaymentDate(true);
                        }}
                      >
                        <Edit className="h-3 w-3 text-slate-500" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div><p className="text-sm text-slate-500">Criado em</p><p className="font-medium">{formatDate(sale.createdAt)}</p></div>
            </CardContent>
          </Card>

          {/* Observações */}
          {sale.observation && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Observações</CardTitle></CardHeader>
              <CardContent><p className="text-slate-700 whitespace-pre-wrap">{sale.observation}</p></CardContent>
            </Card>
          )}

          {/* Histórico */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Histórico de Alterações</CardTitle></CardHeader>
            <CardContent>
              {!history || history.length === 0 ? (
                <p className="text-slate-500">Nenhuma alteração registrada</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.action}</p>
                        <p className="text-xs text-slate-500">{item.userName} - {formatDateTime(item.createdAt)}</p>
                        {item.details && <p className="text-sm text-slate-600 mt-1">{item.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Modal de Documentos */}
      <DocumentsModal
        open={documentsModalOpen}
        onClose={() => setDocumentsModalOpen(false)}
        documents={sale.documents ? JSON.parse(sale.documents) : null}
        saleId={sale.id}
        canUpload={['manager', 'finance'].includes(user?.role || '')}
        onUpload={handleUploadDocument}
      />
    </div>
  );
}
