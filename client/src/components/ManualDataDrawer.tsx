import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect, useState, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatWhileTyping, parseCurrencyInput } from "@/lib/currencyFormatter";

interface ManualDataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
  onSaveSuccess?: () => void;
}

export default function ManualDataDrawer({
  isOpen,
  onClose,
  month: initialMonth,
  year: initialYear,
  onSaveSuccess,
}: ManualDataDrawerProps) {
  const { user } = useAuth();
  const companyId = user?.companyId;

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  const [formData, setFormData] = useState({
    despesaGeral: "",
    despesaImpostos: "",
    fundoInovacao: "",
    resultadoSocios: "",
    fundoEmergencial: "",
  });

  // Refs para inputs não controlados
  const despesaGeralRef = useRef<HTMLInputElement>(null);
  const despesaImpostosRef = useRef<HTMLInputElement>(null);
  const fundoInovacaoRef = useRef<HTMLInputElement>(null);
  const resultadoSociosRef = useRef<HTMLInputElement>(null);
  const fundoEmergencialRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const utils = trpc.useUtils();

  // Query para buscar dados existentes
  const { data: existingData } = trpc.indicators.getManualData.useQuery(
    {
      companyId: companyId || "",
      month: selectedMonth,
      year: selectedYear,
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
        despesaGeral: data.despesaGeral ? data.despesaGeral.toString() : "",
        despesaImpostos: data.despesaImpostos ? data.despesaImpostos.toString() : "",
        fundoInovacao: data.fundoInovacao ? data.fundoInovacao.toString() : "",
        resultadoSocios: data.resultadoSocios ? data.resultadoSocios.toString() : "",
        fundoEmergencial: data.fundoEmergencial ? data.fundoEmergencial.toString() : "",
      });
    }
  }, [existingData]);

  // Mutation para salvar dados
  const saveManualDataMutation = trpc.indicators.saveManualData.useMutation({
    onSuccess: async () => {
      toast.success("Dados salvos com sucesso!");
      // Invalidar caches para recarregar tabela
      await utils.indicators.getYearIndicators.invalidate();
      await utils.indicators.getRealtimeIndicators.invalidate();
      await utils.indicators.getMonthlyManualData.invalidate();
      onSaveSuccess?.();
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao salvar dados:", error);
      toast.error("Erro ao salvar dados");
    }
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    // Apenas atualiza o estado para exibição (não é usado para o input controlado)
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Converter string com formato brasileiro para número
  const parseValue = (value: string): number => {
    return parseCurrencyInput(value);
  };

  const handleSave = async () => {
    if (!companyId) {
      toast.error("Erro: Empresa não identificada");
      return;
    }

    setIsSaving(true);
    try {
      await saveManualDataMutation.mutateAsync({
        companyId,
        month: selectedMonth,
        year: selectedYear,
        despesaGeral: parseValue(despesaGeralRef.current?.value || ""),
        despesaImpostos: parseValue(despesaImpostosRef.current?.value || ""),
        fundoInovacao: parseValue(fundoInovacaoRef.current?.value || ""),
        resultadoSocios: parseValue(resultadoSociosRef.current?.value || ""),
        fundoEmergencial: parseValue(fundoEmergencialRef.current?.value || ""),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="w-full sm:w-[700px] lg:w-[800px] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Incluir Dados Manuais</DrawerTitle>
          <DrawerDescription>
            Preencha os dados manuais para {selectedMonth}/{selectedYear}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Seletor de Mês e Ano */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month" className="text-sm font-medium">Mês</Label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value={1}>Janeiro</option>
                <option value={2}>Fevereiro</option>
                <option value={3}>Março</option>
                <option value={4}>Abril</option>
                <option value={5}>Maio</option>
                <option value={6}>Junho</option>
                <option value={7}>Julho</option>
                <option value={8}>Agosto</option>
                <option value={9}>Setembro</option>
                <option value={10}>Outubro</option>
                <option value={11}>Novembro</option>
                <option value={12}>Dezembro</option>
              </select>
            </div>
            <div>
              <Label htmlFor="year" className="text-sm font-medium">Ano</Label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>
          {/* Campos de Entrada */}
          <div className="space-y-5 pt-4 border-t">
            {/* Despesa Geral */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label htmlFor="despesaGeral" className="text-sm font-medium">Despesa Geral</Label>
              <Input
                ref={despesaGeralRef}
                id="despesaGeral"
                type="text"
                placeholder="0,00"
                defaultValue={formData.despesaGeral}
                onBlur={(e) => {
                  const formatted = formatWhileTyping(e.target.value);
                  e.target.value = formatted;
                }}
                className="flex h-10 w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>

            {/* Despesa com Impostos */}
            <div className="bg-blue-100 p-4 rounded-lg">
              <Label htmlFor="despesaImpostos" className="text-sm font-medium">Despesa com Impostos</Label>
              <Input
                ref={despesaImpostosRef}
                id="despesaImpostos"
                type="text"
                placeholder="0,00"
                defaultValue={formData.despesaImpostos}
                onBlur={(e) => {
                  const formatted = formatWhileTyping(e.target.value);
                  e.target.value = formatted;
                }}
                className="flex h-10 w-full rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>

            {/* Fundo Inovação */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label htmlFor="fundoInovacao" className="text-sm font-medium">Fundo Inovação</Label>
              <Input
                ref={fundoInovacaoRef}
                id="fundoInovacao"
                type="text"
                placeholder="0,00"
                defaultValue={formData.fundoInovacao}
                onBlur={(e) => {
                  const formatted = formatWhileTyping(e.target.value);
                  e.target.value = formatted;
                }}
                className="flex h-10 w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>

            {/* Resultado Sócios */}
            <div className="bg-blue-100 p-4 rounded-lg">
              <Label htmlFor="resultadoSocios" className="text-sm font-medium">Resultado Sócios</Label>
              <Input
                ref={resultadoSociosRef}
                id="resultadoSocios"
                type="text"
                placeholder="0,00"
                defaultValue={formData.resultadoSocios}
                onBlur={(e) => {
                  const formatted = formatWhileTyping(e.target.value);
                  e.target.value = formatted;
                }}
                className="flex h-10 w-full rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>

            {/* Fundo Emergencial */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label htmlFor="fundoEmergencial" className="text-sm font-medium">Fundo Emergencial</Label>
              <Input
                ref={fundoEmergencialRef}
                id="fundoEmergencial"
                type="text"
                placeholder="0,00"
                defaultValue={formData.fundoEmergencial}
                onBlur={(e) => {
                  const formatted = formatWhileTyping(e.target.value);
                  e.target.value = formatted;
                }}
                className="flex h-10 w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t pt-4 mt-auto pb-6">
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
