import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Calendar as CalendarIcon, DollarSign, FileText, Loader, Upload, List, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

interface PendingCommission {
  saleId: string;
  propertyAddress: string;
  propertyReference?: string;
  buyerName: string;
  saleValue: number;
  commissionAmount: number;
  expectedPaymentDate: string | null;
  brokerName: string;
  saleDate: string;
}

export default function CommissionsCalendar() {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
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
  
  // Estados dos filtros
  const [filterBroker, setFilterBroker] = useState<string>("all");
  const [filterMinValue, setFilterMinValue] = useState<string>("");
  const [filterMaxValue, setFilterMaxValue] = useState<string>("");

  // Buscar vendas com comissões pendentes
  const { data: pendingCommissions, isLoading, refetch } = trpc.sales.listMySales.useQuery();

  // Filtrar apenas vendas com comissão pendente (não paga)
  const allPending = (pendingCommissions?.sales || []).filter(
    (sale: any) => !sale.commissionPaymentDate
  ).map((sale: any) => ({
    saleId: sale.id,
    propertyAddress: sale.propertyAddress,
    propertyReference: sale.propertyReference,
    buyerName: sale.buyerName,
    saleValue: parseFloat(sale.saleValue || "0"),
    commissionAmount: parseFloat(sale.totalCommission || "0"),
    expectedPaymentDate: sale.expectedPaymentDate,
    brokerName: sale.brokerVendedorName || "N/A",
    saleDate: sale.saleDate,
  }));
  
  // Aplicar filtros
  const pending = allPending.filter((c: PendingCommission) => {
    const matchesBroker = filterBroker === "all" || c.brokerName === filterBroker;
    const matchesMinValue = !filterMinValue || c.commissionAmount >= parseFloat(filterMinValue);
    const matchesMaxValue = !filterMaxValue || c.commissionAmount <= parseFloat(filterMaxValue);
    return matchesBroker && matchesMinValue && matchesMaxValue;
  });
  
  // Lista de corretores únicos
  const brokers = Array.from(new Set(allPending.map((c: PendingCommission) => c.brokerName))).sort();

  // Agrupar por mês (para visualização em lista)
  const groupedByMonth = pending.reduce((acc: any, commission: PendingCommission) => {
    const date = commission.expectedPaymentDate || commission.saleDate;
    const monthKey = date ? new Date(date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' }) : 'Sem data';
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(commission);
    return acc;
  }, {});

  // Gerar dias do calendário
  const generateCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Dias vazios antes do início do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  // Obter comissões de um dia específico
  const getCommissionsForDay = (day: number) => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    return pending.filter((c: PendingCommission) => {
      const date = c.expectedPaymentDate || c.saleDate;
      if (!date) return false;
      const commissionDate = new Date(date);
      return (
        commissionDate.getDate() === day &&
        commissionDate.getMonth() === month &&
        commissionDate.getFullYear() === year
      );
    });
  };

  const changeMonth = (direction: number) => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

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

    try {
      // TODO: Upload do arquivo de NF para S3
      // const uploadedUrl = await uploadToS3(invoiceFile);

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

  const calendarDays = generateCalendarDays();
  const monthName = selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="container mx-auto px-4 pt-24">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              Calendário de Comissões
            </h1>
            <p className="text-slate-600 mt-1">Gerencie pagamentos de comissões pendentes</p>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")} className="w-auto">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Calendário
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="filterBroker">Corretor</Label>
                <Select value={filterBroker} onValueChange={setFilterBroker}>
                  <SelectTrigger id="filterBroker">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Corretores</SelectItem>
                    {brokers.map((broker) => (
                      <SelectItem key={broker} value={broker}>
                        {broker}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filterMinValue">Valor Mínimo</Label>
                <Input
                  id="filterMinValue"
                  type="number"
                  placeholder="R$ 0,00"
                  value={filterMinValue}
                  onChange={(e) => setFilterMinValue(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filterMaxValue">Valor Máximo</Label>
                <Input
                  id="filterMaxValue"
                  type="number"
                  placeholder="R$ 999.999,99"
                  value={filterMaxValue}
                  onChange={(e) => setFilterMaxValue(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterBroker("all");
                    setFilterMinValue("");
                    setFilterMaxValue("");
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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

          <Link href="/paid-commissions">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Este Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {getCommissionsForDay.length || 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">pagamentos previstos</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Visualização Lista */}
        {viewMode === "list" && (
          <div className="space-y-6">
            {Object.keys(groupedByMonth).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  Nenhuma comissão pendente
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedByMonth).map(([month, commissions]: [string, any]) => (
                <Card key={month}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize">{month}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {commissions.map((commission: PendingCommission) => (
                        <div
                          key={commission.saleId}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-900">
                                Comprador: {commission.buyerName}
                              </span>
                              {commission.propertyReference && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  Ref: {commission.propertyReference}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-600">
                              Corretor: {commission.brokerName}
                            </div>
                            <div className="text-sm text-slate-500">
                              Venda: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.saleValue)} • 
                              Comissão: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.commissionAmount)}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleOpenModal(commission)}
                            className="bg-blue-600 hover:bg-blue-700"
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
        )}

        {/* Visualização Calendário */}
        {viewMode === "calendar" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-xl capitalize">{monthName}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {/* Cabeçalho dos dias da semana */}
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-center font-semibold text-sm text-slate-600 py-2">
                    {day}
                  </div>
                ))}
                
                {/* Dias do mês */}
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }
                  
                  const dayCommissions = getCommissionsForDay(day);
                  const hasCommissions = dayCommissions.length > 0;
                  
                  return (
                    <div
                      key={day}
                      className={`
                        aspect-square border rounded-lg p-2 
                        ${hasCommissions ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}
                        hover:border-blue-400 transition-colors cursor-pointer
                      `}
                    >
                      <div className="text-sm font-medium text-slate-900 mb-1">{day}</div>
                      {hasCommissions && (
                        <div className="space-y-1">
                          {dayCommissions.slice(0, 2).map((c, i) => (
                            <div
                              key={i}
                              onClick={() => handleOpenModal(c)}
                              className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded truncate hover:bg-blue-700"
                            >
                              {c.buyerName}
                            </div>
                          ))}
                          {dayCommissions.length > 2 && (
                            <div className="text-xs text-blue-600 font-medium">
                              +{dayCommissions.length - 2} mais
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modal de Registro de Pagamento */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento de Comissão</DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-4">
              {/* Informações da Venda */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Comprador:</span>
                  <span>{selectedSale.buyerName}</span>
                  {selectedSale.propertyReference && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-auto">
                      Ref: {selectedSale.propertyReference}
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Corretor:</span> {selectedSale.brokerName}
                </div>
                <div>
                  <span className="font-semibold">Valor da Venda:</span>{" "}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedSale.saleValue)}
                </div>
                <div>
                  <span className="font-semibold">Comissão:</span>{" "}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedSale.commissionAmount)}
                </div>
              </div>

              {/* Formulário de Pagamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentDate">Data do Pagamento *</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="amountReceived">Valor Recebido *</Label>
                  <Input
                    id="amountReceived"
                    type="number"
                    step="0.01"
                    value={paymentData.amountReceived}
                    onChange={(e) => setPaymentData({ ...paymentData, amountReceived: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Banco</Label>
                  <Input
                    id="bankName"
                    placeholder="Nome do banco"
                    value={paymentData.bankName}
                    onChange={(e) => setPaymentData({ ...paymentData, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                  <Select value={paymentData.paymentMethod} onValueChange={(v) => setPaymentData({ ...paymentData, paymentMethod: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="ted">TED</SelectItem>
                      <SelectItem value="doc">DOC</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Observações sobre o pagamento"
                  value={paymentData.observations}
                  onChange={(e) => setPaymentData({ ...paymentData, observations: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Upload de Nota Fiscal */}
              <div>
                <Label htmlFor="invoice" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Anexo de Nota Fiscal * (Obrigatório)
                </Label>
                <div className="mt-2 flex items-center gap-3">
                  <Input
                    id="invoice"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  {invoiceFile && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <FileText className="h-4 w-4" />
                      {invoiceFile.name}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos aceitos: PDF, JPG, PNG
                </p>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitPayment}
                  disabled={registerPaymentMutation.isPending || !invoiceFile}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {registerPaymentMutation.isPending ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Registrando...
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
