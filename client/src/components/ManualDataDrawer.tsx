import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { NumericFormat } from "react-number-format";

interface ManualDataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
  companyId: string;
  onDataSaved?: () => void;
}

export default function ManualDataDrawer({
  isOpen,
  onClose,
  month: initialMonth,
  year: initialYear,
  companyId,
  onDataSaved,
}: ManualDataDrawerProps) {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(initialMonth));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
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

  // Mutation para salvar dados
  const saveManualDataMutation = trpc.indicators.saveManualData.useMutation();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveManualDataMutation.mutateAsync({
        companyId,
        year: parseInt(selectedYear),
        month: parseInt(selectedMonth),
        despesaGeral: formData.despesaGeral,
        despesaImpostos: formData.despesaImpostos,
        fundoInovacao: formData.fundoInovacao,
        resultadoSocios: formData.resultadoSocios,
        fundoEmergencial: formData.fundoEmergencial,
      });

      onDataSaved?.();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar dados manuais:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Incluir Dados Manuais</DrawerTitle>
          <DrawerDescription>
            Preencha os dados manuais para {selectedMonth}/{selectedYear}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6 px-4 py-4">
          {/* Seletor de Mês e Ano */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">Mês</Label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={String(m)}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="year">Ano</Label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campos de Entrada com react-number-format */}
          <div className="space-y-4">
            {/* Despesa Geral */}
            <div>
              <Label htmlFor="despesaGeral">Despesa Geral</Label>
              <NumericFormat
                value={formData.despesaGeral}
                onValueChange={(values) => {
                  setFormData((prev) => ({
                    ...prev,
                    despesaGeral: values.floatValue || 0,
                  }));
                }}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="R$ 0,00"
              />
            </div>

            {/* Despesa com Impostos */}
            <div>
              <Label htmlFor="despesaImpostos">Despesa com Impostos</Label>
              <NumericFormat
                value={formData.despesaImpostos}
                onValueChange={(values) => {
                  setFormData((prev) => ({
                    ...prev,
                    despesaImpostos: values.floatValue || 0,
                  }));
                }}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="R$ 0,00"
              />
            </div>

            {/* Fundo Inovação */}
            <div>
              <Label htmlFor="fundoInovacao">Fundo Inovação</Label>
              <NumericFormat
                value={formData.fundoInovacao}
                onValueChange={(values) => {
                  setFormData((prev) => ({
                    ...prev,
                    fundoInovacao: values.floatValue || 0,
                  }));
                }}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="R$ 0,00"
              />
            </div>

            {/* Resultado Sócios */}
            <div>
              <Label htmlFor="resultadoSocios">Resultado Sócios</Label>
              <NumericFormat
                value={formData.resultadoSocios}
                onValueChange={(values) => {
                  setFormData((prev) => ({
                    ...prev,
                    resultadoSocios: values.floatValue || 0,
                  }));
                }}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="R$ 0,00"
              />
            </div>

            {/* Fundo Emergencial */}
            <div>
              <Label htmlFor="fundoEmergencial">Fundo Emergencial</Label>
              <NumericFormat
                value={formData.fundoEmergencial}
                onValueChange={(values) => {
                  setFormData((prev) => ({
                    ...prev,
                    fundoEmergencial: values.floatValue || 0,
                  }));
                }}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="R$ 0,00"
              />
            </div>
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
