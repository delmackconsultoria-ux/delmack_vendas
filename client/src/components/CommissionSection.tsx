import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Calculator } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { parseCurrencyInput, formatWhileTyping } from "@/lib/currencyFormatter";

// Tipos de Comissão conforme manual Baggio Imóveis
const COMMISSION_TYPES = [
  { 
    value: "Venda Interna", 
    label: "Venda Interna",
    percentage: 6,
    tooltip: "Venda realizada entre corretor angariador e corretor vendedor vinculados à Baggio Imóveis."
  },
  { 
    value: "Parceria UNA", 
    label: "Parceria UNA",
    percentage: 6,
    tooltip: "Venda realizada em parceria entre corretor da imobiliária UNA e corretor da Baggio Imóveis, com divisão do comissionamento entre as imobiliárias conforme regra vigente."
  },
  { 
    value: "Parceria Externa", 
    label: "Parceria Externa",
    percentage: 6,
    tooltip: "Venda realizada em parceria entre corretor de imobiliária externa (fora da UNA) e corretor da Baggio Imóveis, com divisão do comissionamento conforme regra estabelecida."
  },
  { 
    value: "Lançamentos (sem coordenação)", 
    label: "Lançamentos (sem coordenação)",
    percentage: 4,
    tooltip: "Venda de empreendimento em parceria com construtora, realizada por corretor vendedor da imobiliária, com comissão padrão de 4%."
  },
  { 
    value: "Lançamentos (com coordenação de produto)", 
    label: "Lançamentos (com coordenação de produto)",
    percentage: 4,
    tooltip: "Venda de empreendimento com participação de corretor coordenador de produto e corretor vendedor, com divisão de comissão conforme regra específica para coordenação."
  },
  { 
    value: "Corretor Autônomo", 
    label: "Corretor Autônomo",
    percentage: 6,
    tooltip: "Venda realizada em parceria com corretor autônomo, profissional independente sem estrutura imobiliária própria, com divisão de comissionamento conforme regra aplicável."
  },
  { 
    value: "Imóveis Ebani", 
    label: "Imóveis Ebani",
    percentage: 5,
    tooltip: "(Proprietário: Elcio Baggio) Venda de imóvel de propriedade de Elcio Baggio, com exigência de exclusividade de anúncio na imobiliária e comissão total fixada em 5%."
  },
  {
    value: "Personalizar",
    label: "Personalizar",
    percentage: 0,
    tooltip: "Permite definir manualmente os valores e porcentagens da comissão para casos não previstos nas regras padrão."
  }
];

interface CommissionCalculation {
  totalCommission: number;
  brokerAngariador?: number;
  brokerCoordenador?: number;
  brokerVendedor: number;
  imobiliaria: number;
  parceira?: number;
  autonomo?: number;
}

/**
 * Calcula comissões baseado no tipo de negócio
 */
function calculateCommission(
  tipo: string,
  valorVenda: number,
  porcentagemCustom?: number
): CommissionCalculation {
  
  const tipoObj = COMMISSION_TYPES.find(t => t.value === tipo);
  const porcentagem = porcentagemCustom !== undefined ? porcentagemCustom : (tipoObj?.percentage || 0);
  const totalCommission = valorVenda * (porcentagem / 100);
  
  switch (tipo) {
    case 'Venda Interna':
      return {
        totalCommission,
        brokerAngariador: totalCommission * 0.20,
        brokerVendedor: totalCommission * 0.20,
        imobiliaria: totalCommission * 0.60
      };
    
    case 'Parceria UNA':
      const baseUNA = totalCommission * 0.50;
      return {
        totalCommission,
        brokerVendedor: baseUNA * 0.40,
        imobiliaria: baseUNA * 0.60,
        parceira: totalCommission * 0.50
      };
    
    case 'Parceria Externa':
      const baseExterna = totalCommission * 0.60;
      return {
        totalCommission,
        brokerVendedor: baseExterna * 0.40,
        imobiliaria: baseExterna * 0.60,
        parceira: totalCommission * 0.40
      };
    
    case 'Lançamentos (sem coordenação)':
      return {
        totalCommission,
        brokerVendedor: totalCommission * 0.35,
        imobiliaria: totalCommission * 0.65
      };
    
    case 'Lançamentos (com coordenação de produto)':
      return {
        totalCommission,
        brokerCoordenador: totalCommission * 0.10,
        brokerVendedor: totalCommission * 0.30,
        imobiliaria: totalCommission * 0.60
      };
    
    case 'Corretor Autônomo':
      const baseAutonomo = totalCommission * 0.70;
      return {
        totalCommission,
        brokerVendedor: baseAutonomo * 0.40,
        imobiliaria: baseAutonomo * 0.60,
        autonomo: totalCommission * 0.30
      };
    
    case 'Imóveis Ebani':
      return {
        totalCommission,
        brokerAngariador: totalCommission * 0.10,
        brokerVendedor: totalCommission * 0.30,
        imobiliaria: totalCommission * 0.60
      };
      
    case 'Personalizar':
      return {
        totalCommission,
        brokerVendedor: 0,
        imobiliaria: 0
      };
    
    default:
      return {
        totalCommission: 0,
        brokerVendedor: 0,
        imobiliaria: 0
      };
  }
}

