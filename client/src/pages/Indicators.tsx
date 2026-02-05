import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import React from "react";
import IndicatorDetailModal from "@/components/IndicatorDetailModal";
import { AppLayout } from "@/components/AppLayout";

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
  
  // Filtros de Mês/Ano
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  // Verificar se é empresa de Testes para mostrar dados mock
  const isTestCompany = user?.companyName?.toLowerCase().includes("testes") || user?.companyName?.toLowerCase().includes("teste");

  // Mock data for monthly evolution (replace with real data from API)
  const mockMonthlyData = [
    { month: "Jan", value: 5200000, prontos: 3000000, lancamentos: 2200000, todos: 5200000 },
    { month: "Fev", value: 5800000, prontos: 3200000, lancamentos: 2600000, todos: 5800000 },
    { month: "Mar", value: 6100000, prontos: 3500000, lancamentos: 2600000, todos: 6100000 },
    { month: "Abr", value: 5900000, prontos: 3300000, lancamentos: 2600000, todos: 5900000 },
    { month: "Mai", value: 6500000, prontos: 3800000, lancamentos: 2700000, todos: 6500000 },
    { month: "Jun", value: 7200000, prontos: 4200000, lancamentos: 3000000, todos: 7200000 },
    { month: "Jul", value: 6800000, prontos: 3900000, lancamentos: 2900000, todos: 6800000 },
    { month: "Ago", value: 7500000, prontos: 4400000, lancamentos: 3100000, todos: 7500000 },
    { month: "Set", value: 7100000, prontos: 4100000, lancamentos: 3000000, todos: 7100000 },
    { month: "Out", value: 8000000, prontos: 4600000, lancamentos: 3400000, todos: 8000000 },
  ];

  const mockBrokers = [
    { id: "1", name: "João Silva" },
    { id: "2", name: "Maria Santos" },
    { id: "3", name: "Pedro Costa" },
    { id: "4", name: "Ana Oliveira" },
  ];

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

  const indicators: Indicator[] = [
    { name: "Negócios no mês", meta: "R$ 15.000.000,00", media: "R$ 6.071.208,23", percentual: "40%", trend: "up" },
    { name: "Negócios no mês (unidades)", meta: "24", media: "R$ 12,13", percentual: "51%", trend: "up" },
    { name: "Vendas Canceladas", meta: "", media: "R$ 104.375,00", percentual: "#DIV/0!" },
    { name: "VSO - venda/oferta", meta: "5,00%", media: "#DIV/0!", percentual: "#DIV/0!" },
    { name: "Comissão Recebida", meta: "R$ 525.000,00", media: "R$ 238.250,81", percentual: "45%", trend: "up" },
    { name: "Comissão Vendida", meta: "R$ 600.000,00", media: "R$ 191.652,06", percentual: "32%", trend: "down" },
    { name: "Comissão Pendentes Final do mês", meta: "R$ 1.000.000,00", media: "R$ 613.863,85", percentual: "61%", trend: "up" },
    { name: "Carteira de Divulgação (em número)", meta: "410", media: "258", percentual: "63%", trend: "up" },
    { name: "Angariações mês", meta: "50", media: "32", percentual: "64%", trend: "up" },
    { name: "Baixas no mês (em quantidade)", meta: "17", media: "20", percentual: "120%", trend: "down" },
    { name: "% comissão vendida", meta: "4,00%", media: "3%", percentual: "65%", trend: "down" },
    { name: "Negócios de 1 a 1 milhão", meta: "5", media: "1", percentual: "23%", trend: "down" },
    { name: "Número de atendimentos Prontos", meta: "450", media: "271", percentual: "60%", trend: "up" },
    { name: "Número de atendimentos Lançamentos", meta: "400", media: "252", percentual: "63%", trend: "up" },
    { name: "Prazo médio recebimento de venda", meta: "60", media: "44", percentual: "73%", trend: "up" },
    { name: "% Com cancelada/ com pendente", meta: "5,00%", media: "#DIV/0!", percentual: "#DIV/0!" },
    { name: "Tempo médio de venda ang X venda", meta: "150", media: "99", percentual: "66%", trend: "up" },
    { name: "Valor médio do imóvel de venda", meta: "R$ 625.000,00", media: "R$ 307.518,50", percentual: "49%", trend: "down" },
    { name: "Negócios na Rede", meta: "5", media: "3", percentual: "53%", trend: "up" },
    { name: "Negócios Internos", meta: "12", media: "7", percentual: "55%", trend: "up" },
    { name: "Negócios Parceria Externa", meta: "12", media: "3", percentual: "24%", trend: "down" },
    { name: "Negócios Lançamentos", meta: "7", media: "-", percentual: "0%", trend: "down" },
    { name: "Negócios Prontos", meta: "12", media: "7", percentual: "58%", trend: "up" },
    { name: "Despesa Geral", meta: "R$ 50.000,00", media: "R$ 46.796,51", percentual: "94%", trend: "up" },
    { name: "Despesa com impostos", meta: "R$ 20.000,00", media: "R$ 32.161,61", percentual: "161%", trend: "down" },
    { name: "Fundo Inovação", meta: "R$ 100.000,00", media: "R$ 42.112,94", percentual: "42%", trend: "down" },
    { name: "Resultado Sócios", meta: "R$ 60.000,00", media: "R$ 26.860,90", percentual: "45%", trend: "down" },
    { name: "Fundo emergencial", meta: "R$ 105.228,04", media: "#DIV/0!", percentual: "#DIV/0!" },
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

  // Dados vazios para empresas que não são de teste
  const emptyIndicators: Indicator[] = indicators.map(ind => ({
    ...ind,
    meta: "-",
    media: "-",
    percentual: "0%",
    trend: undefined
  }));

  const displayIndicators = isTestCompany ? indicators : emptyIndicators;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Indicadores de Vendas</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe os principais indicadores de desempenho
          </p>
        </div>
        
        {!isTestCompany && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <p className="text-amber-800">Nenhum dado cadastrado para esta empresa. Os indicadores serão exibidos quando houver vendas registradas.</p>
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
                <p className="text-2xl font-bold text-green-600">{isTestCompany ? "14" : "0"}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium mb-1">Negativos</p>
                <p className="text-2xl font-bold text-red-600">{isTestCompany ? "8" : "0"}</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700 font-medium mb-1">Indefinidos</p>
                <p className="text-2xl font-bold text-slate-600">{isTestCompany ? "5" : "0"}</p>
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
          {displayIndicators.map((indicator, idx) => (
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
                    <p className="text-xs text-slate-600 mb-1">Média Anual</p>
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
          onClose={() => {
            setModalOpen(false);
            setSelectedIndicator(null);
          }}
          indicatorName={selectedIndicator}
          indicatorType="value"
          monthlyData={isTestCompany ? mockMonthlyData : []}
          brokers={isTestCompany ? mockBrokers : []}
          userRole={user?.role as "broker" | "manager" | "finance" | "admin" | "viewer"}
        />
      )}
    </AppLayout>
  );
}

