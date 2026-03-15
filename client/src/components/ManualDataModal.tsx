import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ManualDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  year: number;
  month: number;
  onMonthChange?: (month: number) => void;
  userRole?: string;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function ManualDataModal({
  isOpen,
  onClose,
  companyId,
  year,
  month,
  onMonthChange,
  userRole = "user",
}: ManualDataModalProps) {
  const [formData, setFormData] = useState({
    generalExpense: 0,
    taxExpense: 0,
    innovationFund: 0,
    partnerResult: 0,
    emergencyFund: 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);

  // Gerar lista de anos (ano atual até +10 anos)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear + i);

  // Buscar dados existentes
  const { data: existingData, isLoading } = trpc.indicators.getMonthlyManualData.useQuery(
    {
      companyId,
      year: selectedYear,
      month: selectedMonth,
    },
    {
      enabled: isOpen,
    }
  );

  // Atualizar form com dados existentes
  useEffect(() => {
    if (existingData) {
      setFormData({
        generalExpense: Number(existingData.generalExpense) || 0,
        taxExpense: Number(existingData.taxExpense) || 0,
        innovationFund: Number(existingData.innovationFund) || 0,
        partnerResult: Number(existingData.partnerResult) || 0,
        emergencyFund: Number(existingData.emergencyFund) || 0,
      });
    }
  }, [existingData]);

  // Mutation para salvar
  const saveMutation = trpc.indicators.saveMonthlyManualData.useMutation({
    onSuccess: () => {
      toast.success("Dados salvos com sucesso!");
      onClose();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const handleSave = async () => {
    if (userRole !== "manager") {
      toast.error("Apenas gerentes podem salvar dados manuais");
      return;
    }
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({
        companyId,
        year: selectedYear,
        month: selectedMonth,
        ...formData,
      });
      if (onMonthChange) {
        onMonthChange(selectedMonth);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (userRole !== "manager") {
      toast.error("Apenas gerentes podem editar dados manuais");
      return;
    }
    setFormData({
      ...formData,
      [field]: parseFloat(value) || 0,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Dados Manuais</DialogTitle>
          <DialogDescription>
            Preencha os valores para o mês e ano selecionados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {userRole !== "manager" && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ Apenas gerentes podem editar dados manuais. Seu perfil atual é: <strong>{userRole}</strong>
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                disabled={userRole !== "manager"}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                disabled={userRole !== "manager"}
              >
                {MONTH_NAMES.map((monthName, idx) => (
                  <option key={monthName} value={idx + 1}>
                    {monthName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="generalExpense">Despesa Geral</Label>
                <Input
                  id="generalExpense"
                  type="number"
                  placeholder="0,00"
                  value={formData.generalExpense}
                  onChange={(e) => handleInputChange("generalExpense", e.target.value)}
                  step="0.01"
                  min="0"
                  disabled={userRole !== "manager"}
                />
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(formData.generalExpense)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxExpense">Despesa com Impostos</Label>
                <Input
                  id="taxExpense"
                  type="number"
                  placeholder="0,00"
                  value={formData.taxExpense}
                  onChange={(e) => handleInputChange("taxExpense", e.target.value)}
                  step="0.01"
                  min="0"
                  disabled={userRole !== "manager"}
                />
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(formData.taxExpense)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="innovationFund">Fundo Inovação</Label>
                <Input
                  id="innovationFund"
                  type="number"
                  placeholder="0,00"
                  value={formData.innovationFund}
                  onChange={(e) => handleInputChange("innovationFund", e.target.value)}
                  step="0.01"
                  min="0"
                  disabled={userRole !== "manager"}
                />
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(formData.innovationFund)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerResult">Resultado Sócios</Label>
                <Input
                  id="partnerResult"
                  type="number"
                  placeholder="0,00"
                  value={formData.partnerResult}
                  onChange={(e) => handleInputChange("partnerResult", e.target.value)}
                  step="0.01"
                  min="0"
                  disabled={userRole !== "manager"}
                />
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(formData.partnerResult)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyFund">Fundo Emergencial</Label>
                <Input
                  id="emergencyFund"
                  type="number"
                  placeholder="0,00"
                  value={formData.emergencyFund}
                  onChange={(e) => handleInputChange("emergencyFund", e.target.value)}
                  step="0.01"
                  min="0"
                  disabled={userRole !== "manager"}
                />
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(formData.emergencyFund)}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading || userRole !== "manager"}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
