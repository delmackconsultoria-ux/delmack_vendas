import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Search, CheckCircle, Loader, CheckCircle2, AlertCircle, Upload, FileText, Calculator, XCircle, MapPin } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import CommissionSection from "@/components/CommissionSection";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import ErrorModal from "@/components/ErrorModal";
import { validateCPFOrCNPJ, formatCPF, formatCNPJ, validateCEP, fetchAddressFromCEP, formatPhone, BRAZILIAN_STATES, maskCPFOrCNPJ, maskCEP, maskPhone } from "@/lib/validators";
import { calculateCommissions, formatCurrency, BusinessType } from "@/lib/commissionCalculator";
import { getProperfyFieldClassName } from "@/lib/properfyFieldHelper";
import { formatWhileTyping, parseCurrencyInput, formatArea, parseAreaInput } from "@/lib/currencyFormatter";


// Tipos de Comissão conforme manual de comissionamento Baggio Imóveis (12/02/2026)
const COMMISSION_TYPES = [
  { value: "Venda Interna", label: "Venda Interna", percentage: 6 },
  { value: "Parceria UNA", label: "Parceria UNA", percentage: 6 },
  { value: "Parceria Externa", label: "Parceria Externa", percentage: 6 },
  { value: "Lançamentos (sem coordenação)", label: "Lançamentos (sem coordenação)", percentage: 4 },
  { value: "Lançamentos (com coordenação de produto)", label: "Lançamentos (com coordenação de produto)", percentage: 4 },
  { value: "Corretor Autônomo", label: "Corretor Autônomo", percentage: 6 },
  { value: "Imóveis Ebani", label: "Imóveis Ebani", percentage: 5 },
];

// Manter BUSINESS_TYPES para compatibilidade com código existente
const BUSINESS_TYPES = COMMISSION_TYPES;

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
  name: string | null;
  email: string | null;
  isActive?: boolean | null;
  createdAt?: Date | null;
  role?: string;
}

interface ClientData {
  name: string;
  cpfCnpj: string;
  phone: string;
  origin?: string; // Apenas para compradores
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
  condominiumName: string;
  
  // Property Details
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
  expectedPaymentDate: string;
  saleType: string; // Lançamento ou Pronto
  responsible: string; // Lucas ou Camila (automático)
  invoiceNumber: string; // Número da NF

  // Buyer Info (múltiplos compradores)
  buyers: ClientData[];
  buyerName: string; // Mantido para compatibilidade
  buyerCpfCnpj: string; // Mantido para compatibilidade
  buyerPhone: string; // Mantido para compatibilidade
  clientOrigin: string; // Mantido para compatibilidade
  paymentMethod: string;
  financedValue: string;

  // Seller Info (múltiplos vendedores)
  sellers: ClientData[];
  sellerName: string; // Mantido para compatibilidade
  sellerCpfCnpj: string; // Mantido para compatibilidade
  sellerPhone: string; // Mantido para compatibilidade

  // Additional Info
  cartoryBank: string;
  despachante: string;
  investmentType: string;
  // Campos mantidos: Banco Financiador
  bankName: string; // Banco Financiador
  brokerAngariadorType: "internal" | "external";
  brokerAngariador: string;
  brokerAngariadorName: string;
  brokerAngariadorCreci: string;
  brokerAngariadorEmail: string;
  brokerVendedorType: "internal" | "external";
  brokerVendedor: string;
  brokerVendedorName: string;
  brokerVendedorCreci: string;
  brokerVendedorEmail: string;
  businessType: string;

  // Commission Info (Sistema Automático 12/02/2026)
  tipoComissao: string; // Tipo de comissão (7 opções)
  porcentagemComissao: string; // % da comissão total
  comissaoTotal: string; // Valor total da comissão
  comissaoAngariador: string; // Comissão do angariador
  comissaoCoordenador: string; // Comissão do coordenador (se aplicável)
  comissaoVendedor: string; // Comissão do vendedor
  comissaoImobiliaria: string; // Comissão da imobiliária
  comissaoParceira: string; // Comissão da imobiliária parceira (se aplicável)
  comissaoAutonomo: string; // Comissão do corretor autônomo (se aplicável)
  // Bonificações
  possuiBonificacao: boolean;
  tipoBonificacao: string; // "Dinheiro" ou "Material"
  valorBonificacao: string;
  descricaoBonificacao: string;
  comissaoBonificacaoCorretor: string;
  comissaoBonificacaoImobiliaria: string;
  // Campos antigos (manter para compatibilidade)
  totalCommissionPercent: string;
  totalCommissionValue: string;
  angariadorCommission: string;
  vendedorCommission: string;
  realEstateCommission: string;

