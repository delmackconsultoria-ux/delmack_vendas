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
import { ManualDataModal } from "@/components/ManualDataModal";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";


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
  const [isManualDataModalOpen, setIsManualDataModalOpen] = useState(false);
  const [manualDataByMonth, setManualDataByMonth] = useState<Record<string, any>>({});

  const openIndicatorModal = (indicatorName: string) => {
    setSelectedIndicator(indicatorName);
    setIsModalOpen(true);
  };

  const closeIndicatorModal = () => {
    setIsModalOpen(false);
    setSelectedIndicator(null);
  };

  // Buscar indicadores do mês selecionado
  const { data: indicatorsData, isLoading, refetch } = trpc.indicators.getRealtimeIndicators.useQuery(
    {
      companyId: user?.companyId || "",
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
    },
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
    }
  );

  // Buscar indicadores de todos os 12 meses para a tabela consolidada
  const { data: yearData, isLoading: isLoadingYear } = trpc.indicators.getYearIndicators.useQuery(
    {
      companyId: user?.companyId || "",
      year: parseInt(selectedYear),
    },
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
    }
  );

  // Buscar metas do ano selecionado
  const { data: goalsData } = trpc.goals.getOrCreateGoals.useQuery(
    {
      year: parseInt(selectedYear),
    },
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
    }
  );

  // Mutation para sincronização Properfy
  // Buscar dados manuais para o mês selecionado
  const { data: currentMonthManualData } = trpc.indicators.getMonthlyManualData.useQuery(
    {
      companyId: user?.companyId || "",
      year: parseInt(selectedYear),
      month: parseInt(selectedMonth),
    },
    {
      enabled: !!user?.companyId,
      refetchOnWindowFocus: false,
    }
  );

  // Atualizar manualDataByMonth quando os dados forem carregados
  useEffect(() => {
    if (currentMonthManualData) {
      const monthKey = `${parseInt(selectedYear)}-${String(parseInt(selectedMonth)).padStart(2, '0')}`;
      setManualDataByMonth({
        ...manualDataByMonth,
        [monthKey]: currentMonthManualData,
      });
    }
  }, [currentMonthManualData]);

  
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

  // Recarregar dados manuais quando modal fecha
  const handleManualDataClose = () => {
    setIsManualDataModalOpen(false);
    // Recarregar dados será feito automaticamente pelo useQuery
  };

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

  // Construir dados da tabela consolidada a partir dos dados do ano
  const buildConsolidatedData = () => {
    if (!yearData?.monthlyData || yearData.monthlyData.length === 0) return [];

    const indicators: any[] = [];

    // Função para obter valor de meta
    const getGoalValue = (fieldName: string): number => {
      if (!goalsData?.indicators) return 0;
      const value = (goalsData.indicators as any)[fieldName];
      const numValue = value !== null && value !== undefined ? Number(value) : 0;
      return isNaN(numValue) ? 0 : numValue;
    };

    // Mapeamento de indicadores com suas metas (dinâmicas do banco)
    const indicatorsList = [
      {
        title: "Negócios no mês (valor)",
        monthlyGoal: (getGoalValue("businessMonth") || 1200000) / 12,
        annualAverage: getGoalValue("businessMonth") || 1200000,
        fieldName: "negociosValor",
      },
      {
        title: "Negócios no mês (unidades)",
        monthlyGoal: (getGoalValue("businessMonth") || 120) / 12,
        annualAverage: getGoalValue("businessMonth") || 120,
        fieldName: "negociosUnidades",
      },
      {
        title: "Vendas Canceladas",
        monthlyGoal: (getGoalValue("cancelledSales") || 24) / 12,
        annualAverage: getGoalValue("cancelledSales") || 24,
        fieldName: "vendidosCancelados",
      },
      {
        title: "VSO - venda/oferta",
        monthlyGoal: (getGoalValue("vsoRatio") || 0.6) / 12,
        annualAverage: getGoalValue("vsoRatio") || 0.6,
        fieldName: "vsoVendaOferta",
      },
      {
        title: "Comissão Recebida",
        monthlyGoal: (getGoalValue("commissionReceived") || 600000) / 12,
        annualAverage: getGoalValue("commissionReceived") || 600000,
        fieldName: "comissaoRecebida",
      },
      {
        title: "Comissão Vendida",
        monthlyGoal: (getGoalValue("commissionSold") || 900000) / 12,
        annualAverage: getGoalValue("commissionSold") || 900000,
        fieldName: "comissaoVendida",
      },
      {
        title: "Comissão Pendente Final do mês",
        monthlyGoal: (getGoalValue("commissionPending") || 1200000) / 12,
        annualAverage: getGoalValue("commissionPending") || 1200000,
        fieldName: "comissaoPendente",
      },
      {
        title: "Carteira de Divulgação (em número)",
        monthlyGoal: (getGoalValue("portfolioDisclosure") || 4800) / 12,
        annualAverage: getGoalValue("portfolioDisclosure") || 4800,
        fieldName: "carteiraAtiva",
      },
      {
        title: "Angariações mês",
        monthlyGoal: (getGoalValue("prospectingMonth") || 600) / 12,
        annualAverage: getGoalValue("prospectingMonth") || 600,
        fieldName: "angariacesMes",
      },
      {
        title: "Baixas no mês (em quantidade)",
        monthlyGoal: (getGoalValue("removalsMonth") || 180) / 12,
        annualAverage: getGoalValue("removalsMonth") || 180,
        fieldName: "baixasMes",
      },
      {
        title: "% comissão vendida",
        monthlyGoal: (getGoalValue("commissionPercentage") || 0.6) / 12,
        annualAverage: getGoalValue("commissionPercentage") || 0.6,
        fieldName: "percentualComissaoVendida",
      },
      {
        title: "Negócios acima de 1 milhão",
        monthlyGoal: (getGoalValue("businessOver1m") || 24) / 12,
        annualAverage: getGoalValue("businessOver1m") || 24,
        fieldName: "negociosAcima1M",
      },
      {
        title: "Número de atendimentos Prontos",
        monthlyGoal: (getGoalValue("readyCalls") || 600) / 12,
        annualAverage: getGoalValue("readyCalls") || 600,
        fieldName: "atendimentosProntos",
      },
      {
        title: "Número de atendimentos Lançamentos",
        monthlyGoal: (getGoalValue("launchCalls") || 240) / 12,
        annualAverage: getGoalValue("launchCalls") || 240,
        fieldName: "atendimentosLancamentos",
      },
      {
        title: "Prazo médio recebimento de venda",
        monthlyGoal: (getGoalValue("avgReceiptTime") || 360) / 12,
        annualAverage: getGoalValue("avgReceiptTime") || 360,
        fieldName: "prazoMedioRecebimento",
      },
      {
        title: "% Com cancelada / com pendente",
        monthlyGoal: (getGoalValue("cancelledPendingRatio") || 1.2) / 12,
        annualAverage: getGoalValue("cancelledPendingRatio") || 1.2,
        fieldName: "percentualCanceladaPendente",
      },
      {
        title: "Tempo médio de venda ang X venda",
        monthlyGoal: (getGoalValue("avgSaleTime") || 720) / 12,
        annualAverage: getGoalValue("avgSaleTime") || 720,
        fieldName: "tempoMedioVendaAngVenda",
      },
      {
        title: "Valor médio do imóvel de venda",
        monthlyGoal: (getGoalValue("avgPropertyValue") || 6000000) / 12,
        annualAverage: getGoalValue("avgPropertyValue") || 6000000,
        fieldName: "valorMedioImovel",
      },
      {
        title: "Negócios na Rede",
        monthlyGoal: (getGoalValue("networkBusiness") || 36) / 12,
        annualAverage: getGoalValue("networkBusiness") || 36,
        fieldName: "negociosRede",
      },
      {
        title: "Negócios Internos",
        monthlyGoal: (getGoalValue("internalBusiness") || 48) / 12,
        annualAverage: getGoalValue("internalBusiness") || 48,
        fieldName: "negociosInternos",
      },
      {
        title: "Negócios Parceria Externa",
        monthlyGoal: (getGoalValue("externalPartnership") || 24) / 12,
        annualAverage: getGoalValue("externalPartnership") || 24,
        fieldName: "negociosParceriaExterna",
      },
      {
        title: "Negócios Lançamentos",
        monthlyGoal: (getGoalValue("launchBusiness") || 12) / 12,
        annualAverage: getGoalValue("launchBusiness") || 12,
        fieldName: "negociosLancamentos",
      },
      {
        title: "Despesa Geral",
        monthlyGoal: (getGoalValue("generalExpense") || 120000) / 12,
        annualAverage: getGoalValue("generalExpense") || 120000,
        fieldName: "despesaGeral",
        manualField: "generalExpense",
      },
      {
        title: "Despesa com impostos",
        monthlyGoal: (getGoalValue("taxExpense") || 60000) / 12,
        annualAverage: getGoalValue("taxExpense") || 60000,
        fieldName: "despesaImpostos",
        manualField: "taxExpense",
      },
      {
        title: "Fundo Inovação",
        monthlyGoal: (getGoalValue("innovationFund") || 24000) / 12,
        annualAverage: getGoalValue("innovationFund") || 24000,
        fieldName: "fundoInovacao",
        manualField: "innovationFund",
      },
      {
        title: "Resultado Sócios",
        monthlyGoal: (getGoalValue("partnersResult") || 600000) / 12,
        annualAverage: getGoalValue("partnersResult") || 600000,
        fieldName: "resultadoSocios",
        manualField: "partnersResult",
      },
      {
        title: "Fundo emergencial",
        monthlyGoal: (getGoalValue("emergencyFund") || 120000) / 12,
        annualAverage: getGoalValue("emergencyFund") || 120000,
        fieldName: "fundoEmergencial",
        manualField: "emergencyFund",
      },
    ];

    // Construir dados com meses reais
    const CURRENT_MONTH_NUM = new Date().getMonth() + 1; // Março = 3
    
    indicatorsList.forEach((ind) => {
      const months = {
        jan: 0, fev: 0, mar: 0, abr: 0, mai: 0, jun: 0,
        jul: 0, ago: 0, set: 0, out: 0, nov: 0, dez: 0,
      };
      const monthKeys = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      let total = 0;
      let selectedMonthValue = 0;

      monthKeys.forEach((monthKey, monthIndex) => {
        const monthData = yearData?.monthlyData?.find((m: any) => m.month === monthIndex + 1);
        const value = monthData ? (monthData as any)[ind.fieldName] || 0 : 0;
        (months as any)[monthKey] = value;
        total += value;
        if (monthIndex + 1 === parseInt(selectedMonth)) {
          selectedMonthValue = value;
        }
      });

      const monthlyGoal = Number(ind.monthlyGoal) || 0;
      const percentage = monthlyGoal > 0 && !isNaN(monthlyGoal) ? (selectedMonthValue / monthlyGoal) * 100 : 0;

      indicators.push({
        title: ind.title,
        monthlyGoal: Number(ind.monthlyGoal) || 0,
        annualAverage: Number(ind.annualAverage) || 0,
        percentageAchieved: Number(percentage) || 0,
        total: total,
        months: months,
      });
    });

    return indicators;
  };

  const consolidatedData = buildConsolidatedData();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Indicadores</h1>
            <p className="text-gray-600 mt-1">Acompanhe o desempenho mensal e anual</p>
          </div>
          <Button 
            onClick={handleSyncPropertyfy} 
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Properfy'}
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Mês</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((month, index) => (
                      <SelectItem key={index} value={String(index + 1)}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Ano</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores em tempo real */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        ) : indicatorsData ? (
          <Card>
            <CardHeader>
              <CardTitle>Indicadores - {MONTH_NAMES[parseInt(selectedMonth) - 1]} de {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Indicadores renderizados aqui */}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Tabela consolidada */}
        {isLoadingYear ? (
          <Card>
            <CardContent className="pt-6 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        ) : (
          <IndicatorsConsolidatedTable indicators={consolidatedData} />
        )}

        {/* Modais */}
        {selectedIndicator && (
          <IndicatorHistoryModal
            isOpen={isModalOpen}
            onClose={closeIndicatorModal}
            indicatorName={selectedIndicator}
          />
        )}

        {isManualDataModalOpen && (
          <ManualDataModal
            isOpen={isManualDataModalOpen}
            onClose={handleManualDataClose}
            month={parseInt(selectedMonth)}
            year={parseInt(selectedYear)}
            companyId={user?.companyId || ""}
          />
        )}
      </div>
    </AppLayout>
  );
}
