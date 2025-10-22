import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function NewSale() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    propertyType: "baggio", // "baggio" ou "external"
    propertyReference: "",
    propertyAddress: "",
    propertyCity: "",
    propertyState: "",
    propertyCEP: "",
    propertyValue: "",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    commissionType: "standard",
    notes: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validações
      if (!formData.propertyAddress) {
        throw new Error("Endereço do imóvel é obrigatório");
      }
      if (!formData.propertyValue) {
        throw new Error("Valor do imóvel é obrigatório");
      }
      if (!formData.buyerName) {
        throw new Error("Nome do comprador é obrigatório");
      }
      if (!formData.buyerEmail) {
        throw new Error("Email do comprador é obrigatório");
      }

      // TODO: Chamar API para salvar venda
      console.log("Venda a ser salva:", formData);

      // Simular sucesso
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
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
          <h1 className="text-xl font-bold text-slate-900">Nova Venda</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Erro</h3>
                <p className="text-sm text-red-800 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Property Type Selection */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Tipo de Imóvel</CardTitle>
              <CardDescription>
                Selecione se o imóvel é da Baggio ou externo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectChange("propertyType", "baggio")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.propertyType === "baggio"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="font-semibold text-slate-900">🏢 Baggio</p>
                  <p className="text-sm text-slate-600 mt-1">Imóvel cadastrado no Properfy</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectChange("propertyType", "external")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.propertyType === "external"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="font-semibold text-slate-900">🏠 Externo</p>
                  <p className="text-sm text-slate-600 mt-1">Imóvel de terceiros</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Property Information */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Informações do Imóvel</CardTitle>
              <CardDescription>
                Preencha os dados do imóvel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.propertyType === "baggio" && (
                <div>
                  <Label htmlFor="propertyReference">Referência Properfy *</Label>
                  <Input
                    id="propertyReference"
                    name="propertyReference"
                    placeholder="Ex: PROP-12345"
                    value={formData.propertyReference}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Insira a referência do imóvel no Properfy para puxar os dados automaticamente
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="propertyAddress">Endereço *</Label>
                  <Input
                    id="propertyAddress"
                    name="propertyAddress"
                    placeholder="Rua, número"
                    value={formData.propertyAddress}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="propertyCEP">CEP *</Label>
                  <Input
                    id="propertyCEP"
                    name="propertyCEP"
                    placeholder="00000-000"
                    value={formData.propertyCEP}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="propertyCity">Cidade *</Label>
                  <Input
                    id="propertyCity"
                    name="propertyCity"
                    placeholder="São Paulo"
                    value={formData.propertyCity}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="propertyState">Estado *</Label>
                  <Input
                    id="propertyState"
                    name="propertyState"
                    placeholder="SP"
                    value={formData.propertyState}
                    onChange={handleInputChange}
                    className="mt-2"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="propertyValue">Valor do Imóvel *</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">R$</span>
                  <Input
                    id="propertyValue"
                    name="propertyValue"
                    type="number"
                    placeholder="0,00"
                    value={formData.propertyValue}
                    onChange={handleInputChange}
                    className="pl-10"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Information */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Informações do Comprador</CardTitle>
              <CardDescription>
                Dados de contato do comprador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="buyerName">Nome Completo *</Label>
                <Input
                  id="buyerName"
                  name="buyerName"
                  placeholder="João Silva"
                  value={formData.buyerName}
                  onChange={handleInputChange}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buyerEmail">Email *</Label>
                  <Input
                    id="buyerEmail"
                    name="buyerEmail"
                    type="email"
                    placeholder="joao@email.com"
                    value={formData.buyerEmail}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="buyerPhone">Telefone</Label>
                  <Input
                    id="buyerPhone"
                    name="buyerPhone"
                    placeholder="(11) 99999-9999"
                    value={formData.buyerPhone}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Information */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Informações de Comissão</CardTitle>
              <CardDescription>
                Tipo de negociação e comissão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="commissionType">Tipo de Comissão *</Label>
                <Select value={formData.commissionType} onValueChange={(value) => handleSelectChange("commissionType", value)}>
                  <SelectTrigger id="commissionType" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Padrão (5%)</SelectItem>
                    <SelectItem value="reduced">Reduzida (3%)</SelectItem>
                    <SelectItem value="premium">Premium (7%)</SelectItem>
                    <SelectItem value="custom">Customizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
              <CardDescription>
                Informações adicionais sobre a venda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                name="notes"
                placeholder="Adicione qualquer informação relevante sobre a venda..."
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? "Salvando..." : "Registrar Venda"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

