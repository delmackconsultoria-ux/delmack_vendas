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
import { formatWhileTyping, parseCurrencyInput } from "@/lib/currencyFormatter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ManualDataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
}

export default function ManualDataDrawer({
  isOpen,
  onClose,
  month,
  year,
}: ManualDataDrawerProps) {
  const { user } = useAuth();
  const companyId = user?.id;

  const [formData, setFormData] = useState({
    despesaGeral: "",
    despesaImpostos: "",
    fundoInovacao: "",
    resultadoSocios: "",
    fundoEmergencial: "",
  });

  const [isSaving, setIsSaving] = useState(false);

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
  const saveManualDataMutation = trpc.indicators.saveManualData.useMutation();

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        despesaGeral: parseCurrencyInput(formData.despesaGeral),
        despesaImpostos: parseCurrencyInput(formData.despesaImpostos),
        fundoInovacao: parseCurrencyInput(formData.fundoInovacao),
        resultadoSocios: parseCurrencyInput(formData.resultadoSocios),
        fundoEmergencial: parseCurrencyInput(formData.fundoEmergencial),
      });

      toast.success("Dados salvos com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      toast.error("Erro ao salvar dados");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="w-full sm:w-[600px] max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Incluir Dados Manuais</DrawerTitle>
          <DrawerDescription>
            Preencha os dados manuais para {month}/{year}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-4 space-y-6">
          {/* Campos de Entrada com formatação de moeda */}
          <div className="space-y-4">
            {/* Despesa Geral */}
            <div>
              <Label htmlFor="despesaGeral">Despesa Geral</Label>
              <Input
                id="despesaGeral"
                type="text"
                placeholder="0,00"
                value={formData.despesaGeral}
                onChange={(e) => {
                  const formatted = formatWhileTyping(e.target.value);
                  handleInputChange("despesaGeral", formatted);
                }}
              />
            </div>

            {/* Despesa com Impostos */}
            <div>
              <Label htmlFor="despesaImpostos">Despesa com Impostos</Label>
              <Input
                id="despesaImpostos"
                type="text"
                placeholder="0,00"
                value={formData.despesaImpostos}
                onChange={(e) => {
                  const formatted = formatWhileTyping(e.target.value);
                  handleInputChange("despesaImpostos", formatted);
                }}
              />
            </div>

            {/* Fundo Inovação */}
            <div>
              <Label htmlFor="fundoInovacao">Fundo Inovação</Label>
              <Input
                id="fundoInovacao"
                type="text"
                placeholder="0,00"
                value={formData.fundoInovacao}
                onChange={(e) => {
                  const formatted = formatWhileTyping(e.target.value);
                  handleInputChange("fundoInovacao", formatted);
                }}
              />
            </div>

            {/* Resultado Sócios */}
            <div>
              <Label htmlFor="resultadoSocios">Resultado Sócios</Label>
              <Input
                id="resultadoSocios"
                type="text"
                placeholder="0,00"
                value={formData.resultadoSocios}
                onChange={(e) => {
                  const formatted = formatWhileTyping(e.target.value);
                  handleInputChange("resultadoSocios", formatted);
                }}
              />
            </div>

            {/* Fundo Emergencial */}
            <div>
              <Label htmlFor="fundoEmergencial">Fundo Emergencial</Label>
              <Input
                id="fundoEmergencial"
                type="text"
                placeholder="0,00"
                value={formData.fundoEmergencial}
                onChange={(e) => {
                  const formatted = formatWhileTyping(e.target.value);
                  handleInputChange("fundoEmergencial", formatted);
                }}
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
