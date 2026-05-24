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

// Paleta de cores para o gráfico de pizza
const PIE_COLORS = [
  "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#84cc16", "#f97316",
  "#ec4899", "#6366f1", "#14b8a6", "#eab308",
  "#0b0bb5", "#2563eb", "#16a34a", "#dc2626",
];

// Formatar valor em R$ completo (ex: R$ 1.250.000,00)
function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Formatar valor abreviado para gráficos (ex: R$ 1,25M ou R$ 250k)
function formatBRLShort(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(2).replace('.', ',')}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`;
  }
  return formatBRL(value);
}

export default function Ranking() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  // Usar acumulado anual por padrão (month = 0 = acumulado do ano)
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = acumulado anual
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

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

  // Dados para gráfico de barras comparativo (top 5)
  const comparisonData = rankingVendas.slice(0, 5).map((item) => ({
    nome: item.brokerName.split(' ')[0], // Primeiro nome para caber no gráfico
    nomeCompleto: item.brokerName,
    vendas: item.quantidadeVendas,
    angariacao: rankingAngariacao.find((a) => a.brokerId === item.brokerId)?.quantidadeAngariacao || 0,
  }));

  // Dados para gráfico de pizza - distribuição de vendas (somente corretores da Baggio)
  const vendaDistribution = rankingVendas.map((item, index) => ({
    name: item.brokerName.split(' ')[0], // Primeiro nome
    nomeCompleto: item.brokerName,
    value: Number(item.valorTotal),
    fill: PIE_COLORS[index % PIE_COLORS.length],
  }));

  // Mostrar top 3 + dados do próprio corretor se for broker
  let displayRankingVendas = rankingVendas;
  let displayRankingAngariacao = rankingAngariacao;

  if (isBroker) {
    displayRankingVendas = rankingVendas.slice(0, 3);
    displayRankingAngariacao = rankingAngariacao.slice(0, 3);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Padrão */}
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Ranking de Vendas e Angariações
          </h2>
          <p className="text-muted-foreground mt-2">
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
        {!isBroker && (
          <Card className="border-0 shadow-md mb-8 bg-background">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mês */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Período
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value={0}>Acumulado anual</option>
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ano
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                      <div key={item.brokerId} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-lg font-bold min-w-[3rem] justify-center">
                            {item.posicao}º
                          </Badge>
                          <div>
                            <p className="font-medium text-foreground">{item.brokerName}</p>
                            <p className="text-sm text-muted-foreground">{item.quantidadeVendas} {item.quantidadeVendas === 1 ? 'venda' : 'vendas'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground text-sm">
                            {formatBRL(Number(item.valorTotal))}
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
                    {displayRankingAngariacao.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        Nenhuma angariação registrada neste período.
                      </p>
                    ) : (
                      displayRankingAngariacao.map((item) => (
                        <div key={item.brokerId || item.properfyUserId} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-lg font-bold min-w-[3rem] justify-center">
                              {item.posicao}º
                            </Badge>
                            <div>
                              <p className="font-medium text-foreground">{item.brokerName}</p>
                              <p className="text-sm text-muted-foreground">{item.quantidadeAngariacao} {item.quantidadeAngariacao === 1 ? 'angariação' : 'angariações'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground text-sm">
                              {Number(item.valorTotal) > 0 ? formatBRL(Number(item.valorTotal)) : '—'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico Comparativo */}
            {comparisonData.length > 0 && (
              <Card className="border-0 shadow-md mb-8">
                <CardHeader>
                  <CardTitle>Comparativo Top 5</CardTitle>
                  <CardDescription>Vendas vs Angariações por corretor</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }} barCategoryGap="30%" barGap={4}>
                      <defs>
                        <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1e40af" stopOpacity={1} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="gradAngariacao" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                          <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="nome" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: any, name: string) => [value, name === 'vendas' ? 'Vendas' : 'Angariações']}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.nomeCompleto || label}
                      />
                      <Legend
                        formatter={(value) => value === 'vendas' ? 'Vendas' : 'Angariações'}
                        wrapperStyle={{ paddingTop: '12px' }}
                      />
                      <Bar dataKey="vendas" fill="url(#gradVendas)" name="vendas" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="angariacao" fill="url(#gradAngariacao)" name="angariacao" radius={[4, 4, 0,