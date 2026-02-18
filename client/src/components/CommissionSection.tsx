import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Calculator } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { parseCurrencyInput } from "@/lib/currencyFormatter";

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
    tooltip: "Venda de imóvel de propriedade de Elcio Baggio, com exigência de exclusividade de anúncio na imobiliária e comissão total fixada em 5%."
  },
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
  const porcentagem = porcentagemCustom || tipoObj?.percentage || 0;
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
}

export function CommissionSection({ formData, handleInputChange }: CommissionSectionProps) {
  
  // Função para recalcular comissões quando tipo ou valor muda
  const handleCommissionTypeChange = (tipo: string) => {
    handleInputChange("tipoComissao", tipo);
    
    // Auto-preencher porcentagem padrão
    const tipoObj = COMMISSION_TYPES.find(t => t.value === tipo);
    if (tipoObj) {
      handleInputChange("porcentagemComissao", tipoObj.percentage.toString());
      
      // Recalcular se já tem valor de venda
      if (formData.saleValue) {
        const valorNumerico = parseCurrencyInput(formData.saleValue);
        if (valorNumerico > 0) {
          recalculateCommissions(tipo, valorNumerico, tipoObj.percentage);
        }
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
    const calc = calculateCommission(tipo, valorVenda, porcentagem);
    
    handleInputChange("comissaoTotal", calc.totalCommission.toFixed(2));
    handleInputChange("comissaoAngariador", (calc.brokerAngariador || 0).toFixed(2));
    handleInputChange("comissaoCoordenador", (calc.brokerCoordenador || 0).toFixed(2));
    handleInputChange("comissaoVendedor", calc.brokerVendedor.toFixed(2));
    handleInputChange("comissaoImobiliaria", calc.imobiliaria.toFixed(2));
    handleInputChange("comissaoParceira", (calc.parceira || 0).toFixed(2));
    handleInputChange("comissaoAutonomo", (calc.autonomo || 0).toFixed(2));
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
                    {type.label} ({type.percentage}%)
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
              onChange={(e) => handlePercentageChange(e.target.value)}
            />
          </div>
        </div>
        
        {/* Resumo de Comissões Calculadas */}
        {formData.tipoComissao && formData.comissaoTotal && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Resumo de Comissões Calculadas
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Comissão Total:</span>
                <span className="font-semibold text-slate-900">
                  R$ {parseFloat(formData.comissaoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              {parseFloat(formData.comissaoAngariador || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Corretor Angariador:</span>
                  <span className="font-semibold text-green-600">
                    R$ {parseFloat(formData.comissaoAngariador).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              
              {parseFloat(formData.comissaoCoordenador || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Coordenador:</span>
                  <span className="font-semibold text-green-600">
                    R$ {parseFloat(formData.comissaoCoordenador).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-slate-600">Corretor Vendedor:</span>
                <span className="font-semibold text-green-600">
                  R$ {parseFloat(formData.comissaoVendedor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-600">Imobiliária:</span>
                <span className="font-semibold text-blue-600">
                  R$ {parseFloat(formData.comissaoImobiliaria || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              {parseFloat(formData.comissaoParceira || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Imobiliária Parceira:</span>
                  <span className="font-semibold text-purple-600">
                    R$ {parseFloat(formData.comissaoParceira).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              
              {parseFloat(formData.comissaoAutonomo || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Corretor Autônomo:</span>
                  <span className="font-semibold text-orange-600">
                    R$ {parseFloat(formData.comissaoAutonomo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Seção de Bonificações */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-4">
            <Checkbox
              checked={formData.possuiBonificacao}
              onCheckedChange={(checked) => handleInputChange("possuiBonificacao", checked)}
            />
            <Label className="cursor-pointer">Possui Bonificação/Prêmio?</Label>
          </div>
          
          {formData.possuiBonificacao && (
            <div className="space-y-4 pl-6 border-l-2 border-blue-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Bonificação</Label>
                  <Select value={formData.tipoBonificacao} onValueChange={handleBonusTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro">Dinheiro (50% corretor / 50% imobiliária)</SelectItem>
                      <SelectItem value="Material">Material (100% corretor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Valor da Bonificação (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1000.00"
                    value={formData.valorBonificacao}
                    onChange={(e) => handleBonusChange(e.target.value)}
                    disabled={!formData.tipoBonificacao}
                  />
                </div>
              </div>
              
              <div>
                <Label>Descrição da Bonificação</Label>
                <Textarea
                  placeholder="Descreva o prêmio ou bonificação (ex: Prêmio campanha Q1, Viagem para Gramado, etc.)"
                  value={formData.descricaoBonificacao}
                  onChange={(e) => handleInputChange("descricaoBonificacao", e.target.value)}
                  rows={2}
                />
              </div>
              
              {formData.tipoBonificacao && formData.valorBonificacao && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bonificação Corretor:</span>
                    <span className="font-semibold text-green-700">
                      R$ {parseFloat(formData.comissaoBonificacaoCorretor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bonificação Imobiliária:</span>
                    <span className="font-semibold text-green-700">
                      R$ {parseFloat(formData.comissaoBonificacaoImobiliaria || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
