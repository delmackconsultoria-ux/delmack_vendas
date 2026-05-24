import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, DollarSign, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
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

export default function SalesByResponsible() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | "all">("all");

  // Query para buscar vendas por responsável
  const { data: salesData, isLoading } = trpc.sales.getSalesByResponsible.useQuery({
    year,
    month: month === "all" ? undefined : month,
  });

  if (!user) {
    return null;
  }

  // Apenas gerentes e admins podem acessar
  if (user.role !== "manager" && user.role !== "admin" && user.role !== "finance") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <p className="text-foreground font-semibold mb-4">
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

  // Dados para gráficos
  const chartData = salesData
    ? [
        {
          name: "Lucas",
          vendas: salesData.lucas.quantity,
          vgv: salesData.lucas.totalVGV,
        },
        {
          name: "Camila",
          vendas: salesData.camila.quantity,
          vgv: salesData.camila.totalVGV,
        },
      ]
    : [];

  const pieData = salesData
    ? [
        { name: "Lucas", value: salesData.lucas.totalVGV },
        { name: "Camila", value: salesData.camila.totalVGV },
      ]
    : [];

  const COLORS = ["#f97316", "#3b82f6"];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-foreground">
              Vendas por Responsável
            </h1>
          </div>
          <p className="text-muted-foreground">
            Análise de vendas por responsável (Lucas - Lançamentos, Camila - Prontos)
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione o período para análise</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Ano
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Mês
                </label>
                <select
                  value={month}
                  onChange={(e) =>
                    setMonth(e.target.value === "all" ? "all" : parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Todos os meses</option>
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
            <p className="text-muted-foreground mt-4">Carregando dados...</p>
          </div>
        ) : salesData ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Total Geral */}
              <Card className="border-l-4 border-l-purple-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    VGV Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(salesData.total.totalVGV)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {salesData.total.quantity} vendas
                  </p>
                </CardContent>
              </Card>

              {/* Lucas */}
              <Card className="border-l-4 border-l-orange-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Lucas (Lançamentos)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(salesData.lucas.totalVGV)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {salesData.lucas.quantity} vendas
                  </p>
                  <Badge className="mt-2 bg-orange-100 text-orange-700">
                    {((salesData.lucas.totalVGV / salesData.total.totalVGV) * 100).toFixed(1)}%
                  </Badge>
                </CardContent>
              </Card>

              {/* Camila */}
              <Card className="border-l-4 border-l-blue-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Camila (Prontos)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(salesData.camila.totalVGV)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {salesData.camila.quantity} vendas
                  </p>
                  <Badge className="mt-2 bg-blue-100 text-blue-700">
                    {((salesData.camila.totalVGV / salesData.total.totalVGV) * 100).toFixed(1)}%
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfico de Barras - VGV */}
              <Card>
                <CardHeader>
                  <CardTitle>VGV por Responsável</CardTitle>
                  <CardDescription>Comparação de valores</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="vgv" name="VGV" fill="#1d4ed8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Pizza - Distribuição */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de VGV</CardTitle>
                  <CardDescription>Percentual por responsável</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${((entry.value / salesData.total.totalVGV) * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#0b0bb5"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Tabela Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Responsável</CardTitle>
                <CardDescription>Estatísticas completas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Responsável
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Tipo
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">
                          Quantidade
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">
                          VGV Total
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">
                          Ticket Médio
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">
                          % do Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100 hover:bg-background">
                        <td className="py-3 px-4 font-medium text-foreground">Lucas</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <Badge className="bg-orange-100 text-orange-700">Lançamentos</Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-foreground">
                          {salesData.lucas.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-foreground">
                          {formatCurrency(salesData.lucas.totalVGV)}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {formatCurrency(
                            salesData.lucas.quantity > 0
                              ? salesData.lucas.totalVGV / salesData.lucas.quantity
                              : 0
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {((salesData.lucas.totalVGV / salesData.total.totalVGV) * 100).toFixed(1)}%
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100 hover:bg-background">
                        <td className="py-3 px-4 font-medium text-foreground">Camila</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          <Badge className="bg-blue-100 text-blue-700">Prontos</Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-foreground">
                          {salesData.camila.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-foreground">
                          {formatCurrency(salesData.camila.totalVGV)}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {formatCurrency(
                            salesData.camila.quantity > 0
                              ? salesData.camila.totalVGV / salesData.camila.quantity
                              : 0
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {((salesData.camila.totalVGV / salesData.total.totalVGV) * 100).toFixed(1)}%
                        </td>
                      </tr>
                      <tr className="bg-muted font-semibold">
                        <td className="py-3 px-4 text-foreground">Total</td>
                        <td className="py-3 px-4"></td>
                        <td className="py-3 px-4 text-right text-foreground">
                          {salesData.total.quantity}
                        </td>
                        <td className="py-3 px-4 text-right text-foreground">
                          {formatCurrency(salesData.total.totalVGV)}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {formatCurrency(
                            salesData.total.quantity > 0
                              ? salesData.total.totalVGV / salesData.total.quantity
                              : 0
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma venda encontrada para o período selecionado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
