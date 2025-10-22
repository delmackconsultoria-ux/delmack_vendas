import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Home, LogOut, Plus, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function DashboardBroker() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold">
              D
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Delmack</h1>
              <p className="text-xs text-slate-600">Plataforma de Vendas</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <Badge variant="outline" className="text-xs">🏠 Corretor</Badge>
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
          <h2 className="text-3xl font-bold text-slate-900">Bem-vindo, {user.name?.split(' ')[0]}! 👋</h2>
          <p className="text-slate-600 mt-2">
            Gerencie suas vendas e acompanhe suas comissões em tempo real
          </p>
        </div>

        {/* Primary CTA - New Sale */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Registre uma Nova Venda</h3>
              <p className="text-blue-100">Comece agora a registrar suas propostas de venda</p>
            </div>
            <Button
              onClick={() => setLocation("/sales/new")}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold gap-2"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Nova Venda
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Sales */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Home className="h-4 w-4 text-blue-600" />
                Vendas Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-600 mt-2">Propostas registradas</p>
            </CardContent>
          </Card>

          {/* Total Commission */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Comissões Ganhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">R$ 0,00</p>
              <p className="text-xs text-slate-600 mt-2">Este mês</p>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-600" />
                Pendentes de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-600 mt-2">Aguardando financeiro</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales Section */}
        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Minhas Vendas Recentes</CardTitle>
                <CardDescription>
                  Acompanhe o status de suas propostas
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setLocation("/sales")}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Nenhuma venda registrada ainda</p>
              <p className="text-slate-500 text-sm mt-1">
                Comece registrando sua primeira venda
              </p>
              <Button
                onClick={() => setLocation("/sales/new")}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Venda
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Minhas Comissões
              </CardTitle>
              <CardDescription>
                Visualize todas as suas comissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setLocation("/commissions")}
                className="w-full"
              >
                Ver Comissões
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Meu Desempenho
              </CardTitle>
              <CardDescription>
                Acompanhe suas estatísticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setLocation("/performance")}
                className="w-full"
              >
                Ver Desempenho
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

