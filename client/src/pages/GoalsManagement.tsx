import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Save, AlertCircle, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function GoalsManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [teamGoal, setTeamGoal] = useState("");

  // Buscar meta atual
  const { data: currentGoal, isLoading, refetch } = trpc.goals.getGoal.useQuery({
    year,
    month,
  });

  // Mutation para salvar meta
  const saveGoalMutation = trpc.goals.saveGoal.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar meta");
    },
  });

  // Preencher campo quando carregar meta
  useEffect(() => {
    if (currentGoal) {
      const goalValue = parseFloat(currentGoal.teamGoal);
      setTeamGoal(goalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
    }
  }, [currentGoal]);

  if (!user) {
    return null;
  }

  if (user.role !== "manager" && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <p className="text-slate-900 font-semibold mb-4">
              Acesso restrito a gerentes
            </p>
            <Button onClick={() => setLocation("/dashboard")}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveGoal = async () => {
    if (!teamGoal) {
      toast.error("Preencha o valor da meta");
      return;
    }

    // Converter valor formatado para número
    const numericValue = parseFloat(teamGoal.replace(/\./g, "").replace(",", "."));

    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error("Valor da meta inválido");
      return;
    }

    await saveGoalMutation.mutateAsync({
      year,
      month,
      teamGoal: numericValue,
    });
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    
    // Converte para número e formata
    const number = parseFloat(numbers) / 100;
    
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleTeamGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setTeamGoal(formatted);
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Configuração de Metas
            </h1>
          </div>
          <p className="text-slate-600">
            Configure a meta mensal do time (padrão: R$ 15 milhões/mês)
          </p>
        </div>

        {/* Seleção de Mês/Ano */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Selecionar Período
            </CardTitle>
            <CardDescription>
              Escolha o mês e ano para configurar a meta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="month">Mês</Label>
                <select
                  id="month"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {months.map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="year">Ano</Label>
                <select
                  id="year"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Meta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Meta do Time - {months[month - 1]} {year}
            </CardTitle>
            <CardDescription>
              {currentGoal?.isDefault ? (
                <span className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  Meta padrão (R$ 15 milhões). Configure uma meta personalizada.
                </span>
              ) : (
                <span className="text-green-600">
                  Meta configurada
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Carregando...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="teamGoal">Meta Mensal do Time (R$)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                      R$
                    </span>
                    <Input
                      id="teamGoal"
                      type="text"
                      value={teamGoal}
                      onChange={handleTeamGoalChange}
                      placeholder="15.000.000,00"
                      className="pl-10 text-lg font-semibold"
                    />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Digite o valor da meta mensal para o time
                  </p>
                </div>

                <Button
                  onClick={handleSaveGoal}
                  disabled={saveGoalMutation.isPending || !teamGoal}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {saveGoalMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Meta
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Como funciona:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>A meta padrão é de R$ 15 milhões por mês</li>
                  <li>Você pode configurar metas diferentes para cada mês</li>
                  <li>A meta é compartilhada por todo o time</li>
                  <li>O progresso é calculado com base nas vendas do mês</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
