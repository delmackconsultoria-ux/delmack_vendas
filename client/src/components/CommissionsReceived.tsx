import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, Building2, CreditCard, Plus, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "ted", label: "TED" },
  { value: "boleto", label: "Boleto" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "outros", label: "Outros" },
];

export default function CommissionsReceived() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; saleId: string; saleBuyerName: string }>({ 
    open: false, 
    saleId: "", 
    saleBuyerName: "" 
  });
  const [paymentData, setPaymentData] = useState({
    commissionPaymentDate: "",
    commissionAmountReceived: "",
    commissionPaymentBank: "",
    commissionPaymentMethod: "",
    commissionPaymentObservations: "",
  });

  const { data: salesData, isLoading, refetch } = trpc.sales.listMySales.useQuery();

  const registerPaymentMutation = trpc.sales.registerCommissionPayment.useMutation({
    onSuccess: () => {
      toast.success("Pagamento de comissão registrado com sucesso!");
      refetch();
      setPaymentDialog({ open: false, saleId: "", saleBuyerName: "" });
      setPaymentData({
        commissionPaymentDate: "",
        commissionAmountReceived: "",
        commissionPaymentBank: "",
        commissionPaymentMethod: "",
        commissionPaymentObservations: "",
      });
    },
    onError: (error: any) => {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });

  // Filtrar vendas com comissão pendente ou já paga
  const commissionsData = useMemo(() => {
    if (!salesData?.sales) return [];
    return salesData.sales
      .filter((sale: any) => ["finance_review", "commission_paid"].includes(sale.status))
      .map((sale: any) => ({
        ...sale,
        hasPayment: !!sale.commissionPaymentDate,
      }));
  }, [salesData]);

  const filteredCommissions = useMemo(() => {
    return commissionsData.filter((sale: any) => {
      const matchesSearch = searchTerm === "" || 
        sale.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.propertyId?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "paid" && sale.hasPayment) ||
        (statusFilter === "pending" && !sale.hasPayment);
      return matchesSearch && matchesStatus;
    });
  }, [commissionsData, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const total = commissionsData.length;
    const paid = commissionsData.filter((s: any) => s.hasPayment).length;
    const pending = total - paid;
    const totalReceived = commissionsData
      .filter((s: any) => s.hasPayment && s.commissionAmountReceived)
      .reduce((acc: number, s: any) => acc + parseFloat(s.commissionAmountReceived || "0"), 0);
    const totalPending = commissionsData
      .filter((s: any) => !s.hasPayment && s.totalCommission)
      .reduce((acc: number, s: any) => acc + parseFloat(s.totalCommission || "0"), 0);
    
    return { total, paid, pending, totalReceived, totalPending };
  }, [commissionsData]);

  const formatCurrency = (value: number | string | null) => {
    if (!value) return "R$ 0,00";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const handleRegisterPayment = () => {
    if (!paymentDialog.saleId || !paymentData.commissionPaymentDate || !paymentData.commissionAmountReceived) {
      toast.error("Preencha os campos obrigatórios: Data e Valor Recebido");
      return;
    }

    registerPaymentMutation.mutate({
      saleId: paymentDialog.saleId,
      commissionPaymentDate: paymentData.commissionPaymentDate,
      commissionAmountReceived: parseFloat(paymentData.commissionAmountReceived),
      commissionPaymentBank: paymentData.commissionPaymentBank,
      commissionPaymentMethod: paymentData.commissionPaymentMethod,
      commissionPaymentObservations: paymentData.commissionPaymentObservations,
    });
  };

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.total}</p>
                <p className="text-xs text-slate-500">Total de Comissões</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{metrics.paid}</p>
                <p className="text-xs text-slate-500">Comissões Pagas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-600">{metrics.pending}</p>
                <p className="text-xs text-slate-500">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(metrics.totalReceived)}</p>
                <p className="text-xs text-slate-500">Total Recebido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por comprador ou referência..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pagas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Comissões */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões ({filteredCommissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Carregando...</div>
          ) : filteredCommissions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Nenhuma comissão encontrada</div>
          ) : (
            <div className="space-y-3">
              {filteredCommissions.map((sale: any) => (
                <div key={sale.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{sale.buyerName}</h3>
                        <Badge className={sale.hasPayment ? "bg-green-100 text-green-700 border-0" : "bg-amber-100 text-amber-700 border-0"}>
                          {sale.hasPayment ? "Paga" : "Pendente"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-600">
                        <div>
                          <span className="text-slate-400">Comissão:</span> {formatCurrency(sale.totalCommission)}
                        </div>
                        <div>
                          <span className="text-slate-400">Data Venda:</span> {formatDate(sale.saleDate)}
                        </div>
                        {sale.hasPayment && (
                          <>
                            <div>
                              <span className="text-slate-400">Valor Recebido:</span> {formatCurrency(sale.commissionAmountReceived)}
                            </div>
                            <div>
                              <span className="text-slate-400">Data Recebimento:</span> {formatDate(sale.commissionPaymentDate)}
                            </div>
                            <div>
                              <span className="text-slate-400">Banco:</span> {sale.commissionPaymentBank || "-"}
                            </div>
                            <div>
                              <span className="text-slate-400">Forma:</span> {sale.commissionPaymentMethod || "-"}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!sale.hasPayment && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => setPaymentDialog({ 
                            open: true, 
                            saleId: sale.id, 
                            saleBuyerName: sale.buyerName 
                          })}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Registrar Pagamento
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Registro de Pagamento */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog({ ...paymentDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Registrar Pagamento de Comissão
            </DialogTitle>
            <p className="text-sm text-slate-500">Venda: {paymentDialog.saleBuyerName}</p>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Data de Recebimento *</Label>
              <Input
                type="date"
                value={paymentData.commissionPaymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, commissionPaymentDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Valor Recebido *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentData.commissionAmountReceived}
                onChange={(e) => setPaymentData({ ...paymentData, commissionAmountReceived: e.target.value })}
              />
            </div>
            <div>
              <Label>Banco Pagador</Label>
              <Input
                placeholder="Nome do banco"
                value={paymentData.commissionPaymentBank}
                onChange={(e) => setPaymentData({ ...paymentData, commissionPaymentBank: e.target.value })}
              />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select 
                value={paymentData.commissionPaymentMethod} 
                onValueChange={(value) => setPaymentData({ ...paymentData, commissionPaymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações sobre o pagamento..."
                value={paymentData.commissionPaymentObservations}
                onChange={(e) => setPaymentData({ ...paymentData, commissionPaymentObservations: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPaymentDialog({ open: false, saleId: "", saleBuyerName: "" })}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleRegisterPayment} 
              disabled={registerPaymentMutation.isPending}
            >
              {registerPaymentMutation.isPending ? "Salvando..." : "Registrar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
