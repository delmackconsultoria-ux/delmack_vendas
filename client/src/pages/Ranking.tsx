import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
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

  // Verificar se é empresa de Testes para mostrar dados mock
  const isTestCompany = user?.companyName?.toLowerCase().includes("testes") || user?.companyName?.toLowerCase().includes("teste");

  // Dados mock para ranking de vendas (apenas para empresa de testes)
  const mockRankingVendas = [
    { posicao: 1, nome: "Pedro Costa", vendas: 25, valor: 1562500, meta: 50000, percentualMeta: 156 },
    { posicao: 2, nome: "João Silva", vendas: 12, valor: 750000, meta: 50000, percentualMeta: 92 },
    { posicao: 3, nome: "Maria Santos", vendas: 8, valor: 500000, meta: 50000, percentualMeta: 62 },
    { posicao: 4, nome: "Ana Oliveira", vendas: 6, valor: 375000, meta: 50000, percentualMeta: 45 },
  ];

  // Dados mock para ranking de angariações (apenas para empresa de testes)
  const mockRankingAngariacao = [
    { posicao: 1, nome: "Maria Santos", angariacao: 32, valor: 1280000, meta: 30000, percentualMeta: 107 },
    { posicao: 2, nome: "Pedro Costa", angariacao: 28, valor: 1120000, meta: 30000, percentualMeta: 93 },
    { posicao: 3, nome: "João Silva", angariacao: 18, valor: 720000, meta: 30000, percentualMeta: 60 },
    { posicao: 4, nome: "Ana Oliveira", angariacao: 15, valor: 600000, meta: 30000, percentualMeta: 50 },
  ];

  // Usar dados mock apenas para empresa de testes
  const allRankingVendas = isTestCompany ? mockRankingVendas : [];
  const allRankingAngariacao = isTestCompany ? mockRankingAngariacao : [];

  const isBroker = user.role === "broker";
  const isManager = user.role === "manager";
  const isFinance = user.role === "finance";

  // Se for corretor, mostrar apenas top 3 + seus dados
  let rankingVendas = allRankingVendas;
  let rankingAngariacao = allRankingAngariacao;
  let brokerVendas = null;
  let brokerAngariacao = null;

  if (isBroker) {
    // Mock: João Silva é o corretor logado
    rankingVendas = allRankingVendas.slice(0, 3); // Top 3
    rankingAngariacao = allRankingAngariacao.slice(0, 3); // Top 3
    
    // Dados do próprio corretor
    brokerVendas = allRankingVendas.find(r => r.nome === "João Silva");
    brokerAngariacao = allRankingAngariacao.find(r => r.nome === "João Silva");
  }

  // Dados para gráfico de barras comparativo (apenas para empresa de testes)
  const comparisonData = isTestCompany ? [
    { nome: "Pedro Costa", vendas: 25, angariacao: 28 },
    { nome: "João Silva", vendas: 12, angariacao: 18 },
    { nome: "Maria Santos", vendas: 8, angariacao: 32 },
  ] : [];

  // Dados para gráfico de pizza - distribuição de vendas (apenas para empresa de testes)
  const vendaDistribution = isTestCompany ? [
    { name: "Pedro Costa", value: 1562500, fill: "#8b5cf6" },
    { name: "João Silva", value: 750000, fill: "#3b82f6" },
    { name: "Maria Santos", value: 500000, fill: "#10b981" },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      {/* Header Padrão */}
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Ranking de Vendas e Angariações
          </h2>
          <p className="text-slate-600 mt-2">
            {isBroker
              ? "Veja seu desempenho em relação ao ranking da equipe"
              : "Acompanhe o desempenho de toda a equipe"}
          </p>
        </div>

        {/* Mensagem de dados vazios */}
        {!isTestCompany && (
          <Card className="bg-amber-50 border-amber-200 mb-8">
            <CardContent className="pt-6">
              <p className="text-amber-800">Nenhum dado cadastrado para esta empresa. O ranking será exibido quando houver vendas registradas.</p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {!isBroker && isTestCompany && (
          <Card className="border-0 shadow-md mb-8 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mês */}
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
                        {new Date(2025, i).toLocaleString("pt-BR", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ano */}
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
        )}

        {/* Broker's Own Data */}
        {isTestCompany && isBroker && brokerVendas && brokerAngariacao && (
          <Card className="border-0 shadow-md mb-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Seus Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Posição em Vendas</p>
                  <p className="text-3xl font-bold text-blue-600">#{brokerVendas.posicao}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Vendas Realizadas</p>
                  <p className="text-3xl font-bold text-slate-900">{brokerVendas.vendas}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Valor Vendas</p>
                  <p className="text-2xl font-bold text-slate-900">
                    R$ {(brokerVendas.valor / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">% da Meta</p>
                  <Badge
                    className={
                      brokerVendas.percentualMeta >= 100
                        ? "bg-green-100 text-green-800 text-lg py-2"
                        : "bg-amber-100 text-amber-800 text-lg py-2"
                    }
                  >
                    {brokerVendas.percentualMeta}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Chart */}
        {isTestCompany && (
        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <CardTitle>Vendas vs Angariações</CardTitle>
            <CardDescription>
              Comparação entre vendas e angariações
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
                <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
                <Bar dataKey="angariacao" fill="#10b981" name="Angariações" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        )}

        {/* Ranking Vendas */}
        {isTestCompany && (
        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking de Vendas {isBroker ? "(Top 3)" : ""}
            </CardTitle>
            <CardDescription>
              Posição dos corretores em vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Posição
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Corretor
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Vendas
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Valor
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Meta
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      % Meta
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rankingVendas.map((rank) => (
                    <tr
                      key={rank.posicao}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${
                        isBroker && rank.nome === user.name
                          ? "bg-blue-50 border-l-4 border-l-blue-600"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            rank.posicao === 1
                              ? "bg-yellow-100 text-yellow-800"
                              : rank.posicao === 2
                              ? "bg-gray-100 text-gray-800"
                              : "bg-orange-100 text-orange-800"
                          }
                        >
                          #{rank.posicao}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-medium">
                        {rank.nome}
                        {isBroker && rank.nome === user.name && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Você
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-semibold">
                        {rank.vendas}
                      </td>
                      <td className="py-3 px-4 text-slate-900">
                        R$ {(rank.valor / 1000000).toFixed(2)}M
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        R$ {(rank.meta / 1000).toFixed(0)}k
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            rank.percentualMeta >= 100
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }
                        >
                          {rank.percentualMeta}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Ranking Angariações */}
        {isTestCompany && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking de Angariações {isBroker ? "(Top 3)" : ""}
            </CardTitle>
            <CardDescription>
              Posição dos corretores em angariações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Posição
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Corretor
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Angariações
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Valor
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Meta
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      % Meta
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rankingAngariacao.map((rank) => (
                    <tr
                      key={rank.posicao}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${
                        isBroker && rank.nome === user.name
                          ? "bg-blue-50 border-l-4 border-l-blue-600"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            rank.posicao === 1
                              ? "bg-yellow-100 text-yellow-800"
                              : rank.posicao === 2
                              ? "bg-gray-100 text-gray-800"
                              : "bg-orange-100 text-orange-800"
                          }
                        >
                          #{rank.posicao}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-medium">
                        {rank.nome}
                        {isBroker && rank.nome === user.name && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Você
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-semibold">
                        {rank.angariacao}
                      </td>
                      <td className="py-3 px-4 text-slate-900">
                        R$ {(rank.valor / 1000000).toFixed(2)}M
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        R$ {(rank.meta / 1000).toFixed(0)}k
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            rank.percentualMeta >= 100
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }
                        >
                          {rank.percentualMeta}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        )}
      </main>
    </div>
  );
}

