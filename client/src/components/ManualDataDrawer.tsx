import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface ManualDataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
  companyId: string;
  onDataSaved?: () => void;
}

export function ManualDataDrawer({
  isOpen,
  onClose,
  month: initialMonth,
  year: initialYear,
  companyId,
  onDataSaved,
}: ManualDataDrawerProps) {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(initialMonth));
  const [selectedYear, setSelectedYear] = useState<string>(String(initialYear));
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    despesaGeral: 0,
    despesaImpostos: 0,
    fundoInovacao: 0,
    resultadoSocios: 0,
    fundoEmergencial: 0,
  });

  // Buscar dados manuais existentes
  const { data: existingData } = trpc.indicators.getMonthlyManualData.useQuery(
    {
      companyId,
      year: parseInt(selectedYear),
      month: parseInt(selectedMonth),
    },
    {
      enabled: !!companyId && isOpen,
    }
  );

  // Atualizar form quando dados existentes forem carregados
  useEffect(() => {
    if (existingData) {
      const data = existingData as any;
      setFormData({
        despesaGeral: Number(data.despesaGeral) || 0,
        despesaImpostos: Number(data.despesaImpostos) || 0,
        fundoInovacao: Number(data.fundoInovacao) || 0,
        resultadoSocios: Number(data.resultadoSocios) || 0,
        fundoEmergencial: Number(data.fundoEmergencial) || 0,
      });
    }
  }, [existingData]);

  // Mutation para salvar dados manuais
  const saveMutation = trpc.indicators.saveManualData.useMutation({
    onSuccess: () => {
      toast.success("Dados salvos com sucesso!");
      setIsSaving(false);
      onDataSaved?.();
      onClose();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    saveMutation.mutate({
      companyId,
      year: parseInt(selectedYear),
      month: parseInt(selectedMonth),
      despesaGeral: formData.despesaGeral * 100,
      despesaImpostos: formData.despesaImpostos * 100,
      fundoInovacao: formData.fundoInovacao * 100,
      resultadoSocios: formData.resultadoSocios * 100,
      fundoEmergencial: formData.fundoEmergencial * 100,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    // Remove caracteres não numéricos
    let numericValue = value.replace(/[^0-9]/g, '');
    
    // Limita a 9 dígitos
    if (numericValue.length > 9) {
      numericValue = numericValue.slice(0, 9);
    }
    
    const numValue = numericValue === '' ? 0 : parseInt(numericValue) || 0;
    setFormData((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const formatCurrencyDisplay = (value: number): string => {
    if (value === 0) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  // Verificar se usuário pode editar
  const canEdit = ["manager", "admin", "superadmin"].includes(user?.role || "");

  if (!isOpen) return null;

  return (
    <>
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg z-50 overflow-y-auto transition-transform">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Editar Dados Manuais</h2>
            <p className="text-sm text-gray-600 mt-1">Preencha os valores para o mês e ano selecionados</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Seletores de Ano e Mês */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Ano</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027, 2028].map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Mês</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((month, index) => (
                    <SelectItem key={index} value={String(index + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campos de Dados Manuais */}
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <div>
              <label className="text-sm font-medium block mb-2">Despesa Geral</label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatCurrencyDisplay(formData.despesaGeral)}
                onChange={(e) => handleInputChange("despesaGeral", e.target.value)}
                disabled={!canEdit}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Despesa com Impostos</label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatCurrencyDisplay(formData.despesaImpostos)}
                onChange={(e) => handleInputChange("despesaImpostos", e.target.value)}
                disabled={!canEdit}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Fundo Inovação</label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatCurrencyDisplay(formData.fundoInovacao)}
                onChange={(e) => handleInputChange("fundoInovacao", e.target.value)}
                disabled={!canEdit}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Resultado Sócios</label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatCurrencyDisplay(formData.resultadoSocios)}
                onChange={(e) => handleInputChange("resultadoSocios", e.target.value)}
                disabled={!canEdit}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Fundo Emergencial</label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatCurrencyDisplay(formData.fundoEmergencial)}
                onChange={(e) => handleInputChange("fundoEmergencial", e.target.value)}
                disabled={!canEdit}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          {!canEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
              Você não tem permissão para editar dados manuais. Apenas gerentes podem fazer alterações.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !canEdit}
            className="flex-1"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </>
  );
}
