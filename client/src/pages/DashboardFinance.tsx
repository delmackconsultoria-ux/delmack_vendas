import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, CheckCircle, LogOut, AlertCircle, BarChart3, X, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { useState, useRef } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function DashboardFinance() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setLocation("/login");
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!user) {
    return null;
  }

  // Buscar dados financeiros do mês atual
  const { data: financeSummary, isLoading } = trpc.finance.getMonthlyFinanceSummary.useQuery({
    companyId: user.companyId || user.id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Preparar dados para gráficos
  const commissionsByType = financeSummary
    ? [
        {
          name: "Corretores",
          pendentes: financeSummary.commissionsToPay.brokers,
          pagas: financeSummary.commissionsPaid.brokers,
          fill: "#3b82f6",
        },
        {
          name: "Baggio",
          pendentes: financeSummary.commissionsToPay.baggio,
          pagas: financeSummary.commissionsPaid.baggio,
          fill: "#10b981",
        },
      ]
    : [];

  const managerBreakdownData = financeSummary
    ? Object.entries(financeSummary.commissionsPaid.managerBreakdown).map(([manager, value]) => ({
        name: manager,
        value: value,
      }))
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Padrão */}
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" ref={mainRef}>
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Painel Financeiro</h2>
          <p className="text-sm text-slate-600 mt-1">
            Gerencie pagamentos de comissões e acompanhe o fluxo financeiro
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-slate-600">Carregando dados financeiros...</p>
          </div>
        )}

        {/* No Data Alert */}
        {!isLoading && !financeSummary && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-800 font-medium">Nenhum dado cadastrado para este mês.</p>
              <p className="text-amber-700 text-sm mt-1">Os dados financeiros serão exibidos quando houver vendas registradas.</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {financeSummary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Comissão à Receber */}
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Comissão à Receber</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {formatCurrency(financeSummary.commissionsToPay.total)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {financeSummary.commissionsToPay.count} comissões
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-amber-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              {/* VGV - Valor Geral de Vendas */}
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">VGV (Valor Geral de Vendas)</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(financeSummary.vgv.total)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {financeSummary.vgv.count} vendas
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              {/* Comissão Recebida */}
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Comissão Recebida</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(financeSummary.commissionsPaid.total)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {financeSummary.commissionsPaid.count} comissões
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalhamento de Comissões */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Comissão à Receber - Detalhamento */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Comissão à Receber - Detalhamento</CardTitle>
                  <CardDescription>Pending + Received</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                      <span className="text-sm font-medium text-slate-700">Corretores</span>
                      <span className="text-sm font-bold text-blue-600">
                        {formatCurrency(financeSummary.commissionsToPay.brokers)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                      <span className="text-sm font-medium text-slate-700">Baggio</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(financeSummary.commissionsToPay.baggio)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded border border-amber-200">
                      <span className="text-sm font-bold text-slate-900">Total</span>
                      <span className="text-sm font-bold text-amber-600">
                        {formatCurrency(financeSummary.commissionsToPay.total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comissão Recebida - Detalhamento */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Comissão Recebida - Detalhamento</CardTitle>
                  <CardDescription>Status: Paid</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                      <span className="text-sm font-medium text-slate-700">Corretores</span>
                      <span className="text-sm font-bold text-blue-600">
                        {formatCurrency(financeSummary.commissionsPaid.brokers)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                      <span className="text-sm font-medium text-slate-700">Baggio</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(financeSummary.commissionsPaid.baggio)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
                      <span className="text-sm font-bold text-slate-900">Total</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(financeSummary.commissionsPaid.total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalhamento por Gerente - Comissão Recebida da Baggio */}
            {Object.keys(financeSummary.commissionsPaid.managerBreakdown).length > 0 && (
              <Card className="border-0 shadow-md mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">Comissão Recebida da Baggio - Por Gerente</CardTitle>
                  <CardDescription>Detalhamento de comissões pagas por gerente</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(financeSummary.commissionsPaid.managerBreakdown).map(([manager, value]) => (
                      <div key={manager} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                        <span className="text-sm font-medium text-slate-700">{manager}</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(value as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Comissões por Tipo */}
            {commissionsByType.length > 0 && (
              <Card className="border-0 shadow-md mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">Comissões: Pendentes vs Pagas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={commissionsByType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="pendentes" fill="#fbbf24" name="À Receber" />
                      <Bar dataKey="pagas" fill="#10b981" name="Recebidas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Comissões por Gerente */}
            {managerBreakdownData.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição de Comissões Recebidas por Gerente</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={managerBreakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${formatCurrency(value as number)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {managerBreakdownData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][index % 4]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
