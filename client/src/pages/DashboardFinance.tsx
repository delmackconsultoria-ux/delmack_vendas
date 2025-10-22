import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, CheckCircle, LogOut, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

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
              <Badge variant="outline" className="text-xs">💰 Financeiro</Badge>
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
          <h2 className="text-3xl font-bold text-slate-900">Painel Financeiro 💰</h2>
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
              Você tem 0 comissões aguardando aprovação para pagamento
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
              <p className="text-3xl font-bold text-amber-600">R$ 0,00</p>
              <p className="text-xs text-slate-600 mt-2">0 comissões aguardando</p>
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
              <p className="text-3xl font-bold text-red-600">R$ 0,00</p>
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
              <p className="text-3xl font-bold text-green-600">R$ 0,00</p>
              <p className="text-xs text-slate-600 mt-2">Comissões processadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals Section */}
        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Comissões Pendentes de Aprovação
            </CardTitle>
            <CardDescription>
              Revise e aprove comissões para pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Nenhuma comissão pendente</p>
              <p className="text-slate-500 text-sm mt-1">
                Todas as comissões foram aprovadas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment History Section */}
        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-slate-600" />
              Histórico de Pagamentos
            </CardTitle>
            <CardDescription>
              Últimos pagamentos de comissões realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Nenhum pagamento registrado</p>
              <p className="text-slate-500 text-sm mt-1">
                Os pagamentos aparecerão aqui quando forem processados
              </p>
            </div>
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
                onClick={() => setLocation("/commissions/approve")}
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

