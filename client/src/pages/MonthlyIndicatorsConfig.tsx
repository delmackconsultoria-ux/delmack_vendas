import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Save, RefreshCw } from "lucide-react";

export default function MonthlyIndicatorsConfig() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Mutation para sincronização manual Properfy
  const syncMutation = trpc.system.syncPropertyfyNow.useMutation({
    onSuccess: (data) => {
      if (data.success && data.stats) {
        toast.success(`Sincronização concluída! ${data.stats.inserted} imóveis atualizados.`);
      } else {
        toast.error(data.message || 'Erro ao sincronizar');
      }
      setIsSyncing(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
      setIsSyncing(false);
    }
  });
  
  const handleSyncPropertyfy = () => {
    setIsSyncing(true);
    toast.info('Sincronizando base Properfy... Isso pode levar alguns minutos.');
    syncMutation.mutate();
  };

  // Query current indicator
  const { data: indicator, isLoading, refetch } = trpc.monthlyIndicators.getByMonth.useQuery({
    month: selectedMonth,
  });

  // Mutation to save
  const saveMutation = trpc.monthlyIndicators.upsert.useMutation({
    onSuccess: () => {
      toast.success("Indicadores salvos com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    generalExpense: indicator?.generalExpense || "",
    taxExpense: indicator?.taxExpense || "",
    innovationFund: indicator?.innovationFund || "",
    partnerResult: indicator?.partnerResult || "",
    emergencyFund: indicator?.emergencyFund || "",
  });

  // Update form when indicator loads
  React.useEffect(() => {
    if (indicator) {
      setFormData({
        generalExpense: indicator.generalExpense || "",
        taxExpense: indicator.taxExpense || "",
        innovationFund: indicator.innovationFund || "",
        partnerResult: indicator.partnerResult || "",
        emergencyFund: indicator.emergencyFund || "",
      });
    }
  }, [indicator]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    saveMutation.mutate({
      month: selectedMonth,
      generalExpense: formData.generalExpense ? parseFloat(formData.generalExpense) : undefined,
      taxExpense: formData.taxExpense ? parseFloat(formData.taxExpense) : undefined,
      innovationFund: formData.innovationFund ? parseFloat(formData.innovationFund) : undefined,
      partnerResult: formData.partnerResult ? parseFloat(formData.partnerResult) : undefined,
      emergencyFund: formData.emergencyFund ? parseFloat(formData.emergencyFund) : undefined,
    });
  };

  // Check permissions
  if (!user || !["manager", "finance", "superadmin"].includes(user.role)) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Acesso restrito a gerentes e financeiro.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuração de Indicadores Mensais</h1>
            <p className="text-muted-foreground mt-2">
              Preencha os valores de despesas e fundos para o mês selecionado
            </p>
          </div>
          <Button
            onClick={handleSyncPropertyfy}
            disabled={isSyncing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Properfy'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecionar Mês</CardTitle>
            <CardDescription>Escolha o mês para configurar os indicadores</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="max-w-xs"
            />
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Valores do Mês {selectedMonth}</CardTitle>
                <CardDescription>Preencha os campos abaixo com os valores em reais (R$)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="generalExpense">Despesa Geral</Label>
                    <Input
                      id="generalExpense"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.generalExpense}
                      onChange={(e) => setFormData({ ...formData, generalExpense: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxExpense">Despesa com Impostos</Label>
                    <Input
                      id="taxExpense"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.taxExpense}
                      onChange={(e) => setFormData({ ...formData, taxExpense: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="innovationFund">Fundo Inovação</Label>
                    <Input
                      id="innovationFund"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.innovationFund}
                      onChange={(e) => setFormData({ ...formData, innovationFund: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partnerResult">Resultado Sócios</Label>
                    <Input
                      id="partnerResult"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.partnerResult}
                      onChange={(e) => setFormData({ ...formData, partnerResult: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyFund">Fundo Emergencial</Label>
                    <Input
                      id="emergencyFund"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.emergencyFund}
                      onChange={(e) => setFormData({ ...formData, emergencyFund: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        generalExpense: "",
                        taxExpense: "",
                        innovationFund: "",
                        partnerResult: "",
                        emergencyFund: "",
                      });
                    }}
                  >
                    Limpar
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Indicadores
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Os valores inseridos aqui serão exibidos automaticamente na página de Indicadores
              para o mês selecionado. Deixe os campos em branco se não houver valor para o período.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
