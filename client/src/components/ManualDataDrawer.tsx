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
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { NumericFormat } from "react-number-format";

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
  month,
  year,
  onSaveSuccess,
}: ManualDataDrawerProps) {
  const { user } = useAuth();
  const companyId = user?.companyId;

  const [formData, setFormData] = useState({
    despesaGeral: "",
    despesaImpostos: "",
    fundoInovacao: "",
    resultadoSocios: "",
    fundoEmergencial: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const utils = trpc.useUtils();

  // Query para buscar dados existentes
  const { data: existingData } = trpc.indicators.getManualData.useQuery(
    {
      companyId: companyId || "",
      month: month,
      year: year,
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
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Converter string com formato brasileiro para número
  const parseValue = (value: string): number => {
    if (!value) return 0;
    // Remove espaços
    value = value.trim();
    // Remove "R$" se existir
    value = value.replace(/R\$/g, '').trim();
    // Substitui ponto por vazio (remove separador de milhar)
    value = value.replace(/\./g, '');
    // Substitui vírgula por ponto (converte decimal)
    value = value.replace(',', '.');
    return parseFloat(value) || 0;
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
        month: month,
        year: year,
        despesaGeral: parseValue(formData.despesaGeral),
        despesaImpostos: parseValue(formData.despesaImpostos),
        fundoInovacao: parseValue(formData.fundoInovacao),
        resultadoSocios: parseValue(formData.resultadoSocios),
        fundoEmergencial: parseValue(formData.fundoEmergencial),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="w-full sm:w-[700px] lg:w-[800px] max-h-[95vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Incluir Dados Manuais</DrawerTitle>
          <DrawerDescription>
            Preencha os dados manuais para {month}/{year}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Campos de Entrada */}
          <div className="space-y-5">
            {/* Despesa Geral */}
            <div>
              <Label htmlFor="despesaGeral" className="text-sm font-medium">Despesa Geral</Label>
              <NumericFormat
                id="despesaGeral"
                type="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix=""
                suffix=""
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={false}
                placeholder="0,00"
                value={formData.despesaGeral}
                onValueChange={(values) => {
                  handleInputChange("despesaGeral", values.formattedValue);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>

            {/* Despesa com Impostos */}
            <div>
              <Label htmlFor="despesaImpostos" className="text-sm font-medium">Despesa com Impostos</Label>
              <NumericFormat
                id="despesaImpostos"
                type="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix=""
                suffix=""
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={false}
                placeholder="0,00"
                value={formData.despesaImpostos}
                onValueChange={(values) => {
                  handleInputChange("despesaImpostos", values.formattedValue);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>

            {/* Fundo Inovação */}
            <div>
              <Label htmlFor="fundoInovacao" className="text-sm font-medium">Fundo Inovação</Label>
              <NumericFormat
                id="fundoInovacao"
                type="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix=""
                suffix=""
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={false}
                placeholder="0,00"
                value={formData.fundoInovacao}
                onValueChange={(values) => {
                  handleInputChange("fundoInovacao", values.formattedValue);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>

            {/* Resultado Sócios */}
            <div>
              <Label htmlFor="resultadoSocios" className="text-sm font-medium">Resultado Sócios</Label>
              <NumericFormat
                id="resultadoSocios"
                type="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix=""
                suffix=""
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={false}
                placeholder="0,00"
                value={formData.resultadoSocios}
                onValueChange={(values) => {
                  handleInputChange("resultadoSocios", values.formattedValue);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>

            {/* Fundo Emergencial */}
            <div>
              <Label htmlFor="fundoEmergencial" className="text-sm font-medium">Fundo Emergencial</Label>
              <NumericFormat
                id="fundoEmergencial"
                type="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix=""
                suffix=""
                decimalScale={2}
                fixedDecimalScale={true}
                allowNegative={false}
                placeholder="0,00"
                value={formData.fundoEmergencial}
                onValueChange={(values) => {
                  handleInputChange("fundoEmergencial", values.formattedValue);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t pt-4">
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
