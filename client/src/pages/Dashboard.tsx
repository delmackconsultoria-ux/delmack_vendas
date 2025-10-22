import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, FileText, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center text-white font-bold">
              D
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Delmack</h1>
              <p className="text-xs text-slate-600">Sistema de Vendas Imobiliárias</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-600 capitalize">{user.role}</p>
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
          <h2 className="text-3xl font-bold text-slate-900">Bem-vindo ao Dashboard</h2>
          <p className="text-slate-600 mt-2">
            Aqui você pode gerenciar suas vendas, comissões e visualizar insights sobre o negócio.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sales */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                Total de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-600 mt-1">Este mês</p>
            </CardContent>
          </Card>

          {/* Total Commission */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                Comissões Vendidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">R$ 0,00</p>
              <p className="text-xs text-slate-600 mt-1">Este mês</p>
            </CardContent>
          </Card>

          {/* Commissions Received */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-400" />
                Comissões Recebidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">R$ 0,00</p>
              <p className="text-xs text-slate-600 mt-1">Este mês</p>
            </CardContent>
          </Card>

          {/* Active Brokers */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                Corretores Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-xs text-slate-600 mt-1">Na empresa</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                Nova Venda
              </CardTitle>
              <CardDescription>
                Registre uma nova venda no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setLocation("/sales/new")}
                className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950"
              >
                Cadastrar Venda
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-600" />
                Minhas Vendas
              </CardTitle>
              <CardDescription>
                Visualize todas as suas vendas registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setLocation("/sales")}
                className="w-full"
              >
                Ver Vendas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-slate-100">
          <CardHeader>
            <CardTitle>Próximas Funcionalidades</CardTitle>
            <CardDescription>
              Estamos trabalhando em novos recursos para melhorar sua experiência
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>✓ Integração com Properfy para imóveis da Baggio</li>
              <li>✓ Cálculo automático de comissões</li>
              <li>✓ Dashboards com insights detalhados</li>
              <li>✓ Relatórios e exportação de dados</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

