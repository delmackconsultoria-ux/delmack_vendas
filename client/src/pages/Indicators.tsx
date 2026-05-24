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
import ManualDataDrawer from "@/components/ManualDataDrawer";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";


const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

// Determinar mês padrão inteligente: se estamos em Abril/2026 ou posterior sem dados,
// usar Fevereiro/2026 (último mês com dados importados)
function getDefaultMonth(): { month: number; year: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // Se estamos em 2026 e no mês 3 (Março) ou posterior, usar Fevereiro como padrão
  if (year === 2026 && month >= 3) {
    return { month: 2, year: 2026 };
  }
  return { month, year };
}

const DEFAULT_PERIOD = getDefaultMonth();

export default function Indicators() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(DEFAULT_PERIOD.month));
  const [selectedYear, setSelectedYear] = useState<string>(String(DEFAULT_PERIOD.year));
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
  const { data: yearData, isLoading: isLoadingYear, refetch: refetchYear } = trpc.indicators.getYearIndicators.useQuery(
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

  // Buscar anos disponíveis com histórico
  const { data: availableYears = [] } = trpc.indicators.getAvailableYears.useQuery(
    {
      companyId: user?.companyId || "",
    },
    {
      enabled: !!user?.companyId,
      refetchOnWindowFocus: false,
    }
  );

  // Buscar dados do Properfy (Baixas, Angariações, Carteira de Divulgação)
  const { data: properfyData } = trpc.indicators.getProperfyData.useQuery(
    {
      companyId: user?.companyId || "",
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
    },
    {
      enabled: !!user?.companyId,
      refetchOnWindowFocus: false,
    }
  );

  // Mutation para sincronização Properfy
  // Buscar dados manuais para o mês selecionado
  const { data: currentMonthManualData, refetch: refetchMonthlyManualData } = trpc.indicators.getMonthlyManualData.useQuery(
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

  // Recarregar dados manuais quando drawer fecha
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
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
    // Para campos de R$: meta mensal = valor anual / 12, meta anual = valor anual
    // Para campos de %: meta mensal = valor (% é igual todo mês), meta anual = valor
    // Para campos de número: meta mensal = valor anual / 12, meta anual = valor anual
    const indicatorsList = [
      {
        title: "Negócios no mês (valor)",
        monthlyGoal: (getGoalValue("businessValue") || 0) / 12,
        annualAverage: getGoalValue("businessValue") || 0,
        fieldName: "negociosValor",
      },
      {
        title: "Negócios no mês (unidades)",
        monthlyGoal: (getGoalValue("businessMonth") || 0) / 12,
        annualAverage: getGoalValue("businessMonth") || 0,
        fieldName: "negociosUnidades",
        isCurrency: false,
        isInteger: true,
      },
      {
        title: "Vendas canceladas",
        monthlyGoal: (getGoalValue("cancelledSales") || 0) / 12,
        annualAverage: getGoalValue("cancelledSales") || 0,
        fieldName: "vendidosCancelados",
        isCurrency: false,
        isInteger: true,
      },
      {
        title: "VSO - venda/oferta",
        monthlyGoal: getGoalValue("vsoRatio") || 0,
        annualAverage: getGoalValue("vsoRatio") || 0,
        fieldName: "vsoVendaOferta",
        isCurrency: false,
        isPercentage: true,
      },
      {
        title: "Comissão recebida",
        monthlyGoal: (getGoalValue("commissionReceived") || 0) / 12,
        annualAverage: getGoalValue("commissionReceived") || 0,
        fieldName: "comissaoRecebida",
      },
      {
        title: "Comissão vendida",
        monthlyGoal: (getGoalValue("commissionSold") || 0) / 12,
        annualAverage: getGoalValue("commissionSold") || 0,
        fieldName: "comissaoVendida",
      },
      {
        title: "Comissão pendente final do mês",
        monthlyGoal: (getGoalValue("commissionPending") || 0) / 12,
        annualAverage: getGoalValue("commissionPending") || 0,
        fieldName: "comissaoPendente",
      },
      {
        title: "Carteira de divulgação (em número)",
        monthlyGoal: (getGoalValue("portfolioDisclosure") || 0) / 12,
        annualAverage: getGoalValue("portfolioDisclosure") || 0,
        fieldName: "carteiraAtiva",
        isCurrency: false,
      },
      {
        title: "Angariações mês",
        monthlyGoal: (getGoalValue("prospectingMonth") || 0) / 12,
        annualAverage: getGoalValue("prospectingMonth") || 0,
        fieldName: "angariacesMes",
        isCurrency: false,
      },
      {
        title: "Baixas no mês (em quantidade)",
        monthlyGoal: (getGoalValue("removalsMonth") || 0) / 12,
        annualAverage: getGoalValue("removalsMonth") || 0,
        fieldName: "baixasMes",
        isCurrency: false,
      },
      {
        title: "% comissão vendida",
        monthlyGoal: getGoalValue("commissionPercentage") || 0,
        annualAverage: getGoalValue("commissionPercentage") || 0,
        fieldName: "percentualComissaoVendida",
        isCurrency: false,
        isPercentage: true,
      },
      {
        title: "Negócios acima de 1 milhão",
        monthlyGoal: (getGoalValue("businessOver1m") || 0) / 12,
        annualAverage: getGoalValue("businessOver1m") || 0,
        fieldName: "negociosAcima1M",
        isCurrency: false,
      },
      {
        title: "Prazo médio recebimento de venda",
        monthlyGoal: getGoalValue("avgReceiptTime") || 0,
        annualAverage: getGoalValue("avgReceiptTime") || 0,
        fieldName: "prazoMedioRecebimento",
        isCurrency: false,
      },
      {
        title: "% Com cancelada / com pendente",
        monthlyGoal: getGoalValue("cancelledPendingRatio") || 0,
        annualAverage: getGoalValue("cancelledPendingRatio") || 0,
        fieldName: "percentualCanceladaPendente",
        isCurrency: false,
        isPercentage: true,
      },
      {
        title: "Valor médio do imóvel de venda",
        monthlyGoal: (getGoalValue("avgPropertyValue") || 0) / 12,
        annualAverage: getGoalValue("avgPropertyValue") || 0,
        fieldName: "valorMedioImovel",
      },
      {
        title: "Negócios na rede",
        monthlyGoal: (getGoalValue("networkBusiness") || 0) / 12,
        annualAverage: getGoalValue("networkBusiness") || 0,
        fieldName: "negociosRede",
        isCurrency: false,
        isInteger: true,
      },
      {
        title: "Negócios internos",
        monthlyGoal: (getGoalValue("internalBusiness") || 0) / 12,
        annualAverage: getGoalValue("internalBusiness") || 0,
        fieldName: "negociosInternos",
        isCurrency: false,
        isInteger: true,
      },
      {
        title: "Negócios parceria externa",
        monthlyGoal: (getGoalValue("externalPartnership") || 0) / 12,
        annualAverage: getGoalValue("externalPartnership") || 0,
        fieldName: "negociosParceriaExterna",
        isCurrency: false,
        isInteger: true,
      },
      {
        title: "Negócios lançamentos",
        monthlyGoal: (getGoalValue("launchBusiness") || 0) / 12,
        annualAverage: getGoalValue("launchBusiness") || 0,
        fieldName: "negociosLancamentos",
        isCurrency: false,
        isInteger: true,
      },
      {
        title: "Número de atendimentos prontos",
        monthlyGoal: (getGoalValue("readyCalls") || 0) / 12,
        annualAverage: getGoalValue("readyCalls") || 0,
        fieldName: "atendimentosProntos",
        isCurrency: false,
      },
      {
        title: "Número de atendimentos lançamentos",
        monthlyGoal: (getGoalValue("launchCalls") || 0) / 12,
        annualAverage: getGoalValue("launchCalls") || 0,
        fieldName: "atendimentosLancamentos",
        isCurrency: false,
      },
      {
        title: "Tempo médio de venda ang X venda",
        monthlyGoal: getGoalValue("avgSaleTime") || 0,
        annualAverage: getGoalValue("avgSaleTime") || 0,
        fieldName: "tempoMedioVendaAngVenda",
        isCurrency: false,
      },
      {
        title: "Despesa geral",
        monthlyGoal: (getGoalValue("generalExpense") || 0) / 12,
        annualAverage: getGoalValue("generalExpense") || 0,
        fieldName: "despesaGeral",
        manualField: "despesaGeral",
        isManualData: true,
      },
      {
        title: "Despesa com impostos",
        monthlyGoal: (getGoalValue("taxExpense") || 0) / 12,
        annualAverage: getGoalValue("taxExpense") || 0,
        fieldName: "despesaImpostos",
        manualField: "despesaImpostos",
        isManualData: true,
      },
      {
        title: "Fundo inovação",
        monthlyGoal: (getGoalValue("innovationFund") || 0) / 12,
        annualAverage: getGoalValue("innovationFund") || 0,
        fieldName: "fundoInovacao",
        manualField: "fundoInovacao",
        isManualData: true,
      },
      {
        title: "Resultado sócios",
        monthlyGoal: (getGoalValue("partnersResult") || 0) / 12,
        annualAverage: getGoalValue("partnersResult") || 0,
        fieldName: "resultadoSocios",
        manualField: "resultadoSocios",
        isManualData: true,
      },
      {
        title: "Fundo emergencial",
        monthlyGoal: (getGoalValue("emergencyFund") || 0) / 12,
        annualAverage: getGoalValue("emergencyFund") || 0,
        fieldName: "fundoEmergencial",
        manualField: "fundoEmergencial",
        isManualData: true,
      },
    ];

    // Processar cada indicador
    const MONTH_KEYS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    indicatorsList.forEach((indicator) => {
      const monthlyValues: Record<string, number> = {};
      let totalValue = 0;

      // Buscar valores para cada mês
      for (let month = 1; month <= 12; month++) {
        const monthData = yearData.monthlyData.find((m: any) => m.month === month);
        const value = monthData ? (monthData[indicator.fieldName] || 0) : 0;
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
        monthlyValues[MONTH_KEYS[month - 1]] = numValue;
        totalValue += numValue;
      }

      // Buscar dados manuais se aplicável
      if (indicator.manualField) {
        for (let month = 1; month <= 12; month++) {
          const monthKey = `${parseInt(selectedYear)}-${String(month).padStart(2, '0')}`;
          const manualData = manualDataByMonth[monthKey];
          if (manualData && manualData[indicator.manualField] !== undefined) {
            monthlyValues[MONTH_KEYS[month - 1]] = manualData[indicator.manualField];
            totalValue = Object.values(monthlyValues).reduce((a: number, b: number) => a + b, 0);
          }
        }
      }

      // Calcular média mensal real (apenas meses com dados > 0)
      const monthsWithData = Object.values(monthlyValues).filter((v) => v > 0).length;
      const realAnnualAverage = monthsWithData > 0 ? totalValue / monthsWithData : 0;

      // Calcular % atingido com base na meta anual (annualAverage = meta anual)
      const annualGoal = indicator.annualAverage; // meta anual configurada
      const percentage = annualGoal > 0
        ? ((totalValue / annualGoal) * 100).toFixed(1)
        : "0.0";

      indicators.push({
        title: indicator.title,
        monthlyGoal: indicator.monthlyGoal,
        annualAverage: realAnnualAverage,
        percentageAchieved: percentage,
        total: totalValue,
        months: monthlyValues as any,
        isCurrency: indicator.isCurrency,
        isPercentage: indicator.isPercentage,
        isInteger: indicator.isInteger,
        isManualData: indicator.isManualData,
      });
    });

    return indicators;
  };

  const consolidatedData = buildConsolidatedData();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Título */}
        <h1 className="text-3xl font-bold">Indicadores</h1>

        {/* Header com Ano, Incluir dados manuais e Sincronizar Properfy */}
        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Ano</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.length > 0 ? (
                  availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={String(CURRENT_YEAR)}>
                    {CURRENT_YEAR}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={() => setIsDrawerOpen(true)}
            variant="outline"
            className="gap-2"
          >
            Incluir dados manuais
          </Button>
          
          <Button 
            onClick={handleSyncPropertyfy} 
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Properfy'}
          </Button>
        </div>

        {/* Tabela consolidada */}
        {isLoadingYear ? (
          <Card>
            <CardContent className="pt-6 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        ) : (
          <Card>
         