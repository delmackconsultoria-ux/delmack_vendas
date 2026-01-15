import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, XCircle, Eye, ExternalLink, TrendingUp, DollarSign, Clock } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  sale: { label: "Venda", color: "text-blue-600", bgColor: "bg-blue-100" },
  manager_review: { label: "Em análise (Gerente)", color: "text-purple-600", bgColor: "bg-purple-100" },
  finance_review: { label: "Em análise (Financeiro)", color: "text-indigo-600", bgColor: "bg-indigo-100" },
  commission_paid: { label: "Comissão Paga", color: "text-green-600", bgColor: "bg-green-100" },
  cancelled: { label: "Cancelada", color: "text-red-600", bgColor: "bg-red-100" },
};

export default function SalesApproval() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [observation, setObservation] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  const { data: salesData, isLoading, refetch } = trpc.sales.listMySales.useQuery();
  const updateStatusMutation = trpc.sales.updateSaleStatus.useMutation({
    onSuccess: () => {
      toast.success(actionType === "approve" ? "Venda aprovada!" : "Venda cancelada!");
      refetch();
      setDialogOpen(false);
      setSelectedSale(null);
      setObservation("");
    },
    onError: (err) => toast.error(err.message),
  });

  // Filtrar vendas por role
  const pendingSales = salesData?.sales?.filter((s: any) => {
    if (user?.role === "manager") return s.status === "sale" || s.status === "manager_review";
    if (user?.role === "finance") return s.status === "finance_review";
    return false;
  }) || [];

  // Calcular KPIs
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const approvedThisMonth = salesData?.sales?.filter((s: any) => {
    const saleDate = new Date(s.createdAt);
    return saleDate.getMonth() === currentMonth && 
           saleDate.getFullYear() === currentYear &&
           (s.status === "finance_review" || s.status === "commission_paid");
  }) || [];

  const approvedCount = approvedThisMonth.length;
  const approvedVGV = approvedThisMonth.reduce((sum: number, s: any) => sum + (parseFloat(s.saleValue) || 0), 0);
  const approvedCommission = approvedThisMonth.reduce((sum: number, s: any) => sum + (parseFloat(s.commissionValue) || 0), 0);

  const pendingVGV = pendingSales.reduce((sum: number, s: any) => sum + (parseFloat(s.saleValue) || 0), 0);
  const pendingCommission = pendingSales.reduce((sum: number, s: any) => sum + (parseFloat(s.commissionValue) || 0), 0);

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "R$ 0,00";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleAction = (sale: any, type: "approve" | "reject") => {
    setSelectedSale(sale);
    setActionType(type);
    setDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedSale) return;
    let newStatus: string;
    if (actionType === "reject") {
      newStatus = "cancelled";
    } else if (user?.role === "manager") {
      newStatus = selectedSale.status === "sale" ? "manager_review" : "finance_review";
    } else {
      newStatus = "commission_paid";
    }
    updateStatusMutation.mutate({ saleId: selectedSale.id, status: newStatus as any, observation });
  };

  if (user?.role !== "finance" && user?.role !== "manager") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <p>Acesso restrito a financeiro e gerente</p>
            </div>
            <Button onClick={() => setLocation("/")} className="w-full">Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Aprovação de Vendas</h1>
        <p className="text-slate-500 mb-6">
          {user?.role === "manager" ? "Aprovar vendas para enviar ao financeiro" : "Aprovar pagamento de comissões"}
        </p>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Aprovadas no Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-slate-900">{approvedCount}</p>
                <p className="text-sm text-slate-600">VGV: {formatCurrency(approvedVGV)}</p>
                <p className="text-sm text-slate-600">Comissões: {formatCurrency(approvedCommission)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                Pendentes de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-slate-900">{pendingSales.length}</p>
                <p className="text-sm text-slate-600">VGV Potencial: {formatCurrency(pendingVGV)}</p>
                <p className="text-sm text-slate-600">Comissões Potenciais: {formatCurrency(pendingCommission)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Total Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-slate-900">{approvedCount + pendingSales.length}</p>
                <p className="text-sm text-slate-600">VGV: {formatCurrency(approvedVGV + pendingVGV)}</p>
                <p className="text-sm text-slate-600">Comissões: {formatCurrency(approvedCommission + pendingCommission)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : pendingSales.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              Nenhuma venda pendente de aprovação
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingSales.map((sale: any) => (
              <Card key={sale.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{sale.buyerName || "Sem comprador"}</h3>
                        <Badge className={`${STATUS_CONFIG[sale.status]?.bgColor} ${STATUS_CONFIG[sale.status]?.color} border-0`}>
                          {STATUS_CONFIG[sale.status]?.label}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(sale.saleValue)}</p>
                      <p className="text-sm text-slate-500">Tipo: {sale.businessType || "-"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sale.proposalDocumentUrl && (
                        <Button variant="outline" size="sm" onClick={() => window.open(sale.proposalDocumentUrl, "_blank")}>
                          <ExternalLink className="h-4 w-4 mr-1" /> Anexo
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setLocation(`/proposals/${sale.id}`)}>
                        <Eye className="h-4 w-4 mr-1" /> Ver
                      </Button>
                      <Button variant="default" size="sm" onClick={() => handleAction(sale, "approve")}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleAction(sale, "reject")}>
                        <XCircle className="h-4 w-4 mr-1" /> Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "approve" ? "Aprovar Venda" : "Cancelar Venda"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              {actionType === "approve" 
                ? (user?.role === "manager" 
                    ? (selectedSale?.status === "sale" ? "Enviar para análise do gerente?" : "Enviar para o financeiro?")
                    : "Confirmar pagamento da comissão?")
                : "Tem certeza que deseja cancelar esta venda?"}
            </p>
            <Textarea
              placeholder="Observação (opcional)"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button 
              variant={actionType === "approve" ? "default" : "destructive"} 
              onClick={confirmAction}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
