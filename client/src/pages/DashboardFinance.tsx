import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, CheckCircle, LogOut, AlertCircle, BarChart3 } from "lucide-react";
import { trpc } from "@/lib/trpc";
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

  // Dados mock para comissões por status
  const commissionsByStatus = [
    { status: "Pendentes", value: 45000, fill: "#fbbf24" },
    { status: "Recebidas", value: 125000, fill: "#60a5fa" },
    { status: "Pagas", value: 380000, fill: "#10b981" },
    { status: "Canceladas", value: 12000, fill: "#ef4444" },
  ];

  // Dados mock para comissões por corretor
  const commissionsByBroker = [
    { name: "João Silva", pendentes: 15000, recebidas: 45000, pagas: 120000 },
    { name: "Maria Santos", pendentes: 12000, recebidas: 35000, pagas: 95000 },
    { name: "Pedro Costa", pendentes: 18000, recebidas: 45000, pagas: 165000 },
  ];

  // Dados mock para evolução de pagamentos
  const paymentEvolution = [
    { mes: "Jan", pagos: 50000, pendentes: 30000 },
    { mes: "Fev", pagos: 75000, pendentes: 25000 },
    { mes: "Mar", pagos: 95000, pendentes: 35000 },
    { mes: "Abr", pagos: 120000, pendentes: 45000 },
    { mes: "Mai", pagos: 150000, pendentes: 40000 },
    { mes: "Jun", pagos: 180000, pendentes: 45000 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center text-white font-bold">
              D
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Delmack</h1>
              <p className="text-xs text-slate-600">Gestão Financeira</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <Badge variant="outline" className="text-xs">Financeiro</Badge>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Painel Financeiro</h2>
          <p className="text-slate-600 mt-2">
            Gerencie pagamentos de comissões e acompanhe o fluxo financeiro
          </p>
        </div>

        {/* Alert - Pending Approvals */}
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">Atenção: Comissões Pendentes</h3>
            <p className="text-sm text-amber-800 mt-1">
              Você tem 45 comissões aguardando aprovação para pagamento
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Pending Commissions */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all border-l-4 border-l-amber-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Pendentes de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">R$ 45.000</p>
              <p className="text-xs text-slate-600 mt-2">45 comissões aguardando</p>
            </CardContent>
          </Card>

          {/* To Pay */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all border-l-4 border-l-red-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-red-600" />
                A Pagar Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">R$ 125.000</p>
              <p className="text-xs text-slate-600 mt-2">Próximas 30 dias</p>
            </CardContent>
          </Card>

          {/* Already Paid */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all border-l-4 border-l-green-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Já Pagos Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">R$ 380.000</p>
              <p className="text-xs text-slate-600 mt-2">Comissões processadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Distribuição por Status */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribuição de Comissões por Status
              </CardTitle>
              <CardDescription>
                Visualização das comissões por situação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={commissionsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, value }) =>
                      `${status}: R$ ${(value / 1000).toFixed(0)}k`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {commissionsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => `R$ ${(value / 1000).toFixed(1)}k`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Evolução de Pagamentos */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Evolução de Pagamentos
              </CardTitle>
              <CardDescription>
                Histórico dos últimos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={paymentEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `R$ ${(value / 1000).toFixed(0)}k`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pagos"
                    stroke="#10b981"
                    name="Pagos"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="pendentes"
                    stroke="#fbbf24"
                    name="Pendentes"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Comissões por Corretor */}
        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Comissões por Corretor
            </CardTitle>
            <CardDescription>
              Comparação de comissões pendentes, recebidas e pagas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={commissionsByBroker}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Legend />
                <Bar dataKey="pendentes" fill="#fbbf24" name="Pendentes" />
                <Bar dataKey="recebidas" fill="#60a5fa" name="Recebidas" />
                <Bar dataKey="pagas" fill="#10b981" name="Pagas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Aprovar Comissões
              </CardTitle>
              <CardDescription>
                Revise e aprove comissões pendentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={() => setLocation("/sales-approval")}
              >
                Ir para Aprovação
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Relatório Financeiro
              </CardTitle>
              <CardDescription>
                Visualize relatórios e análises
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/reports")}
              >
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

