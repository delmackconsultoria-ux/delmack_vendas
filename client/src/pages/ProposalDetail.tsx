import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, User, Home, DollarSign, Calendar, Edit, Download, Paperclip, History, ExternalLink, Check, X, Trash2, Ban } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DocumentsModal } from "@/components/DocumentsModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { validateFile, FILE_VALIDATION_CONFIG, formatFileSize } from "@/lib/fileValidationHelper";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Rascunho", color: "text-muted-foreground", bgColor: "bg-muted" },
  sale: { label: "Venda", color: "text-blue-600", bgColor: "bg-blue-100" },
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [editForm, setEditForm] = useState({
    buyerName: "",
    buyerCpfCnpj: "",
    buyerPhone: "",
    sellerName: "",
    sellerCpfCnpj: "",
    sellerPhone: "",
    saleValue: "",
    businessType: "",
    observations: "",
    changeReason: "",
  });
  
  const updateSaleMutation = trpc.sales.updateSale.useMutation({
    onSuccess: () => {
      toast.success("Venda atualizada com sucesso");
      setEditModalOpen(false);
      refetch();
      refetchHistory();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar venda");
    },
  });
  
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
    // Validar arquivo
    const validation = validateFile(file, FILE_VALIDATION_CONFIG.MODAL_DOCUMENTS);
    if (!validation.isValid) {
      toast.error("Arquivo inválido", {
        description: validation.error,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result?.toString().split(",")[1];
      if (!base64) {
        toast.error("Erro ao ler arquivo");
        return;
      }
      
      await uploadDocumentMutation.mutateAsync({
        saleId: params.id || "",
        documentType: documentType as "sinal_comprovante" | "contrato_escritura" | "nota_fiscal" | "proposta" | "outro",
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
  
  const deleteSaleMutation = trpc.sales.deleteSale.useMutation({
    onSuccess: () => {
      toast.success("Rascunho deletado com sucesso");
      setDeleteDialogOpen(false);
      setLocation("/proposals");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar rascunho");
    },
  });
  
  const cancelSaleMutation = trpc.sales.cancelSale.useMutation({
    onSuccess: () => {
      toast.success("Venda cancelada com sucesso");
      setCancelDialogOpen(false);
      setCancelReason("");
      refetch();
      refetchHistory();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cancelar venda");
    },
  });

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Carregando...</div>;
  if (!sale) return <div className="min-h-screen bg-background flex items-center justify-center">Venda não encontrada</div>;

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
    return new Date(date).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  };

  // Validação de edição: Broker pode editar em rascunho e pendente, Gerente pode editar sempre, Financeiro não pode editar
  const canEdit = user?.role === "manager" || (user?.role === "broker" && ["draft", "pending"].includes(sale.status));
  
  // Se já foi pago, apenas gerente pode editar
  const isCommissionPaid = sale.status === "commission_paid";
  const canEditAfterPayment = user?.role === "manager" && isCommissionPaid;

  // Função removida - exportar não é mais suportado

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => setLocation("/proposals")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <div className="flex gap-2">
            {(canEdit || canEditAfterPayment) && (
              <Button 
                variant="outline" 
                disabled={isCommissionPaid && !canEditAfterPayment}
                onClick={() => {
                  if (isCommissionPaid && !canEditAfterPayment) {
                    toast.error("Esta venda já foi paga. Apenas gerentes podem editar.");
                    return;
                  }
                  // Ir para página de edição completa ao invés de abrir modal
                  setLocation(`/proposals/edit/${params.id}`);
                }}
                title={isCommissionPaid && !canEditAfterPayment ? "Esta venda já foi paga. Apenas gerentes podem editar." : ""}
              >
                <Edit className="h-4 w-4 mr-2" /> Editar
              </Button>
            )}

            <Button variant="outline" onClick={() => setDocumentsModalOpen(true)}>
              <Paperclip className="h-4 w-4 mr-2" /> Documentos
            </Button>
            {sale.status === "draft" && (
              <Button 
                variant="outline" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Deletar
              </Button>
            )}
            {sale.status !== "draft" && sale.status !== "cancelled" && (
              <Button 
                variant="outline" 
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                onClick={() => setCancelDialogOpen(true)}
              >
                <Ban className="h-4 w-4 mr-2" /> Cancelar
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Detalhes da Proposta</h1>
          <Badge className={`${STATUS_CONFIG[sale.status]?.bgColor} ${STATUS_CONFIG[sale.status]?.color} border-0`}>
            {STATUS_CONFIG[sale.status]?.label || sale.status}
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Imóvel */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Imóvel</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Endereço</p><p className="font-medium">{sale.property?.address || "-"}, {sale.property?.number || "S/N"}</p></div>
              <div><p className="text-sm text-muted-foreground">Bairro</p><p className="font-medium">{sale.property?.neighborhood || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">Cidade/Estado</p><p className="font-medium">{sale.property?.city || "-"}/{sale.property?.state || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">CEP</p><p className="font-medium">{sale.property?.zipCode || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">Referência</p><p className="font-medium">{sale.property?.propertyReference || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">Condomínio</p><p className="font-medium">{sale.condominiumName || "-"}</p></div>
            </CardContent>
          </Card>

          {/* Comprador */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Comprador</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Nome</p><p className="font-medium">{sale.buyerName || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">CPF/CNPJ</p><p className="font-medium">{sale.buyerCpfCnpj || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">Telefone</p><p className="font-medium">{sale.buyerPhone || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">Origem</p><p className="font-medium">{sale.clientOrigin || "-"}</p></div>
            </CardContent>
          </Card>

          {/* Vendedor */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Vendedor</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Nome</p><p className="font-medium">{sale.sellerName || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">CPF/CNPJ</p><p className="font-medium">{sale.sellerCpfCnpj || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">Telefone</p><p className="font-medium">{sale.sellerPhone || "-"}</p></div>
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Valores e Comissões</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div><p className="text-sm text-muted-foreground">Valor da Venda</p><p className="font-bold text-lg text-green-600">{formatCurrency(sale.saleValue)}</p></div>
              <div><p className="text-sm text-muted-foreground">Valor Divulgação</p><p className="font-medium">{formatCurrency(sale.advertisementValue)}</p></div>
              <div><p className="text-sm text-muted-foreground">Forma Pagamento</p><p className="font-medium">{sale.paymentMethod || "-"}</p></div>
              <div><p className="text-sm text-muted-foreground">Comissão Total</p><p className="font-medium">{formatCurrency(sale.comissaoTotal || sale.totalCommission)} ({sale.totalCommissionPercent || 0}%)</p></div>
              <div><p className="text-sm text-muted-foreground">Comissão Angariador</p><p className="font-medium">{formatCurrency(sale.comissaoAngariador || sale.angariadorCommission)}</p></div>
              <div><p className="text-sm text-muted-foreground">Comissão Vendedor</p><p className="font-medium">{formatCurrency(sale.comissaoVendedor || sale.vendedorCommission)}</p></div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Datas</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div><p className="text-sm text-muted-foreground">Data da Venda</p><p className="font-medium">{formatDate(sale.saleDate)}</p></div>
              <div><p className="text-sm text-muted-foreground">Data Angariação</p><p className="font-medium">{formatDate(sale.angariationDate)}</p></div>
              <div>
                <p className="text-sm text-muted-foreground">Previsão Recebimento</p>
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
                      <X className="h-4 w-4 text-muted-foreground" />
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
                        <Edit className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div><p className="text-sm text-muted-foreground">Criado em</p><p className="font-medium">{formatDate(sale.createdAt)}</p></div>
            </CardContent>
          </Card>

          {/* Observações e Histórico */}
          <Card id="observations">
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Observações e histórico de alterações</CardTitle></CardHeader>
            <CardContent>
              {/* Observações gerais salvas */}
              {sale?.observations && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg border-l-4 border-slate-400">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Observações gerais</p>
                  <p className="text-sm whitespace-pre-wrap">{sale.observations}</p>
                </div>
              )}
              {!history || history.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma alteração registrada</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item: any, idx: number) => {
                    const actionLabels: Record<string, string> = {
                      create: "Venda criada",
                      update: "Venda atualizada",
                      delete: "Venda excluída",
                      status_change: "Status alterado",
                      approval: "Venda aprovada",
                      rejection: "Venda rejeitada",
                    };
                    const actionLabel = actionLabels[item.action] || item.action;
                    const actionColors: Record<string, string> = {
                      create: "bg-green-50 border-l-4 border-green-500",
                      update: "bg-blue-50 border-l-4 border-blue-500",
                      delete: "bg-red-50 border-l-4 border-red-500",
                      status_change: "bg-purple-50 border-l-4 border-purple-500",
                      approval: "bg-emerald-50 border-l-4 border-emerald-500",
                      rejection: "bg-orange-50 border-l-4 border-orange-500",
                    };
                    const colorClass = actionColors[item.action] || "bg-background border-l-4 border-slate-500";
                    
                    return (
                      <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${colorClass}`}>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{actionLabel}</p>
                          <p className="text-xs text-muted-foreground">{item.userName || "Sistema"} - {formatDateTime(item.createdAt)}</p>
                          {item.details && <p className="text-sm text-muted-foreground mt-1">{item.details}</p>}
                        </div>
                      </div>
                    );
                  })}
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
        proposalDocumentUrl={docUrl?.url || sale.proposalDocumentUrl || null}
        sinalComprovanteUrl={sale.sinalNegocioComprovanteUrl || null}
      />
      
      {/* Modal de Edição */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Editar Venda</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Comprador */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Informações do Comprador</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nome do Comprador</label>
                  <Input
                    value={editForm.buyerName}
                    onChange={(e) => setEditForm({ ...editForm, buyerName: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">CPF/CNPJ do Comprador</label>
                  <Input
                    value={editForm.buyerCpfCnpj}
                    onChange={(e) => setEditForm({ ...editForm, buyerCpfCnpj: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Telefone do Comprador</label>
                  <Input
                    value={editForm.buyerPhone}
                    onChange={(e) => setEditForm({ ...editForm, buyerPhone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              
              {/* Vendedor */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Informações do Vendedor</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nome do Vendedor</label>
                  <Input
                    value={editForm.sellerName}
                    onChange={(e) => setEditForm({ ...editForm, sellerName: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">CPF/CNPJ do Vendedor</label>
                  <Input
                    value={editForm.sellerCpfCnpj}
                    onChange={(e) => setEditForm({ ...editForm, sellerCpfCnpj: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Telefone do Vendedor</label>
                  <Input
                    value={editForm.sellerPhone}
                    onChange={(e) => setEditForm({ ...editForm, sellerPhone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              
              {/* Valor e Tipo */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Informações da Venda</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Valor da Venda</label>
                  <Input
                    value={editForm.saleValue}
                    onChange={(e) => setEditForm({ ...editForm, saleValue: e.target.value })}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tipo de Negócio</label>
                  <Input
                    value={editForm.businessType}
                    onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value })}
                    placeholder="Tipo de negócio"
                  />
                </div>
              </div>
              
              {/* Comprovante/Arquivo */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Comprovante/Arquivo</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Validar arquivo
                    const validation = validateFile(file, FILE_VALIDATION_CONFIG.SINAL_COMPROVANTE);
                    if (!validation.isValid) {
                      toast.error("Arquivo inválido", {
                        description: validation.error,
                      });
                      e.target.value = ""; // Limpar input
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const base64 = event.target?.result as string;
                      setEditForm({ ...editForm, sinalNegocioComprovanteUrl: base64 });
                      toast.success("Comprovante carregado", {
                        description: `${file.name} (${formatFileSize(file.size)})`,
                      });
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {editForm.sinalNegocioComprovanteUrl && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ Arquivo carregado
                  </div>
                )}
              </div>
              
              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Observações</label>
                <textarea
                  value={editForm.observations}
                  onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Observações adicionais"
                />
              </div>
              
              {/* Motivo da Alteração */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Motivo da Alteração <span className="text-orange-500">*</span>
                </label>
                <textarea
                  value={editForm.changeReason}
                  onChange={(e) => setEditForm({ ...editForm, changeReason: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={2}
                  placeholder="Descreva o motivo desta alteração para auditoria"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este campo é obrigatório e será registrado no histórico de alterações.
                </p>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!editForm.changeReason.trim()) {
                    toast.error("Por favor, informe o motivo da alteração");
                    return;
                  }
                  updateSaleMutation.mutate({
                    saleId: sale.id,
                    ...editForm,
                  });
                }}
                disabled={updateSaleMutation.isPending}
              >
                {updateSaleMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Dialog para deletar rascunho */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Rascunho</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Tem certeza que deseja deletar este rascunho? Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteSaleMutation.mutate({ saleId: sale.id })}
              disabled={deleteSaleMutation.isPending}
            >
              {deleteSaleMutation.isPending ? "Deletando..." : "Deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para cancelar venda */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Venda</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja cancelar esta venda? Informe o motivo do cancelamento.
            </p>
            <Textarea 
              placeholder="Motivo do cancelamento..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Fechar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => cancelSaleMutation.mutate({ saleId: sale.id, reason: cancelReason })}
              disabled={cancelSaleMutation.isPending || !cancelReason.trim()}
            >
              {cancelSaleMutation.isPending ? "Cancelando..." : "Cancelar Venda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
