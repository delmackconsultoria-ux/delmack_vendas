import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/_core/hooks/useAuth";
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

  // Buscar dados reais do backend
  const { data: rankingVendas = [] } = trpc.ranking.getVendasRanking.useQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  const { data: rankingAngariacao = [] } = trpc.ranking.getAngaricoesRanking.useQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  const { data: myPerformance } = trpc.ranking.getMyPerformance.useQuery(
    {
      month: selectedMonth,
      year: selectedYear,
    },
    { enabled: user?.role === "broker" }
  );

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

  const isBroker = user.role === "broker";
  const isManager = user.role === "manager";

  // Dados para gráfico de barras comparativo
  const comparisonData = rankingVendas.slice(0, 3).map((item) => ({
    nome: item.brokerName,
    vendas: item.quantidadeVendas,
    angariacao: rankingAngariacao.find((a) => a.brokerId === item.brokerId)?.quantidadeAngariacao || 0,
  }));

  // Dados para gráfico de pizza - distribuição de vendas
  const vendaDistribution = rankingVendas.map((item, index) => ({
    name: item.brokerName,
    value: item.valorTotal,
    fill: ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"][index % 4],
  }));

  // Mostrar top 3 + dados do próprio corretor se for broker
  let displayRankingVendas = rankingVendas;
  let displayRankingAngariacao = rankingAngariacao;

  if (isBroker) {
    displayRankingVendas = rankingVendas.slice(0, 3);
    displayRankingAngariacao = rankingAngariacao.slice(0, 3);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Padrão */}
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        {rankingVendas.length === 0 && (
          <Card className="bg-amber-50 border-amber-200 mb-8">
            <CardContent className="pt-6">
              <p className="text-amber-800">Nenhum dado cadastrado para este período. O ranking será exibido quando houver vendas registradas.</p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {!isBroker && rankingVendas.length > 0 && (
          <Card className="border-0 shadow-md mb-8 bg-white">
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
                    {[2024, 2025, 2026].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {rankingVendas.length > 0 && (
          <>
            {/* Ranking de Vendas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>Ranking de Vendas</CardTitle>
                  <CardDescription>Top corretores por valor vendido</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayRankingVendas.map((item) => (
                      <div key={item.brokerId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-lg font-bold">
                            {item.posicao}º
                          </Badge>
                          <div>
                            <p className="font-medium text-slate-900">{item.brokerName}</p>
                            <p className="text-sm text-slate-600">{item.quantidadeVendas} vendas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">
                            R$ {(item.valorTotal / 1000).toFixed(1)}k
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Ranking de Angariações */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>Ranking de Angariações</CardTitle>
                  <CardDescription>Top corretores por imóveis angariados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayRankingAngariacao.map((item) => (
                      <div key={item.brokerId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-lg font-bold">
                            {item.posicao}º
                          </Badge>
                          <div>
                            <p className="font-medium text-slate-900">{item.brokerName}</p>
                            <p className="text-sm text-slate-600">{item.quantidadeAngariacao} angariações</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">
                            R$ {(item.valorTotal / 1000).toFixed(1)}k
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico Comparativo */}
            {comparisonData.length > 0 && (
              <Card className="border-0 shadow-md mb-8">
                <CardHeader>
                  <CardTitle>Comparativo Top 3</CardTitle>
                  <CardDescription>Vendas vs Angariações</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="vendas" fill="#3b82f6" />
                      <Bar dataKey="angariacao" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Pizza */}
            {vendaDistribution.length > 0 && (
              <Card className="border-0 shadow-md mb-8">
                <CardHeader>
                  <CardTitle>Distribuição de Vendas</CardTitle>
                  <CardDescription>Percentual por corretor</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={vendaDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {vendaDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Meus Dados (apenas para corretores) */}
            {isBroker && myPerformance && (
              <Card className="border-0 shadow-md border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle>Meu Desempenho</CardTitle>
                  <CardDescription>Seu desempenho neste período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-slate-600">Vendas</p>
                      <p className="text-2xl font-bold text-blue-600">{myPerformance.vendas.quantidade}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-slate-600">Valor Vendido</p>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {(myPerformance.vendas.valor / 1000).toFixed(1)}k
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-slate-600">Angariações</p>
                      <p className="text-2xl font-bold text-purple-600">{myPerformance.angariacao.quantidade}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-slate-600">Valor Angariado</p>
                      <p className="text-2xl font-bold text-orange-600">
                        R$ {(myPerformance.angariacao.valor / 1000).toFixed(1)}k
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
