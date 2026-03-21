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

export default function Indicators() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(CURRENT_MONTH));
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_YEAR));
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
        isCurrency: false,
      },
      {
        title: "Angariações mês",
        monthlyGoal: (getGoalValue("prospectingMonth") || 600) / 12,
        annualAverage: getGoalValue("prospectingMonth") || 600,
        fieldName: "angariacesMes",
        isCurrency: false,
      },
      {
        title: "Baixas no mês (em quantidade)",
        monthlyGoal: (getGoalValue("removalsMonth") || 180) / 12,
        annualAverage: getGoalValue("removalsMonth") || 180,
        fieldName: "baixasMes",
        isCurrency: false,
      },
      {
        title: "% comissão vendida",
        monthlyGoal: (getGoalValue("commissionPercentage") || 0.6) / 12,
        annualAverage: getGoalValue("commissionPercentage") || 0.6,
        fieldName: "percentualComissaoVendida",
      },
      {
        title: "Negócios acima de 1 milhão",
        monthlyGoal: (getGoalValue("businessAboveOneMillion") || 60) / 12,
        annualAverage: getGoalValue("businessAboveOneMillion") || 60,
        fieldName: "negociosAcimaMilhao",
        isCurrency: false,
      },
      {
        title: "Prazo médio recebimento de venda",
        monthlyGoal: (getGoalValue("averageReceiptTime") || 90) / 12,
        annualAverage: getGoalValue("averageReceiptTime") || 90,
        fieldName: "prazoMedioRecebimento",
        isCurrency: false,
      },
      {
        title: "% Com cancelada / com pendente",
        monthlyGoal: (getGoalValue("cancelledVsPending") || 0.2) / 12,
        annualAverage: getGoalValue("cancelledVsPending") || 0.2,
        fieldName: "percentualCancelada",
      },
      {
        title: "Valor médio do imóvel de venda",
        monthlyGoal: (getGoalValue("averagePropertyValue") || 500000) / 12,
        annualAverage: getGoalValue("averagePropertyValue") || 500000,
        fieldName: "valorMedioImovel",
      },
      {
        title: "Negócios na Rede",
        monthlyGoal: (getGoalValue("businessNetwork") || 30) / 12,
        annualAverage: getGoalValue("businessNetwork") || 30,
        fieldName: "negociosRede",
      },
      {
        title: "Negócios Internos",
        monthlyGoal: (getGoalValue("businessInternal") || 30) / 12,
        annualAverage: getGoalValue("businessInternal") || 30,
        fieldName: "negociosInternos",
      },
      {
        title: "Negócios Parceria Externa",
        monthlyGoal: (getGoalValue("businessExternalPartnership") || 30) / 12,
        annualAverage: getGoalValue("businessExternalPartnership") || 30,
        fieldName: "negociosParcerias",
      },
      {
        title: "Negócios Lançamentos",
        monthlyGoal: (getGoalValue("businessLaunches") || 30) / 12,
        annualAverage: getGoalValue("businessLaunches") || 30,
        fieldName: "negociosLancamentos",
      },
      {
        title: "Número de atendimentos Prontos",
        monthlyGoal: (getGoalValue("attendanceReady") || 300) / 12,
        annualAverage: getGoalValue("attendanceReady") || 300,
        fieldName: "atendimentosProntos",
        isCurrency: false,
      },
      {
        title: "Número de atendimentos Lançamentos",
        monthlyGoal: (getGoalValue("attendanceLaunches") || 300) / 12,
        annualAverage: getGoalValue("attendanceLaunches") || 300,
        fieldName: "atendimentosLancamentos",
        isCurrency: false,
      },
      {
        title: "Tempo médio de venda ang X venda",
        monthlyGoal: (getGoalValue("averageSaleTime") || 90) / 12,
        annualAverage: getGoalValue("averageSaleTime") || 90,
        fieldName: "tempoMedioVenda",
        isCurrency: false,
      },
      {
        title: "Despesa Geral",
        monthlyGoal: (getGoalValue("generalExpense") || 50000) / 12,
        annualAverage: getGoalValue("generalExpense") || 50000,
        fieldName: "despesaGeral",
        manualField: "despesaGeral",
        isManualData: true,
      },
      {
        title: "Despesa com Impostos",
        monthlyGoal: (getGoalValue("taxExpense") || 30000) / 12,
        annualAverage: getGoalValue("taxExpense") || 30000,
        fieldName: "despesaImpostos",
        manualField: "despesaImpostos",
        isManualData: true,
      },
      {
        title: "Fundo Inovação",
        monthlyGoal: (getGoalValue("innovationFund") || 20000) / 12,
        annualAverage: getGoalValue("innovationFund") || 20000,
        fieldName: "fundoInovacao",
        manualField: "fundoInovacao",
        isManualData: true,
      },
      {
        title: "Resultado Sócios",
        monthlyGoal: (getGoalValue("partnersResult") || 100000) / 12,
        annualAverage: getGoalValue("partnersResult") || 100000,
        fieldName: "resultadoSocios",
        manualField: "resultadoSocios",
        isManualData: true,
      },
      {
        title: "Fundo Emergencial",
        monthlyGoal: (getGoalValue("emergencyFund") || 10000) / 12,
        annualAverage: getGoalValue("emergencyFund") || 10000,
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

      // Calcular percentual
      const percentage = indicator.monthlyGoal > 0 
        ? ((totalValue / (indicator.monthlyGoal * 12)) * 100).toFixed(1)
        : "0.0";

      indicators.push({
        title: indicator.title,
        monthlyGoal: indicator.monthlyGoal,
        annualAverage: indicator.annualAverage,
        percentageAchieved: percentage,
        total: totalValue,
        months: monthlyValues as any,
        isCurrency: indicator.isCurrency,
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
            <CardHeader>
              <CardTitle>Tabela Consolidada de Indicadores</CardTitle>
            </CardHeader>
            <CardContent>
              <IndicatorsConsolidatedTable indicators={consolidatedData} />
            </CardContent>
          </Card>
        )}

        {/* Modais */}
        {selectedIndicator && (
          <IndicatorHistoryModal
            isOpen={isModalOpen}
            onClose={closeIndicatorModal}
            indicatorName={selectedIndicator}
          />
        )}

        {/* Drawer para edição de dados manuais */}
        <ManualDataDrawer
          isOpen={isDrawerOpen}
          onClose={handleDrawerClose}
          month={parseInt(selectedMonth)}
          year={parseInt(selectedYear)}
          onSaveSuccess={() => {
            refetchYear();
            refetch();
            refetchMonthlyManualData();
          }}
        />
      </div>
    </AppLayout>
  );
}