  // Sinal de Negócio (16/02/2026)
  sinalNegocio: string; // "Baggio" ou "Outra"
  sinalNegocioEmpresa: string; // Nome da empresa se "Outra"
  sinalNegocioValor: string; // Valor do sinal
  sinalNegocioDataPagamento: string; // Data do pagamento
  sinalNegocioComprovanteFile: File | null; // Arquivo do comprovante (se Baggio)
  sinalNegocioComprovanteUrl: string; // URL do comprovante após upload

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

export default function NewProposal() {
  // DEBUG: Versão do código - 2026-02-10 02:27 UTC
  console.log("[NewProposal] Versão: 2026-02-16 01:45 UTC - Validação CPF/CNPJ ativa");
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  
  // Verificar se é modo de edição
  const editMatch = location.match(/\/proposals\/edit\/(.+)/);
  const editId = editMatch ? editMatch[1] : null;
  const isEditMode = !!editId;
  
  // Buscar dados da proposta para edição
  const { data: existingSale } = trpc.sales.getSaleById.useQuery(
    { saleId: editId || "" },
    { enabled: isEditMode }
  );

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
    condominiumName: "",
    
    typeOfProperty: "",
    bedrooms: "",
    costPerM2: "",
    privateArea: "",
    totalArea: "",
    propertyAge: "",

    saleDate: new Date().toISOString().split('T')[0], // Auto-preencher com data atual
    angariationDate: "",
    saleValue: "",
    expectedPaymentDate: "",
    saleType: "",
    responsible: "",
    invoiceNumber: "",

    buyers: [{ name: "", cpfCnpj: "", phone: "", origin: "" }],
    buyerName: "",
    buyerCpfCnpj: "",
    buyerPhone: "",
    clientOrigin: "",
    paymentMethod: "",
    financedValue: "",

    sellers: [{ name: "", cpfCnpj: "", phone: "" }],
    sellerName: "",
    sellerCpfCnpj: "",
    sellerPhone: "",

    cartoryBank: "",
    despachante: "",
    investmentType: "",
    
    // Campos mantidos
    bankName: "",

    brokerAngariadorType: "internal",
    brokerAngariador: "",
    brokerAngariadorName: "",
    brokerAngariadorCreci: "",
    brokerAngariadorEmail: "",
    brokerVendedorType: "internal",
    brokerVendedor: "",
    brokerVendedorName: "",
    brokerVendedorCreci: "",
    brokerVendedorEmail: "",
    businessType: "",
    // Sistema de Comissionamento Automático (12/02/2026)
    tipoComissao: "",
    porcentagemComissao: "",
    comissaoTotal: "",
    comissaoAngariador: "",
    comissaoCoordenador: "",
    comissaoVendedor: "",
    comissaoImobiliaria: "",
    comissaoParceira: "",
    comissaoAutonomo: "",
    possuiBonificacao: false,
    tipoBonificacao: "",
    valorBonificacao: "",
    descricaoBonificacao: "",
    comissaoBonificacaoCorretor: "",
    comissaoBonificacaoImobiliaria: "",
    // Campos antigos (compatibilidade)
    totalCommissionPercent: "",
    totalCommissionValue: "",
    angariadorCommission: "",
    vendedorCommission: "",
    realEstateCommission: "",

    // Sinal de Negócio (16/02/2026)
    sinalNegocio: "",
    sinalNegocioEmpresa: "",
    sinalNegocioValor: "",
    sinalNegocioDataPagamento: "",
    sinalNegocioComprovanteFile: null,
    sinalNegocioComprovanteUrl: "",

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
  const [properfySearch, setProperfySearch] = useState({ loading: false, error: "", found: false, searchType: "auto" as "auto" | "reference" | "address" | "cep" });
  
  // Validação visual de CPF/CNPJ
  const [cpfValidation, setCpfValidation] = useState<{ buyer: "idle" | "valid" | "invalid"; seller: "idle" | "valid" | "invalid" }>({
    buyer: "idle",
    seller: "idle",
  });
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const createSaleMutation = trpc.sales.createSale.useMutation();
  const uploadMutation = trpc.sales.uploadProposalDocument.useMutation();

  // Cálculo automático de comissões
  const commissionCalc = useMemo(() => {
    if (!formData.saleValue || !formData.businessType) return null;
    const saleValue = parseFloat(formData.saleValue);
    if (isNaN(saleValue) || saleValue <= 0) return null;
    
    const customPercent = formData.totalCommissionPercent ? parseFloat(formData.totalCommissionPercent) : undefined;
    return calculateCommissions(saleValue, formData.businessType as BusinessType, customPercent);
  }, [formData.saleValue, formData.businessType, formData.totalCommissionPercent]);

  // Buscar imóvel no Properfy (busca inteligente por referência, endereço ou CEP)
  const utils = trpc.useUtils();
  const handleSearchPropertyfy = async (searchType: "auto" | "reference" | "address" | "cep" = "auto") => {
    const searchQuery = formData.propertyReference || formData.propertyAddress || formData.propertyZipCode;
    if (!searchQuery) return;
    
    console.log('[Frontend] Buscando Properfy:', { searchQuery, searchType });
    setProperfySearch({ loading: true, error: "", found: false, searchType });
    
    try {
      // Usar utils.fetch para fazer query imperativa
      const result = await utils.client.sales.searchProperty.query({ 
        reference: searchQuery, 
        searchType 
      });
      
      console.log('[Frontend] Resultado Properfy:', result);
      
      if (result?.success && result?.property) {
        const prop = result.property;
        setFormData(prev => ({
          ...prev,
          propertyReference: prop.reference || prev.propertyReference,
          propertyAddress: prop.address || prev.propertyAddress,
          propertyNumber: prop.number || prev.propertyNumber,
          propertyCity: prop.city || prev.propertyCity,
          propertyState: prop.state || prev.propertyState,
          propertyNeighborhood: prop.district || prev.propertyNeighborhood,
          propertyZipCode: prop.postalCode || prev.propertyZipCode,
          typeOfProperty: prop.propertyType?.toLowerCase() || prev.typeOfProperty,
          advertisementValue: prop.value ? formatWhileTyping(prop.value.toString()) : prev.advertisementValue,
          privateArea: prop.area?.toString() || prev.privateArea,
          totalArea: prop.totalArea?.toString() || prev.totalArea,
          bedrooms: prop.bedrooms?.toString() || prev.bedrooms,
          condominiumName: prop.condominiumName || prev.condominiumName,
          costPerM2: prop.pricePerSqm ? formatWhileTyping(prop.pricePerSqm.toString()) : prev.costPerM2,
          propertyAge: prop.propertyAge?.toString() || prev.propertyAge,
        }));
        setProperfySearch({ loading: false, error: "", found: true, searchType });
      } else {
        setProperfySearch({ loading: false, error: result?.error || "Imóvel não encontrado no Properfy", found: false, searchType });
      }
    } catch (error: any) {
      console.error('[Frontend] Erro ao buscar Properfy:', error);
      setProperfySearch({ loading: false, error: error?.message || "Erro ao conectar com Properfy. Preencha manualmente.", found: false, searchType });
    }
  };

  // Validação em tempo real de CPF/CNPJ com máscara
  const handleCpfCnpjChange = (value: string, field: "buyer" | "seller") => {
    const cleanValue = value.replace(/\D/g, "");
    // Aplicar máscara em tempo real enquanto digita
    const formattedValue = maskCPFOrCNPJ(value);
    
    // Atualizar o formulário
    if (field === "buyer") {
      setFormData(prev => ({ ...prev, buyerCpfCnpj: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, sellerCpfCnpj: formattedValue }));
    }
    
    // Validar apenas quando tiver tamanho completo
    if (cleanValue.length === 11 || cleanValue.length === 14) {
      const isValid = validateCPFOrCNPJ(cleanValue);
      setCpfValidation(prev => ({ ...prev, [field]: isValid ? "valid" : "invalid" }));
    } else if (cleanValue.length > 0) {
      setCpfValidation(prev => ({ ...prev, [field]: "idle" }));
    } else {
      setCpfValidation(prev => ({ ...prev, [field]: "idle" }));
    }
  };

  // Componente de ícone de validação
  const ValidationIcon = ({ status }: { status: "idle" | "valid" | "invalid" }) => {
    if (status === "valid") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === "invalid") return <XCircle className="h-5 w-5 text-red-500" />;
    return null;
  };

