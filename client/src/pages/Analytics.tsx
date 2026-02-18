import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, LogOut, Target, Activity, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Analytics() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Scroll para topo ao entrar na página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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

  // Dados mock para performance da equipe (apenas para empresa de testes)
  const teamPerformance = isTestCompany ? [
    { name: "João Silva", vendas: 12, comissoes: 45000, meta: 50000 },
    { name: "Maria Santos", vendas: 8, comissoes: 35000, meta: 50000 },
    { name: "Pedro Costa", vendas: 15, comissoes: 65000, meta: 50000 },
  ] : [];

  // Dados mock para evolução de vendas (apenas para empresa de testes)
  const salesEvolution = isTestCompany ? [
    { mes: "Jan", vendas: 8, angariações: 15, canceladas: 2 },
    { mes: "Fev", vendas: 12, angariações: 18, canceladas: 1 },
    { mes: "Mar", vendas: 15, angariações: 22, canceladas: 3 },
    { mes: "Abr", vendas: 18, angariações: 25, canceladas: 2 },
    { mes: "Mai", vendas: 22, angariações: 28, canceladas: 4 },
    { mes: "Jun", vendas: 25, angariações: 32, canceladas: 3 },
  ] : [];

  // Dados mock para comissões por status (apenas para empresa de testes)
  const commissionsByStatus = isTestCompany ? [
    { status: "Pendentes", value: 45000, fill: "#fbbf24" },
    { status: "Recebidas", value: 125000, fill: "#60a5fa" },
    { status: "Pagas", value: 380000, fill: "#10b981" },
    { status: "Canceladas", value: 12000, fill: "#ef4444" },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header Padrão */}
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Análise de Dados</h2>
          <p className="text-slate-600 mt-1 text-sm">
            Visualize gráficos detalhados de vendas, comissões e performance da equipe
          </p>
        </div>

        {/* Mensagem de dados vazios */}
        {!isTestCompany && (
          <Card className="bg-amber-50 border-amber-200 mb-8">
            <CardContent className="pt-6">
              <p className="text-amber-800">Nenhum dado cadastrado para esta empresa. Os gráficos serão exibidos quando houver vendas registradas.</p>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Team Sales */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Vendas da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{isTestCompany ? "55" : "0"}</p>
              <p className="text-xs text-slate-600 mt-2">Este mês</p>
            </CardContent>
          </Card>

          {/* Active Brokers */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                Corretores Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{isTestCompany ? "3" : "0"}</p>
              <p className="text-xs text-slate-600 mt-2">Membros da equipe</p>
            </CardContent>
          </Card>

          {/* Total Commission */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-600" />
                Comissões Geradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{isTestCompany ? "R$ 145k" : "R$ 0"}</p>
              <p className="text-xs text-slate-600 mt-2">Este mês</p>
            </CardContent>
          </Card>

          {/* Goal Achievement */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                Meta Realizada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{isTestCompany ? "92%" : "0%"}</p>
              <p className="text-xs text-slate-600 mt-2">Do objetivo mensal</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts - Apenas para empresa de testes */}
        {isTestCompany && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Team Performance */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance da Equipe
              </CardTitle>
              <CardDescription>
                Vendas vs Meta por corretor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `R$ ${(value / 1000).toFixed(0)}k`} />
                  <Legend />
                  <Bar dataKey="comissoes" fill="#3b82f6" name="Comissões" />
                  <Bar dataKey="meta" fill="#d1d5db" name="Meta" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sales Evolution */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolução de Vendas
              </CardTitle>
              <CardDescription>
                Últimos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="vendas" stroke="#3b82f6" strokeWidth={2} name="Vendas" />
                  <Line type="monotone" dataKey="angariações" stroke="#10b981" strokeWidth={2} name="Angariações" />
                  <Line type="monotone" dataKey="canceladas" stroke="#ef4444" strokeWidth={2} name="Canceladas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Commissions by Status */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Comissões por Status
              </CardTitle>
              <CardDescription>
                Distribuição de comissões
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
                    label={({ status, value }) => `${status}: R$ ${(value / 1000).toFixed(0)}k`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {commissionsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `R$ ${(value / 1000).toFixed(1)}k`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        )}
      </main>
    </div>
  );
}