interface CommissionSectionProps {
  formData: any;
  handleInputChange: (field: any, value: any) => void;
  attemptedSave?: boolean;
  completionStatus?: any;
}

export default function CommissionSection({ formData, handleInputChange }: CommissionSectionProps) {
  
  // Função para recalcular comissões quando tipo ou valor muda
  const handleCommissionTypeChange = (tipo: string) => {
    handleInputChange("tipoComissao", tipo);
    
    // Auto-preencher porcentagem padrão se não for personalizar
    const tipoObj = COMMISSION_TYPES.find(t => t.value === tipo);
    if (tipoObj) {
      if (tipo !== "Personalizar") {
        handleInputChange("porcentagemComissao", tipoObj.percentage.toString());
        
        // Recalcular se já tem valor de venda
        if (formData.saleValue) {
          const valorNumerico = parseCurrencyInput(formData.saleValue);
          if (valorNumerico > 0) {
            recalculateCommissions(tipo, valorNumerico, tipoObj.percentage);
          }
        }
      } else {
        // Se for personalizar, zera tudo para o usuário preencher
        handleInputChange("porcentagemComissao", "");
        handleInputChange("comissaoTotal", "");
        handleInputChange("comissaoAngariador", "");
        handleInputChange("comissaoAngariadorPerc", "");
        handleInputChange("comissaoCoordenador", "");
        handleInputChange("comissaoCoordenadorPerc", "");
        handleInputChange("comissaoVendedor", "");
        handleInputChange("comissaoVendedorPerc", "");
        handleInputChange("comissaoImobiliaria", "");
        handleInputChange("comissaoImobiliariaPerc", "");
        handleInputChange("comissaoParceira", "");
        handleInputChange("comissaoParceiraPerc", "");
        handleInputChange("comissaoAutonomo", "");
        handleInputChange("comissaoAutonomoPerc", "");
      }
    }
  };
  
  const handlePercentageChange = (percentage: string) => {
    handleInputChange("porcentagemComissao", percentage);
    
    if (formData.tipoComissao && formData.saleValue && percentage) {
      const valorNumerico = parseCurrencyInput(formData.saleValue);
      if (valorNumerico > 0) {
        recalculateCommissions(formData.tipoComissao, valorNumerico, parseFloat(percentage));
      }
    }
  };
  
  const recalculateCommissions = (tipo: string, valorVenda: number, porcentagem: number) => {
    if (tipo === "Personalizar") {
      // Se for personalizar, apenas calcula o total baseado na porcentagem, os outros campos ficam livres
      const totalCommission = valorVenda * (porcentagem / 100);
      handleInputChange("comissaoTotal", totalCommission.toFixed(2));
      return;
    }
    
    const calc = calculateCommission(tipo, valorVenda, porcentagem);
    
    handleInputChange("comissaoTotal", calc.totalCommission.toFixed(2));
    handleInputChange("comissaoAngariador", (calc.brokerAngariador || 0).toFixed(2));
    handleInputChange("comissaoCoordenador", (calc.brokerCoordenador || 0).toFixed(2));
    handleInputChange("comissaoVendedor", calc.brokerVendedor.toFixed(2));
    handleInputChange("comissaoImobiliaria", calc.imobiliaria.toFixed(2));
    handleInputChange("comissaoParceira", (calc.parceira || 0).toFixed(2));
    handleInputChange("comissaoAutonomo", (calc.autonomo || 0).toFixed(2));
  };

  // Helpers para sincronização % <-> R$ no modo Personalizar
  const getValorVenda = () => {
    if (formData.saleValue) {
      return parseCurrencyInput(formData.saleValue);
    }
    return 0;
  };

  const getComissaoTotal = () => {
    return parseFloat(formData.comissaoTotal || "0") || 0;
  };

  // Ao editar % de um participante: calcula R$ automaticamente
  const handlePercChange = (field: string, fieldPerc: string, percValue: string) => {
    handleInputChange(fieldPerc, percValue);
    const perc = parseFloat(percValue) || 0;
    const total = getComissaoTotal();
    if (total > 0) {
      const valor = total * (perc / 100);
      handleInputChange(field, valor.toFixed(2));
    }
  };

  // Ao editar R$ de um participante: calcula % automaticamente
  const handleValorChange = (field: string, fieldPerc: string, valorValue: string) => {
    handleInputChange(field, valorValue);
    const valor = parseFloat(valorValue) || 0;
    const total = getComissaoTotal();
    if (total > 0) {
      const perc = (valor / total) * 100;
      handleInputChange(fieldPerc, perc.toFixed(4));
    }
  };

  // Ao editar a porcentagem total no modo Personalizar: recalcula o total e mantém os % dos participantes
  const handleTotalPercChange = (percentage: string) => {
    handleInputChange("porcentagemComissao", percentage);
    const perc = parseFloat(percentage) || 0;
    const valorVenda = getValorVenda();
    if (valorVenda > 0) {
      const novoTotal = valorVenda * (perc / 100);
      handleInputChange("comissaoTotal", novoTotal.toFixed(2));
      // Recalcular R$ de cada participante baseado nos % já definidos
      const campos = [
        { field: "comissaoAngariador", fieldPerc: "comissaoAngariadorPerc" },
        { field: "comissaoCoordenador", fieldPerc: "comissaoCoordenadorPerc" },
        { field: "comissaoVendedor", fieldPerc: "comissaoVendedorPerc" },
        { field: "comissaoImobiliaria", fieldPerc: "comissaoImobiliariaPerc" },
        { field: "comissaoParceira", fieldPerc: "comissaoParceiraPerc" },
        { field: "comissaoAutonomo", fieldPerc: "comissaoAutonomoPerc" },
      ];
      campos.forEach(({ field, fieldPerc }) => {
        const p = parseFloat(formData[fieldPerc] || "0") || 0;
        if (p > 0) {
          handleInputChange(field, (novoTotal * (p / 100)).toFixed(2));
        }
      });
    }
  };
  
  // Calcular bonificação
  const handleBonusChange = (valor: string) => {
    handleInputChange("valorBonificacao", valor);
    
    if (formData.tipoBonificacao && valor) {
      const valorNum = parseFloat(valor);
      if (formData.tipoBonificacao === "Material") {
        handleInputChange("comissaoBonificacaoCorretor", valorNum.toFixed(2));
        handleInputChange("comissaoBonificacaoImobiliaria", "0.00");
      } else {
        // Dinheiro: 50/50
        handleInputChange("comissaoBonificacaoCorretor", (valorNum * 0.5).toFixed(2));
        handleInputChange("comissaoBonificacaoImobiliaria", (valorNum * 0.5).toFixed(2));
      }
    }
  };
  
  const handleBonusTypeChange = (tipo: string) => {
    handleInputChange("tipoBonificacao", tipo);
    
    if (formData.valorBonificacao) {
      const valorNum = parseFloat(formData.valorBonificacao);
      if (tipo === "Material") {
        handleInputChange("comissaoBonificacaoCorretor", valorNum.toFixed(2));
        handleInputChange("comissaoBonificacaoImobiliaria", "0.00");
      } else {
        handleInputChange("comissaoBonificacaoCorretor", (valorNum * 0.5).toFixed(2));
        handleInputChange("comissaoBonificacaoImobiliaria", (valorNum * 0.5).toFixed(2));
      }
    }
  };
  
  const isPersonalizar = formData.tipoComissao === "Personalizar";
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Informações de Comissionamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Comissão */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              Tipo de Comissão *
              {formData.tipoComissao && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        {COMMISSION_TYPES.find(t => t.value === formData.tipoComissao)?.tooltip}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </Label>
            <Select value={formData.tipoComissao} onValueChange={handleCommissionTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de comissão" />
              </SelectTrigger>
              <SelectContent>
                {COMMISSION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label} {type.percentage > 0 ? `(${type.percentage}%)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Porcentagem da Comissão (%)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Ex: 6.00"
              value={formData.porcentagemComissao}
              onChange={(e) => isPersonalizar ? handleTotalPercChange(e.target.value) : handlePercentageChange(e.target.value)}
            />
          </div>
        </div>
        
        {/* Resumo de Comissões Calculadas */}
        {formData.tipoComissao && (isPersonalizar || formData.comissaoTotal) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              {isPersonalizar ? "Distribuição Personalizada de Comissões" : "Resumo de Comissões Calculadas"}
            </h4>
            
            {/* Total */}
            <div className="flex justify-between col-span-2 border-b border-blue-100 pb-2 mb-1 text-sm">
              <span className="text-muted-foreground font-medium">Comissão Total:</span>
              <span className="font-semibold text-foreground text-base">
                R$ {parseFloat(formData.comissaoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {isPersonalizar ? (
              /* Modo Personalizar: campos editáveis de % e R$ para cada participante */
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground italic">
                  Edite o % ou o R$ de cada participante — os valores são sincronizados automaticamente com base na comissão total.
                </p>

                {/* Angariador */}
                <div className="grid grid-cols-3 gap-2 items-center text-sm">
                  <span className="text-muted-foreground">Corretor Angariador:</span>
                  <div className="flex items-center gap-1">
                    <Input
                      className="h-8 text-right font-semibold text-green-600"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.comissaoAngariadorPerc || ""}
                      onChange={(e) => handlePercChange("comissaoAngariador", "comissaoAngariadorPerc", e.target.value)}
                      placeholder="0.00"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <Input
                      className="h-8 text-right font-semibold text-green-600"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.comissaoAngariador || ""}
                      onChange={(e) => handleValorChange("comissaoAngariador", "comissaoAngariadorPerc", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
