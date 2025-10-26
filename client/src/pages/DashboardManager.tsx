import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Loader2, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
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
} from "recharts";

export default function DashboardManager() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedBroker, setSelectedBroker] = useState<string>("all");

  // Fetch all data
  const { data: table1, isLoading: loadingTable1 } = trpc.dashboard.getSalesAndAngariationsByBroker.useQuery();
  const { data: table2, isLoading: loadingTable2 } = trpc.dashboard.getAngariationValueByBroker.useQuery();
  const { data: table3, isLoading: loadingTable3 } = trpc.dashboard.getAngariationQuantityByBroker.useQuery();
  const { data: table4, isLoading: loadingTable4 } = trpc.dashboard.getCancelledSalesQuantityByBroker.useQuery();
  const { data: table5, isLoading: loadingTable5 } = trpc.dashboard.getCancelledSalesValueByBroker.useQuery();
  const { data: verificadores, isLoading: loadingVerificadores } = trpc.dashboard.getVerificadores.useQuery();
  const { data: salesByType, isLoading: loadingSalesByType } = trpc.dashboard.getSalesByBusinessType.useQuery();
  const { data: brokers, isLoading: loadingBrokers } = trpc.brokers.listBrokers.useQuery();

  const isLoading =
    loadingTable1 ||
    loadingTable2 ||
    loadingTable3 ||
    loadingTable4 ||
    loadingTable5 ||
    loadingVerificadores ||
    loadingSalesByType ||
    loadingBrokers;

  if (!user) {
    return null;
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Prepare chart data
  const salesChartData = (salesByType || []).map((item) => ({
    name: item.businessType || "N/A",
    vendas: Number(item.count || 0),
  }));

  // Calculate totals
  const totalVendidos = (table1 || []).reduce((sum, row) => sum + Number(row.salesValue || 0), 0);
  const totalRecebidos = verificadores?.sales.receivedValue || 0;
  const totalAngariados = (table2 || []).reduce((sum, row) => sum + Number(row.angariationValue || 0), 0);
  const totalDisponiveis = (table1 || []).length * 457; // Placeholder
  const totalBaixas = (table5 || []).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const totalComissoes = verificadores?.commissions.received || 0;
  const totalComissoesCanceladas = verificadores?.commissions.cancelled || 0;
  const totalComissoesPendentes = verificadores?.commissions.pending || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Dashboard Operacional</h2>
          <p className="text-slate-600 mt-2">
            Acompanhe o desempenho de toda a equipe e dados operacionais
          </p>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Month Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mês</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {new Date(2024, i).toLocaleDateString("pt-BR", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ano</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
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

              {/* Broker Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Corretor</label>
                <select
                  value={selectedBroker}
                  onChange={(e) => setSelectedBroker(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900"
                >
                  <option value="all">Todos os Corretores</option>
                  {brokers?.map((broker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
            <p className="ml-2 text-slate-600">Carregando dados...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Totalizadores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalVendidos)}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Recebidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRecebidos)}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Angariados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalAngariados)}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Disponíveis para Venda</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{totalDisponiveis}</p>
                </CardContent>
              </Card>
            </div>

            {/* More Totalizadores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total de Baixas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalBaixas)}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Comissões Pagas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalComissoes)}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Comissões Canceladas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalComissoesCanceladas)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico: Vendas por Tipo de Comissão */}
            <Card className="border-0 shadow-sm mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-slate-600" />
                  Vendas por Tipo de Comissão
                </CardTitle>
                <CardDescription>Distribuição de vendas por tipo</CardDescription>
              </CardHeader>
              <CardContent>
                {salesChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="vendas" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-300 text-slate-600">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEÇÃO OPERACIONAL */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4 bg-blue-600 text-white p-3 rounded">
                OPERACIONAL
              </h3>

              {/* Tabela 1: Valor por Corretor (Angariações + Vendas) */}
              <Card className="border-0 shadow-sm mb-6">
                <CardHeader>
                  <CardTitle>Tabela 1: Valor por Corretor (Angariações + Vendas)</CardTitle>
                  <CardDescription>Mostrando valor total de angariações e vendas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Corretor</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table1 && table1.length > 0 ? (
                          table1.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-900">{row.brokerName || "N/A"}</td>
                              <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                                {formatCurrency(Number(row.salesValue))}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="py-4 px-4 text-center text-slate-600">
                              Sem dados disponíveis
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela 2: Valor por Corretor (Angariações) */}
              <Card className="border-0 shadow-sm mb-6">
                <CardHeader>
                  <CardTitle>Tabela 2: Valor por Corretor (Angariações)</CardTitle>
                  <CardDescription>Mostrando apenas valor de angariações</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Corretor</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">Valor Angariações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table2 && table2.length > 0 ? (
                          table2.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-900">{row.brokerName || "N/A"}</td>
                              <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                                {formatCurrency(Number(row.angariationValue))}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="py-4 px-4 text-center text-slate-600">
                              Sem dados disponíveis
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela 3: Quantidade de Angariações por Corretor */}
              <Card className="border-0 shadow-sm mb-6">
                <CardHeader>
                  <CardTitle>Tabela 3: Quantidade de Angariações por Corretor</CardTitle>
                  <CardDescription>Mostrando quantidade de angariações</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Corretor</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">Quantidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table3 && table3.length > 0 ? (
                          table3.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-900">{row.brokerName || "N/A"}</td>
                              <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                                {Number(row.quantity)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="py-4 px-4 text-center text-slate-600">
                              Sem dados disponíveis
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela 4: Quantidade de Baixas por Corretor */}
              <Card className="border-0 shadow-sm mb-6">
                <CardHeader>
                  <CardTitle>Tabela 4: Quantidade de Baixas por Corretor</CardTitle>
                  <CardDescription>Mostrando quantidade de vendas canceladas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Corretor</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">Quantidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table4 && table4.length > 0 ? (
                          table4.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-900">{row.brokerName || "N/A"}</td>
                              <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                                {Number(row.quantity)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="py-4 px-4 text-center text-slate-600">
                              Sem dados disponíveis
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela 5: Valor de Baixas por Corretor */}
              <Card className="border-0 shadow-sm mb-6">
                <CardHeader>
                  <CardTitle>Tabela 5: Valor de Baixas por Corretor</CardTitle>
                  <CardDescription>Mostrando valor total de vendas canceladas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Corretor</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table5 && table5.length > 0 ? (
                          table5.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-900">{row.brokerName || "N/A"}</td>
                              <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                                {formatCurrency(Number(row.value))}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="py-4 px-4 text-center text-slate-600">
                              Sem dados disponíveis
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

