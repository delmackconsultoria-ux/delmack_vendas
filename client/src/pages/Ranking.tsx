import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, LogOut, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Ranking() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setLocation("/login");
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  if (!user) {
    return null;
  }

  // Dados mock para ranking de vendas
  const rankingVendas = [
    { posicao: 1, nome: "Pedro Costa", vendas: 25, valor: 1562500, meta: 50000, percentualMeta: 156 },
    { posicao: 2, nome: "João Silva", vendas: 12, valor: 750000, meta: 50000, percentualMeta: 92 },
    { posicao: 3, nome: "Maria Santos", vendas: 8, valor: 500000, meta: 50000, percentualMeta: 62 },
  ];

  // Dados mock para ranking de angariações
  const rankingAngariacao = [
    { posicao: 1, nome: "Maria Santos", angariacao: 32, valor: 1280000, meta: 30000, percentualMeta: 107 },
    { posicao: 2, nome: "Pedro Costa", angariacao: 28, valor: 1120000, meta: 30000, percentualMeta: 93 },
    { posicao: 3, nome: "João Silva", angariacao: 18, valor: 720000, meta: 30000, percentualMeta: 60 },
  ];

  // Dados para gráfico de barras comparativo
  const comparisonData = [
    { nome: "Pedro Costa", vendas: 25, angariacao: 28 },
    { nome: "João Silva", vendas: 12, angariacao: 18 },
    { nome: "Maria Santos", vendas: 8, angariacao: 32 },
  ];

  // Dados para gráfico de pizza - distribuição de vendas
  const vendaDistribution = [
    { name: "Pedro Costa", value: 1562500, fill: "#8b5cf6" },
    { name: "João Silva", value: 750000, fill: "#3b82f6" },
    { name: "Maria Santos", value: 500000, fill: "#10b981" },
  ];

  const isManager = user.role === "manager";
  const isBroker = user.role === "broker";

  // Se for corretor, mostrar apenas seus dados + média + ranking
  const brokerRanking = isBroker ? rankingVendas : rankingVendas;
  const brokerPosition = isBroker ? 2 : 1; // Mock: João Silva está em 2º lugar

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-lg flex items-center justify-center text-white font-bold">
              D
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Delmack</h1>
              <p className="text-xs text-slate-600">Ranking de Vendas</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <Badge variant="outline" className="text-xs">
                {user.role === "manager" ? "Gerente" : user.role === "broker" ? "Corretor" : "Financeiro"}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-500" />
            Ranking de Vendas e Angariações
          </h2>
          <p className="text-slate-600 mt-2">
            Acompanhe o desempenho da equipe e sua posição no ranking
          </p>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mês
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleString("pt-BR", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ano
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Broker Personal Stats */}
        {isBroker && (
          <div className="mb-8 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg shadow-lg p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-indigo-100 text-sm">Sua Posição</p>
                <p className="text-4xl font-bold mt-2">#{brokerPosition}</p>
              </div>
              <div>
                <p className="text-indigo-100 text-sm">Suas Vendas</p>
                <p className="text-4xl font-bold mt-2">12</p>
              </div>
              <div>
                <p className="text-indigo-100 text-sm">Suas Angariações</p>
                <p className="text-4xl font-bold mt-2">18</p>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Comparison Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Vendas vs Angariações
              </CardTitle>
              <CardDescription>
                Comparação entre vendas e angariações por corretor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="vendas" fill="#8b5cf6" name="Vendas" />
                  <Bar dataKey="angariacao" fill="#3b82f6" name="Angariações" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribution Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Distribuição de Vendas
              </CardTitle>
              <CardDescription>
                Percentual de vendas por corretor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={vendaDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: R$ ${(value / 1000000).toFixed(1)}M`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {vendaDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `R$ ${(value / 1000000).toFixed(1)}M`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Rankings Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ranking Vendas */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Ranking de Vendas
              </CardTitle>
              <CardDescription>
                Posicionamento por número de vendas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rankingVendas.map((item) => (
                  <div
                    key={item.posicao}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isBroker && item.nome === user.name
                        ? "bg-indigo-50 border-indigo-300"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold">
                        {item.posicao}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.nome}</p>
                        <p className="text-xs text-slate-600">{item.vendas} vendas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">R$ {(item.valor / 1000).toFixed(0)}k</p>
                      <Badge variant="outline" className="mt-1">
                        {item.percentualMeta}% da meta
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ranking Angariações */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-500" />
                Ranking de Angariações
              </CardTitle>
              <CardDescription>
                Posicionamento por número de angariações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rankingAngariacao.map((item) => (
                  <div
                    key={item.posicao}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isBroker && item.nome === user.name
                        ? "bg-indigo-50 border-indigo-300"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold">
                        {item.posicao}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.nome}</p>
                        <p className="text-xs text-slate-600">{item.angariacao} angariações</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">R$ {(item.valor / 1000).toFixed(0)}k</p>
                      <Badge variant="outline" className="mt-1">
                        {item.percentualMeta}% da meta
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Average Stats */}
        {isBroker && (
          <Card className="border-0 shadow-md mt-8">
            <CardHeader>
              <CardTitle>Sua Performance vs Média da Equipe</CardTitle>
              <CardDescription>
                Comparação com a média dos corretores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                  <p className="text-sm font-medium text-indigo-900">Vendas</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">12</p>
                  <p className="text-xs text-indigo-700 mt-1">Média: 15</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Angariações</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">18</p>
                  <p className="text-xs text-blue-700 mt-1">Média: 26</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-900">Comissões</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">R$ 45k</p>
                  <p className="text-xs text-green-700 mt-1">Média: R$ 52k</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

