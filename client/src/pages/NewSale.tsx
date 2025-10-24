import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, AlertCircle, Search, CheckCircle, Loader } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function NewSale() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [propertyError, setPropertyError] = useState("");
  const [propertySuccess, setPropertySuccess] = useState(false);

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
      setPropertySuccess(false);
      return;
    }

    setLoadingProperty(true);
    setPropertyError("");
    setPropertySuccess(false);

    try {
      console.log("Iniciando busca do imóvel...");
      
      // Usar endpoint REST com credenciais reais
      const response = await fetch(
        `/api/rest/properfy/search?reference=${encodeURIComponent(
          formData.propertyReference.toUpperCase()
        )}`
      );

      const data = await response.json();
      console.log("Resposta da API:", data);

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
          propertyValue: data.data.value?.toString() || "",
        }));
        setPropertyError("");
        setPropertySuccess(true);
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => setPropertySuccess(false), 3000);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Lidar com Enter em diferentes campos
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, fieldName: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      // Se estiver no campo de referência, buscar imóvel
      if (fieldName === "propertyReference") {
        handleSearchProperty();
      }
      // Se estiver em qualquer outro campo da seção de venda, registrar venda
      else if (
        fieldName === "saleValue" ||
        fieldName === "buyerName" ||
        fieldName === "buyerEmail" ||
        fieldName === "buyerPhone"
      ) {
        handleSubmit(e as any);
      }
    }
  };

  const calculateCommission = () => {
    const saleValue = parseFloat(formData.saleValue) || 0;
    let commission = 0;

    switch (formData.commissionType) {
      case "standard":
        commission = saleValue * 0.05;
        break;
      case "reduced":
        commission = saleValue * 0.03;
        break;
      case "premium":
        commission = saleValue * 0.07;
        break;
    }

    return commission.toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Aqui você faria a chamada para criar a venda
      // await trpc.sales.createSale.mutate({...});
      
      // Por enquanto, apenas redireciona
      setLocation("/");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao criar venda";
      setError(errorMsg);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
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
            <CardDescription>Registre uma nova venda de imóvel</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">Erro</h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Informações do Imóvel */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informações do Imóvel</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Selecione o tipo de imóvel e preencha os dados
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="propertyType">Tipo de Imóvel</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) =>
                        handleInputChange("propertyType", value)
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="propertyZipCode">CEP</Label>
                      <Input
                        id="propertyZipCode"
                        placeholder="00000-000"
                        value={formData.propertyZipCode}
                        onChange={(e) =>
                          handleInputChange("propertyZipCode", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="propertyValue">Valor do Imóvel</Label>
                    <Input
                      id="propertyValue"
                      type="number"
                      placeholder="0.00"
                      value={formData.propertyValue}
                      onChange={(e) =>
                        handleInputChange("propertyValue", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Informações da Venda */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informações da Venda</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Preencha os dados da venda e comissão
                </p>

                <div className="space-y-4">
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
                      onKeyPress={(e) => handleKeyPress(e, "saleValue")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="commissionType">Tipo de Comissão</Label>
                      <Select
                        value={formData.commissionType}
                        onValueChange={(value) =>
                          handleInputChange("commissionType", value)
                        }
                      >
                        <SelectTrigger id="commissionType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reduced">Reduzida (3%)</SelectItem>
                          <SelectItem value="standard">Padrão (5%)</SelectItem>
                          <SelectItem value="premium">Premium (7%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="commissionValue">Valor da Comissão</Label>
                      <Input
                        id="commissionValue"
                        type="number"
                        placeholder="0.00"
                        value={calculateCommission()}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações do Comprador */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informações do Comprador</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Dados de contato do comprador
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
                      onKeyPress={(e) => handleKeyPress(e, "buyerName")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buyerEmail">Email</Label>
                      <Input
                        id="buyerEmail"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={formData.buyerEmail}
                        onChange={(e) =>
                          handleInputChange("buyerEmail", e.target.value)
                        }
                        onKeyPress={(e) => handleKeyPress(e, "buyerEmail")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyerPhone">Telefone</Label>
                      <Input
                        id="buyerPhone"
                        placeholder="(00) 00000-0000"
                        value={formData.buyerPhone}
                        onChange={(e) =>
                          handleInputChange("buyerPhone", e.target.value)
                        }
                        onKeyPress={(e) => handleKeyPress(e, "buyerPhone")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observations">Observações</Label>
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

              {/* Botões de Ação */}
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
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Registrar Venda
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

