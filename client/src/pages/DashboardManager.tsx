import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Target, Activity, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DashboardManager() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const now = new Date();
  const [periodMode, setPeriodMode] = useState<"anual" | "mensal">("anual");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear] = useState(now.getFullYear());
  // Buscar KPIs do dashboard
  const companyId = user?.companyId || user?.id || "";
  const { data: monthlyData, isLoading: isLoadingMonthly } = trpc.indicators.getRealtimeIndicators.useQuery(
    { companyId, month: selectedMonth, year: selectedYear },
    { enabled: periodMode === "mensal" && !!companyId }
  );
  const { data: yearlyData, isLoading: isLoadingYearly } = trpc.indicators.getYearIndicators.useQuery(
    { companyId, year: selectedYear },
    { enabled: periodMode === "anual" && !!companyId }
  );
  const isLoadingKPIs = periodMode === "mensal" ? isLoadingMonthly : isLoadingYearly;
  const kpiVgv = periodMode === "mensal"
    ? (monthlyData?.negociosValor || 0)
    : (yearlyData?.monthlyData?.reduce((s: number, m: any) => s + (m.negociosValor || 0), 0) || 0);
  const kpiCount = periodMode === "mensal"
    ? (monthlyData?.negociosUnidades || 0)
    : (yearlyData?.monthlyData?.reduce((s: number, m: any) => s + (m.negociosUnidades || 0), 0) || 0);
  const kpiTicket = kpiCount > 0 ? kpiVgv / kpiCount : 0;
  const kpiCommission = periodMode === "mensal"
    ? (monthlyData?.comissaoRecebida || 0)
    : (yearlyData?.monthlyData?.reduce((s: number, m: any) => s + (m.comissaoRecebida || 0), 0) || 0);
  const kpiLabel = periodMode === "anual" ? `Acumulado ${selectedYear}` : `${String(selectedMonth).padStart(2,'0')}/${selectedYear}`;

  if (!user) {
    return null;
  }

  // Dados mock removidos - usar dados reais do backend quando disponível
  const teamPerformance = [
    { name: "Corretor 1", comissoes: 15000, meta: 20000 },
    { name: "Corretor 2", comissoes: 18000, meta: 20000 },
    { name: "Corretor 3", comissoes: 12000, meta: 20000 },
  ];

  const salesEvolution = [
    { mes: "Jan", vendas: 45000 },
    { mes: "Fev", vendas: 52000 },
    { mes: "Mar", vendas: 48000 },
    { mes: "Abr", vendas: 61000 },
    { mes: "Mai", vendas: 55000 },
    { mes: "Jun", vendas: 67000 },
  ];



  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-background">
        {/* Main Content */}
        <div className="px-6 py-6 max-w-7xl mx-auto">
          {/* Welcome Section + Seletor de Período */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Painel de Gestão</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Acompanhe a performance da sua equipe e evolução das vendas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  className={`px-4 py-2 text-sm font-medium transition-colors ${periodMode === "anual" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  onClick={() => setPeriodMode("anual")}
                >
                  Anual
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium transition-colors ${periodMode === "mensal" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  onClick={() => setPeriodMode("mensal")}
                >
                  Mensal
                </button>
              </div>
              {periodMode === "mensal" && (
                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((m, i) => (
                      <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Aviso de dados vazios - removido, agora mostra dados reais */}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* VGV Mensal */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  VGV Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingKPIs ? (
                  <p className="text-3xl font-bold text-slate-400">...</p>
                ) : (
                  <p className="text-3xl font-bold text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(kpiVgv)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {kpiLabel}
                </p>
              </CardContent>
            </Card>

            {/* Quantidade de Vendas */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Quantidade de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingKPIs ? (
                  <p className="text-3xl font-bold text-slate-400">...</p>
                ) : (
                  <p className="text-3xl font-bold text-foreground">{kpiCount}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {kpiLabel}
                </p>
              </CardContent>
            </Card>

            {/* Ticket Médio */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-600" />
                  Ticket Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingKPIs ? (
                  <p className="text-3xl font-bold text-slate-400">...</p>
                ) : (
                  <p className="text-3xl font-bold text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(kpiTicket)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {kpiLabel}
                </p>
              </CardContent>
            </Card>

             {/* Comissões Recebidas */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  Comissões Recebidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingKPIs ? (
                  <p className="text-3xl font-bold text-slate-400">...</p>
                ) : (
                  <p className="text-3xl font-bold text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(kpiCommission)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {kpiLabel}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts - Removido dados mock, será implementado com dados reais */}
          {false && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Team Performance */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance da Equipe
                  </CardTitle>
                  <CardDescription>
                    Vendas vs Meta por corretor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={teamPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `R$ ${(value / 1000).toFixed(0)}k`} />
                      <Legend />
                      <Bar dataKey="comissoes" fill="#2563eb" name="Comissões" />
                      <Bar dataKey="meta" fill="#f0f0f0" name="Meta" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales Evolution */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Evolução de Vendas
                  </CardTitle>
                  <CardDescription>
                    Últimos 6 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="vendas"
                        stroke="#3b82f6"
                        name="Vendas"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="angariações"
                        stroke="#0b0bb5"
                        name="Angariações"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="canceladas"
                        stroke="#dc2626"
                        name="Canceladas"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Gerenciar Equipe
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie seus corretores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation("/brokers")}
                >
                  Ir para Equipe
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Relatórios
                </CardTitle>
                <CardDescription>
                  Análise detalhada de vendas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation("/reports")}
                >
                  Ver Relatórios
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Indicadores
                </CardTitle>
                <CardDescription>
                  KPIs e métricas da equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation("/indicators")}
                >
                  Ver Indicadores
                </Button>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </>
  );
}
