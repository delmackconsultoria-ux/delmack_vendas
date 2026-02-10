import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";
import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Indicator {
  name: string;
  meta: string | number;
  media: string | number;
  percentual: string;
  trend?: "up" | "down";
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Indicators() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [isSyncing, setIsSyncing] = useState(false);

  // Buscar indicadores reais do backend
  const { data: indicatorsData, isLoading, refetch } = trpc.indicators.getByMonth.useQuery(
    {
      month: selectedMonth !== "all" ? parseInt(selectedMonth) : undefined,
      year: selectedYear !== "all" ? parseInt(selectedYear) : undefined,
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

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Formatar percentual
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Construir indicadores a partir dos dados do Excel
  const buildIndicators = (): Indicator[] => {
    if (!indicatorsData?.success || !indicatorsData.indicators) {
      return [];
    }

    const data = indicatorsData.indicators;
    const indicators: Indicator[] = [];

    // Helper para extrair valor
    const getValue = (indicatorName: string) => {
      const ind = data[indicatorName];
      if (!ind) return 0;
      return ind.total || ind.mediaAnual || 0;
    };

    // Helper para calcular percentual de meta
    const getPercentOfMeta = (value: number, meta: number) => {
      if (meta === 0) return "-";
      return `${((value / meta) * 100).toFixed(0)}%`;
    };

    // 1. Negócios no mês (valor)
    const negociosValor = getValue("Negócios no mês");
    indicators.push({
      name: "Negócios no mês (valor)",
      meta: formatCurrency(14000),
      media: formatCurrency(negociosValor),
      percentual: getPercentOfMeta(negociosValor, 14000),
      trend: negociosValor > 7000 ? "up" : "down",
    });

    // 2. Negócios no mês (unidades)
    const negociosUnidades = getValue("Negócios no mês (unidades)");
    indicators.push({
      name: "Negócios no mês (unidades)",
      meta: "23",
      media: String(Math.round(negociosUnidades)),
      percentual: getPercentOfMeta(negociosUnidades, 23),
      trend: negociosUnidades > 12 ? "up" : "down",
    });

    // 3. VSO - venda/oferta
    const vso = getValue("VSO - venda /oferta");
    indicators.push({
      name: "VSO - venda/oferta",
      meta: "5,00%",
      media: vso > 0 ? formatPercent(vso * 100) : "-",
      percentual: vso > 0 ? getPercentOfMeta(vso * 100, 5) : "-",
    });

    // 4. Comissão Recebida
    const comissaoRecebida = getValue("Comissão Recebida");
    indicators.push({
      name: "Comissão Recebida",
      meta: formatCurrency(500000),
      media: formatCurrency(comissaoRecebida),
      percentual: getPercentOfMeta(comissaoRecebida, 500000),
      trend: comissaoRecebida > 250000 ? "up" : "down",
    });

    // 5. Comissão Vendida
    const comissaoVendida = getValue("Comissão Vendida");
    indicators.push({
      name: "Comissão Vendida",
      meta: formatCurrency(600000),
      media: formatCurrency(comissaoVendida),
      percentual: getPercentOfMeta(comissaoVendida, 600000),
      trend: comissaoVendida > 300000 ? "up" : "down",
    });

    // 6. Comissão Pendente
    const comissaoPendente = getValue("Comissão Pendentes Final do mês");
    indicators.push({
      name: "Comissão Pendente",
      meta: formatCurrency(1000000),
      media: formatCurrency(comissaoPendente),
      percentual: getPercentOfMeta(comissaoPendente, 1000000),
    });

    // 7. Carteira de Divulgação
    const carteira = getValue("Carteira de Divulgação ( em número)");
    indicators.push({
      name: "Carteira de Divulgação (em número)",
      meta: "410",
      media: carteira > 0 ? String(Math.round(carteira)) : "-",
      percentual: carteira > 0 ? getPercentOfMeta(carteira, 410) : "-",
    });

    // 8. Angariações mês
    const angariacoes = getValue("Angariações mês");
    indicators.push({
      name: "Angariações mês",
      meta: "50",
      media: angariacoes > 0 ? String(Math.round(angariacoes)) : "-",
      percentual: angariacoes > 0 ? getPercentOfMeta(angariacoes, 50) : "-",
    });

    // 9. Baixas no mês
    const baixas = getValue("Baixas no mês (em quantidade)");
    indicators.push({
      name: "Baixas no mês (em quantidade)",
      meta: "17",
      media: baixas > 0 ? String(Math.round(baixas)) : "-",
      percentual: baixas > 0 ? getPercentOfMeta(baixas, 17) : "-",
    });

    // 10. % comissão vendida
    const percComissao = getValue("% comissao vendida");
    indicators.push({
      name: "% comissão vendida",
      meta: "4,00%",
      media: percComissao > 0 ? formatPercent(percComissao * 100) : "-",
      percentual: percComissao > 0 ? getPercentOfMeta(percComissao * 100, 4) : "-",
    });

    // 11. Negócios acima de 750 mil
    const negociosAltos = getValue("Negócios acima de 750 mil");
    indicators.push({
      name: "Negócios acima de 750 mil",
      meta: "5",
      media: negociosAltos > 0 ? String(Math.round(negociosAltos)) : "-",
      percentual: negociosAltos > 0 ? getPercentOfMeta(negociosAltos, 5) : "-",
    });

    // 12. Número de atendimentos sedes
    const atendimentos = getValue("Número de atendimentos sedes");
    indicators.push({
      name: "Número de atendimentos sedes",
      meta: "850",
      media: atendimentos > 0 ? String(Math.round(atendimentos)) : "-",
      percentual: atendimentos > 0 ? getPercentOfMeta(atendimentos, 850) : "-",
    });

    // 13. Prazo médio recebimento
    const prazoRecebimento = getValue("Prazo médio recebimento de venda");
    indicators.push({
      name: "Prazo médio recebimento de venda",
      meta: "60 dias",
      media: prazoRecebimento > 0 ? `${Math.round(prazoRecebimento)} dias` : "-",
      percentual: prazoRecebimento > 0 ? getPercentOfMeta(prazoRecebimento, 60) : "-",
    });

    // 14. % Com cancelada/pendente
    const percCancelada = getValue("% Com cancelada/ com pendente");
    indicators.push({
      name: "% Com cancelada/ com pendente",
      meta: "5,00%",
      media: percCancelada > 0 ? formatPercent(percCancelada * 100) : "-",
      percentual: percCancelada > 0 ? getPercentOfMeta(percCancelada * 100, 5) : "-",
    });

    // 15. Tempo médio de venda
    const tempoVenda = getValue("Tempo médio de venda ang X venda");
    indicators.push({
      name: "Tempo médio de venda ang X venda",
      meta: "150 dias",
      media: tempoVenda > 0 ? `${Math.round(tempoVenda)} dias` : "-",
      percentual: tempoVenda > 0 ? getPercentOfMeta(tempoVenda, 150) : "-",
      trend: tempoVenda > 0 && tempoVenda < 150 ? "up" : "down",
    });

    // 16. Valor médio do imóvel
    const valorMedio = getValue("Valor médio do imóvel de venda");
    indicators.push({
      name: "Valor médio do imóvel de venda",
      meta: formatCurrency(800000),
      media: valorMedio > 0 ? formatCurrency(valorMedio) : "-",
      percentual: valorMedio > 0 ? getPercentOfMeta(valorMedio, 800000) : "-",
    });

    // 17. Negócios na Rede
    const negociosRede = getValue("Negócios na Rede");
    indicators.push({
      name: "Negócios na Rede",
      meta: "10",
      media: negociosRede > 0 ? String(Math.round(negociosRede)) : "-",
      percentual: negociosRede > 0 ? getPercentOfMeta(negociosRede, 10) : "-",
    });

    // 18. Despesa Geral
    const despesaGeral = getValue("Despesa Geral");
    indicators.push({
      name: "Despesa Geral",
      meta: formatCurrency(200000),
      media: despesaGeral > 0 ? formatCurrency(despesaGeral) : "-",
      percentual: despesaGeral > 0 ? getPercentOfMeta(despesaGeral, 200000) : "-",
    });

    // 19. Despesa com impostos
    const despesaImpostos = getValue("Despesa com impostos");
    indicators.push({
      name: "Despesa com impostos",
      meta: formatCurrency(150000),
      media: despesaImpostos > 0 ? formatCurrency(despesaImpostos) : "-",
      percentual: despesaImpostos > 0 ? getPercentOfMeta(despesaImpostos, 150000) : "-",
    });

    // 20. Fundo Inovação
    const fundoInovacao = getValue("Fundo Inovação");
    indicators.push({
      name: "Fundo Inovação",
      meta: formatCurrency(50000),
      media: fundoInovacao > 0 ? formatCurrency(fundoInovacao) : "-",
      percentual: fundoInovacao > 0 ? getPercentOfMeta(fundoInovacao, 50000) : "-",
    });

    // 21. Resultado Sócios
    const resultadoSocios = getValue("Resultado Sócios");
    indicators.push({
      name: "Resultado Sócios",
      meta: formatCurrency(300000),
      media: resultadoSocios > 0 ? formatCurrency(resultadoSocios) : "-",
      percentual: resultadoSocios > 0 ? getPercentOfMeta(resultadoSocios, 300000) : "-",
    });

    // 22. Fundo emergencial
    const fundoEmergencial = getValue("Fundo emergencial");
    indicators.push({
      name: "Fundo emergencial",
      meta: formatCurrency(100000),
      media: fundoEmergencial > 0 ? formatCurrency(fundoEmergencial) : "-",
      percentual: fundoEmergencial > 0 ? getPercentOfMeta(fundoEmergencial, 100000) : "-",
    });

    // 23. Negócios Internos
    const negociosInternos = getValue("Negócios Internos ");
    indicators.push({
      name: "Negócios Internos",
      meta: "15",
      media: negociosInternos > 0 ? String(Math.round(negociosInternos)) : "-",
      percentual: negociosInternos > 0 ? getPercentOfMeta(negociosInternos, 15) : "-",
    });

    // 24. Negócios Parceria Externa
    const negociosParceria = getValue("Negócios Parceria Externa");
    indicators.push({
      name: "Negócios Parceria Externa",
      meta: "8",
      media: negociosParceria > 0 ? String(Math.round(negociosParceria)) : "-",
      percentual: negociosParceria > 0 ? getPercentOfMeta(negociosParceria, 8) : "-",
    });

    // 25. Negócios Lançamentos
    const negociosLancamentos = getValue("Negócios Lançamentos");
    indicators.push({
      name: "Negócios Lançamentos",
      meta: "12",
      media: negociosLancamentos > 0 ? String(Math.round(negociosLancamentos)) : "-",
      percentual: negociosLancamentos > 0 ? getPercentOfMeta(negociosLancamentos, 12) : "-",
    });

    return indicators;
  };

  const indicators = buildIndicators();

  // Calcular resumo de performance
  const positivos = indicators.filter(i => i.trend === "up").length;
  const negativos = indicators.filter(i => i.trend === "down").length;
  const indefinidos = indicators.filter(i => !i.trend).length;

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Indicadores de Vendas</h1>
            <p className="text-muted-foreground">
              Acompanhe os principais indicadores de desempenho
            </p>
          </div>
          <Button
            onClick={handleSyncPropertyfy}
            disabled={isSyncing}
            variant="outline"
            className="gap-2"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sincronizar Properfy
              </>
            )}
          </Button>
        </div>

        {/* Resumo de Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">
                Positivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{positivos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">
                Negativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{negativos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Indefinidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{indefinidos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-6 items-center">
          <span className="text-sm text-muted-foreground">Filtros:</span>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {MONTH_NAMES.map((month, index) => (
                <SelectItem key={index + 1} value={String(index + 1)}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Indicadores Grid */}
        {!isLoading && indicators.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicators.map((indicator, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium">
                      {indicator.name}
                    </CardTitle>
                    {indicator.trend && (
                      <div className={indicator.trend === "up" ? "text-green-600" : "text-red-600"}>
                        {indicator.trend === "up" ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Meta Mensal</p>
                      <p className="text-lg font-semibold">{indicator.meta}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Atual</p>
                      <p className="text-lg font-semibold">{indicator.media}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Percentual</p>
                      <p className="text-lg font-semibold">{indicator.percentual}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && indicators.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhum indicador encontrado para o período selecionado.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
