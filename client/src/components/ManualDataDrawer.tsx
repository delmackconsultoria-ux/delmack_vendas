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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
          {/* Campos de Entrada */}
          <div className="space-y-4">
            {/* Despesa Geral */}
            <div>
              <Label htmlFor="despesaGeral">Despesa Geral</Label>
              <Input
                id="despesaGeral"
                type="text"
                placeholder="Ex: 1.041,44"
                value={formData.despesaGeral}
                onChange={(e) => {
                  handleInputChange("despesaGeral", e.target.value);
                }}
              />
            </div>

            {/* Despesa com Impostos */}
            <div>
              <Label htmlFor="despesaImpostos">Despesa com Impostos</Label>
              <Input
                id="despesaImpostos"
                type="text"
                placeholder="Ex: 1.041,44"
                value={formData.despesaImpostos}
                onChange={(e) => {
                  handleInputChange("despesaImpostos", e.target.value);
                }}
              />
            </div>

            {/* Fundo Inovação */}
            <div>
              <Label htmlFor="fundoInovacao">Fundo Inovação</Label>
              <Input
                id="fundoInovacao"
                type="text"
                placeholder="Ex: 1.041,44"
                value={formData.fundoInovacao}
                onChange={(e) => {
                  handleInputChange("fundoInovacao", e.target.value);
                }}
              />
            </div>

            {/* Resultado Sócios */}
            <div>
              <Label htmlFor="resultadoSocios">Resultado Sócios</Label>
              <Input
                id="resultadoSocios"
                type="text"
                placeholder="Ex: 1.041,44"
                value={formData.resultadoSocios}
                onChange={(e) => {
                  handleInputChange("resultadoSocios", e.target.value);
                }}
              />
            </div>

            {/* Fundo Emergencial */}
            <div>
              <Label htmlFor="fundoEmergencial">Fundo Emergencial</Label>
              <Input
                id="fundoEmergencial"
                type="text"
                placeholder="Ex: 1.041,44"
                value={formData.fundoEmergencial}
                onChange={(e) => {
                  handleInputChange("fundoEmergencial", e.target.value);
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
