import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, FileText, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch KPI data
  const { data: kpiData, isLoading: loadingKPI } = trpc.dashboard.getKPIData.useQuery();
  const { data: salesByType, isLoading: loadingSalesByType } = trpc.dashboard.getSalesByBusinessType.useQuery();
  const { data: commissionsByType, isLoading: loadingCommissionsByType } = trpc.dashboard.getCommissionsByBusinessType.useQuery();
  const { data: recentSales, isLoading: loadingRecentSales } = trpc.dashboard.getRecentSales.useQuery();

  // Fetch operational tables
  const { data: salesAndAngariations, isLoading: loadingSalesAndAngariations } =
    trpc.dashboard.getSalesAndAngariationsByBroker.useQuery();

  const isLoading =
    loadingKPI ||
    loadingSalesByType ||
    loadingCommissionsByType ||
    loadingRecentSales ||
    loadingSalesAndAngariations;

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

  const commissionsChartData = (commissionsByType || []).map((item) => ({
    name: item.businessType || "N/A",
    comissoes: Number(item.amount || 0),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Bem-vindo, {user.name}!</h2>
          <p className="text-slate-600 mt-2">
            Gerencie suas vendas e acompanhe suas comissões em tempo real
          </p>
        </div>

        {/* Call to Action */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white mb-8">
          <CardHeader>
            <CardTitle className="text-white">Registre uma Nova Venda</CardTitle>
            <CardDescription className="text-blue-100">
              Comece agora a registrar suas propostas de venda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation("/sales/new")}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              ➕ Nova Venda
            </Button>
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
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Vendas Este Mês */}
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Vendas Este Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-900">{kpiData?.salesThisMonth.count || 0}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {formatCurrency(kpiData?.salesThisMonth.value || 0)}
                  </p>
                </CardContent>
              </Card>

              {/* Comissões Ganhas */}
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Comissões Ganhas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatCurrency(kpiData?.commissions.total || 0)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Este mês</p>
                </CardContent>
              </Card>

              {/* Pendentes de Aprovação */}
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Pendentes de Aprovação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatCurrency(kpiData?.commissions.pending || 0)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Aguardando</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Minhas Vendas por Tipo */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-slate-600" />
                    Minhas Vendas por Tipo
                  </CardTitle>
                  <CardDescription>Distribuição das suas vendas</CardDescription>
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

              {/* Comissões por Tipo */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-slate-600" />
                    Comissões por Tipo
                  </CardTitle>
                  <CardDescription>Ganhos por tipo de negócio</CardDescription>
                </CardHeader>
                <CardContent>
                  {commissionsChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={commissionsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="comissoes" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-300 text-slate-600">
                      Sem dados disponíveis
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Minhas Vendas Recentes */}
            <Card className="border-0 shadow-sm mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  Minhas Vendas Recentes
                </CardTitle>
                <CardDescription>Acompanhe o status de suas propostas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Comprador</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Valor</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Tipo</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales && recentSales.length > 0 ? (
                        recentSales.map((sale, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-900">{sale.buyerName}</td>
                            <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                              {formatCurrency(Number(sale.saleValue))}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{sale.businessType}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  sale.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : sale.status === "received"
                                    ? "bg-blue-100 text-blue-800"
                                    : sale.status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {sale.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString("pt-BR") : "N/A"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 px-4 text-center text-slate-600">
                            Nenhuma venda registrada
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Tabela Operacional - Valor por Corretor */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Tabela Operacional: Valor por Corretor</CardTitle>
                <CardDescription>Mostrando valor total de angariações e vendas por corretor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Corretor</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesAndAngariations && salesAndAngariations.length > 0 ? (
                        salesAndAngariations.map((row, idx) => (
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
          </>
        )}
      </main>
    </div>
  );
}

