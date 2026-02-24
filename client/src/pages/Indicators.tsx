import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";
import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { IndicatorsConsolidatedTable } from "@/components/IndicatorsConsolidatedTable";
import { IndicatorHistoryModal } from "@/components/IndicatorHistoryModal";
import { useLocation } from "wouter";


const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

export default function Indicators() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(CURRENT_MONTH));
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_YEAR));
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openIndicatorModal = (indicatorName: string) => {
    setSelectedIndicator(indicatorName);
    setIsModalOpen(true);
  };

  const closeIndicatorModal = () => {
    setIsModalOpen(false);
    setSelectedIndicator(null);
  };

  // Buscar indicadores reais do backend
  const { data: indicatorsData, isLoading, refetch } = trpc.indicators.getRealtimeIndicators.useQuery(
    {
      companyId: user?.id || "",
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
    },
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
    }
  );

  // Mutation para sincronização Properfy
  const syncMutation = trpc.system.syncPropertyfyNow.useMutation({
    onSuccess: () => {
      toast.success("Sincronização concluída!");
      setIsSyncing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro na sincronização: ${error.message}`);
      setIsSyncing(false);
    }
  });

  const handleSyncPropertyfy = () => {
    setIsSyncing(true);
    toast.info('Sincronização iniciada...');
    syncMutation.mutate();
  };

  // Refetch quando filtros mudarem
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [selectedMonth, selectedYear, user, refetch]);

  // Scroll para topo ao entrar na página
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!user || !["manager", "finance", "broker", "viewer", "admin"].includes(user.role)) {
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

  // Construir dados da tabela consolidada
  const buildConsolidatedData = () => {
    if (!indicatorsData) return [];

    const data = indicatorsData;
    const indicators: any[] = [];

    // Mapeamento de indicadores com suas metas e dados
    const indicatorsList = [
      {
        title: "Negócios no mês (valor)",
        monthlyGoal: 100000,
        annualAverage: 1200000,
        value: data.negociosValor || 0,
        isCurrency: true,
      },
      {
        title: "Negócios no mês (unidades)",
        monthlyGoal: 10,
        annualAverage: 120,
        value: data.negociosUnidades || 0,
        isCurrency: false,
      },
      {
        title: "Vendas Canceladas",
        monthlyGoal: 2,
        annualAverage: 24,
        value: data.vendidosCancelados || 0,
        isCurrency: false,
      },
      {
        title: "VSO - venda/oferta",
        monthlyGoal: 0.05,
        annualAverage: 0.05,
        value: data.vsoVendaOferta || 0,
        isCurrency: false,
        isPercentage: true,
      },
      {
        title: "Comissão Recebida",
        monthlyGoal: 50000,
        annualAverage: 600000,
        value: data.comissaoRecebida || 0,
        isCurrency: true,
      },
      {
        title: "Comissão Vendida",
        monthlyGoal: 75000,
        annualAverage: 900000,
        value: data.comissaoVendida || 0,
        isCurrency: true,
      },
      {
        title: "Comissão Pendente Final do mês",
        monthlyGoal: 100000,
        annualAverage: 1200000,
        value: data.comissaoPendente || 0,
        isCurrency: true,
      },
      {
        title: "Carteira de Divulgação (em número)",
        monthlyGoal: 400,
        annualAverage: 400,
        value: data.carteiraAtiva || 0,
        isCurrency: false,
      },
      {
        title: "Angariações mês",
        monthlyGoal: 50,
        annualAverage: 600,
        value: data.angariacesMes || 0,
        isCurrency: false,
      },
      {
        title: "Baixas no mês (em quantidade)",
        monthlyGoal: 15,
        annualAverage: 180,
        value: data.baixasMes || 0,
        isCurrency: false,
      },
      {
        title: "% comissão vendida",
        monthlyGoal: 0.05,
        annualAverage: 0.05,
        value: data.percentualComissaoVendida || 0,
        isCurrency: false,
        isPercentage: true,
      },
      {
        title: "Negócios acima de 1 milhão",
        monthlyGoal: 2,
        annualAverage: 24,
        value: data.negociosAcima1M || 0,
        isCurrency: false,
      },
      {
        title: "Número de atendimentos Prontos",
        monthlyGoal: 50,
        annualAverage: 600,
        value: data.atendimentosProntos || 0,
        isCurrency: false,
      },
      {
        title: "Número de atendimentos Lançamentos",
        monthlyGoal: 20,
        annualAverage: 240,
        value: data.atendimentosLancamentos || 0,
        isCurrency: false,
      },
      {
        title: "Prazo médio recebimento de venda",
        monthlyGoal: 30,
        annualAverage: 30,
        value: data.prazoMedioRecebimento || 0,
        isCurrency: false,
        isDays: true,
      },
      {
        title: "% Com cancelada / com pendente",
        monthlyGoal: 0.1,
        annualAverage: 0.1,
        value: data.percentualCanceladaPendente || 0,
        isCurrency: false,
        isPercentage: true,
      },
      {
        title: "Tempo médio de venda ang X venda",
        monthlyGoal: 60,
        annualAverage: 60,
        value: 0, // Será calculado quando houver dados
        isCurrency: false,
        isDays: true,
      },
      {
        title: "Valor médio do imóvel de venda",
        monthlyGoal: 500000,
        annualAverage: 500000,
        value: data.valorMedioImovel || 0,
        isCurrency: true,
      },
      {
        title: "Negócios na Rede",
        monthlyGoal: 3,
        annualAverage: 36,
        value: data.negociosRede || 0,
        isCurrency: false,
      },
      {
        title: "Negócios Internos",
        monthlyGoal: 4,
        annualAverage: 48,
        value: data.negociosInternos || 0,
        isCurrency: false,
      },
      {
        title: "Negócios Parceria Externa",
        monthlyGoal: 2,
        annualAverage: 24,
        value: data.negociosParceriaExterna || 0,
        isCurrency: false,
      },
      {
        title: "Negócios Lançamentos",
        monthlyGoal: 1,
        annualAverage: 12,
        value: data.negociosLancamentos || 0,
        isCurrency: false,
      },
      {
        title: "Despesa Geral",
        monthlyGoal: 10000,
        annualAverage: 120000,
        value: data.despesaGeral || 0,
        isCurrency: true,
      },
      {
        title: "Despesa com impostos",
        monthlyGoal: 5000,
        annualAverage: 60000,
        value: data.despesaImpostos || 0,
        isCurrency: true,
      },
      {
        title: "Fundo Inovação",
        monthlyGoal: 2000,
        annualAverage: 24000,
        value: data.fundoInovacao || 0,
        isCurrency: true,
      },
      {
        title: "Resultado Sócios",
        monthlyGoal: 50000,
        annualAverage: 600000,
        value: data.resultadoSocios || 0,
        isCurrency: true,
      },
      {
        title: "Fundo emergencial",
        monthlyGoal: 10000,
        annualAverage: 120000,
        value: data.fundoEmergencial || 0,
        isCurrency: true,
      },
    ];

    // Construir dados com meses (placeholder - será preenchido com dados reais)
    indicatorsList.forEach((ind) => {
      const total = ind.value;
      const monthlyValue = total / 12; // Distribuição simplificada
      const percentage = ind.monthlyGoal > 0 ? (total / (ind.monthlyGoal * 12)) * 100 : 0;

      indicators.push({
        title: ind.title,
        monthlyGoal: ind.monthlyGoal,
        annualAverage: ind.annualAverage,
        percentageAchieved: percentage,
        total: total,
        months: {
          jan: monthlyValue,
          fev: monthlyValue,
          mar: monthlyValue,
          abr: monthlyValue,
          mai: monthlyValue,
          jun: monthlyValue,
          jul: monthlyValue,
          ago: monthlyValue,
          set: monthlyValue,
          out: monthlyValue,
          nov: monthlyValue,
          dez: monthlyValue,
        },
      });
    });

    return indicators;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Indicadores de Vendas</h1>
            <p className="text-muted-foreground">Acompanhe os principais indicadores de desempenho</p>
          </div>
          <Button
            onClick={handleSyncPropertyfy}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar Properfy"}
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="w-48">
            <label className="text-sm font-medium mb-2 block">Mês</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((month, idx) => (
                  <SelectItem key={month} value={String(idx + 1)}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <label className="text-sm font-medium mb-2 block">Ano</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards de Status */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Período</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{MONTH_NAMES[parseInt(selectedMonth) - 1]}/{selectedYear}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {indicatorsData?.isHistorical ? "Histórico" : "Tempo Real"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Indicadores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">28</p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Indicadores - Primeira linha */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openIndicatorModal("Negócios no mês")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Negócios no mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Meta Mensal</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Média Anual</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Percentual</p>
                  <p className="text-lg font-semibold text-red-600">0%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openIndicatorModal("Negócios no mês (unidades)")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Negócios no mês (unidades)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Meta Mensal</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Média Anual</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Percentual</p>
                  <p className="text-lg font-semibold text-red-600">0%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openIndicatorModal("Vendas Canceladas")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vendas Canceladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Meta Mensal</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Média Anual</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Percentual</p>
                  <p className="text-lg font-semibold text-red-600">0%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Indicadores - Segunda linha */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openIndicatorModal("VSO - venda/oferta")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">VSO - venda/oferta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Meta Mensal</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Média Anual</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Percentual</p>
                  <p className="text-lg font-semibold text-red-600">0%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openIndicatorModal("Comissão Recebida")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Comissão Recebida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Meta Mensal</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Média Anual</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Percentual</p>
                  <p className="text-lg font-semibold text-red-600">0%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openIndicatorModal("Comissão Vendida")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Comissão Vendida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Meta Mensal</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Média Anual</p>
                  <p className="text-lg font-semibold">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Percentual</p>
                  <p className="text-lg font-semibold text-red-600">0%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela Consolidada */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          <IndicatorsConsolidatedTable
            indicators={buildConsolidatedData()}
            isLoading={isLoading}
            year={parseInt(selectedYear)}
          />
        )}

        {/* Modal de Histórico de Indicador */}
        {selectedIndicator && (
          <IndicatorHistoryModal
            isOpen={isModalOpen}
            onClose={closeIndicatorModal}
            indicatorName={selectedIndicator}
          />
        )}
      </div>
    </AppLayout>
  );
}
