import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";
import IndicatorDetailModal from "@/components/IndicatorDetailModal";
import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Indicator {
  name: string;
  meta: string;
  media: string;
  percentual: string;
  trend?: "up" | "down";
}

export default function Indicators() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<"team" | "broker">("team");
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Mutation para sincronização manual
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<{success: boolean; message: string; stats?: any} | null>(null);
  
  const syncMutation = trpc.system.syncPropertyfyNow.useMutation({
    onSuccess: (data) => {
      setSyncResult(data);
      setSyncDialogOpen(true);
      setIsSyncing(false);
    },
    onError: (error) => {
      setSyncResult({ success: false, message: `Erro: ${error.message}` });
      setSyncDialogOpen(true);
      setIsSyncing(false);
    }
  });
  
  const handleSyncPropertyfy = () => {
    setIsSyncing(true);
    toast.info('Sincronização iniciada em background. Você pode mudar de página que a sincronização continuará.');
    syncMutation.mutate();
  };
  
  // Filtros de Mês/Ano
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  // Buscar indicadores reais do backend
  const { data: indicatorsData, isLoading: isLoadingIndicators, refetch } = trpc.indicators.getAll.useQuery(
    {
      month: selectedMonth !== "all" ? parseInt(selectedMonth) : undefined,
      year: selectedYear !== "all" ? parseInt(selectedYear) : undefined,
    },
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
    }
  );

  // Refetch quando filtros mudarem
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [selectedMonth, selectedYear, user, refetch]);

  const handleIndicatorClick = (indicatorName: string) => {
    setSelectedIndicator(indicatorName);
    setModalOpen(true);
  };

  // Scroll para topo ao entrar na página
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!user || !["manager", "finance", "broker", "viewer"].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">Acesso restrito</p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canViewTeamData = ["manager", "finance", "viewer"].includes(user.role);

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Formatar percentual
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Construir indicadores com dados reais
  const indicators: Indicator[] = isLoadingIndicators
    ? []
    : [
        {
          name: "Negócios no mês (valor)",
          meta: "R$ 15.000.000,00",
          media: formatCurrency(indicatorsData?.indicators?.monthlyRevenue || 0),
          percentual: indicatorsData?.indicators?.monthlyRevenue
            ? `${((indicatorsData.indicators.monthlyRevenue / 15000000) * 100).toFixed(0)}%`
            : "0%",
          trend: (indicatorsData?.indicators?.monthlyRevenue || 0) > 6000000 ? "up" : "down",
        },
        {
          name: "Negócios no mês (unidades)",
          meta: "24",
          media: String(indicatorsData?.indicators?.monthlyUnits || 0),
          percentual: indicatorsData?.indicators?.monthlyUnits
            ? `${((indicatorsData.indicators.monthlyUnits / 24) * 100).toFixed(0)}%`
            : "0%",
          trend: (indicatorsData?.indicators?.monthlyUnits || 0) > 12 ? "up" : "down",
        },
        {
          name: "Vendas Canceladas",
          meta: "-",
          media: formatCurrency(indicatorsData?.indicators?.cancelledSales || 0),
          percentual: "-",
        },
        {
          name: "VSO - venda/oferta",
          meta: "5,00%",
          media: "-",
          percentual: "-",
        },
        {
          name: "Comissão Recebida",
          meta: "R$ 525.000,00",
          media: formatCurrency(indicatorsData?.indicators?.commissionReceived || 0),
          percentual: indicatorsData?.indicators?.commissionReceived
            ? `${((indicatorsData.indicators.commissionReceived / 525000) * 100).toFixed(0)}%`
            : "0%",
          trend: (indicatorsData?.indicators?.commissionReceived || 0) > 250000 ? "up" : "down",
        },
        {
          name: "Comissão Vendida",
          meta: "R$ 600.000,00",
          media: formatCurrency(indicatorsData?.indicators?.commissionSold || 0),
          percentual: indicatorsData?.indicators?.commissionSold
            ? `${((indicatorsData.indicators.commissionSold / 600000) * 100).toFixed(0)}%`
            : "0%",
          trend: (indicatorsData?.indicators?.commissionSold || 0) > 300000 ? "up" : "down",
        },
        {
          name: "Comissão Pendente",
          meta: "R$ 1.000.000,00",
          media: formatCurrency(indicatorsData?.indicators?.commissionPending || 0),
          percentual: indicatorsData?.indicators?.commissionPending
            ? `${((indicatorsData.indicators.commissionPending / 1000000) * 100).toFixed(0)}%`
            : "0%",
          trend: (indicatorsData?.indicators?.commissionPending || 0) > 500000 ? "up" : "down",
        },
        {
          name: "Carteira de Divulgação (em número)",
          meta: "410",
          media: "-",
          percentual: "-",
        },
        {
          name: "Angariações mês",
          meta: "50",
          media: "-",
          percentual: "-",
        },
        {
          name: "Baixas no mês (em quantidade)",
          meta: "17",
          media: "-",
          percentual: "-",
        },
        {
          name: "% comissão vendida",
          meta: "4,00%",
          media: formatPercent(indicatorsData?.indicators?.avgCommissionPercent || 0),
          percentual: indicatorsData?.indicators?.avgCommissionPercent
            ? `${((indicatorsData.indicators.avgCommissionPercent / 4) * 100).toFixed(0)}%`
            : "0%",
          trend: (indicatorsData?.indicators?.avgCommissionPercent || 0) > 3 ? "up" : "down",
        },
        {
          name: "Negócios de 1 a 1 milhão",
          meta: "5",
          media: "-",
          percentual: "-",
        },
        {
          name: "Número de atendimentos Prontos",
          meta: "450",
          media: String(indicatorsData?.indicators?.salesByType?.prontos || 0),
          percentual: indicatorsData?.indicators?.salesByType?.prontos
            ? `${((indicatorsData.indicators.salesByType.prontos / 450) * 100).toFixed(0)}%`
            : "0%",
          trend: (indicatorsData?.indicators?.salesByType?.prontos || 0) > 200 ? "up" : "down",
        },
        {
          name: "Número de atendimentos Lançamentos",
          meta: "400",
          media: String(indicatorsData?.indicators?.salesByType?.lancamentos || 0),
          percentual: indicatorsData?.indicators?.salesByType?.lancamentos
            ? `${((indicatorsData.indicators.salesByType.lancamentos / 400) * 100).toFixed(0)}%`
            : "0%",
          trend: (indicatorsData?.indicators?.salesByType?.lancamentos || 0) > 200 ? "up" : "down",
        },
        {
          name: "Prazo médio recebimento de venda",
          meta: "60",
          media: "-",
          percentual: "-",
        },
        {
          name: "% Com cancelada/ com pendente",
          meta: "5,00%",
          media: "-",
          percentual: "-",
        },
        {
          name: "Tempo médio de venda ang X venda",
          meta: "150 dias",
          media: `${indicatorsData?.indicators?.avgSaleTime || 0} dias`,
          percentual: indicatorsData?.indicators?.avgSaleTime
            ? `${((indicatorsData.indicators.avgSaleTime / 150) * 100).toFixed(0)}%`
            : "0%",
          trend: (indicatorsData?.indicators?.avgSaleTime || 0) < 150 ? "up" : "down",
        },
        {
          name: "Valor médio do imóvel de venda",
          meta: "R$ 625.000,00",
          media: formatCurrency(indicatorsData?.indicators?.avgPropertyValue || 0),
          percentual: indicatorsData?.indicators?.avgPropertyValue
            ? `${((indicatorsData.indicators.avgPropertyValue / 625000) * 100).toFixed(0)}%`
            : "0%",
          trend: (indicatorsData?.indicators?.avgPropertyValue || 0) > 400000 ? "up" : "down",
        },
        {
          name: "Negócios na Rede",
          meta: "5",
          media: "-",
          percentual: "-",
        },
        {
          name: "Negócios Internos",
          meta: "12",
          media: "-",
          percentual: "-",
        },
        {
          name: "Negócios Parceria Externa",
          meta: "12",
          media: "-",
          percentual: "-",
        },
        {
          name: "Negócios Lançamentos",
          meta: "7",
          media: String(indicatorsData?.indicators?.salesByType?.lancamentos || 0),
          percentual: indicatorsData?.indicators?.salesByType?.lancamentos
            ? `${((indicatorsData.indicators.salesByType.lancamentos / 7) * 100).toFixed(0)}%`
            : "0%",
          trend: (indicatorsData?.indicators?.salesByType?.lancamentos || 0) > 4 ? "up" : "down",
        },
        {
          name: "Negócios Prontos",
          meta: "12",
          media: String(indicatorsData?.indicators?.salesByType?.prontos || 0),
          percentual: indicatorsData?.indicators?.salesByType?.prontos
            ? `${((indicatorsData.indicators.salesByType.prontos / 12) * 100).toFixed(0)}%`
            : "0%",
          trend: (indicatorsData?.indicators?.salesByType?.prontos || 0) > 6 ? "up" : "down",
        },
        {
          name: "Despesa Geral",
          meta: "R$ 50.000,00",
          media: "-",
          percentual: "-",
        },
        {
          name: "Despesa com impostos",
          meta: "R$ 20.000,00",
          media: "-",
          percentual: "-",
        },
        {
          name: "Fundo Inovação",
          meta: "R$ 100.000,00",
          media: "-",
          percentual: "-",
        },
        {
          name: "Resultado Sócios",
          meta: "R$ 60.000,00",
          media: "-",
          percentual: "-",
        },
        {
          name: "Fundo emergencial",
          meta: "R$ 105.228,04",
          media: "-",
          percentual: "-",
        },
      ];

  const getTrendIcon = (trend?: string) => {
    if (!trend) return null;
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTrendColor = (trend?: string) => {
    if (!trend) return "text-slate-600";
    if (trend === "up") return "text-green-600";
    return "text-red-600";
  };

  // Calcular resumo de performance
  const positiveCount = indicators.filter(ind => ind.trend === "up").length;
  const negativeCount = indicators.filter(ind => ind.trend === "down").length;
  const undefinedCount = indicators.filter(ind => !ind.trend).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Indicadores de Vendas</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe os principais indicadores de desempenho
            </p>
          </div>
          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'finance') && (
            <Button
              onClick={handleSyncPropertyfy}
              disabled={isSyncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Properfy'}
            </Button>
          )}
        </div>
        
        {isLoadingIndicators && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-blue-800">Carregando indicadores...</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Card - MOVED TO TOP */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resumo de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-1">Positivos</p>
                <p className="text-2xl font-bold text-green-600">{positiveCount}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium mb-1">Negativos</p>
                <p className="text-2xl font-bold text-red-600">{negativeCount}</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700 font-medium mb-1">Indefinidos</p>
                <p className="text-2xl font-bold text-slate-600">{undefinedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Section */}
        {canViewTeamData && (
          <div className="mb-4 flex gap-3 items-center text-sm flex-wrap">
            <span className="text-slate-600">Filtros:</span>
            <div className="flex gap-3 items-center flex-wrap">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2 py-1 text-sm border border-slate-200 rounded bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              >
                <option value="all">Todos os meses</option>
                <option value="1">Janeiro</option>
                <option value="2">Fevereiro</option>
                <option value="3">Março</option>
                <option value="4">Abril</option>
                <option value="5">Maio</option>
                <option value="6">Junho</option>
                <option value="7">Julho</option>
                <option value="8">Agosto</option>
                <option value="9">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2 py-1 text-sm border border-slate-200 rounded bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              >
                <option value="all">Todos os anos</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
          </div>
        )}

        {/* Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {indicators.map((indicator, idx) => (
            <Card
              key={idx}
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleIndicatorClick(indicator.name)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-700">
                  {indicator.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Meta Mensal</p>
                    <p className="text-sm font-semibold text-slate-900">{indicator.meta || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Valor Atual</p>
                    <p className="text-sm font-semibold text-slate-900">{indicator.media}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">Percentual</p>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(indicator.trend)}
                      <p className={`text-sm font-semibold ${getTrendColor(indicator.trend)}`}>
                        {indicator.percentual}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Indicator Detail Modal */}
      {selectedIndicator && (
        <IndicatorDetailModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          indicatorName={selectedIndicator}
          indicatorType="value"
          monthlyData={[]}
          brokers={[]}
          userRole={user.role as "broker" | "manager" | "finance" | "admin" | "viewer"}
        />
      )}

      {/* Sync Result Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {syncResult?.success ? '✅ Sincronização Concluída' : '❌ Erro na Sincronização'}
            </DialogTitle>
            <DialogDescription>
              {syncResult?.message}
            </DialogDescription>
          </DialogHeader>
          {syncResult?.success && syncResult?.stats && (
            <div className="space-y-2 text-sm">
              <p><strong>Total de imóveis:</strong> {syncResult.stats.total}</p>
              <p><strong>Novos imóveis:</strong> {syncResult.stats.inserted}</p>
              <p><strong>Imóveis atualizados:</strong> {syncResult.stats.updated}</p>
              <p><strong>Tempo decorrido:</strong> {syncResult.stats.duration}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSyncDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
