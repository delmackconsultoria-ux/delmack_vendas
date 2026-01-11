import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function GoalsDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Query para buscar progresso da meta
  const { data: progress, isLoading } = trpc.goals.getGoalProgress.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  if (!user) {
    return null;
  }

  // Apenas gerentes, finance e admins podem acessar
  if (user.role !== "manager" && user.role !== "admin" && user.role !== "finance") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <p className="text-slate-900 font-semibold mb-4">
              Acesso restrito a gerentes e financeiro
            </p>
            <Button onClick={() => setLocation("/dashboard")}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Dados para gráfico de pizza (progresso)
  const pieData = progress
    ? [
        { name: "Atingido", value: progress.vgvAccumulated },
        { name: "Restante", value: Math.max(0, progress.remaining) },
      ]
    : [];

  const COLORS = ["#10b981", "#e5e7eb"];

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-8 w-8 text-orange-600" />
                <h1 className="text-3xl font-bold text-slate-900">
                  Dashboard de Metas
                </h1>
              </div>
              <p className="text-slate-600">
                Acompanhamento em tempo real do progresso de vendas
              </p>
            </div>
            <Button 
              onClick={() => setLocation("/goals-config")}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Configurar Metas
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Período</CardTitle>
            <CardDescription>Selecione o mês para visualizar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ano
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mês
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {months.map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Carregando dados...</p>
          </div>
        ) : progress ? (
          <>
            {/* Status Card - Destaque */}
            <Card className={`mb-6 border-l-4 ${progress.isOnTrack ? 'border-l-green-600 bg-green-50' : 'border-l-red-600 bg-red-50'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {progress.isOnTrack ? (
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    ) : (
                      <AlertCircle className="h-12 w-12 text-red-600" />
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {progress.isOnTrack ? "No Caminho Certo!" : "Atenção Necessária"}
                      </h2>
                      <p className="text-slate-600 mt-1">
                        {progress.isOnTrack 
                          ? `Você está ${(progress.percentageAchieved - progress.expectedProgress).toFixed(1)}% acima do esperado para o período`
                          : `Você está ${(progress.expectedProgress - progress.percentageAchieved).toFixed(1)}% abaixo do esperado para o período`
                        }
                      </p>
                    </div>
                  </div>
                  <Badge 
                    className={`text-lg px-4 py-2 ${
                      progress.isOnTrack 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {progress.percentageAchieved.toFixed(1)}% da meta
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Meta do Mês */}
              <Card className="border-l-4 border-l-purple-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Meta do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(progress.goal)}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {months[progress.month - 1]} {progress.year}
                  </p>
                </CardContent>
              </Card>

              {/* VGV Acumulado */}
              <Card className="border-l-4 border-l-green-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    VGV Acumulado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(progress.vgvAccumulated)}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Faltam {formatCurrency(progress.remaining)}
                  </p>
                </CardContent>
              </Card>

              {/* Projeção */}
              <Card className="border-l-4 border-l-blue-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Projeção de Fechamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(progress.projectedTotal)}
                  </div>
                  <Badge className={`mt-2 ${
                    progress.projectedPercentage >= 100 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {progress.projectedPercentage.toFixed(1)}% da meta
                  </Badge>
                </CardContent>
              </Card>

              {/* Dias Restantes */}
              <Card className="border-l-4 border-l-orange-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tempo Restante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {progress.daysRemaining} dias
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Dia {progress.currentDay} de {progress.daysInMonth}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfico de Pizza - Progresso */}
              <Card>
                <CardHeader>
                  <CardTitle>Progresso Visual</CardTitle>
                  <CardDescription>Distribuição da meta</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-4">
                    <div className="text-4xl font-bold text-slate-900">
                      {progress.percentageAchieved.toFixed(1)}%
                    </div>
                    <p className="text-slate-600 mt-1">da meta atingida</p>
                  </div>
                </CardContent>
              </Card>

              {/* Métricas Adicionais */}
              <Card>
                <CardHeader>
                  <CardTitle>Análise Detalhada</CardTitle>
                  <CardDescription>Métricas de performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Média Diária */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">
                          Média Diária Atual
                        </span>
                        <span className="text-lg font-bold text-slate-900">
                          {formatCurrency(progress.dailyAverage)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Baseado em {progress.currentDay} dias de vendas
                      </div>
                    </div>

                    {/* Média Necessária */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">
                          Média Diária Necessária
                        </span>
                        <span className="text-lg font-bold text-slate-900">
                          {formatCurrency(progress.remaining / Math.max(1, progress.daysRemaining))}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Para atingir a meta nos próximos {progress.daysRemaining} dias
                      </div>
                    </div>

                    {/* Progresso Esperado */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">
                          Progresso Esperado
                        </span>
                        <span className="text-lg font-bold text-slate-900">
                          {progress.expectedProgress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Baseado no dia {progress.currentDay} do mês
                      </div>
                    </div>

                    {/* Diferença */}
                    <div className={`p-4 rounded-lg ${
                      progress.isOnTrack ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {progress.isOnTrack ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`font-semibold ${
                          progress.isOnTrack ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {progress.isOnTrack ? 'Acima' : 'Abaixo'} do Esperado
                        </span>
                      </div>
                      <div className={`text-sm ${
                        progress.isOnTrack ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {Math.abs(progress.percentageAchieved - progress.expectedProgress).toFixed(1)}% de diferença
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Barra de Progresso Grande */}
            <Card>
              <CardHeader>
                <CardTitle>Progresso da Meta</CardTitle>
                <CardDescription>Visualização linear do avanço</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-slate-600">
                          Progresso Atual
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-slate-900">
                          {progress.percentageAchieved.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-6 mb-4 text-xs flex rounded-full bg-slate-200">
                      <div
                        style={{ width: `${Math.min(100, progress.percentageAchieved)}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          progress.percentageAchieved >= 100
                            ? 'bg-green-600'
                            : progress.isOnTrack
                            ? 'bg-blue-600'
                            : 'bg-orange-600'
                        }`}
                      ></div>
                    </div>
                  </div>

                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-slate-600">
                          Progresso Esperado
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-slate-900">
                          {progress.expectedProgress.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-slate-200">
                      <div
                        style={{ width: `${progress.expectedProgress}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-slate-400"
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Nenhum dado disponível para o período selecionado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
