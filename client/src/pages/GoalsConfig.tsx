import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Save, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function GoalsConfig() {
  const { user } = useAuth();
  const [monthlyGoal, setMonthlyGoal] = useState("15000000"); // R$ 15 milhões padrão
  const [isSaving, setIsSaving] = useState(false);

  // Buscar meta atual (TODO: implementar endpoint)
  // const { data: currentGoal } = trpc.goals.getCurrent.useQuery();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implementar endpoint de salvar meta
      // await trpc.goals.setMonthlyGoal.mutate({ value: parseFloat(monthlyGoal) });
      toast.success("Meta mensal atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar meta");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/\D/g, ""));
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num / 100);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="h-8 w-8 text-blue-600" />
              Configuração de Metas
            </h1>
            <p className="text-slate-600 mt-2">
              Defina as metas mensais para acompanhamento de desempenho
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Meta Mensal de Vendas</CardTitle>
              <CardDescription>
                Valor total esperado em vendas por mês
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="monthlyGoal">Valor da Meta (R$)</Label>
                <Input
                  id="monthlyGoal"
                  type="text"
                  value={formatCurrency(monthlyGoal)}
                  onChange={(e) => {
                    const num = e.target.value.replace(/\D/g, "");
                    setMonthlyGoal(num);
                  }}
                  className="text-2xl font-bold"
                />
                <p className="text-sm text-slate-500">
                  Meta padrão: R$ 15.000.000,00 por mês
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Como funciona</p>
                    <p className="text-sm text-blue-700 mt-1">
                      A meta mensal será usada para calcular o progresso da equipe nos dashboards e relatórios.
                      Você pode alterar este valor a qualquer momento.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Meta"}
              </Button>
            </CardContent>
          </Card>

          {/* Card de Preview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Visualização</CardTitle>
              <CardDescription>
                Como a meta aparecerá nos relatórios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <p className="text-sm opacity-90">Meta Mensal</p>
                <p className="text-4xl font-bold mt-2">
                  {formatCurrency(monthlyGoal)}
                </p>
                <div className="mt-4 bg-white/20 rounded-full h-2">
                  <div className="bg-white rounded-full h-2 w-[65%]"></div>
                </div>
                <p className="text-sm mt-2 opacity-90">65% atingido</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
