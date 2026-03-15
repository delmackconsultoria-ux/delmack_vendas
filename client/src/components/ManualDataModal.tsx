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
}

export function ManualDataModal({
  isOpen,
  onClose,
  companyId,
  year,
  month,
}: ManualDataModalProps) {
  const [formData, setFormData] = useState({
    generalExpense: 0,
    taxExpense: 0,
    innovationFund: 0,
    partnerResult: 0,
    emergencyFund: 0,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Buscar dados existentes
  const { data: existingData, isLoading } = trpc.indicators.getMonthlyManualData.useQuery(
    {
      companyId,
      year,
      month,
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
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({
        companyId,
        year,
        month,
        ...formData,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
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
            Preencha os valores para {month}/{year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
