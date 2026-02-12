import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Calendar, DollarSign, FileText, Loader, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PendingCommission {
  saleId: string;
  propertyAddress: string;
  buyerName: string;
  saleValue: number;
  commissionAmount: number;
  expectedPaymentDate: string | null;
  brokerName: string;
  saleDate: string;
}

export default function CommissionsCalendar() {
  const [selectedSale, setSelectedSale] = useState<PendingCommission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amountReceived: "",
    bankName: "",
    paymentMethod: "pix",
    observations: "",
  });

  // Buscar vendas com comissões pendentes
  const { data: pendingCommissions, isLoading, refetch } = trpc.sales.listMySales.useQuery();

  // Filtrar apenas vendas com comissão pendente (não paga)
  const pending = (pendingCommissions?.sales || []).filter(
    (sale: any) => !sale.commissionPaymentDate
  ).map((sale: any) => ({
    saleId: sale.id,
    propertyAddress: sale.propertyAddress,
    buyerName: sale.buyerName,
    saleValue: sale.salePrice,
    commissionAmount: sale.commissionAmount || 0,
    expectedPaymentDate: sale.expectedPaymentDate,
    brokerName: sale.brokerVendedorName || "N/A",
    saleDate: sale.saleDate,
  }));

  // Agrupar por mês
  const groupedByMonth = pending.reduce((acc: any, commission: PendingCommission) => {
    const date = commission.expectedPaymentDate || commission.saleDate;
    const monthKey = date ? new Date(date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' }) : 'Sem data';
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(commission);
    return acc;
  }, {});

  // Mutation para registrar pagamento
  const registerPaymentMutation = trpc.sales.registerCommissionPayment.useMutation({
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso!");
      setIsModalOpen(false);
      setSelectedSale(null);
      setInvoiceFile(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });

  const handleOpenModal = (commission: PendingCommission) => {
    setSelectedSale(commission);
    setPaymentData({
      paymentDate: new Date().toISOString().split('T')[0],
      amountReceived: commission.commissionAmount.toString(),
      bankName: "",
      paymentMethod: "pix",
      observations: "",
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setInvoiceFile(e.target.files[0]);
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedSale) return;

    // Validar anexo de NF obrigatório
    if (!invoiceFile) {
      toast.error("Anexo de Nota Fiscal é obrigatório!");
      return;
    }

    // Validar campos obrigatórios
    if (!paymentData.paymentDate || !paymentData.amountReceived || !paymentData.bankName) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    try {
      // Converter arquivo para base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(invoiceFile);
      });

      await registerPaymentMutation.mutateAsync({
        saleId: selectedSale.saleId,
        commissionPaymentDate: new Date(paymentData.paymentDate).toISOString(),
        commissionAmountReceived: parseFloat(paymentData.amountReceived),
        commissionPaymentBank: paymentData.bankName,
        commissionPaymentMethod: paymentData.paymentMethod,
        commissionPaymentObservations: paymentData.observations,
      });
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            Calendário de Comissões
          </h1>
          <p className="text-slate-600 mt-2">
            Gerencie pagamentos de comissões pendentes
          </p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Pendente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {pending.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">vendas aguardando pagamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  pending.reduce((sum: number, c: PendingCommission) => sum + c.commissionAmount, 0)
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">em comissões pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Este Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {pending.filter((c: PendingCommission) => {
                  const date = c.expectedPaymentDate || c.saleDate;
                  if (!date) return false;
                  const commissionDate = new Date(date);
                  const now = new Date();
                  return commissionDate.getMonth() === now.getMonth() && 
                         commissionDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-slate-500 mt-1">pagamentos previstos</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista agrupada por mês */}
        {Object.keys(groupedByMonth).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhuma comissão pendente</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedByMonth).map(([month, commissions]: [string, any]) => (
            <Card key={month} className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg capitalize">{month}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {commissions.map((commission: PendingCommission) => (
                    <div
                      key={commission.saleId}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">{commission.propertyAddress}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                          <span>Comprador: {commission.buyerName}</span>
                          <span>•</span>
                          <span>Corretor: {commission.brokerName}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          <span>Venda: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.saleValue)}</span>
                          <span>•</span>
                          <span className="font-medium text-green-600">
                            Comissão: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.commissionAmount)}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOpenModal(commission)}
                        className="ml-4"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Registrar Pagamento
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Registro de Pagamento */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento de Comissão</DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              {/* Informações da Venda */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Imóvel</p>
                <p className="font-medium">{selectedSale.propertyAddress}</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-slate-600">Comprador</p>
                    <p className="font-medium">{selectedSale.buyerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Corretor</p>
                    <p className="font-medium">{selectedSale.brokerName}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-slate-600">Valor da Comissão</p>
                  <p className="text-lg font-bold text-green-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedSale.commissionAmount)}
                  </p>
                </div>
              </div>

              {/* Formulário de Pagamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Pagamento *</Label>
                  <Input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Valor Recebido *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentData.amountReceived}
                    onChange={(e) => setPaymentData({ ...paymentData, amountReceived: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Banco Pagador *</Label>
                  <Input
                    value={paymentData.bankName}
                    onChange={(e) => setPaymentData({ ...paymentData, bankName: e.target.value })}
                    placeholder="Ex: Banco do Brasil"
                  />
                </div>
                <div>
                  <Label>Forma de Pagamento *</Label>
                  <Select
                    value={paymentData.paymentMethod}
                    onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="ted">TED</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={paymentData.observations}
                  onChange={(e) => setPaymentData({ ...paymentData, observations: e.target.value })}
                  placeholder="Informações adicionais sobre o pagamento"
                  rows={3}
                />
              </div>

              {/* Anexo de Nota Fiscal (OBRIGATÓRIO) */}
              <div>
                <Label className="text-red-600 font-medium">Anexo de Nota Fiscal * (Obrigatório)</Label>
                <div className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  invoiceFile ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                }`}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="invoice-upload"
                  />
                  <label htmlFor="invoice-upload" className="cursor-pointer">
                    {invoiceFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-6 w-6 text-green-600" />
                        <span className="text-green-600 font-medium">{invoiceFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-slate-400" />
                        <span className="text-slate-600">Clique para anexar Nota Fiscal</span>
                        <span className="text-xs text-slate-500">PDF, JPG ou PNG (máx. 10MB)</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={registerPaymentMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitPayment}
                  disabled={registerPaymentMutation.isPending}
                >
                  {registerPaymentMutation.isPending ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Confirmar Pagamento
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
