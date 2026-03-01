import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Target, Activity, AlertCircle } from "lucide-react";
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

  // Buscar KPIs do dashboard
  const { data: kpis, isLoading: isLoadingKPIs } = trpc.dashboard.getKPIs.useQuery();

  if (!user) {
    return null;
  }

  // Dados mock removidos - usar dados reais do backend quando disponível

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-slate-50">
        {/* Main Content */}
        <div className="px-6 py-6 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Painel de Gestão</h2>
            <p className="text-slate-600 mt-1 text-sm">
              Acompanhe a performance da sua equipe e evolução das vendas
            </p>
          </div>

          {/* Aviso de dados vazios - removido, agora mostra dados reais */}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* VGV Mensal */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  VGV Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingKPIs ? (
                  <p className="text-3xl font-bold text-slate-400">...</p>
                ) : (
                  <p className="text-3xl font-bold text-slate-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(kpis?.vgv || 0)}
                  </p>
                )}
                <p className="text-xs text-slate-600 mt-2">Este mês</p>
              </CardContent>
            </Card>

            {/* Quantidade de Vendas */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Quantidade de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingKPIs ? (
                  <p className="text-3xl font-bold text-slate-400">...</p>
                ) : (
                  <p className="text-3xl font-bold text-slate-900">{kpis?.salesCount || 0}</p>
                )}
                <p className="text-xs text-slate-600 mt-2">Este mês</p>
              </CardContent>
            </Card>

            {/* Ticket Médio */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-600" />
                  Ticket Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingKPIs ? (
                  <p className="text-3xl font-bold text-slate-400">...</p>
                ) : (
                  <p className="text-3xl font-bold text-slate-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(kpis?.averageTicket || 0)}
                  </p>
                )}
                <p className="text-xs text-slate-600 mt-2">Este mês</p>
              </CardContent>
            </Card>

            {/* Comissões Recebidas */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  Comissões Recebidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingKPIs ? (
                  <p className="text-3xl font-bold text-slate-400">...</p>
                ) : (
                  <p className="text-3xl font-bold text-slate-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(kpis?.receivedCommissions || 0)}
                  </p>
                )}
                <p className="text-xs text-slate-600 mt-2">Este mês</p>
              </CardContent>
            </Card>

            {/* Carteira Ativa */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  Carteira Ativa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingKPIs ? (
                  <p className="text-3xl font-bold text-slate-400">...</p>
                ) : (
                  <p className="text-3xl font-bold text-slate-900">{kpis?.activePortfolio || 0}</p>
                )}
                <p className="text-xs text-slate-600 mt-2">Imóveis ativos</p>
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
                      <Bar dataKey="comissoes" fill="#8b5cf6" name="Comissões" />
                      <Bar dataKey="meta" fill="#d1d5db" name="Meta" />
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
                        stroke="#10b981"
                        name="Vendas"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="angariações"
                        stroke="#60a5fa"
                        name="Angariações"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="canceladas"
                        stroke="#ef4444"
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
