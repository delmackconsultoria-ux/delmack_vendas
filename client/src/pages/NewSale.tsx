import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Search, CheckCircle, Loader, Eye, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import ErrorModal from "@/components/ErrorModal";
import { validateCPFOrCNPJ, formatCPF, formatCNPJ, validateCEP, fetchAddressFromCEP } from "@/lib/validators";

// Complete lists from Excel
const BUSINESS_TYPES = [
  { value: "venda_interna", label: "Venda Interna" },
  { value: "parceria_una", label: "Parceria UNA" },
  { value: "parceria_externa", label: "Parceria Externa" },
  { value: "lancamento", label: "Lançamento" },
  { value: "prontos", label: "Prontos" },
];

const PAYMENT_METHODS = [
  { value: "a_vista", label: "À Vista" },
  { value: "financiado", label: "Financiado" },
  { value: "consorcio", label: "Consórcio" },
  { value: "permuta", label: "Permuta" },
  { value: "bonificacao_construtora", label: "Bonificação Construtora" },
];

const CLIENT_ORIGINS = [
  { value: "grupo_zap", label: "Grupo Zap" },
  { value: "imovel_web", label: "Imóvel Web" },
  { value: "indicacao", label: "Indicação" },
  { value: "placa", label: "Placa" },
  { value: "construtora", label: "Construtora" },
  { value: "outro", label: "Outro" },
];

const STORES = [
  { value: "baggio", label: "Baggio" },
  { value: "outros", label: "Outros" },
  { value: "rede_una", label: "Rede UNA" },
];

interface Broker {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface FormData {
  propertyType: "baggio" | "external";
  propertyReference: string;
  propertyAddress: string;
  propertyNumber: string;
  propertyComplement: string;
  propertyNeighborhood: string;
  propertyCity: string;
  propertyState: string;
  propertyZipCode: string;
  advertisementValue: string;

  saleDate: string;
  angariationDate: string;
  saleValue: string;

  buyerName: string;
  buyerCpfCnpj: string;
  clientOrigin: string;
  paymentMethod: string;

  storeAngariador: string;
  storeVendedor: string;
  brokerAngariadorType: "internal" | "external"; // internal = from system, external = email
  brokerAngariador: string; // ID if internal, email if external
  brokerVendedorType: "internal" | "external";
  brokerVendedor: string; // ID if internal, email if external
  businessType: string;

  observations: string;

