import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Save, AlertCircle, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// Máscara monetária tipo caixa registradora: digita 525000 → R$ 5.250,00
const applyMoneyMask = (rawDigits: string): string => {
  const digits = rawDigits.replace(/\D/g, "");
  if (!digits || digits === "0" || digits === "00") return "";
  const cents = parseInt(digits, 10);
  const value = cents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Converte string mascarada de volta para número (centavos → reais)
const parseMaskedMoney = (masked: string): number => {
  const digits = masked.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
};

// Formata número para exibição na meta mensal calculada
const formatCurrencyDisplay = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercentageDisplay = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

const INDICATORS = [
  { id: "businessValue", label: "Negócios no mês (valor)", type: "currency" },
  { id: "businessMonth", label: "Negócios no mês (unidades)", type: "number" },
  { id: "cancelledSales", label: "Vendas canceladas", type: "number" },
  { id: "vsoRatio", label: "VSO - venda/oferta", type: "percentage" },
  { id: "commissionReceived", label: "Comissão recebida", type: "currency" },
  { id: "commissionSold", label: "Comissão vendida", type: "currency" },
  { id: "commissionPending", label: "Comissão pendentes final do mês", type: "currency" },
  { id: "portfolioDisclosure", label: "Carteira de divulgação (em número)", type: "number" },
  { id: "prospectingMonth", label: "Angariações mês", type: "number" },
  { id: "removalsMonth", label: "Baixas no mês (em quantidade)", type: "number" },
  { id: "commissionPercentage", label: "% comissão vendida", type: "percentage" },
  { id: "businessOver1m", label: "Negócios acima de 1 milhão", type: "number" },
  { id: "readyCalls", label: "Número de atendimentos prontos", type: "number" },
  { id: "launchCalls", label: "Número de atendimentos lançamentos", type: "number" },
  { id: "avgReceiptTime", label: "Prazo médio recebimento de venda", type: "number" },
  { id: "cancelledPendingRatio", label: "% Com cancelada/com pendente", type: "percentage" },
  { id: "avgSaleTime", label: "Tempo médio de venda ang X venda", type: "number" },
  { id: "avgPropertyValue", label: "Valor médio do imóvel de venda", type: "currency" },
  { id: "networkBusiness", label: "Negócios na rede", type: "number" },
  { id: "internalBusiness", label: "Negócios internos", type: "number" },
  { id: "externalPartnership", label: "Negócios parceria externa", type: "number" },
  { id: "launchBusiness", label: "Negócios lançamentos", type: "number" },
  { id: "generalExpense", label: "Despesa geral", type: "currency" },
  { id: "taxExpense", label: "Despesa com impostos", type: "currency" },
  { id: "innovationFund", label: "Fundo inovação", type: "currency" },
  { id: "partnersResult", label: "Resultado sócios", type: "currency" },
  { id: "emergencyFund", label: "Fundo emergencial", type: "currency" },
];

interface GoalData {
  [key: string]: number | string | null;
}

// Estado interno dos inputs: string para currency (mascarada), string para outros
interface InputState {
  [key: string]: string;
}

export default function GoalsManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  // Valores reais (numéricos) vindos do banco
  const [goals, setGoals] = useState<GoalData>({});
  // Strings exibidas nos inputs (mascaradas para currency, raw para outros)
  const [inputValues, setInputValues] = useState<InputState>({});
  const [isSaving, setIsSaving] = useState(false);

  const isManager = user?.role === "manager" || user?.role === "admin" || user?.role === "superadmin";

  const { data: goalsData, isLoading, refetch } = trpc.goals.getOrCreateGoals.useQuery(
    { year: new Date().getFullYear() }
  );

  // Carregar dados do banco e inicializar inputs
  useEffect(() => {
    if (goalsData?.indicators) {
      const rawGoals = goalsData.indicators as GoalData;
      setGoals(rawGoals);

      // Inicializar inputValues com os valores formatados
      const initialInputs: InputState = {};
      for (const indicator of INDICATORS) {
        const val = rawGoals[indicator.id];
        const num = val !== null && val !== undefined ? Number(val) : 0;
        if (indicator.type === "currency") {
          // Converter número para string de dígitos (centavos) para a máscara
          if (num > 0) {
            const centavos = Math.round(num * 100).toString();
            initialInputs[indicator.id] = applyMoneyMask(centavos);
          } else {
            initialInputs[indicator.id] = "";
          }
        } else {
          initialInputs[indicator.id] = num > 0 ? String(num) : "";
        }
      }
      setInputValues(initialInputs);
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

  // Handler para campos de moeda (máscara tipo caixa registradora)
  const handleCurrencyChange = (indicatorId: string, rawInput: string) => {
    const digits = rawInput.replace(/\D/g, "");
    const masked = applyMoneyMask(digits);
    const numericValue = parseMaskedMoney(masked);
    setInputValues(prev => ({ ...prev, [indicatorId]: masked }));
    setGoals(prev => ({ ...prev, [indicatorId]: numericValue }));
  };

  // Handler para campos de número e percentual
  const handleNumberChange = (indicatorId: string, value: string) => {
    setInputValues(prev => ({ ...prev, [indicatorId]: value }));
    const num = parseFloat(value);
    setGoals(prev => ({ ...prev, [indicatorId]: isNaN(num) ? null : num }));
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
      const indicatorsToSave: Record<string, number | null> = {};
      for (const indicator of INDICATORS) {
        const val = goals[indicator.id];
        if (val === null || val === undefined || val === "") {
          indicatorsToSave[indicator.id] = null;
        } else {
          const num = Number(val);
          indicatorsToSave[indicator.id] = isNaN(num) ? null : num;
        }
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

  // Calcula e formata a meta mensal para exibição
  const getMonthlyGoalDisplay = (indicator: typeof INDICATORS[0]): string => {
    const val = goals[indicator.id];
    const annual = val !== null && val !== undefined ? Number(val) : 0;
    if (!annual || isNaN(annual)) return "—";
    const monthly = annual / 12;
    if (indicator.type === "currency") return formatCurrencyDisplay(monthly);
    if (indicator.type === "percentage") return formatPercentageDisplay(monthly);
    return monthly.toFixed(2);
  };

  if (!user) return null;

  if (!isManager) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-6">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">Acesso restrito</p>
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
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Metas anuais</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie as metas anuais e visualize a previsão mensal
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar metas"}
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Como funciona:</p>
                  <p>Insira a meta anual para cada indicador. A meta mensal será calculada automaticamente dividindo o valor anual por 12.</p>
     