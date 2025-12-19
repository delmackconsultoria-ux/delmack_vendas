import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Search, CheckCircle, Loader, Eye, CheckCircle2, AlertCircle, X, Upload, FileText } from "lucide-react";
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

const PROPERTY_TYPES = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
  { value: "outro", label: "Outro" },
];

const INVESTMENT_TYPES = [
  { value: "investimento", label: "Investimento" },
  { value: "moradia", label: "Moradia" },
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
  // Property Info
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
  
  // New Property Details
  typeOfProperty: string;
  bedrooms: string;
  costPerM2: string;
  privateArea: string;
  totalArea: string;
  propertyAge: string;

  // Sale Info
  saleDate: string;
  angariationDate: string;
  saleValue: string;

  // Buyer Info
  buyerName: string;
  buyerCpfCnpj: string;
  buyerPhone: string;
  clientOrigin: string;
  paymentMethod: string;
  financedValue: string;

  // Seller Info
  sellerName: string;
  sellerCpfCnpj: string;
  sellerPhone: string;

  // Additional Info
  cartoryBank: string;
  despachante: string;
  investmentType: string;

  // Broker Info
  storeAngariador: string;
  storeVendedor: string;
  brokerAngariadorType: "internal" | "external";
  brokerAngariador: string;
  brokerVendedorType: "internal" | "external";
  brokerVendedor: string;
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
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoadingBrokers, setIsLoadingBrokers] = useState(false);

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
    
    typeOfProperty: "",
    bedrooms: "",
    costPerM2: "",
    privateArea: "",
    totalArea: "",
    propertyAge: "",

    saleDate: "",
    angariationDate: "",
    saleValue: "",

    buyerName: "",
    buyerCpfCnpj: "",
    buyerPhone: "",
    clientOrigin: "",
    paymentMethod: "",
    financedValue: "",

    sellerName: "",
    sellerCpfCnpj: "",
    sellerPhone: "",

    cartoryBank: "",
    despachante: "",
    investmentType: "",

    storeAngariador: "",
    storeVendedor: "",
    brokerAngariadorType: "internal",
    brokerAngariador: "",
    brokerVendedorType: "internal",
    brokerVendedor: "",
    businessType: "",

    observations: "",
    showPreview: false,
  });

  const [errorState, setErrorState] = useState<ErrorState>({
    isOpen: false,
    title: "",
    message: "",
    errors: [],
  });

  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properfySearch, setProperfySearch] = useState({ loading: false, error: "", found: false });
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const createSaleMutation = trpc.sales.createSale.useMutation();
  const uploadMutation = trpc.sales.uploadProposalDocument.useMutation();

  // Buscar imóvel no Properfy
  const handleSearchPropertyfy = async () => {
    if (!formData.propertyReference) return;
    setProperfySearch({ loading: true, error: "", found: false });
    try {
      const result = await fetch(`/api/trpc/sales.searchProperty?input=${encodeURIComponent(JSON.stringify({ reference: formData.propertyReference }))}`);
      const data = await result.json();
      if (data.result?.data?.success && data.result?.data?.property) {
        const prop = data.result.data.property;
        setFormData(prev => ({
          ...prev,
          propertyAddress: prop.address || prev.propertyAddress,
          propertyCity: prop.city || prev.propertyCity,
          propertyState: prop.state || prev.propertyState,
          propertyNeighborhood: prop.district || prev.propertyNeighborhood,
          propertyZipCode: prop.postalCode || prev.propertyZipCode,
          typeOfProperty: prop.propertyType?.toLowerCase() || prev.typeOfProperty,
          advertisementValue: prop.value?.toString() || prev.advertisementValue,
          privateArea: prop.area?.toString() || prev.privateArea,
          bedrooms: prop.bedrooms?.toString() || prev.bedrooms,
        }));
        setProperfySearch({ loading: false, error: "", found: true });
      } else {
        setProperfySearch({ loading: false, error: data.result?.data?.error || "Imóvel não encontrado no Properfy", found: false });
      }
    } catch {
      setProperfySearch({ loading: false, error: "Erro ao conectar com Properfy. Preencha manualmente.", found: false });
    }
  };

  // Upload de proposta
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setProposalFile(e.target.files[0]);
  };

  // Load brokers from TRPC
  const { data: brokersList } = trpc.brokers.listBrokers.useQuery(undefined);
  useEffect(() => {
    if (brokersList) {
      setBrokers(brokersList);
    }
  }, [brokersList]);

  // Initialize completionStatus on mount and when formData changes
  useEffect(() => {
    const requiredFieldsToCheck = [
      "buyerName",
      "sellerName",
      "saleValue",
      "typeOfProperty",
      "bedrooms",
      "privateArea",
      "totalArea",
      "propertyAddress",
      "saleDate",
      "storeAngariador",
      "storeVendedor",
      "brokerAngariador",
      "brokerVendedor",
      "businessType",
      "buyerCpfCnpj",
      "sellerCpfCnpj",
    ];
    const newCompletionStatus: CompletionStatus = {};
    requiredFieldsToCheck.forEach((field) => {
      const value = formData[field as keyof FormData];
      const isComplete = value !== "" && value !== null && value !== undefined && value !== "Selecione";
      newCompletionStatus[field as keyof CompletionStatus] = isComplete;
    });
    setCompletionStatus(newCompletionStatus);
  }, [
    formData.buyerName,
    formData.sellerName,
    formData.saleValue,
    formData.typeOfProperty,
    formData.bedrooms,
    formData.privateArea,
    formData.totalArea,
    formData.propertyAddress,
    formData.saleDate,
    formData.storeAngariador,
    formData.storeVendedor,
    formData.brokerAngariador,
    formData.brokerVendedor,
    formData.businessType,
    formData.buyerCpfCnpj,
    formData.sellerCpfCnpj,
  ]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Update completion status
    setCompletionStatus((prev) => ({
      ...prev,
      [field]: value !== "" && value !== null,
    }));
  };

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    handleInputChange("propertyZipCode", cep);

    if (validateCEP(cep)) {
      try {
        const address = await fetchAddressFromCEP(cep);
        if (address) {
          setFormData((prev) => ({
            ...prev,
            propertyAddress: address.address,
            propertyNeighborhood: address.neighborhood,
            propertyCity: address.city,
            propertyState: address.state,
          }));
        }
      } catch (error) {
        console.error("Error fetching address:", error);
      }
    }
  };

  const handleCPFChange = (field: "buyerCpfCnpj" | "sellerCpfCnpj", value: string) => {
    // Allow any value, validation will be done on the server
    if (value === "") {
      handleInputChange(field, "");
    } else {
      // Format if it looks like a CPF or CNPJ
      const cleanValue = value.replace(/\D/g, "");
      if (cleanValue.length === 11) {
        const formatted = formatCPF(value);
        handleInputChange(field, formatted);
      } else if (cleanValue.length === 14) {
        const formatted = formatCNPJ(value);
        handleInputChange(field, formatted);
      } else {
        // If it doesn't match either format, save as is
        handleInputChange(field, value);
      }
    }
  };



  const requiredFields = [
    "propertyAddress",
    "saleValue",
    "buyerName",
    "buyerCpfCnpj",
    "businessType",
    "sellerName",
    "sellerCpfCnpj",
    "typeOfProperty",
    "bedrooms",
    "privateArea",
    "totalArea",
    "saleDate",
    "storeAngariador",
    "storeVendedor",
    "brokerAngariador",
    "brokerVendedor",
  ];

  const isFormComplete = requiredFields.every((field) => completionStatus[field]);

  const handleSave = async () => {
    if (!isFormComplete) {
      const missingFields = requiredFields.filter((field) => !completionStatus[field]);
      setErrorState({
        isOpen: true,
        title: "Campos Obrigatórios",
        message: "Por favor, preencha todos os campos obrigatórios antes de salvar.",
        errors: missingFields.map((field) => {
          const fieldLabels: { [key: string]: string } = {
            propertyAddress: "Endereço do Imóvel",
            saleValue: "Valor da Venda",
            buyerName: "Nome do Comprador",
            buyerCpfCnpj: "CPF/CNPJ do Comprador",
            businessType: "Tipo de Negócio",
            sellerName: "Nome do Vendedor",
            sellerCpfCnpj: "CPF/CNPJ do Vendedor",
            typeOfProperty: "Tipo do Imóvel",
            bedrooms: "Quantidade de Quartos",
            privateArea: "Área Privativa",
            totalArea: "Área Total",
            saleDate: "Data da Venda",
            storeAngariador: "Loja Angariador",
            storeVendedor: "Loja Vendedor",
            brokerAngariador: "Corretor Angariador",
            brokerVendedor: "Corretor Vendedor",
          };
          return fieldLabels[field] || field;
        }),
      });
      return;
    }

    setFormData((prev) => ({ ...prev, showPreview: true }));
  };

  const handleConfirmAndSave = async () => {
    try {
      setIsSubmitting(true);
      
      // Converter data para ISO format
      const saleDateObj = new Date(formData.saleDate);
      const angariationDateObj = formData.angariationDate ? new Date(formData.angariationDate) : null;
      
      const payload = {
        propertyType: formData.propertyType as "baggio" | "external",
        propertyReference: formData.propertyReference,
        propertyAddress: formData.propertyAddress,
        propertyNumber: formData.propertyNumber,
        propertyComplement: formData.propertyComplement,
        propertyNeighborhood: formData.propertyNeighborhood,
        propertyCity: formData.propertyCity,
        propertyState: formData.propertyState,
        propertyZipCode: formData.propertyZipCode,
        advertisementValue: formData.advertisementValue ? parseFloat(formData.advertisementValue) : undefined,
        saleDate: saleDateObj.toISOString(),
        angariationDate: angariationDateObj ? angariationDateObj.toISOString() : undefined,
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
        observations: formData.observations,
      };

      const result = await createSaleMutation.mutateAsync(payload);
      
      // Upload do arquivo de proposta se houver
      if (proposalFile && result.saleId) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(proposalFile);
          });
          
          await uploadMutation.mutateAsync({
            saleId: result.saleId,
            fileName: proposalFile.name,
            fileData: base64,
            contentType: proposalFile.type
          });
        } catch (uploadError) {
          console.error('Erro ao fazer upload da proposta:', uploadError);
        }
      }
      
      setErrorState({
        isOpen: true,
        title: "Sucesso",
        message: "Venda registrada com sucesso!",
        errors: [],
      });
      
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    } catch (error: any) {
      setErrorState({
        isOpen: true,
        title: "Erro ao Salvar",
        message: error.message || "Ocorreu um erro ao salvar a venda",
        errors: [error.message || "Erro desconhecido"],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (formData.showPreview) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto py-8 px-4">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Resumo da Proposta
              </CardTitle>
              <CardDescription>Revise os dados antes de confirmar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preview content */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Comprador</p>
                  <p className="font-semibold">{formData.buyerName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Vendedor</p>
                  <p className="font-semibold">{formData.sellerName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Valor da Venda</p>
                  <p className="font-semibold">R$ {parseFloat(formData.saleValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Tipo de Imóvel</p>
                  <p className="font-semibold">{formData.typeOfProperty}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Área Privativa</p>
                  <p className="font-semibold">{formData.privateArea} m²</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Área Total</p>
                  <p className="font-semibold">{formData.totalArea} m²</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setFormData((prev) => ({ ...prev, showPreview: false }))}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300"
                  disabled={isSubmitting}
                >
                  Voltar para Edição
                </button>
                <button
                  onClick={handleConfirmAndSave}
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Confirmar e Salvar
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <h1 className="text-3xl font-bold text-slate-900">Registrar Nova Venda</h1>
            <p className="text-slate-600 mt-2">Preencha todos os campos obrigatórios para registrar uma nova proposta de venda</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Referência Properfy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Referência do Imóvel (Properfy)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite a referência do imóvel"
                    value={formData.propertyReference}
                    onChange={(e) => handleInputChange("propertyReference", e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearchPropertyfy} disabled={properfySearch.loading || !formData.propertyReference}>
                    {properfySearch.loading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Buscar
                  </Button>
                </div>
                {properfySearch.error && (
                  <p className="text-amber-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {properfySearch.error}
                  </p>
                )}
                {properfySearch.found && (
                  <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Imóvel encontrado! Dados preenchidos automaticamente.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Property Type Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipo do Imóvel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo do Imóvel *</Label>
                    <Select value={formData.typeOfProperty} onValueChange={(value) => handleInputChange("typeOfProperty", value)}>
                      <SelectTrigger className={completionStatus.typeOfProperty ? "bg-green-50 border-green-300" : ""}>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantidade de Quartos *</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 3"
                      value={formData.bedrooms}
                      onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                      className={completionStatus.bedrooms ? "bg-green-50 border-green-300" : ""}
                    />
                  </div>
                  <div>
                    <Label>Área Privativa (m²) *</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 120.50"
                      value={formData.privateArea}
                      onChange={(e) => handleInputChange("privateArea", e.target.value)}
                      className={completionStatus.privateArea ? "bg-green-50 border-green-300" : ""}
                    />
                  </div>
                  <div>
                    <Label>Área Total (m²) *</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 150.00"
                      value={formData.totalArea}
                      onChange={(e) => handleInputChange("totalArea", e.target.value)}
                      className={completionStatus.totalArea ? "bg-green-50 border-green-300" : ""}
                    />
                  </div>
                  <div>
                    <Label>Custo por m² (Área Privativa)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 5000.00"
                      value={formData.costPerM2}
                      onChange={(e) => handleInputChange("costPerM2", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Idade do Imóvel (anos)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 5"
                      value={formData.propertyAge}
                      onChange={(e) => handleInputChange("propertyAge", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Address Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Endereço do Imóvel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CEP</Label>
                    <Input
                      placeholder="00000-000"
                      value={formData.propertyZipCode}
                      onChange={handleCEPChange}
                      onKeyPress={(e) => e.key === "Enter" && handleCEPChange(e as any)}
                    />
                  </div>
                  <div>
                    <Label>Endereço *</Label>
                    <Input
                      placeholder="Rua/Avenida"
                      value={formData.propertyAddress}
                      onChange={(e) => handleInputChange("propertyAddress", e.target.value)}
                      className={completionStatus.propertyAddress ? "bg-green-50 border-green-300" : ""}
                    />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input
                      placeholder="123"
                      value={formData.propertyNumber}
                      onChange={(e) => handleInputChange("propertyNumber", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Complemento</Label>
                    <Input
                      placeholder="Apto 101"
                      value={formData.propertyComplement}
                      onChange={(e) => handleInputChange("propertyComplement", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Bairro</Label>
                    <Input
                      placeholder="Bairro"
                      value={formData.propertyNeighborhood}
                      onChange={(e) => handleInputChange("propertyNeighborhood", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      placeholder="Cidade"
                      value={formData.propertyCity}
                      onChange={(e) => handleInputChange("propertyCity", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input
                      placeholder="SP"
                      maxLength={2}
                      value={formData.propertyState}
                      onChange={(e) => handleInputChange("propertyState", e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buyer Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Comprador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome *</Label>
                    <Input
                      placeholder="Nome completo"
                      value={formData.buyerName}
                      onChange={(e) => handleInputChange("buyerName", e.target.value)}
                      className={completionStatus.buyerName ? "bg-green-50 border-green-300" : ""}
                    />
                  </div>
                  <div>
                    <Label>CPF/CNPJ *</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={formData.buyerCpfCnpj}
                      onChange={(e) => handleCPFChange("buyerCpfCnpj", e.target.value.replace(/\D/g, ""))}
                      className={completionStatus.buyerCpfCnpj ? "bg-green-50 border-green-300" : ""}
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={formData.buyerPhone}
                      onChange={(e) => handleInputChange("buyerPhone", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Origem do Cliente</Label>
                    <Select value={formData.clientOrigin} onValueChange={(value) => handleInputChange("clientOrigin", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
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
              </CardContent>
            </Card>

            {/* Seller Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Vendedor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome *</Label>
                    <Input
                      placeholder="Nome completo"
                      value={formData.sellerName}
                      onChange={(e) => handleInputChange("sellerName", e.target.value)}
                      className={completionStatus.sellerName ? "bg-green-50 border-green-300" : ""}
                    />
                  </div>
                  <div>
                    <Label>CPF/CNPJ *</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={formData.sellerCpfCnpj}
                      onChange={(e) => handleCPFChange("sellerCpfCnpj", e.target.value.replace(/\D/g, ""))}
                      className={completionStatus.sellerCpfCnpj ? "bg-green-50 border-green-300" : ""}
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={formData.sellerPhone}
                      onChange={(e) => handleInputChange("sellerPhone", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sale Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações da Venda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data da Venda</Label>
                    <Input
                      type="date"
                      value={formData.saleDate}
                      onChange={(e) => handleInputChange("saleDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data da Angariação</Label>
                    <Input
                      type="date"
                      value={formData.angariationDate}
                      onChange={(e) => handleInputChange("angariationDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Valor da Venda *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.saleValue}
                      onChange={(e) => handleInputChange("saleValue", e.target.value)}
                      className={completionStatus.saleValue ? "bg-green-50 border-green-300" : ""}
                    />
                  </div>
                  <div>
                    <Label>Forma de Pagamento</Label>
                    <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange("paymentMethod", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
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
                  <div>
                    <Label>Valor Financiado</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.financedValue}
                      onChange={(e) => handleInputChange("financedValue", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Comprou para Investimento ou Moradia?</Label>
                    <Select value={formData.investmentType} onValueChange={(value) => handleInputChange("investmentType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {INVESTMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Qual Cartório/Banco/Consórcio será realizado a Escritura?</Label>
                    <Input
                      placeholder="Nome do cartório/banco"
                      value={formData.cartoryBank}
                      onChange={(e) => handleInputChange("cartoryBank", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Quem é o Despachante?</Label>
                    <Input
                      placeholder="Nome do despachante"
                      value={formData.despachante}
                      onChange={(e) => handleInputChange("despachante", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Broker Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações de Comissionamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Loja Angariador *</Label>
                    <Select value={formData.storeAngariador} onValueChange={(value) => handleInputChange("storeAngariador", value)}>
                      <SelectTrigger className={completionStatus.storeAngariador ? "bg-green-50 border-green-300" : ""}>
                        <SelectValue placeholder="Selecione" />
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
                    <Label>Loja Vendedor *</Label>
                    <Select value={formData.storeVendedor} onValueChange={(value) => handleInputChange("storeVendedor", value)}>
                      <SelectTrigger className={completionStatus.storeVendedor ? "bg-green-50 border-green-300" : ""}>
                        <SelectValue placeholder="Selecione" />
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
                    <Label>Corretor Angariador *</Label>
                    <Select value={formData.brokerAngariador} onValueChange={(value) => handleInputChange("brokerAngariador", value)}>
                      <SelectTrigger className={completionStatus.brokerAngariador ? "bg-green-50 border-green-300" : ""}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {brokers.map((broker) => (
                          <SelectItem key={broker.id} value={broker.id}>
                            {broker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Corretor Vendedor *</Label>
                    <Select value={formData.brokerVendedor} onValueChange={(value) => handleInputChange("brokerVendedor", value)}>
                      <SelectTrigger className={completionStatus.brokerVendedor ? "bg-green-50 border-green-300" : ""}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {brokers.map((broker) => (
                          <SelectItem key={broker.id} value={broker.id}>
                            {broker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo de Negócio *</Label>
                    <Select value={formData.businessType} onValueChange={(value) => handleInputChange("businessType", value)}>
                      <SelectTrigger className={completionStatus.businessType ? "bg-green-50 border-green-300" : ""}>
                        <SelectValue placeholder="Selecione" />
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
              </CardContent>
            </Card>

            {/* Upload de Proposta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anexo da Proposta de Compra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                    {proposalFile ? (
                      <>
                        <FileText className="h-6 w-6 text-green-600" />
                        <span className="text-green-600 font-medium">{proposalFile.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-slate-400" />
                        <span className="text-slate-500">Clique para anexar proposta (PDF, DOC, JPG)</span>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-2">Máximo 10MB. O arquivo será enviado após salvar a venda.</p>
              </CardContent>
            </Card>

            {/* Observations Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Adicione observações sobre a venda..."
                  value={formData.observations}
                  onChange={(e) => handleInputChange("observations", e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex gap-4">
              <button
                onClick={() => setLocation("/dashboard")}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!isFormComplete}
                className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                  isFormComplete
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                <Save className="h-4 w-4" />
                {isFormComplete ? "Salvar Proposta" : "Preencha todos os campos"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorState.isOpen}
        title={errorState.title}
        message={errorState.message}
        errors={errorState.errors}
        onClose={() => setErrorState({ ...errorState, isOpen: false })}
      />
    </div>
  );
}

