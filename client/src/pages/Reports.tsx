import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, LogOut, Download } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
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

export default function Reports() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [reportType, setReportType] = useState("sales-engagement");
  const [selectedBroker, setSelectedBroker] = useState("all");
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

  // Mock data - corretores
  const brokers = [
    { id: "1", name: "João Silva" },
    { id: "2", name: "Maria Santos" },
    { id: "3", name: "Pedro Costa" },
    { id: "4", name: "Ana Oliveira" },
  ];

  // Mock data - vendas e angariações por corretor
  const salesEngagementData = [
    { name: "João Silva", vendas: 1800000, angariações: 2500000 },
    { name: "Maria Santos", vendas: 2100000, angariações: 1900000 },
    { name: "Pedro Costa", vendas: 1600000, angariações: 2100000 },
    { name: "Ana Oliveira", vendas: 2200000, angariações: 1800000 },
  ];

  // Mock data - quantidade de angariações
  const engagementQtyData = [
    { name: "João Silva", quantidade: 45 },
    { name: "Maria Santos", quantidade: 38 },
    { name: "Pedro Costa", quantidade: 42 },
    { name: "Ana Oliveira", quantidade: 50 },
  ];

  // Mock data - quantidade de baixas
  const cancellationsQtyData = [
    { name: "João Silva", quantidade: 8 },
    { name: "Maria Santos", quantidade: 5 },
    { name: "Pedro Costa", quantidade: 7 },
    { name: "Ana Oliveira", quantidade: 6 },
  ];

  // Mock data - valor de baixas
  const cancellationsValueData = [
    { name: "João Silva", valor: 450000 },
    { name: "Maria Santos", valor: 320000 },
    { name: "Pedro Costa", valor: 380000 },
    { name: "Ana Oliveira", valor: 410000 },
  ];

  // Mock data - evolução mensal
  const monthlyEvolutionData = [
    { mes: "Jan", vendas: 8500000, angariações: 9200000 },
    { mes: "Fev", vendas: 9100000, angariações: 8800000 },
    { mes: "Mar", vendas: 7700000, angariações: 8100000 },
    { mes: "Abr", vendas: 10200000, angariações: 9500000 },
  ];

  // Determinar dados a exibir baseado no filtro
  const getChartData = () => {
    if (selectedBroker !== "all") {
      const brokerData = brokers.find((b) => b.id === selectedBroker);
      if (reportType === "sales-engagement") {
        return [salesEngagementData.find((d) => d.name === brokerData?.name)];
      } else if (reportType === "engagement-qty") {
        return [engagementQtyData.find((d) => d.name === brokerData?.name)];
      } else if (reportType === "cancellations-qty") {
        return [cancellationsQtyData.find((d) => d.name === brokerData?.name)];
      } else if (reportType === "cancellations-value") {
        return [cancellationsValueData.find((d) => d.name === brokerData?.name)];
      }
    }

    // Retornar todos os dados se "all" estiver selecionado
    if (reportType === "sales-engagement") {
      return salesEngagementData;
    } else if (reportType === "engagement-qty") {
      return engagementQtyData;
    } else if (reportType === "cancellations-qty") {
      return cancellationsQtyData;
    } else if (reportType === "cancellations-value") {
      return cancellationsValueData;
    }
    return [];
  };

  const getChartTitle = () => {
    switch (reportType) {
      case "sales-engagement":
        return "Vendas + Angariações por Corretor";
      case "engagement-qty":
        return "Quantidade de Angariações por Corretor";
      case "cancellations-qty":
        return "Quantidade de Baixas por Corretor";
      case "cancellations-value":
        return "Valor de Baixas por Corretor";
      default:
        return "Relatório";
    }
  };

  const getChartDescription = () => {
    switch (reportType) {
      case "sales-engagement":
        return "Mostra o valor total de vendas e angariações por corretor";
      case "engagement-qty":
        return "Mostra a quantidade de angariações realizadas por corretor";
      case "cancellations-qty":
        return "Mostra a quantidade de cancelamentos/baixas por corretor";
      case "cancellations-value":
        return "Mostra o valor total de cancelamentos/baixas por corretor";
      default:
        return "";
    }
  };

  const chartData = getChartData();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Title Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios e Análises</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o desempenho de vendas, angariações e indicadores
          </p>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md mb-8 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Tipo de Relatório */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Relatório
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sales-engagement">Vendas + Angariações</option>
                  <option value="engagement-qty">Qtd Angariações</option>
                  <option value="cancellations-qty">Qtd Baixas</option>
                  <option value="cancellations-value">Valor Baixas</option>
                </select>
              </div>

              {/* Corretor */}
              {(user.role === "manager" || user.role === "finance") && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Corretor
                  </label>
                  <select
                    value={selectedBroker}
                    onChange={(e) => setSelectedBroker(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos</option>
                    {brokers.map((broker) => (
                      <option key={broker.id} value={broker.id}>
                        {broker.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mês */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mês
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                R$ {(7700000 / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-slate-600 mt-2">Período selecionado</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Angariações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                R$ {(8100000 / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-slate-600 mt-2">Período selecionado</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Qtd Angariações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">175</p>
              <p className="text-xs text-slate-600 mt-2">Período selecionado</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Valor Baixas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                R$ {(1560000 / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-slate-600 mt-2">Período selecionado</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart */}
        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <CardTitle>{getChartTitle()}</CardTitle>
            <CardDescription>{getChartDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              {reportType === "sales-engagement" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) =>
                      `R$ ${(value / 1000000).toFixed(2)}M`
                    }
                  />
                  <Legend />
                  <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
                  <Bar dataKey="angariações" fill="#10b981" name="Angariações" />
                </BarChart>
              ) : reportType === "engagement-qty" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantidade" fill="#8b5cf6" name="Quantidade" />
                </BarChart>
              ) : reportType === "cancellations-qty" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantidade" fill="#ef4444" name="Quantidade" />
                </BarChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) =>
                      `R$ ${(value / 1000000).toFixed(2)}M`
                    }
                  />
                  <Legend />
                  <Bar dataKey="valor" fill="#f59e0b" name="Valor" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Evolution Chart */}
        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <CardDescription>
              Acompanhe a evolução de vendas e angariações ao longo dos meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) =>
                    `R$ ${(value / 1000000).toFixed(2)}M`
                  }
                />
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
                  stroke="#10b981"
                  name="Angariações"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

