import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, AlertCircle, Search } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function NewSale() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [propertyError, setPropertyError] = useState("");

  const [formData, setFormData] = useState({
    propertyType: "baggio",
    propertyReference: "",
    propertyAddress: "",
    propertyCity: "",
    propertyState: "",
    propertyZipCode: "",
    propertyValue: "",
    saleValue: "",
    commissionType: "standard",
    commissionValue: "",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    observations: "",
  });

  const handleSearchProperty = async () => {
    if (!formData.propertyReference.trim()) {
      setPropertyError("Informe a referência do imóvel");
      return;
    }

    setLoadingProperty(true);
    setPropertyError("");

    try {
      const response = await fetch(
        "/api/trpc/properfy.searchPropertyByReference?input=" +
          encodeURIComponent(JSON.stringify({ reference: formData.propertyReference }))
      );
      const apiResult = await response.json();

      if (apiResult.error) {
        throw new Error(apiResult.error.message);
      }

      if (apiResult.result?.data?.success && apiResult.result?.data?.data) {
        const propData = apiResult.result.data.data;
        setFormData((prev) => ({
          ...prev,
          propertyAddress: propData.address || "",
          propertyCity: propData.city || "",
          propertyState: propData.state || "",
          propertyZipCode: propData.zipCode || "",
          propertyValue: propData.value?.toString() || "",
        }));
        setPropertyError("");
      } else {
        setPropertyError(
          apiResult.result?.data?.error || "Imóvel não encontrado"
        );
      }
    } catch (error) {
      setPropertyError("Erro ao buscar imóvel no Properfy");
      console.error(error);
    } finally {
      setLoadingProperty(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateCommission = () => {
    const saleValue = parseFloat(formData.saleValue) || 0;
    let percentage = 0;

    switch (formData.commissionType) {
      case "standard":
        percentage = 5;
        break;
      case "reduced":
        percentage = 3;
        break;
      case "premium":
        percentage = 7;
        break;
      default:
        percentage = 5;
    }

    return (saleValue * percentage) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.propertyAddress) {
        throw new Error("Endereço do imóvel é obrigatório");
      }
      if (!formData.propertyValue) {
        throw new Error("Valor do imóvel é obrigatório");
      }
      if (!formData.saleValue) {
        throw new Error("Valor da venda é obrigatório");
      }
      if (!formData.buyerName) {
        throw new Error("Nome do comprador é obrigatório");
      }
      if (!formData.buyerEmail) {
        throw new Error("Email do comprador é obrigatório");
      }

      const commission = calculateCommission();

      console.log("Venda a ser salva:", {
        ...formData,
        commissionValue: commission.toString(),
      });

      alert("Venda registrada com sucesso!");
      setLocation("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar venda");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "broker") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <p>Acesso restrito a corretores</p>
            </div>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const commission = calculateCommission();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nova Venda</h1>
            <p className="text-sm text-slate-600">
              Registre uma nova venda de imóvel
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Imóvel</CardTitle>
              <CardDescription>
                Selecione o tipo de imóvel e preencha os dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="propertyType">Tipo de Imóvel</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) =>
                    handleSelectChange("propertyType", value)
                  }
                >
                  <SelectTrigger>
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
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="propertyReference"
                      name="propertyReference"
                      placeholder="Ex: REF-001"
                      value={formData.propertyReference}
                      onChange={handleInputChange}
                    />
                    <Button
                      type="button"
                      onClick={handleSearchProperty}
                      disabled={loadingProperty}
                      className="gap-2"
                    >
                      <Search className="h-4 w-4" />
                      {loadingProperty ? "Buscando..." : "Buscar"}
                    </Button>
                  </div>
                  {propertyError && (
                    <p className="text-red-500 text-sm mt-2">
                      {propertyError}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="propertyAddress">Endereço</Label>
                  <Input
                    id="propertyAddress"
                    name="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={handleInputChange}
                    placeholder="Rua, número"
                  />
                </div>
                <div>
                  <Label htmlFor="propertyCity">Cidade</Label>
                  <Input
                    id="propertyCity"
                    name="propertyCity"
                    value={formData.propertyCity}
                    onChange={handleInputChange}
                    placeholder="Cidade"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="propertyState">Estado</Label>
                  <Input
                    id="propertyState"
                    name="propertyState"
                    value={formData.propertyState}
                    onChange={handleInputChange}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="propertyZipCode">CEP</Label>
                  <Input
                    id="propertyZipCode"
                    name="propertyZipCode"
                    value={formData.propertyZipCode}
                    onChange={handleInputChange}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="propertyValue">Valor do Imóvel (R$)</Label>
                <Input
                  id="propertyValue"
                  name="propertyValue"
                  type="number"
                  value={formData.propertyValue}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Venda</CardTitle>
              <CardDescription>
                Preencha os dados da venda e do comprador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="saleValue">Valor da Venda (R$)</Label>
                <Input
                  id="saleValue"
                  name="saleValue"
                  type="number"
                  value={formData.saleValue}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="commissionType">Tipo de Comissão</Label>
                <Select
                  value={formData.commissionType}
                  onValueChange={(value) =>
                    handleSelectChange("commissionType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Padrão (5%)</SelectItem>
                    <SelectItem value="reduced">Reduzida (3%)</SelectItem>
                    <SelectItem value="premium">Premium (7%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {commission > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-slate-600">Comissão Estimada</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {commission.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buyerName">Nome do Comprador</Label>
                  <Input
                    id="buyerName"
                    name="buyerName"
                    value={formData.buyerName}
                    onChange={handleInputChange}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="buyerEmail">Email do Comprador</Label>
                  <Input
                    id="buyerEmail"
                    name="buyerEmail"
                    type="email"
                    value={formData.buyerEmail}
                    onChange={handleInputChange}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="buyerPhone">Telefone do Comprador</Label>
                <Input
                  id="buyerPhone"
                  name="buyerPhone"
                  value={formData.buyerPhone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  name="observations"
                  value={formData.observations}
                  onChange={handleInputChange}
                  placeholder="Adicione observações sobre a venda..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/dashboard")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Salvando..." : "Registrar Venda"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

