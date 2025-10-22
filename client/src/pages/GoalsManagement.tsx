import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, LogOut, Plus, Edit2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function GoalsManagement() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState("all");
  const [formData, setFormData] = useState({
    brokerName: "",
    monthlySalesGoal: "",
    monthlyEngagementGoal: "",
    monthlyIndicatorGoal: "",
  });

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

  if (user.role !== "manager") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <p className="text-slate-900 font-semibold mb-4">
              Acesso restrito a gerentes
            </p>
            <Button onClick={handleLogout}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data - metas cadastradas
  const goals = [
    {
      id: 1,
      brokerName: "João Silva",
      monthlySalesGoal: 50000,
      monthlyEngagementGoal: 30000,
      monthlyIndicatorGoal: 45,
      createdAt: "2025-01-15",
    },
    {
      id: 2,
      brokerName: "Maria Santos",
      monthlySalesGoal: 55000,
      monthlyEngagementGoal: 35000,
      monthlyIndicatorGoal: 50,
      createdAt: "2025-01-16",
    },
    {
      id: 3,
      brokerName: "Pedro Costa",
      monthlySalesGoal: 48000,
      monthlyEngagementGoal: 28000,
      monthlyIndicatorGoal: 42,
      createdAt: "2025-01-17",
    },
  ];

  const brokers = [
    { id: "1", name: "João Silva" },
    { id: "2", name: "Maria Santos" },
    { id: "3", name: "Pedro Costa" },
    { id: "4", name: "Ana Oliveira" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Enviar dados para o servidor
    console.log("Formulário enviado:", formData);
    setShowForm(false);
    setFormData({
      brokerName: "",
      monthlySalesGoal: "",
      monthlyEngagementGoal: "",
      monthlyIndicatorGoal: "",
    });
  };

  const filteredGoals =
    selectedBroker === "all"
      ? goals
      : goals.filter(
          (g) => g.brokerName === brokers.find((b) => b.id === selectedBroker)?.name
        );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center text-white font-bold">
              D
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Delmack</h1>
              <p className="text-xs text-slate-600">Gerenciamento de Metas</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <Badge variant="outline" className="text-xs">
                Gerente
              </Badge>
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
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Target className="h-8 w-8 text-green-600" />
            Gerenciamento de Metas
          </h2>
          <p className="text-slate-600 mt-2">
            Cadastre e gerencie metas de vendas, angariações e indicadores para sua equipe
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex gap-4">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Nova Meta
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="border-0 shadow-md mb-8 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle>Cadastrar Nova Meta</CardTitle>
              <CardDescription>
                Defina metas para um corretor ou para toda a equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Corretor */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Corretor *
                    </label>
                    <select
                      value={formData.brokerName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          brokerName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione um corretor</option>
                      <option value="all">Todos os corretores</option>
                      {brokers.map((broker) => (
                        <option key={broker.id} value={broker.name}>
                          {broker.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Meta de Vendas */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meta Mensal de Vendas (R$) *
                    </label>
                    <input
                      type="number"
                      value={formData.monthlySalesGoal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlySalesGoal: e.target.value,
                        })
                      }
                      placeholder="Ex: 50000"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Meta de Angariações */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meta Mensal de Angariações (R$) *
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyEngagementGoal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlyEngagementGoal: e.target.value,
                        })
                      }
                      placeholder="Ex: 30000"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Meta de Indicador */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meta de Indicador de Vendas (Quantidade) *
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyIndicatorGoal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlyIndicatorGoal: e.target.value,
                        })
                      }
                      placeholder="Ex: 45"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Salvar Meta
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="border-0 shadow-md mb-8 bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Corretor
                </label>
                <select
                  value={selectedBroker}
                  onChange={(e) => setSelectedBroker(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  {brokers.map((broker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Table */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Metas Cadastradas</CardTitle>
            <CardDescription>
              Total de {filteredGoals.length} meta(s) cadastrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredGoals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600">Nenhuma meta cadastrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">
                        Corretor
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">
                        Meta Vendas
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">
                        Meta Angariações
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">
                        Meta Indicador
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">
                        Data
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGoals.map((goal) => (
                      <tr
                        key={goal.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="py-3 px-4 text-slate-900 font-medium">
                          {goal.brokerName}
                        </td>
                        <td className="py-3 px-4 text-slate-900">
                          R$ {(goal.monthlySalesGoal / 1000).toFixed(0)}k
                        </td>
                        <td className="py-3 px-4 text-slate-900">
                          R$ {(goal.monthlyEngagementGoal / 1000).toFixed(0)}k
                        </td>
                        <td className="py-3 px-4 text-slate-900">
                          {goal.monthlyIndicatorGoal} unidades
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-sm">
                          {new Date(goal.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

