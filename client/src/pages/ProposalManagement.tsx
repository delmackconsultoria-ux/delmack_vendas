import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Search, Eye, Edit, FileText, Filter, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare } from "lucide-react";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Rascunho", color: "text-slate-600", bgColor: "bg-slate-100" },
  pending: { label: "Pendente", color: "text-amber-600", bgColor: "bg-amber-100" },
  sale: { label: "Venda", color: "text-blue-600", bgColor: "bg-blue-100" },
  manager_review: { label: "Em análise (Gerente)", color: "text-purple-600", bgColor: "bg-purple-100" },
  finance_review: { label: "Em análise (Financeiro)", color: "text-indigo-600", bgColor: "bg-indigo-100" },
  commission_paid: { label: "Comissão Paga", color: "text-green-600", bgColor: "bg-green-100" },
  cancelled: { label: "Cancelada", color: "text-red-600", bgColor: "bg-red-100" },
};

export default function ProposalManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [brokerFilter, setBrokerFilter] = useState<string>("all");
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; saleId: string; currentStatus: string }>({ open: false, saleId: "", currentStatus: "" });
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");

  const { data: salesData, isLoading, refetch } = trpc.sales.listMySales.useQuery();

  const { data: brokersData } = trpc.brokers.listBrokers.useQuery(undefined, {
    enabled: user?.role === "manager",
  });

  const updateStatusMutation = trpc.sales.updateSaleStatus.useMutation({
    onSuccess: () => {
      refetch();
      setStatusDialog({ open: false, saleId: "", currentStatus: "" });
      setNewStatus("");
      setStatusComment("");
    },
  });

  // Métricas
  const metrics = useMemo(() => {
    if (!salesData?.sales) return { total: 0, sales: 0, cancelled: 0, conversionRate: 0, avgDays: 0 };
    
    const total = salesData.sales.length;
    const salesCount = salesData.sales.filter((s: any) => ["sale", "manager_review", "finance_review", "commission_paid"].includes(s.status)).length;
    const cancelled = salesData.sales.filter((s: any) => s.status === "cancelled").length;
    const conversionRate = total > 0 ? (salesCount / total) * 100 : 0;
    
    // Calcular tempo médio de proposta para venda
    const completedSales = salesData.sales.filter((s: any) => s.status === "commission_paid" && s.saleDate && s.createdAt);
    let avgDays = 0;
    if (completedSales.length > 0) {
      const totalDays = completedSales.reduce((acc: number, sale: any) => {
        const created = new Date(sale.createdAt!);
        const saleDate = new Date(sale.saleDate!);
        return acc + Math.ceil((saleDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      avgDays = Math.round(totalDays / completedSales.length);
    }
    
    return { total, sales: salesCount, cancelled, conversionRate, avgDays };
  }, [salesData]);

  const filteredSales = useMemo(() => {
    if (!salesData?.sales) return [];
    return salesData.sales.filter((sale: any) => {
      const matchesSearch = searchTerm === "" || 
        sale.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.propertyId?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
      const matchesBroker = brokerFilter === "all" || sale.brokerVendedor === brokerFilter;
      return matchesSearch && matchesStatus && matchesBroker;
    });
  }, [salesData, searchTerm, statusFilter, brokerFilter]);

  const formatCurrency = (value: number | string | null) => {
    if (!value) return "R$ 0,00";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const handleStatusChange = () => {
    if (!newStatus || !statusDialog.saleId) return;
    updateStatusMutation.mutate({
      saleId: statusDialog.saleId,
      status: newStatus as any,
      observation: statusComment || undefined,
    });
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    // Fluxo: draft -> sale -> manager_review -> finance_review -> commission_paid
    if (user?.role === "broker") {
      if (currentStatus === "draft") return ["sale", "cancelled"];
      if (currentStatus === "pending") return ["sale", "cancelled"];
      if (currentStatus === "sale") return ["cancelled"];
      return [];
    }
    if (user?.role === "manager") {
      if (currentStatus === "draft") return ["sale", "cancelled"];
      if (currentStatus === "pending") return ["sale", "cancelled"];
      if (currentStatus === "sale") return ["manager_review", "cancelled"];
      if (currentStatus === "manager_review") return ["finance_review", "cancelled"];
      return [];
    }
    if (user?.role === "finance") {
      if (currentStatus === "finance_review") return ["commission_paid", "cancelled"];
      return [];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Padrão */}
      <AppHeader />
      
      {/* Título da Página */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Gerenciamento de Vendas</h1>
              <p className="text-sm text-slate-500">
                {user?.role === "broker" ? "Suas vendas" : "Todas as vendas"}
              </p>
            </div>
            <Button onClick={() => setLocation("/proposals/new")} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-2xl font-bold">{metrics.total}</p>
                  <p className="text-xs text-slate-500">Total Vendas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{metrics.sales}</p>
                  <p className="text-xs text-slate-500">Vendas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{metrics.cancelled}</p>
                  <p className="text-xs text-slate-500">Canceladas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{metrics.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500">Taxa Conversão</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">{metrics.avgDays}</p>
                  <p className="text-xs text-slate-500">Dias Médios</p>
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
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {user?.role === "manager" && brokersData && brokersData.length > 0 && (
                <Select value={brokerFilter} onValueChange={setBrokerFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Corretor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Corretores</SelectItem>
                    {brokersData.map((broker: any) => (
                      <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Propostas */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas ({filteredSales.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Carregando...</div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Nenhuma proposta encontrada</div>
            ) : (
              <div className="space-y-3">
                {filteredSales.map((sale: any) => {
                  const statusConfig = STATUS_CONFIG[sale.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={sale.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900">{sale.buyerName}</h3>
                            <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-600">
                            <div>
                              <span className="text-slate-400">Valor:</span> {formatCurrency(sale.saleValue)}
                            </div>
                            <div>
                              <span className="text-slate-400">Ref:</span> {sale.propertyId?.slice(0, 8) || "-"}
                            </div>
                            <div>
                              <span className="text-slate-400">Data:</span> {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString("pt-BR") : "-"}
                            </div>
                            {user?.role === "manager" && (
                              <div>
                                <span className="text-slate-400">Registrado por:</span> {sale.registeredByName || "-"}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setLocation(`/proposals/${sale.id}`)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          {(["draft", "pending"].includes(sale.status) || (user?.role === "manager" && ["draft", "pending", "sale"].includes(sale.status))) && (
                            <Button variant="outline" size="sm" onClick={() => setLocation(`/proposals/edit/${sale.id}`)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          )}
                          {getNextStatuses(sale.status).length > 0 && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => setStatusDialog({ open: true, saleId: sale.id, currentStatus: sale.status })}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Alterar Status
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog de Alteração de Status */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog({ ...statusDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Alterar Status da Venda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Status Atual</Label>
              <Badge className={`${STATUS_CONFIG[statusDialog.currentStatus]?.bgColor || ""} ${STATUS_CONFIG[statusDialog.currentStatus]?.color || ""} border-0 mt-1`}>
                {STATUS_CONFIG[statusDialog.currentStatus]?.label || statusDialog.currentStatus}
              </Badge>
            </div>
            <div>
              <Label>Novo Status *</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo status" />
                </SelectTrigger>
                <SelectContent>
                  {getNextStatuses(statusDialog.currentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_CONFIG[status]?.label || status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Comentário (opcional)</Label>
              <Textarea
                placeholder="Adicione um comentário sobre esta alteração..."
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-slate-500 mt-1">
                O comentário será registrado com seu nome e horário
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog({ open: false, saleId: "", currentStatus: "" })}>
              Cancelar
            </Button>
            <Button onClick={handleStatusChange} disabled={!newStatus || updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
