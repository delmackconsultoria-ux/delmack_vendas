import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Download, AlertCircle } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
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

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState("sales-engagement");
  const [selectedBroker, setSelectedBroker] = useState("all");

  // Buscar dados reais de vendas da empresa
  const { data: salesData } = trpc.sales.listMySales.useQuery();
  const sales = salesData?.sales || [];
  const { data: brokers = [] } = trpc.brokers.listBrokers.useQuery();

  // Calcular dados agregados por corretor
  const salesByBroker = brokers.map((broker: any) => {
    const brokerSales = sales.filter((s: any) => s.brokerId === broker.id);
    const totalVendas = brokerSales.reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);
    const totalAngariações = brokerSales.reduce((sum: number, s: any) => sum + (Number(s.engagementValue) || 0), 0);
    const qtdAngariações = brokerSales.filter((s: any) => s.engagementValue && Number(s.engagementValue) > 0).length;
    const qtdBaixas = brokerSales.filter((s: any) => s.status === 'cancelled').length;
    const valorBaixas = brokerSales.filter((s: any) => s.status === 'cancelled').reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);
    
    return {
      id: broker.id,
      name: broker.name,
      vendas: totalVendas,
      angariações: totalAngariações,
      qtdAngariações,
      qtdBaixas,
      valorBaixas,
    };
  });

  // Totais gerais
  const totalVendas = salesByBroker.reduce((sum: number, b: any) => sum + b.vendas, 0);
  const totalAngariações = salesByBroker.reduce((sum: number, b: any) => sum + b.angariações, 0);
  const totalQtdAngariações = salesByBroker.reduce((sum: number, b: any) => sum + b.qtdAngariações, 0);
  const totalQtdBaixas = salesByBroker.reduce((sum: number, b: any) => sum + b.qtdBaixas, 0);

  // Determinar dados a exibir baseado no filtro
  const getChartData = () => {
    let data = salesByBroker;
    
    if (selectedBroker !== "all") {
      data = data.filter((b: any) => b.id === selectedBroker);
    }

    if (reportType === "sales-engagement") {
      return data.map((d: any) => ({ name: d.name, vendas: d.vendas, angariações: d.angariações }));
    } else if (reportType === "engagement-qty") {
      return data.map((d: any) => ({ name: d.name, quantidade: d.qtdAngariações }));
    } else if (reportType === "cancellations-qty") {
      return data.map((d: any) => ({ name: d.name, quantidade: d.qtdBaixas }));
    } else if (reportType === "cancellations-value") {
      return data.map((d: any) => ({ name: d.name, valor: d.valorBaixas }));
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
  const hasData = sales.length > 0;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-slate-50 pt-16">
        <div className="px-6 py-8 max-w-7xl mx-auto">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Relatórios e Gráficos</h1>
            <p className="text-slate-600 mt-2">
              Acompanhe o desempenho de vendas, angariações e indicadores com gráficos interativos
            </p>
          </div>

          {!hasData ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-16 text-center">
                <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum dado disponível</h3>
                <p className="text-slate-500">
                  Ainda não há propostas cadastradas para sua empresa.
                  <br />
                  Os relatórios serão exibidos quando houver dados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filters */}
              <Card className="border-0 shadow-md mb-8 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        {brokers.map((broker: any) => (
                          <option key={broker.id} value={broker.id}>
                            {broker.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Download Button */}
                    <div className="flex items-end">
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Download className="h-4 w-4" />
                        Baixar Relatório
                      </button>
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
                      {formatCurrency(totalVendas)}
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
                      {formatCurrency(totalAngariações)}
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
                    <p className="text-3xl font-bold text-slate-900">{totalQtdAngariações}</p>
                    <p className="text-xs text-slate-600 mt-2">Período selecionado</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Qtd Baixas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-900">{totalQtdBaixas}</p>
                    <p className="text-xs text-slate-600 mt-2">Período selecionado</p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Chart */}
              <Card className="border-0 shadow-md mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {getChartTitle()}
                  </CardTitle>
                  <CardDescription>{getChartDescription()}</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      {reportType === "sales-engagement" ? (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
                          <Bar dataKey="angariações" fill="#8b5cf6" name="Angariações" />
                        </BarChart>
                      ) : (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey={reportType === "engagement-qty" ? "quantidade" : reportType === "cancellations-qty" ? "quantidade" : "valor"} fill="#3b82f6" />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      Nenhum dado para exibir
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
