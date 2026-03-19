import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ManualDataInputProps {
  companyId: string;
  year: number;
  selectedMonth: string;
  userRole?: string;
  onDataSaved?: () => void;
}

const MANUAL_INDICATORS = [
  { value: "generalExpense", label: "Despesa Geral" },
  { value: "taxExpense", label: "Despesa com Impostos" },
  { value: "innovationFund", label: "Fundo Inovação" },
  { value: "partnersResult", label: "Resultado Sócios" },
  { value: "emergencyFund", label: "Fundo Emergencial" },
];

const MONTHS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export function ManualDataInput({
  companyId,
  year,
  selectedMonth,
  userRole = "viewer",
  onDataSaved,
}: ManualDataInputProps) {
  const [month, setMonth] = useState(selectedMonth);
  const [indicator, setIndicator] = useState("generalExpense");
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const saveManualData = trpc.indicators.saveMonthlyManualData.useMutation({
    onSuccess: () => {
      toast.success("Dados salvos com sucesso!");
      setValue("");
      onDataSaved?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar dados");
    },
  });

  const isManager = userRole === "manager" || userRole === "admin" || userRole === "superadmin";

  if (!isManager) {
    return null;
  }

  const handleSave = async () => {
    if (!value || isNaN(parseFloat(value))) {
      toast.error("Insira um valor válido");
      return;
    }

    setIsLoading(true);
    try {
      const data: any = {
        companyId,
        year,
        month: parseInt(month),
      };
      data[indicator] = parseFloat(value);
      
      await saveManualData.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium block mb-2">Mês</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium block mb-2">Indicador Manual</label>
            <Select value={indicator} onValueChange={setIndicator}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_INDICATORS.map((ind) => (
                  <SelectItem key={ind.value} value={ind.value}>
                    {ind.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium block mb-2">Valor</label>
            <Input
              type="number"
              placeholder="0.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isLoading || !value}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Dados Manuais
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