  showPreview: boolean;
}

interface ErrorState {
  isOpen: boolean;
  title: string;
  message: string;
  errors: string[];
}

interface CompletionStatus {
  [key: string]: boolean;
}

export default function NewSale() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<ErrorState>({
    isOpen: false,
    title: "",
    message: "",
    errors: [],
  });
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [propertyError, setPropertyError] = useState("");
  const [propertySuccess, setPropertySuccess] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [cpfError, setCpfError] = useState("");
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loadingBrokers, setLoadingBrokers] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    propertyType: "baggio",
    propertyReference: "",
    propertyAddress: "",
    propertyNumber: "",
    propertyComplement: "",
    propertyNeighborhood: "",
    propertyCity: "",
    propertyState: "",
    propertyZipCode: "",
    advertisementValue: "",
    saleDate: new Date().toISOString().split("T")[0],
    angariationDate: "",
    saleValue: "",
    buyerName: "",
    buyerCpfCnpj: "",
    clientOrigin: "",
    paymentMethod: "",
    storeAngariador: "baggio",
    storeVendedor: "baggio",
    brokerAngariadorType: "internal",
    brokerAngariador: "",
    brokerVendedorType: "internal",
    brokerVendedor: "",
    businessType: "venda_interna",
    observations: "",
    showPreview: false,
  });

  // Fetch brokers list
  const { data: brokersList } = trpc.brokers.listBrokers.useQuery();

  useEffect(() => {
    if (brokersList) {
      setBrokers(brokersList);
      setLoadingBrokers(false);
    }
  }, [brokersList]);

  const commissionRules: Record<string, { angariador: number; vendedor: number }> = {
    venda_interna: { angariador: 0.03, vendedor: 0.05 },
    parceria_una: { angariador: 0.035, vendedor: 0.035 },
    parceria_externa: { angariador: 0.04, vendedor: 0.04 },
    lancamento: { angariador: 0.025, vendedor: 0.025 },
    prontos: { angariador: 0.03, vendedor: 0.05 },
  };

  // Calculate completion status
  const completionStatus = useMemo<CompletionStatus>(() => {
    return {
      propertyType: true, // Always has default value
      propertyReference: formData.propertyType === "baggio" ? !!formData.propertyReference : true,
      propertyAddress: !!formData.propertyAddress,
      propertyCity: !!formData.propertyCity,
      propertyState: !!formData.propertyState,
      propertyZipCode: !!formData.propertyZipCode,
      saleDate: !!formData.saleDate,
      saleValue: !!formData.saleValue,
      buyerName: !!formData.buyerName,
      clientOrigin: !!formData.clientOrigin,
      paymentMethod: !!formData.paymentMethod,
      storeAngariador: true, // Always has default value
      storeVendedor: true, // Always has default value
      brokerAngariador: !!formData.brokerAngariador,
      brokerVendedor: !!formData.brokerVendedor,
      businessType: true, // Always has default value
    };
  }, [formData]);

  // Check if all required fields are filled
  const isFormComplete = useMemo(() => {
    return Object.values(completionStatus).every((status) => status === true);
  }, [completionStatus]);

  const handleSearchProperty = async () => {
    if (!formData.propertyReference.trim()) {
      setPropertyError("Informe a referência do imóvel");
      setPropertySuccess(false);
      return;
    }

    setLoadingProperty(true);
    setPropertyError("");
    setPropertySuccess(false);

    try {
      const response = await fetch(
        `/api/rest/properfy/search?reference=${encodeURIComponent(
          formData.propertyReference.toUpperCase()
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.data) {
        setPropertyError("Referência não encontrada. Verifique e tente novamente.");
        setPropertySuccess(false);
        setLoadingProperty(false);
        return;
      }

      if (data.data) {
        setFormData((prev) => ({
          ...prev,
          propertyAddress: data.data.address || "",
          propertyCity: data.data.city || "",
          propertyState: data.data.state || "",
          propertyZipCode: data.data.zipCode || "",
          advertisementValue: data.data.value?.toString() || "",
        }));
        setPropertyError("");
        setPropertySuccess(true);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao conectar com o servidor";
      console.error("Erro ao buscar imóvel:", errorMsg);
      setPropertyError("Referência não encontrada. Verifique e tente novamente.");
      setPropertySuccess(false);
    } finally {
      setLoadingProperty(false);
    }
  };

  const handleCEPSearch = async (cep: string) => {
    if (!validateCEP(cep)) {
      setPropertyError("CEP inválido");
      return;
    }

    setLoadingCEP(true);
    setPropertyError("");

    try {
      const address = await fetchAddressFromCEP(cep);

      if (!address) {
        setPropertyError("CEP não encontrado");
        setLoadingCEP(false);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        propertyAddress: address.address,
        propertyNeighborhood: address.neighborhood,
        propertyCity: address.city,
        propertyState: address.state,
      }));

      setPropertySuccess(true);
    } catch (error) {
      setPropertyError("Erro ao buscar CEP");
    } finally {
      setLoadingCEP(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "buyerCpfCnpj") {
      setCpfError("");
    }
  };

  const handleCPFChange = (value: string) => {
    handleInputChange("buyerCpfCnpj", value);
  };

  const validateCPF = () => {
    if (!formData.buyerCpfCnpj.trim()) {
      setCpfError("");
      return true;
    }

    if (!validateCPFOrCNPJ(formData.buyerCpfCnpj)) {
      setCpfError("CPF ou CNPJ inválido");
      return false;
    }

    setCpfError("");
    return true;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, fieldName: string) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (fieldName === "propertyReference") {
        handleSearchProperty();
      } else if (fieldName === "propertyZipCode" && formData.propertyType === "external") {
        handleCEPSearch(formData.propertyZipCode);
      }
    }
  };

  const commissionCalculation = useMemo(() => {
    const saleValue = parseFloat(formData.saleValue) || 0;
    const rules = commissionRules[formData.businessType] || commissionRules.venda_interna;

    const totalCommission = saleValue * (rules.angariador + rules.vendedor);
    const angariadorCommission = saleValue * rules.angariador;
    const vendedorCommission = saleValue * rules.vendedor;

    return {
      totalCommission: totalCommission.toFixed(2),
      angariadorCommission: angariadorCommission.toFixed(2),
      vendedorCommission: vendedorCommission.toFixed(2),
      angariadorPercentage: (rules.angariador * 100).toFixed(1),
      vendedorPercentage: (rules.vendedor * 100).toFixed(1),
      totalPercentage: ((rules.angariador + rules.vendedor) * 100).toFixed(1),
    };
  }, [formData.saleValue, formData.businessType]);

  const createSaleMutation = trpc.sales.createSale.useMutation();

  const validateForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.buyerName.trim()) {
      errors.push("Nome do comprador é obrigatório");
    }

    if (!formData.saleValue) {
      errors.push("Valor da venda é obrigatório");
    }

    if (!formData.propertyAddress.trim()) {
      errors.push("Endereço do imóvel é obrigatório");
    }

    if (!formData.businessType) {
      errors.push("Tipo de negócio é obrigatório");
    }

    if (formData.propertyType === "external" && !formData.propertyZipCode) {
      errors.push("CEP é obrigatório para imóveis externos");
    }

    if (formData.buyerCpfCnpj && !validateCPFOrCNPJ(formData.buyerCpfCnpj)) {
      errors.push("CPF ou CNPJ inválido");
    }

    if (!formData.brokerAngariador) {
      errors.push("Angariador é obrigatório");
    }

    if (!formData.brokerVendedor) {
      errors.push("Vendedor é obrigatório");
    }

    if (!formData.clientOrigin) {
      errors.push("Origem do cliente é obrigatória");
    }

    if (!formData.paymentMethod) {
      errors.push("Forma de pagamento é obrigatória");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const handleSaveClick = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm();

    if (!validation.valid) {
      setErrorModal({
        isOpen: true,
        title: "Erro ao Registrar Venda",
        message: "Por favor, corrija os campos destacados abaixo:",
        errors: validation.errors,
      });
      return;
    }

    // Show preview instead of submitting directly
    handleInputChange("showPreview", true);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const result = await createSaleMutation.mutateAsync({
        propertyType: formData.propertyType,
        propertyReference: formData.propertyReference,
        propertyAddress: formData.propertyAddress,
        propertyNumber: formData.propertyNumber,
        propertyComplement: formData.propertyComplement,
        propertyNeighborhood: formData.propertyNeighborhood,
        propertyCity: formData.propertyCity,
        propertyState: formData.propertyState,
        propertyZipCode: formData.propertyZipCode,
        advertisementValue: parseFloat(formData.advertisementValue) || 0,
        saleDate: new Date(formData.saleDate).toISOString(),
        angariationDate: formData.angariationDate
          ? new Date(formData.angariationDate).toISOString()
          : undefined,
        saleValue: parseFloat(formData.saleValue),
        buyerName: formData.buyerName,
        buyerCpfCnpj: formData.buyerCpfCnpj,
        clientOrigin: formData.clientOrigin,
        paymentMethod: formData.paymentMethod,
        storeAngariador: formData.storeAngariador,
        storeVendedor: formData.storeVendedor,
        brokerAngariador: formData.brokerAngariador,
        brokerVendedor: formData.brokerVendedor,
        businessType: formData.businessType,
        walletSituation: "disponivel",
        observations: formData.observations,
      });

      if (result.success) {
        setLocation("/");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao criar venda";
      setErrorModal({
        isOpen: true,
        title: "Erro ao Registrar Venda",
        message: errorMsg,
        errors: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  // Preview Mode
  if (formData.showPreview) {
    const angariadorBroker = formData.brokerAngariadorType === "internal"
      ? brokers.find((b) => b.id === formData.brokerAngariador)
      : { name: formData.brokerAngariador, email: formData.brokerAngariador };

    const vendedorBroker = formData.brokerVendedorType === "internal"
      ? brokers.find((b) => b.id === formData.brokerVendedor)
      : { name: formData.brokerVendedor, email: formData.brokerVendedor };

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => handleInputChange("showPreview", false)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Edição
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Resumo da Venda</CardTitle>
              <CardDescription>Verifique todas as informações antes de confirmar</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-8">
                {/* Property Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informações do Imóvel</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Referência</p>
                      <p className="font-semibold">{formData.propertyReference || "Externo"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Endereço</p>
                      <p className="font-semibold">{formData.propertyAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cidade/Estado</p>
                      <p className="font-semibold">
                        {formData.propertyCity}, {formData.propertyState}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CEP</p>
                      <p className="font-semibold">{formData.propertyZipCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Valor de Divulgação</p>
                      <p className="font-semibold">
                        R$ {parseFloat(formData.advertisementValue || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sale Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informações da Venda</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Data da Venda</p>
                      <p className="font-semibold">
                        {new Date(formData.saleDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data da Angariação</p>
                      <p className="font-semibold">
                        {formData.angariationDate
                          ? new Date(formData.angariationDate).toLocaleDateString("pt-BR")
                          : "Não informada"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Valor da Venda</p>
                      <p className="font-semibold text-lg">
                        R$ {parseFloat(formData.saleValue || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Client Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informações do Comprador</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Nome</p>
                      <p className="font-semibold">{formData.buyerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CPF/CNPJ</p>
                      <p className="font-semibold">{formData.buyerCpfCnpj || "Não informado"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Origem do Cliente</p>
                      <p className="font-semibold">
                        {CLIENT_ORIGINS.find((o) => o.value === formData.clientOrigin)?.label ||
                          formData.clientOrigin}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Forma de Pagamento</p>
                      <p className="font-semibold">
                        {PAYMENT_METHODS.find((m) => m.value === formData.paymentMethod)?.label ||
                          formData.paymentMethod}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commission Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Cálculo de Comissões</h3>
                  <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Negócio</p>
                      <p className="font-semibold">
                        {BUSINESS_TYPES.find((b) => b.value === formData.businessType)?.label}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">% Angariador</p>
                      <p className="font-semibold">{commissionCalculation.angariadorPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">% Vendedor</p>
                      <p className="font-semibold">{commissionCalculation.vendedorPercentage}%</p>
                    </div>
                    <div className="col-span-3 border-t border-blue-200 pt-4 mt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Comissão Angariador</p>
                          <p className="font-semibold text-lg">
                            R$ {parseFloat(commissionCalculation.angariadorCommission).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Comissão Vendedor</p>
                          <p className="font-semibold text-lg">
                            R$ {parseFloat(commissionCalculation.vendedorCommission).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="font-semibold text-lg text-blue-600">
                            R$ {parseFloat(commissionCalculation.totalCommission).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commission Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Detalhes de Comissionamento</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Loja Angariadora</p>
                      <p className="font-semibold">
                        {STORES.find((s) => s.value === formData.storeAngariador)?.label}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Loja Vendedora</p>
                      <p className="font-semibold">
                        {STORES.find((s) => s.value === formData.storeVendedor)?.label}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Angariador</p>
                      <p className="font-semibold">{angariadorBroker?.name || formData.brokerAngariador}</p>
                      {formData.brokerAngariadorType === "external" && (
                        <p className="text-xs text-gray-500">{angariadorBroker?.email}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Vendedor</p>
                      <p className="font-semibold">{vendedorBroker?.name || formData.brokerVendedor}</p>
                      {formData.brokerVendedorType === "external" && (
                        <p className="text-xs text-gray-500">{vendedorBroker?.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Observations */}
                {formData.observations && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Observações</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{formData.observations}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleInputChange("showPreview", false)}
                  >
                    Voltar para Edição
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || createSaleMutation.isPending}
                    className="gap-2"
                  >
                    {loading || createSaleMutation.isPending ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar e Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        errors={errorModal.errors}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
      />

      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Nova Venda</CardTitle>
            <CardDescription>Registre uma nova venda de imóvel com todos os detalhes</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSaveClick} className="space-y-8">
              {/* Section 1: Property Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">1. Informações do Imóvel</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Selecione o tipo de imóvel e preencha os dados
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="propertyType">Tipo de Imóvel</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) =>
                        handleInputChange("propertyType", value as "baggio" | "external")
                      }
                    >
                      <SelectTrigger id="propertyType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baggio">
                          Imóvel Baggio (com referência)
                        </SelectItem>
                        <SelectItem value="external">
                          Imóvel Externo (sem referência)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.propertyType === "baggio" && (
                    <div>
                      <Label htmlFor="propertyReference">
                        Referência do Imóvel
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="propertyReference"
                          placeholder="Ex: BG66206001"
                          value={formData.propertyReference}
                          onChange={(e) =>
                            handleInputChange("propertyReference", e.target.value)
                          }
                          onKeyPress={(e) => handleKeyPress(e, "propertyReference")}
                          disabled={loadingProperty}
                          className={completionStatus.propertyReference ? "bg-green-50 border-green-300" : ""}
                        />
                        <Button
                          type="button"
                          onClick={handleSearchProperty}
                          disabled={loadingProperty}
                          className="gap-2 whitespace-nowrap"
                        >
                          {loadingProperty ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Buscando...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4" />
                              Buscar
                            </>
                          )}
                        </Button>
                      </div>

                      {propertyError && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{propertyError}</p>
                        </div>
                      )}

                      {propertySuccess && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-green-700">Imóvel encontrado com sucesso</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="propertyAddress">Endereço</Label>
                      <Input
                        id="propertyAddress"
                        placeholder="Rua, avenida, etc"
                        value={formData.propertyAddress}
                        onChange={(e) =>
                          handleInputChange("propertyAddress", e.target.value)
                        }
                        className={completionStatus.propertyAddress ? "bg-green-50 border-green-300" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="propertyNumber">Número</Label>
                      <Input
                        id="propertyNumber"
                        placeholder="Número"
                        value={formData.propertyNumber}
                        onChange={(e) =>
                          handleInputChange("propertyNumber", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="propertyComplement">Complemento</Label>
                      <Input
                        id="propertyComplement"
                        placeholder="Apartamento, sala, etc (opcional)"
                        value={formData.propertyComplement}
                        onChange={(e) =>
                          handleInputChange("propertyComplement", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="propertyNeighborhood">Bairro</Label>
                      <Input
                        id="propertyNeighborhood"
                        placeholder="Bairro"
                        value={formData.propertyNeighborhood}
                        onChange={(e) =>
                          handleInputChange("propertyNeighborhood", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="propertyCity">Cidade</Label>
                      <Input
                        id="propertyCity"
                        placeholder="Cidade"
                        value={formData.propertyCity}
                        onChange={(e) =>
                          handleInputChange("propertyCity", e.target.value)
                        }
                        className={completionStatus.propertyCity ? "bg-green-50 border-green-300" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="propertyState">Estado</Label>
                      <Input
                        id="propertyState"
                        placeholder="UF"
                        maxLength={2}
                        value={formData.propertyState}
                        onChange={(e) =>
                          handleInputChange("propertyState", e.target.value)
                        }
                        className={completionStatus.propertyState ? "bg-green-50 border-green-300" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="propertyZipCode">CEP</Label>
                      <div className="flex gap-2">
                        <Input
                          id="propertyZipCode"
                          placeholder="00000-000"
                          value={formData.propertyZipCode}
                          onChange={(e) =>
                            handleInputChange("propertyZipCode", e.target.value)
                          }
                          onKeyPress={(e) => handleKeyPress(e, "propertyZipCode")}
                          className={completionStatus.propertyZipCode ? "bg-green-50 border-green-300" : ""}
                        />
                        {formData.propertyType === "external" && (
                          <Button
                            type="button"
                            onClick={() => handleCEPSearch(formData.propertyZipCode)}
                            disabled={loadingCEP}
                            className="gap-2 whitespace-nowrap"
                          >
                            {loadingCEP ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Buscando...
                              </>
                            ) : (
                              <>
                                <Search className="w-4 h-4" />
                                Buscar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      {propertyError && formData.propertyType === "external" && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{propertyError}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="advertisementValue">Valor de Divulgação</Label>
                      <Input
                        id="advertisementValue"
                        type="number"
                        placeholder="0.00"
                        value={formData.advertisementValue}
                        onChange={(e) =>
                          handleInputChange("advertisementValue", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Sale Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">2. Informações da Venda</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Datas e valores da transação
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="saleDate">Data da Venda</Label>
                      <Input
                        id="saleDate"
                        type="date"
                        value={formData.saleDate}
                        onChange={(e) =>
                          handleInputChange("saleDate", e.target.value)
                        }
                        className={completionStatus.saleDate ? "bg-green-50 border-green-300" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="angariationDate">Data da Angariação</Label>
                      <Input
                        id="angariationDate"
                        type="date"
                        value={formData.angariationDate}
                        onChange={(e) =>
                          handleInputChange("angariationDate", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="saleValue">Valor da Venda</Label>
                    <Input
                      id="saleValue"
                      type="number"
                      placeholder="0.00"
                      value={formData.saleValue}
                      onChange={(e) =>
                        handleInputChange("saleValue", e.target.value)
                      }
                      className={completionStatus.saleValue ? "bg-green-50 border-green-300" : ""}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Client Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">3. Informações do Comprador</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Dados do cliente e origem da negociação
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="buyerName">Nome do Comprador</Label>
                    <Input
                      id="buyerName"
                      placeholder="Nome completo"
                      value={formData.buyerName}
                      onChange={(e) =>
                        handleInputChange("buyerName", e.target.value)
                      }
                      className={completionStatus.buyerName ? "bg-green-50 border-green-300" : ""}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buyerCpfCnpj">
                        CPF/CNPJ
                        {cpfError && <span className="text-red-600 ml-2">*</span>}
                      </Label>
                      <Input
                        id="buyerCpfCnpj"
                        placeholder="000.000.000-00"
                        value={formData.buyerCpfCnpj}
                        onChange={(e) => handleCPFChange(e.target.value)}
                        onBlur={validateCPF}
                        className={cpfError ? "border-red-500 bg-red-50" : ""}
                      />
                      {cpfError && (
                        <p className="text-sm text-red-600 mt-1">{cpfError}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="clientOrigin">Origem do Cliente</Label>
                      <Select
                        value={formData.clientOrigin}
                        onValueChange={(value) =>
                          handleInputChange("clientOrigin", value)
                        }
                      >
                        <SelectTrigger id="clientOrigin" className={completionStatus.clientOrigin ? "bg-green-50 border-green-300" : ""}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CLIENT_ORIGINS.map((origin) => (
                            <SelectItem key={origin.value} value={origin.value}>
                              {origin.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        handleInputChange("paymentMethod", value)
                      }
                    >
                      <SelectTrigger id="paymentMethod" className={completionStatus.paymentMethod ? "bg-green-50 border-green-300" : ""}>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 4: Commission Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">4. Informações de Comissionamento</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Dados de lojas, corretores e tipo de negócio
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="storeAngariador">Loja Angariadora</Label>
                      <Select
                        value={formData.storeAngariador}
                        onValueChange={(value) =>
                          handleInputChange("storeAngariador", value)
                        }
                      >
                        <SelectTrigger id="storeAngariador">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STORES.map((store) => (
                            <SelectItem key={store.value} value={store.value}>
                              {store.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="storeVendedor">Loja Vendedora</Label>
                      <Select
                        value={formData.storeVendedor}
                        onValueChange={(value) =>
                          handleInputChange("storeVendedor", value)
                        }
                      >
                        <SelectTrigger id="storeVendedor">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STORES.map((store) => (
                            <SelectItem key={store.value} value={store.value}>
                              {store.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Angariador Selection */}
                  <div>
                    <Label>Angariador</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={formData.brokerAngariadorType === "internal" ? "default" : "outline"}
                          onClick={() => {
                            handleInputChange("brokerAngariadorType", "internal");
                            handleInputChange("brokerAngariador", "");
                          }}
                          className="flex-1"
                        >
                          Da Equipe
                        </Button>
                        <Button
                          type="button"
                          variant={formData.brokerAngariadorType === "external" ? "default" : "outline"}
                          onClick={() => {
                            handleInputChange("brokerAngariadorType", "external");
                            handleInputChange("brokerAngariador", "");
                          }}
                          className="flex-1"
                        >
                          Externo
                        </Button>
                      </div>

                      {formData.brokerAngariadorType === "internal" ? (
                        <Select
                          value={formData.brokerAngariador}
                          onValueChange={(value) =>
                            handleInputChange("brokerAngariador", value)
                          }
                          disabled={loadingBrokers}
                        >
                          <SelectTrigger className={completionStatus.brokerAngariador ? "bg-green-50 border-green-300" : ""}>
                            <SelectValue placeholder={loadingBrokers ? "Carregando..." : "Selecione um colega"} />
                          </SelectTrigger>
                          <SelectContent>
                            {brokers.map((broker) => (
                              <SelectItem key={broker.id} value={broker.id}>
                                {broker.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={formData.brokerAngariador}
                          onChange={(e) =>
                            handleInputChange("brokerAngariador", e.target.value)
                          }
                          className={completionStatus.brokerAngariador ? "bg-green-50 border-green-300" : ""}
                        />
                      )}
                    </div>
                  </div>

                  {/* Vendedor Selection */}
                  <div>
                    <Label>Vendedor</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={formData.brokerVendedorType === "internal" ? "default" : "outline"}
                          onClick={() => {
                            handleInputChange("brokerVendedorType", "internal");
                            handleInputChange("brokerVendedor", "");
                          }}
                          className="flex-1"
                        >
                          Da Equipe
                        </Button>
                        <Button
                          type="button"
                          variant={formData.brokerVendedorType === "external" ? "default" : "outline"}
                          onClick={() => {
                            handleInputChange("brokerVendedorType", "external");
                            handleInputChange("brokerVendedor", "");
                          }}
                          className="flex-1"
                        >
                          Externo
                        </Button>
                      </div>

                      {formData.brokerVendedorType === "internal" ? (
                        <Select
                          value={formData.brokerVendedor}
                          onValueChange={(value) =>
                            handleInputChange("brokerVendedor", value)
                          }
                          disabled={loadingBrokers}
                        >
                          <SelectTrigger className={completionStatus.brokerVendedor ? "bg-green-50 border-green-300" : ""}>
                            <SelectValue placeholder={loadingBrokers ? "Carregando..." : "Selecione um colega"} />
                          </SelectTrigger>
                          <SelectContent>
                            {brokers.map((broker) => (
                              <SelectItem key={broker.id} value={broker.id}>
                                {broker.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={formData.brokerVendedor}
                          onChange={(e) =>
                            handleInputChange("brokerVendedor", e.target.value)
                          }
                          className={completionStatus.brokerVendedor ? "bg-green-50 border-green-300" : ""}
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="businessType">Tipo de Negócio</Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) =>
                        handleInputChange("businessType", value)
                      }
                    >
                      <SelectTrigger id="businessType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 5: Commission Preview */}
              {formData.saleValue && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">5. Prévia de Comissões</h3>
                  <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div>
                      <p className="text-sm text-gray-600">% Angariador</p>
                      <p className="font-semibold text-lg">{commissionCalculation.angariadorPercentage}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        R$ {parseFloat(commissionCalculation.angariadorCommission).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">% Vendedor</p>
                      <p className="font-semibold text-lg">{commissionCalculation.vendedorPercentage}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        R$ {parseFloat(commissionCalculation.vendedorCommission).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-semibold text-lg text-blue-600">{commissionCalculation.totalPercentage}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        R$ {parseFloat(commissionCalculation.totalCommission).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 6: Observations */}
              <div>
                <h3 className="text-lg font-semibold mb-4">6. Observações</h3>
                <Label htmlFor="observations">Observações (opcional)</Label>
                <Textarea
                  id="observations"
                  placeholder="Adicione observações sobre a venda"
                  value={formData.observations}
                  onChange={(e) =>
                    handleInputChange("observations", e.target.value)
                  }
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormComplete}
                  className="gap-2"
                >
                  {!isFormComplete ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Preencha todos os campos
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Proposta
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