  // Upload de proposta
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setProposalFile(e.target.files[0]);
  };

  // Load brokers from TRPC
  const { data: brokersList } = trpc.brokers.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    refetchOnWindowFocus: false, // Não refazer ao voltar para a aba
    refetchOnMount: false, // Não refazer ao montar componente se já tem cache
    retry: 1, // Apenas 1 tentativa em caso de erro
  });
  useEffect(() => {
    if (brokersList) {
      setBrokers(brokersList);
    }
  }, [brokersList]);

  // Carregar dados existentes em modo de edição
  useEffect(() => {
    if (isEditMode && existingSale) {
      setFormData(prev => ({
        ...prev,
        propertyAddress: existingSale.property?.address || "",
        propertyNeighborhood: existingSale.property?.neighborhood || "",
        propertyCity: existingSale.property?.city || "",
        propertyState: existingSale.property?.state || "",
        propertyZipCode: existingSale.property?.zipCode || "",
        typeOfProperty: (existingSale as any).typeOfProperty || "",
        bedrooms: existingSale.bedrooms?.toString() || "",
        privateArea: existingSale.privateArea?.toString() || "",
        totalArea: existingSale.totalArea?.toString() || "",
        saleDate: existingSale.saleDate ? new Date(existingSale.saleDate).toISOString().split('T')[0] : "",
        saleValue: existingSale.saleValue?.toString() || "",
        buyerName: existingSale.buyerName || "",
        buyerCpfCnpj: existingSale.buyerCpfCnpj || "",
        buyerPhone: existingSale.buyerPhone || "",
        sellerName: existingSale.sellerName || "",
        sellerCpfCnpj: existingSale.sellerCpfCnpj || "",
        sellerPhone: existingSale.sellerPhone || "",
        businessType: existingSale.businessType || "",
        brokerAngariador: existingSale.brokerAngariador || "",
        brokerVendedor: existingSale.brokerVendedor || "",
        observations: existingSale.observation || "",
      }));
    }
  }, [isEditMode, existingSale]);

  // Initialize completionStatus on mount and when formData changes
  useEffect(() => {
    // SIMPLIFICADO (13/02/2026): Apenas campos REALMENTE essenciais
    const requiredFieldsToCheck = [
      "saleValue",
      "buyerName",
      "buyerCpfCnpj",
      "sellerName",
      "sellerCpfCnpj",
      "propertyAddress",
      "saleDate",
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
    
    setCompletionStatus((prev) => ({
      ...prev,
      [field]: value !== "" && value !== null,
    }));
  };

  // Busca automática de endereço por CEP
  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedCep = maskCEP(e.target.value);
    handleInputChange("propertyZipCode", maskedCep);
    const rawCep = e.target.value.replace(/\D/g, "");

    if (rawCep.length === 8) {
      try {
        const address = await fetchAddressFromCEP(rawCep);
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

  // Formatação automática de CPF/CNPJ com máscara em tempo real
  const handleCPFChange = (field: "buyerCpfCnpj" | "sellerCpfCnpj", value: string) => {
    const maskedValue = maskCPFOrCNPJ(value);
    handleInputChange(field, maskedValue);
  };

  // Formatação automática de telefone com máscara em tempo real
  const handlePhoneChange = (field: "buyerPhone" | "sellerPhone", value: string) => {
    const maskedValue = maskPhone(value);
    handleInputChange(field, maskedValue);
  };

  // SIMPLIFICADO (13/02/2026): Apenas campos REALMENTE essenciais
  const requiredFields = [
    "saleValue",
    "buyerName",
    "buyerCpfCnpj",
    "sellerName",
    "sellerCpfCnpj",
    "propertyAddress",
    "saleDate",
    // Sinal de Negócio (16/02/2026)
    "sinalNegocio",
    "sinalNegocioValor",
    "sinalNegocioDataPagamento",
  ];

  const isFormComplete = requiredFields.every((field) => completionStatus[field]);

  // Estado para marcar campos com erro (vazios quando tentou salvar)
  const [attemptedSave, setAttemptedSave] = useState(false);

  // Salvar Rascunho - salva imediatamente sem prévia
  const handleSaveDraft = async () => {
    try {
      setIsSubmitting(true);
      
      const saleDateObj = formData.saleDate ? new Date(formData.saleDate) : new Date();
      const angariationDateObj = formData.angariationDate ? new Date(formData.angariationDate) : null;
      const expectedPaymentDateObj = formData.expectedPaymentDate ? new Date(formData.expectedPaymentDate) : null;
      
      const payload = {
        propertyType: (formData.propertyType || "baggio") as "baggio" | "external",
        propertyReference: formData.propertyReference || "",
        propertyAddress: formData.propertyAddress || "",
        propertyNumber: formData.propertyNumber,
        propertyComplement: formData.propertyComplement,
        propertyNeighborhood: formData.propertyNeighborhood,
        propertyCity: formData.propertyCity,
        propertyState: formData.propertyState,
        propertyZipCode: formData.propertyZipCode,
        advertisementValue: formData.advertisementValue ? parseCurrencyInput(formData.advertisementValue) : undefined,
        condominiumName: formData.condominiumName,
        saleDate: saleDateObj.toISOString(),
        angariationDate: angariationDateObj ? angariationDateObj.toISOString() : undefined,
        expectedPaymentDate: expectedPaymentDateObj ? expectedPaymentDateObj.toISOString() : undefined,
        saleValue: formData.saleValue ? parseFloat(formData.saleValue) : 0,
        buyerName: formData.buyerName || "",
        buyerCpfCnpj: formData.buyerCpfCnpj?.replace(/\D/g, "") || "",
        buyerPhone: formData.buyerPhone?.replace(/\D/g, "") || "",
        clientOrigin: formData.clientOrigin,
        paymentMethod: formData.paymentMethod,
        financedValue: formData.financedValue ? parseFloat(formData.financedValue) : undefined,
        sellerName: formData.sellerName,
        sellerCpfCnpj: formData.sellerCpfCnpj?.replace(/\D/g, "") || "",
        sellerPhone: formData.sellerPhone?.replace(/\D/g, "") || "",
        cartoryBank: formData.cartoryBank,
        despachante: formData.despachante,
        investmentType: formData.investmentType,
        brokerAngariadorType: formData.brokerAngariadorType,
        brokerAngariador: formData.brokerAngariadorType === "internal" ? formData.brokerAngariador : undefined,
        brokerAngariadorName: formData.brokerAngariadorType === "external" ? formData.brokerAngariadorName : undefined,
        brokerAngariadorCreci: formData.brokerAngariadorType === "external" ? formData.brokerAngariadorCreci : undefined,
        brokerAngariadorEmail: formData.brokerAngariadorType === "external" ? formData.brokerAngariadorEmail : undefined,
        brokerVendedorType: formData.brokerVendedorType,
        brokerVendedor: formData.brokerVendedorType === "internal" ? formData.brokerVendedor : undefined,
        brokerVendedorName: formData.brokerVendedorType === "external" ? formData.brokerVendedorName : undefined,
        brokerVendedorCreci: formData.brokerVendedorType === "external" ? formData.brokerVendedorCreci : undefined,
        brokerVendedorEmail: formData.brokerVendedorType === "external" ? formData.brokerVendedorEmail : undefined,
        businessType: formData.businessType || "sale",
        totalCommission: formData.totalCommissionValue ? parseFloat(formData.totalCommissionValue) : commissionCalc?.totalCommissionValue,
        totalCommissionPercent: formData.totalCommissionPercent ? parseFloat(formData.totalCommissionPercent) : commissionCalc?.totalCommissionPercent,
        angariadorCommission: formData.angariadorCommission ? parseFloat(formData.angariadorCommission) : commissionCalc?.angariadorValue,
        vendedorCommission: formData.vendedorCommission ? parseFloat(formData.vendedorCommission) : commissionCalc?.vendedorValue,
        realEstateCommission: formData.realEstateCommission ? parseFloat(formData.realEstateCommission) : undefined,
        baggioCommission: commissionCalc?.baggioValue,
        observations: formData.observations,
        typeOfProperty: formData.typeOfProperty,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        privateArea: formData.privateArea ? parseFloat(formData.privateArea) : undefined,
        totalArea: formData.totalArea ? parseFloat(formData.totalArea) : undefined,
        costPerM2: formData.costPerM2 ? parseCurrencyInput(formData.costPerM2) : undefined,
        propertyAge: formData.propertyAge ? parseInt(formData.propertyAge) : undefined,
        status: "draft" as const, // Salva como rascunho
      };

      await createSaleMutation.mutateAsync(payload);
      toast.success("Rascunho salvo com sucesso!");
      setLocation("/proposals");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar rascunho");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enviar Venda - valida campos e mostra prévia
  const handleSubmitProposal = async () => {
    // Marcar que tentou enviar para destacar campos vazios em vermelho
    setAttemptedSave(true);
    
    // Verificar se anexo de proposta foi anexado (obrigatório)
    if (!proposalFile) {
      toast.error("Anexo de Proposta é obrigatório. Por favor, anexe um documento.");
      // Scroll para o campo de anexo
      setTimeout(() => {
        const attachmentField = document.querySelector('input[type="file"]');
        if (attachmentField) {
          attachmentField.closest('div')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }
    
    // DEBUG: Verificar quais campos estão faltando
    const missingFields = requiredFields.filter(field => !completionStatus[field]);
    console.log('[DEBUG] Campos obrigatórios faltando:', missingFields);
    console.log('[DEBUG] completionStatus:', completionStatus);
    console.log('[DEBUG] formData:', formData);
    
    // Verificar se todos os campos obrigatórios estão preenchidos
    if (!isFormComplete) {
      toast.error(`Preencha todos os campos obrigatórios: ${missingFields.join(', ')}`);
      // Scroll para o primeiro campo com erro
      setTimeout(() => {
        const errorField = document.querySelector('.bg-red-50');
        if (errorField) {
          errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (errorField as HTMLElement).focus?.();
        }
      }, 100);
      return;
    }
    
    // Validar Sinal de Negócio condicional (16/02/2026)
    if (formData.sinalNegocio === "Baggio" && !formData.sinalNegocioComprovanteFile && !formData.sinalNegocioComprovanteUrl) {
      toast.error("⚠️ Comprovante de Sinal de Negócio é obrigatório para Baggio.");
      setTimeout(() => {
        const comprovanteField = document.querySelector('input[type="file"]');
        if (comprovanteField) {
          comprovanteField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }
    
    if (formData.sinalNegocio === "Outra" && !formData.sinalNegocioEmpresa) {
      toast.error("⚠️ Nome da empresa é obrigatório quando Sinal de Negócio é 'Outra'.");
      setTimeout(() => {
        const empresaField = document.querySelector('input[placeholder="Digite o nome da empresa"]');
        if (empresaField) {
          empresaField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (empresaField as HTMLElement).focus?.();
        }
      }, 100);
      return;
    }
    
    // Validar CPF/CNPJ do comprador
    if (cpfValidation.buyer === "invalid") {
      toast.error("⚠️ CPF/CNPJ do comprador inválido. Verifique os dígitos.");
      // Scroll para o campo de CPF do comprador
      setTimeout(() => {
        const buyerCpfField = document.querySelector('input[placeholder="000.000.000-00"]');
        if (buyerCpfField) {
          buyerCpfField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (buyerCpfField as HTMLElement).focus?.();
        }
      }, 100);
      return;
    }
    
    // Validar CPF/CNPJ do vendedor
    if (cpfValidation.seller === "invalid") {
      toast.error("⚠️ CPF/CNPJ do vendedor inválido. Verifique os dígitos.");
      // Scroll para o campo de CPF do vendedor
      setTimeout(() => {
        const sellerCpfFields = document.querySelectorAll('input[placeholder="000.000.000-00"]');
        if (sellerCpfFields.length > 1) {
          sellerCpfFields[1].scrollIntoView({ behavior: 'smooth', block: 'center' });
          (sellerCpfFields[1] as HTMLElement).focus?.();
        }
      }, 100);
      return;
    }
    
    console.log('[DEBUG] Todos os campos obrigatórios preenchidos! Mostrando prévia...');
    
    // Validações do Sistema de Comissionamento (12/02/2026)
    if (!formData.tipoComissao) {
      toast.error("⚠️ Selecione o tipo de comissão");
      return;
    }
    
    if (!formData.porcentagemComissao || parseFloat(formData.porcentagemComissao) <= 0) {
      toast.error("⚠️ Porcentagem de comissão inválida");
      return;
    }
    
    if (!formData.comissaoTotal || parseFloat(formData.comissaoTotal) <= 0) {
      toast.error("⚠️ Comissão total inválida");
      return;
    }
    
    if (!formData.comissaoVendedor || parseFloat(formData.comissaoVendedor) <= 0) {
      toast.error("⚠️ Comissão do vendedor é obrigatória");
      return;
    }
    
    if (!formData.comissaoImobiliaria || parseFloat(formData.comissaoImobiliaria) <= 0) {
      toast.error("⚠️ Comissão da imobiliária é obrigatória");
      return;
    }
    
    // Validar bonificação se checkbox marcado
    if (formData.possuiBonificacao) {
      if (!formData.tipoBonificacao) {
        toast.error("⚠️ Selecione o tipo de bonificação (Dinheiro ou Material)");
        return;
      }
      if (!formData.valorBonificacao || parseFloat(formData.valorBonificacao) <= 0) {
        toast.error("⚠️ Valor da bonificação é obrigatório");
        return;
      }
    }
    
    // Mostrar prévia antes de salvar
    setFormData((prev) => ({ ...prev, showPreview: true }));
  };

  // Função para verificar se campo está com erro (vazio após tentar salvar)
  const isFieldError = (field: string) => {
    if (!attemptedSave) return false;
    return requiredFields.includes(field) && !completionStatus[field];
  };

  const handleConfirmAndSave = async () => {
    try {
      setIsSubmitting(true);
      
      const saleDateObj = new Date(formData.saleDate);
      const angariationDateObj = formData.angariationDate ? new Date(formData.angariationDate) : null;
      const expectedPaymentDateObj = formData.expectedPaymentDate ? new Date(formData.expectedPaymentDate) : null;
      
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
        advertisementValue: formData.advertisementValue ? parseCurrencyInput(formData.advertisementValue) : undefined,
        condominiumName: formData.condominiumName,
        saleDate: saleDateObj.toISOString(),
        angariationDate: angariationDateObj ? angariationDateObj.toISOString() : undefined,
        expectedPaymentDate: expectedPaymentDateObj ? expectedPaymentDateObj.toISOString() : undefined,
        saleValue: parseFloat(formData.saleValue),
        buyerName: formData.buyerName,
        buyerCpfCnpj: formData.buyerCpfCnpj.replace(/\D/g, ""),
        buyerPhone: formData.buyerPhone.replace(/\D/g, ""),
        clientOrigin: formData.clientOrigin,
        paymentMethod: formData.paymentMethod,
        financedValue: formData.financedValue ? parseFloat(formData.financedValue) : undefined,
        sellerName: formData.sellerName,
        sellerCpfCnpj: formData.sellerCpfCnpj.replace(/\D/g, ""),
        sellerPhone: formData.sellerPhone.replace(/\D/g, ""),
        cartoryBank: formData.cartoryBank,
        despachante: formData.despachante,
        investmentType: formData.investmentType,
        brokerAngariadorType: formData.brokerAngariadorType,
        brokerAngariador: formData.brokerAngariadorType === "internal" ? formData.brokerAngariador : undefined,
        brokerAngariadorName: formData.brokerAngariadorType === "external" ? formData.brokerAngariadorName : undefined,
        brokerAngariadorCreci: formData.brokerAngariadorType === "external" ? formData.brokerAngariadorCreci : undefined,
        brokerAngariadorEmail: formData.brokerAngariadorType === "external" ? formData.brokerAngariadorEmail : undefined,
        brokerVendedorType: formData.brokerVendedorType,
        brokerVendedor: formData.brokerVendedorType === "internal" ? formData.brokerVendedor : undefined,
        brokerVendedorName: formData.brokerVendedorType === "external" ? formData.brokerVendedorName : undefined,
        brokerVendedorCreci: formData.brokerVendedorType === "external" ? formData.brokerVendedorCreci : undefined,
        brokerVendedorEmail: formData.brokerVendedorType === "external" ? formData.brokerVendedorEmail : undefined,
        businessType: formData.businessType,
        // Comissões
        totalCommission: formData.totalCommissionValue ? parseFloat(formData.totalCommissionValue) : commissionCalc?.totalCommissionValue,
        totalCommissionPercent: formData.totalCommissionPercent ? parseFloat(formData.totalCommissionPercent) : commissionCalc?.totalCommissionPercent,
        angariadorCommission: formData.angariadorCommission ? parseFloat(formData.angariadorCommission) : commissionCalc?.angariadorValue,
        vendedorCommission: formData.vendedorCommission ? parseFloat(formData.vendedorCommission) : commissionCalc?.vendedorValue,
        realEstateCommission: formData.realEstateCommission ? parseFloat(formData.realEstateCommission) : undefined,
        baggioCommission: commissionCalc?.baggioValue,
        observations: formData.observations,
        typeOfProperty: formData.typeOfProperty,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        privateArea: formData.privateArea ? parseFloat(formData.privateArea) : undefined,
        totalArea: formData.totalArea ? parseFloat(formData.totalArea) : undefined,
        costPerM2: formData.costPerM2 ? parseCurrencyInput(formData.costPerM2) : undefined,
        propertyAge: formData.propertyAge ? parseInt(formData.propertyAge) : undefined,
        saleType: formData.saleType as "lancamento" | "pronto" | undefined,
        responsible: formData.responsible,
        invoiceNumber: formData.invoiceNumber,
        // Sistema de Comissionamento Automático (12/02/2026)
        tipoComissao: formData.tipoComissao,
        porcentagemComissao: formData.porcentagemComissao,
        comissaoTotal: formData.comissaoTotal,
        comissaoAngariador: formData.comissaoAngariador,
        comissaoCoordenador: formData.comissaoCoordenador,
        comissaoVendedor: formData.comissaoVendedor,
        comissaoImobiliaria: formData.comissaoImobiliaria,
        comissaoParceira: formData.comissaoParceira,
        comissaoAutonomo: formData.comissaoAutonomo,
        // Bonificações
        possuiBonificacao: formData.possuiBonificacao,
        tipoBonificacao: formData.tipoBonificacao,
        valorBonificacao: formData.valorBonificacao,
        descricaoBonificacao: formData.descricaoBonificacao,
        comissaoBonificacaoCorretor: formData.comissaoBonificacaoCorretor,
        comissaoBonificacaoImobiliaria: formData.comissaoBonificacaoImobiliaria,
        // Sinal de Negócio (16/02/2026)
        sinalNegocio: formData.sinalNegocio as "Baggio" | "Outra" | undefined,
        sinalNegocioEmpresa: formData.sinalNegocio === "Outra" ? formData.sinalNegocioEmpresa : undefined,
        sinalNegocioValor: formData.sinalNegocioValor ? parseCurrencyInput(formData.sinalNegocioValor) : undefined,
        sinalNegocioDataPagamento: formData.sinalNegocioDataPagamento ? new Date(formData.sinalNegocioDataPagamento).toISOString() : undefined,
        sinalNegocioComprovanteUrl: formData.sinalNegocioComprovanteUrl || undefined,
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
          console.error('Erro ao fazer upload do documento:', uploadError);
        }
      }
      
      // Upload do comprovante de Sinal de Negócio (se Baggio)
      if (formData.sinalNegocioComprovanteFile && result.saleId) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(formData.sinalNegocioComprovanteFile!);
          });
          
          // TODO: Implementar upload do comprovante via API
          // await uploadComprovanteS inalMutation.mutateAsync({
          //   saleId: result.saleId,
          //   fileName: formData.sinalNegocioComprovanteFile.name,
          //   fileData: base64,
          //   contentType: formData.sinalNegocioComprovanteFile.type
          // });
          console.log('[DEBUG] Upload de comprovante de sinal pendente de implementação');
        } catch (uploadError) {
          console.error('Erro ao fazer upload do comprovante de sinal:', uploadError);
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

  // Tela de Preview/Resumo
  if (formData.showPreview) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header Padrão */}
        <AppHeader />
        
        <div className="container mx-auto py-8 px-4">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Resumo da Venda
              </CardTitle>
              <CardDescription>Revise os dados antes de confirmar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dados do Imóvel */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Dados do Imóvel</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Referência</p>
                    <p className="font-medium">{formData.propertyReference || "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Condomínio</p>
                    <p className="font-medium">{formData.condominiumName || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500">Endereço</p>
                    <p className="font-medium">{formData.propertyAddress}, {formData.propertyNumber} {formData.propertyComplement} - {formData.propertyNeighborhood}, {formData.propertyCity}/{formData.propertyState} - CEP: {formData.propertyZipCode}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Tipo</p>
                    <p className="font-medium">{PROPERTY_TYPES.find(t => t.value === formData.typeOfProperty)?.label || formData.typeOfProperty}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Quartos</p>
                    <p className="font-medium">{formData.bedrooms}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Área Privativa</p>
                    <p className="font-medium">{formData.privateArea} m²</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Área Total</p>
                    <p className="font-medium">{formData.totalArea} m²</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Valor de Divulgação</p>
                    <p className="font-medium">{formData.advertisementValue ? formatCurrency(parseFloat(formData.advertisementValue)) : "-"}</p>
                  </div>
                </div>
              </div>

              {/* Dados da Venda */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Dados da Venda</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Data da Venda</p>
                    <p className="font-medium">{new Date(formData.saleDate).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Data da Angariação</p>
                    <p className="font-medium">{formData.angariationDate ? new Date(formData.angariationDate).toLocaleDateString("pt-BR") : "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Valor da Venda</p>
                    <p className="font-medium text-lg text-green-700">{formatCurrency(parseFloat(formData.saleValue))}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Previsão de Recebimento</p>
                    <p className="font-medium">{formData.expectedPaymentDate ? new Date(formData.expectedPaymentDate).toLocaleDateString("pt-BR") : "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Forma de Pagamento</p>
                    <p className="font-medium">{PAYMENT_METHODS.find(m => m.value === formData.paymentMethod)?.label || "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Tipo de Negócio</p>
                    <p className="font-medium">{BUSINESS_TYPES.find(t => t.value === formData.businessType)?.label || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Comissões Calculadas */}
              {commissionCalc && (
                <div className="border-b pb-4 bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    Comissões Calculadas
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                      <p className="text-slate-500">Total da Comissão Fechada</p>
                      <p className="font-bold text-xl text-blue-700">{formatCurrency(commissionCalc.totalCommissionValue)} ({commissionCalc.totalCommissionPercent}%)</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Comissão Corretor Angariador ({commissionCalc.angariadorPercent}%)</p>
                      <p className="font-medium text-green-700">{formatCurrency(commissionCalc.angariadorValue)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Comissão Corretor Vendedor ({commissionCalc.vendedorPercent}%)</p>
                      <p className="font-medium text-green-700">{formatCurrency(commissionCalc.vendedorValue)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500">Comissão Baggio ({commissionCalc.baggioPercent}%)</p>
                      <p className="font-medium text-slate-700">{formatCurrency(commissionCalc.baggioValue)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dados do Comprador */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Dados do Comprador</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Nome</p>
                    <p className="font-medium">{formData.buyerName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">CPF/CNPJ</p>
                    <p className="font-medium">{formData.buyerCpfCnpj}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Telefone</p>
                    <p className="font-medium">{formData.buyerPhone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Origem do Cliente</p>
                    <p className="font-medium">{CLIENT_ORIGINS.find(o => o.value === formData.clientOrigin)?.label || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Dados do Vendedor */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Dados do Vendedor</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Nome</p>
                    <p className="font-medium">{formData.sellerName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">CPF/CNPJ</p>
                    <p className="font-medium">{formData.sellerCpfCnpj}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Telefone</p>
                    <p className="font-medium">{formData.sellerPhone || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Corretores */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Corretores</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Corretor Angariador</p>
                    <p className="font-medium">
                      {formData.brokerAngariadorType === "internal" 
                        ? brokers.find(b => b.id === formData.brokerAngariador)?.name || "-"
                        : `${formData.brokerAngariadorName} (Externo - CRECI: ${formData.brokerAngariadorCreci})`}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Comissão Angariador</p>
                    <p className="font-medium">{formData.angariadorCommission ? formatCurrency(parseFloat(formData.angariadorCommission)) : "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Corretor Vendedor</p>
                    <p className="font-medium">
                      {formData.brokerVendedorType === "internal" 
                        ? brokers.find(b => b.id === formData.brokerVendedor)?.name || "-"
                        : `${formData.brokerVendedorName} (Externo - CRECI: ${formData.brokerVendedorCreci})`}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Comissão Vendedor</p>
                    <p className="font-medium">{formData.vendedorCommission ? formatCurrency(parseFloat(formData.vendedorCommission)) : "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Comissão Imobiliária</p>
                    <p className="font-medium">{formData.realEstateCommission ? formatCurrency(parseFloat(formData.realEstateCommission)) : "-"}</p>
                  </div>
                </div>
              </div>

              {/* Botões */}
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
      {/* Header Padrão */}
      <AppHeader />
      
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
{/* Título da Página */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? "Editar Venda" : "Nova Venda"}</h1>
              <p className="text-slate-600 mt-1 text-sm">{isEditMode ? "Atualize os dados da venda" : "Preencha os campos para registrar uma nova venda"}</p>
            </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Referência Properfy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Buscar Imóvel (Properfy)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Digite o código de referência (ex: BG97142005)"
                      value={formData.propertyReference}
                      onChange={(e) => handleInputChange("propertyReference", e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearchPropertyfy()}
                      className="pr-10"
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                  <Button onClick={() => handleSearchPropertyfy("auto")} disabled={properfySearch.loading || !formData.propertyReference}>
                    {properfySearch.loading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Buscar
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Digite o código de referência do imóvel (ex: BG97142005, BG96925001)</p>
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
                      <SelectTrigger className={getProperfyFieldClassName("typeOfProperty", formData.typeOfProperty, completionStatus.typeOfProperty, attemptedSave, true)}>
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
                      className={getProperfyFieldClassName("bedrooms", formData.bedrooms, completionStatus.bedrooms, attemptedSave, true)}
                    />
                  </div>
                  <div>
                    <Label>Área Privativa (m²) *</Label>
                    <Input
                      type="text"
                      value={formData.privateArea}
                      onChange={(e) => handleInputChange("privateArea", formatArea(e.target.value))}
                      onBlur={(e) => handleInputChange("privateArea", formatArea(e.target.value))}
                      placeholder="Ex: 120,50"
                      className={getProperfyFieldClassName("privateArea", formData.privateArea, completionStatus.privateArea, attemptedSave, true)}
                    />
                  </div>
                  <div>
                    <Label>Área Total (m²) *</Label>
                    <Input
                      type="text"
                      value={formData.totalArea}
                      onChange={(e) => handleInputChange("totalArea", formatArea(e.target.value))}
                      onBlur={(e) => handleInputChange("totalArea", formatArea(e.target.value))}
                      placeholder="Ex: 150,00"
                      className={getProperfyFieldClassName("totalArea", formData.totalArea, completionStatus.totalArea, attemptedSave, true)}
                    />
                  </div>
                  <div>
                    <Label>Custo por m² (Área Privativa)</Label>
                    <Input
                      type="text"
                      value={formData.costPerM2}
                      onChange={(e) => handleInputChange("costPerM2", formatWhileTyping(e.target.value))}
                      onBlur={(e) => handleInputChange("costPerM2", formatWhileTyping(e.target.value))}
                      placeholder="Ex: 5.000,00"
                      className={getProperfyFieldClassName("costPerM2", formData.costPerM2)}
                    />
                  </div>
                  <div>
                    <Label>Idade do Imóvel (anos)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 5"
                      value={formData.propertyAge}
                      onChange={(e) => handleInputChange("propertyAge", e.target.value)}
                      className={getProperfyFieldClassName("propertyAge", formData.propertyAge)}
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
                      maxLength={9}
                      className={getProperfyFieldClassName("propertyZipCode", formData.propertyZipCode)}
                    />
                    <p className="text-xs text-slate-500 mt-1">Digite o CEP para preencher o endereço automaticamente</p>
                  </div>
                  <div>
                    <Label>Nome do Condomínio</Label>
                    <Input
                      placeholder="Nome do condomínio"
                      value={formData.condominiumName}
                      onChange={(e) => handleInputChange("condominiumName", e.target.value)}
                      className={getProperfyFieldClassName("condominiumName", formData.condominiumName)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Endereço *</Label>
                    <Input
                      placeholder="Rua/Avenida"
                      value={formData.propertyAddress}
                      onChange={(e) => handleInputChange("propertyAddress", e.target.value)}
                      className={getProperfyFieldClassName("propertyAddress", formData.propertyAddress, completionStatus.propertyAddress, attemptedSave, true)}
                    />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input
                      placeholder="123"
                      value={formData.propertyNumber}
                      onChange={(e) => handleInputChange("propertyNumber", e.target.value)}
                      className={getProperfyFieldClassName("propertyNumber", formData.propertyNumber)}
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
                      className={getProperfyFieldClassName("propertyNeighborhood", formData.propertyNeighborhood)}
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      placeholder="Cidade"
                      value={formData.propertyCity}
                      onChange={(e) => handleInputChange("propertyCity", e.target.value)}
                      className={getProperfyFieldClassName("propertyCity", formData.propertyCity)}
                    />
                  </div>
                  <div>
                    <Label>Estado *</Label>
                    <Select value={formData.propertyState} onValueChange={(value) => handleInputChange("propertyState", value)}>
                      <SelectTrigger className={getProperfyFieldClassName("propertyState", formData.propertyState)}>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRAZILIAN_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.value} - {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buyer Section - Multiple Buyers */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Dados do Cliente Comprador</CardTitle>
                    <CardDescription>Dados utilizados na Nota Fiscal (Mínimo 1 obrigatório)</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      buyers: [...prev.buyers, { name: "", cpfCnpj: "", phone: "", origin: "" }]
                    }))}
                  >
                    + Adicionar Comprador
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.buyers.map((buyer, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                    {formData.buyers.length > 1 && (
                      <button
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          buyers: prev.buyers.filter((_, i) => i !== index)
                        }))}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <XCircle size={20} />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nome *</Label>
                        <Input
                          placeholder="Nome completo"
                          value={buyer.name}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            buyers: prev.buyers.map((b, i) => i === index ? { ...b, name: e.target.value } : b)
                          }))}
                        />
                      </div>
                      <div>
                        <Label>CPF/CNPJ *</Label>
                        <Input
                          placeholder="000.000.000-00"
                          value={buyer.cpfCnpj}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            buyers: prev.buyers.map((b, i) => i === index ? { ...b, cpfCnpj: maskCPFOrCNPJ(e.target.value) } : b)
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Telefone</Label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={buyer.phone}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            buyers: prev.buyers.map((b, i) => i === index ? { ...b, phone: maskPhone(e.target.value) } : b)
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Origem do Cliente</Label>
                        <Select value={buyer.origin || ""} onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          buyers: prev.buyers.map((b, i) => i === index ? { ...b, origin: value } : b)
                        }))}>
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
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Seller Section - Multiple Sellers */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Dados do Cliente Vendedor</CardTitle>
                    <CardDescription>Dados utilizados na Nota Fiscal (Mínimo 1 obrigatório)</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      sellers: [...prev.sellers, { name: "", cpfCnpj: "", phone: "" }]
                    }))}
                  >
                    + Adicionar Vendedor
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.sellers.map((seller, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                    {formData.sellers.length > 1 && (
                      <button
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          sellers: prev.sellers.filter((_, i) => i !== index)
                        }))}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <XCircle size={20} />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nome *</Label>
                        <Input
                          placeholder="Nome completo"
                          value={seller.name}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            sellers: prev.sellers.map((s, i) => i === index ? { ...s, name: e.target.value } : s)
                          }))}
                        />
                      </div>
                      <div>
                        <Label>CPF/CNPJ *</Label>
                        <Input
                          placeholder="000.000.000-00"
                          value={seller.cpfCnpj}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            sellers: prev.sellers.map((s, i) => i === index ? { ...s, cpfCnpj: maskCPFOrCNPJ(e.target.value) } : s)
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Telefone</Label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={seller.phone}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            sellers: prev.sellers.map((s, i) => i === index ? { ...s, phone: maskPhone(e.target.value) } : s)
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                    <Label>Data da Venda *</Label>
                    <Input
                      type="date"
                      value={formData.saleDate}
                      onChange={(e) => handleInputChange("saleDate", e.target.value)}
                      className={completionStatus.saleDate ? "bg-green-50 border-green-300" : attemptedSave && !completionStatus.saleDate ? "bg-red-50 border-red-400" : ""}
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
                      type="text"
                      value={formData.saleValue}
                      onChange={(e) => handleInputChange("saleValue", formatWhileTyping(e.target.value))}
                      onBlur={(e) => handleInputChange("saleValue", formatWhileTyping(e.target.value))}
                      placeholder="R$ 0,00"
                      className={completionStatus.saleValue ? "bg-green-50 border-green-300" : attemptedSave && !completionStatus.saleValue ? "bg-red-50 border-red-400" : ""}
                    />
                  </div>
                  <div>
                    <Label>Valor de Divulgação</Label>
                    <Input
                      type="text"
                      value={formData.advertisementValue}
                      onChange={(e) => handleInputChange("advertisementValue", formatWhileTyping(e.target.value))}
                      onBlur={(e) => handleInputChange("advertisementValue", formatWhileTyping(e.target.value))}
                      placeholder="0,00"
                      className={getProperfyFieldClassName("advertisementValue", formData.advertisementValue)}
                    />
                  </div>
                  <div>
                    <Label>Previsão de Recebimento</Label>
                    <Input
                      type="date"
                      value={formData.expectedPaymentDate}
                      onChange={(e) => handleInputChange("expectedPaymentDate", e.target.value)}
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
                      type="text"
                      value={formData.financedValue}
                      onChange={(e) => handleInputChange("financedValue", formatWhileTyping(e.target.value))}
                      onBlur={(e) => handleInputChange("financedValue", formatWhileTyping(e.target.value))}
                      placeholder="R$ 0,00"
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
                  <div>
                    <Label>Tipo de Venda *</Label>
                    <Select 
                      value={formData.saleType} 
                      onValueChange={(value) => {
                        handleInputChange("saleType", value);
                        // Atribuir responsável automaticamente
                        const responsible = value === "lancamento" ? "Lucas" : value === "pronto" ? "Camila" : "";
                        handleInputChange("responsible", responsible);
                      }}
                    >
                      <SelectTrigger className={completionStatus.saleType ? "bg-green-50 border-green-300" : attemptedSave && !completionStatus.saleType ? "bg-red-50 border-red-400" : ""}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lancamento">Lançamento</SelectItem>
                        <SelectItem value="pronto">Pronto</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">Lançamento: Lucas | Pronto: Camila</p>
                  </div>
                </div>

                {/* Sinal de Negócio */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-md font-semibold mb-4">Sinal de Negócio</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Sinal de Negócio *</Label>
                      <Select 
                        value={formData.sinalNegocio} 
                        onValueChange={(value) => handleInputChange("sinalNegocio", value)}
                      >
                        <SelectTrigger className={completionStatus.sinalNegocio ? "bg-green-50 border-green-300" : attemptedSave && !completionStatus.sinalNegocio ? "bg-red-50 border-red-400" : ""}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baggio">Baggio</SelectItem>
                          <SelectItem value="Outra">Outra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.sinalNegocio === "Outra" && (
                      <div>
                        <Label>Nome da Empresa *</Label>
                        <Input
                          type="text"
                          placeholder="Digite o nome da empresa"
                          value={formData.sinalNegocioEmpresa}
                          onChange={(e) => handleInputChange("sinalNegocioEmpresa", e.target.value)}
                          className={completionStatus.sinalNegocioEmpresa ? "bg-green-50 border-green-300" : attemptedSave && !completionStatus.sinalNegocioEmpresa ? "bg-red-50 border-red-400" : ""}
                        />
                      </div>
                    )}

                    {formData.sinalNegocio === "Baggio" && (
                      <div>
                        <Label>Comprovante de Sinal de Negócio *</Label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleInputChange("sinalNegocioComprovanteFile", file);
                            }
                          }}
                          className={completionStatus.sinalNegocioComprovanteUrl ? "bg-green-50 border-green-300" : attemptedSave && !completionStatus.sinalNegocioComprovanteUrl ? "bg-red-50 border-red-400" : ""}
                        />
                        <p className="text-xs text-slate-500 mt-1">Formatos aceitos: PDF, JPG, PNG</p>
                      </div>
                    )}

                    <div>
                      <Label>Valor de Sinal de Negócio *</Label>
                      <Input
                        type="text"
                        placeholder="R$ 0,00"
                        defaultValue={formData.sinalNegocioValor}
                        onBlur={(e) => {
                          const formatted = formatWhileTyping(e.target.value);
                          e.target.value = formatted;
                          handleInputChange("sinalNegocioValor", formatted);
                        }}
                        className={completionStatus.sinalNegocioValor ? "bg-green-50 border-green-300" : attemptedSave && !completionStatus.sinalNegocioValor ? "bg-red-50 border-red-400" : ""}
                      />
                    </div>

                    <div>
                      <Label>Data do Pagamento do Sinal de Negócio *</Label>
                      <Input
                        type="date"
                        value={formData.sinalNegocioDataPagamento}
                        onChange={(e) => handleInputChange("sinalNegocioDataPagamento", e.target.value)}
                        className={completionStatus.sinalNegocioDataPagamento ? "bg-green-50 border-green-300" : attemptedSave && !completionStatus.sinalNegocioDataPagamento ? "bg-red-50 border-red-400" : ""}
                      />
                    </div>
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



            {/* Broker Section - Sistema Automático de Comissionamento (12/02/2026) */}
            <CommissionSection formData={formData} handleInputChange={handleInputChange} />
            
            {/* Seção de Corretores (Angariador e Vendedor) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Corretores Envolvidos</CardTitle>
                <CardDescription>Selecione os corretores responsáveis pela venda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Corretor Angariador */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-slate-700 mb-3">Corretor Angariador</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Corretor *</Label>
                      <Select value={formData.brokerAngariadorType} onValueChange={(value: "internal" | "external") => handleInputChange("brokerAngariadorType", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Interno (da empresa)</SelectItem>
                          <SelectItem value="external">Externo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.brokerAngariadorType === "internal" ? (
                      <div>
                        <Label>Selecionar Corretor *</Label>
                        <Select value={formData.brokerAngariador} onValueChange={(value) => handleInputChange("brokerAngariador", value)}>
                          <SelectTrigger className={completionStatus.brokerAngariador ? "bg-green-50 border-green-300" : attemptedSave && !completionStatus.brokerAngariador ? "bg-red-50 border-red-400" : ""}>
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
                    ) : (
                      <>
                        <div>
                          <Label>Nome do Corretor *</Label>
                          <Input
                            placeholder="Nome completo"
                            value={formData.brokerAngariadorName}
                            onChange={(e) => handleInputChange("brokerAngariadorName", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>CRECI *</Label>
                          <Input
                            placeholder="Número do CRECI"
                            value={formData.brokerAngariadorCreci}
                            onChange={(e) => handleInputChange("brokerAngariadorCreci", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            value={formData.brokerAngariadorEmail}
                            onChange={(e) => handleInputChange("brokerAngariadorEmail", e.target.value)}
                          />
                        </div>
                      </>
                    )}

                  </div>
                </div>

                {/* Corretor Vendedor */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-slate-700 mb-3">Corretor Vendedor</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Corretor *</Label>
                      <Select value={formData.brokerVendedorType} onValueChange={(value: "internal" | "external") => handleInputChange("brokerVendedorType", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Interno (da empresa)</SelectItem>
                          <SelectItem value="external">Externo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.brokerVendedorType === "internal" ? (
                      <div>
                        <Label>Selecionar Corretor *</Label>
                        <Select value={formData.brokerVendedor} onValueChange={(value) => handleInputChange("brokerVendedor", value)}>
                          <SelectTrigger className={completionStatus.brokerVendedor ? "bg-green-50 border-green-300" : attemptedSave && !completionStatus.brokerVendedor ? "bg-red-50 border-red-400" : ""}>
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
                    ) : (
                      <>
                        <div>
                          <Label>Nome do Corretor *</Label>
                          <Input
                            placeholder="Nome completo"
                            value={formData.brokerVendedorName}
                            onChange={(e) => handleInputChange("brokerVendedorName", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>CRECI *</Label>
                          <Input
                            placeholder="Número do CRECI"
                            value={formData.brokerVendedorCreci}
                            onChange={(e) => handleInputChange("brokerVendedorCreci", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            value={formData.brokerVendedorEmail}
                            onChange={(e) => handleInputChange("brokerVendedorEmail", e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload de Proposta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anexo de Proposta *</CardTitle>
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
                        <span className="text-slate-500">Clique para anexar documento de venda (PDF, DOC, JPG)</span>
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

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <button
                onClick={() => setLocation("/proposals")}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Salvando..." : "Salvar Rascunho"}
              </button>
              <button
                onClick={handleSubmitProposal}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Enviar Venda
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
