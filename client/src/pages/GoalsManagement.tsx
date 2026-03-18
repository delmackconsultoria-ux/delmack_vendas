import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Save, AlertCircle, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const INDICATORS = [
  { id: "businessMonth", label: "Negócios no mês (unidades)", type: "number" },
  { id: "cancelledSales", label: "Vendas Canceladas", type: "currency" },
  { id: "vsoRatio", label: "VSO - venda/oferta", type: "percentage" },
  { id: "commissionReceived", label: "Comissão Recebida", type: "currency" },
  { id: "commissionSold", label: "Comissão Vendida", type: "currency" },
  { id: "commissionPending", label: "Comissão Pendentes Final do mês", type: "currency" },
  { id: "portfolioDisclosure", label: "Carteira de Divulgação (em número)", type: "number" },
  { id: "prospectingMonth", label: "Angariações mês", type: "number" },
  { id: "removalsMonth", label: "Baixas no mês (em quantidade)", type: "number" },
  { id: "commissionPercentage", label: "% comissão vendida", type: "percentage" },
  { id: "businessOver1m", label: "Negócios acima de 1 milhão", type: "currency" },
  { id: "readyCalls", label: "Número de atendimentos Prontos", type: "number" },
  { id: "launchCalls", label: "Número de atendimentos Lançamentos", type: "number" },
  { id: "avgReceiptTime", label: "Prazo médio recebimento de venda", type: "number" },
  { id: "cancelledPendingRatio", label: "% Com cancelada/com pendente", type: "percentage" },
  { id: "avgSaleTime", label: "Tempo médio de venda ang X venda", type: "number" },
  { id: "avgPropertyValue", label: "Valor médio do imóvel de venda", type: "currency" },
  { id: "networkBusiness", label: "Negócios na Rede", type: "number" },
  { id: "internalBusiness", label: "Negócios Internos", type: "number" },
  { id: "externalPartnership", label: "Negócios Parceria Externa", type: "number" },
  { id: "launchBusiness", label: "Negócios Lançamentos", type: "number" },
  { id: "generalExpense", label: "Despesa Geral", type: "currency" },
  { id: "taxExpense", label: "Despesa com impostos", type: "currency" },
  { id: "innovationFund", label: "Fundo Inovação", type: "currency" },
  { id: "partnersResult", label: "Resultado Sócios", type: "currency" },
  { id: "emergencyFund", label: "Fundo emergencial", type: "currency" },
];

interface GoalData {
  [key: string]: number | string;
}

export default function GoalsManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [goals, setGoals] = useState<GoalData>({});
  const [isSaving, setIsSaving] = useState(false);

  // Verificar se é gerente
  const isManager = user?.role === "manager" || user?.role === "admin" || user?.role === "superadmin";

  // Buscar metas do servidor
  const { data: goalsData, isLoading, refetch } = trpc.goals.getOrCreateGoals.useQuery(
    { year: new Date().getFullYear() }
  );

  // Carregar dados das metas quando disponíveis
  useEffect(() => {
    if (goalsData?.indicators) {
      setGoals(goalsData.indicators as GoalData);
    }
  }, [goalsData?.indicators]);

  const saveIndicatorsMutation = trpc.goals.saveIndicators.useMutation({
    onSuccess: () => {
      toast.success("Metas salvas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar metas: ${error.message}`);
    },
  });

  // Calcular meta mensal
  const calculateMonthlyGoal = (annualGoal: number | string): string => {
    const annual = typeof annualGoal === "string" ? parseFloat(annualGoal) : annualGoal;
    if (isNaN(annual)) return "0";
    const monthly = annual / 12;
    return monthly.toFixed(2);
  };

  const handleGoalChange = (indicatorId: string, value: string) => {
    setGoals(prev => ({
      ...prev,
      [indicatorId]: value
    }));
  };

  const handleSave = async () => {
    if (!isManager) {
      toast.error("Apenas gerentes podem editar metas");
      return;
    }

    if (!goalsData?.goalId) {
      toast.error("Meta não encontrada");
      return;
    }

    setIsSaving(true);
    try {
      // Converter valores para números
      const indicatorsToSave: Record<string, number | null> = {};
      for (const [key, value] of Object.entries(goals)) {
        const numValue = value ? parseFloat(value.toString()) : null;
        indicatorsToSave[key] = isNaN(numValue as number) ? null : numValue;
      }

      await saveIndicatorsMutation.mutateAsync({
        goalId: goalsData.goalId,
        indicators: indicatorsToSave,
      });
    } catch (error) {
      console.error("Erro ao salvar metas:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: string): string => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  };

  const formatPercentage = (value: string): string => {
    const num = parseFloat(value) || 0;
    return `${num.toFixed(2)}%`;
  };

  if (!user) {
    return null;
  }

  if (!isManager) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-6">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">Acesso Restrito</p>
                  <p className="text-sm text-amber-800">Apenas gerentes podem acessar a página de metas.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Metas Anuais</h1>
              <p className="text-sm text-slate-500 mt-1">
                Gerencie as metas anuais e visualize a previsão mensal
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Metas"}
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6">
          {/* Informações */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Como funciona:</p>
                  <p>Insira a meta anual para cada indicador. A meta mensal será calculada automaticamente dividindo o valor anual por 12.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de Indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INDICATORS.map((indicator) => (
              <Card key={indicator.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{indicator.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Meta Anual */}
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 mb-1 block">Meta Anual</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={goals[indicator.id] || ""}
                      onChange={(e) => handleGoalChange(indicator.id, e.target.value)}
                      className="text-sm"
                      disabled={!isManager}
                    />
                  </div>

                  {/* Meta Mensal (Calculada) */}
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 mb-1 block">Meta Mensal (Calculada)</Label>
                    <div className="p-2 bg-slate-100 rounded border border-slate-200 text-sm font-semibold text-slate-700">
                      {(() => {
                        const annual = goals[indicator.id];
                        if (!annual || annual === "") return "0";
                        const monthly = calculateMonthlyGoal(annual);
                        
                        if (indicator.type === "currency") {
                          return formatCurrency(monthly);
                        } else if (indicator.type === "percentage") {
                          return formatPercentage(monthly);
                        } else {
                          return monthly;
                        }
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Botão de Salvar Fixo */}
          <div className="sticky bottom-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setGoals({})}>
              Limpar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Metas"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
