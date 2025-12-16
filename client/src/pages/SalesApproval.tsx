import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ArrowLeft, CheckCircle, XCircle, FileUp, FileText, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface Sale {
  id: string;
  buyerName: string;
  saleValue: string | number;
  status: "pending" | "received" | "paid" | "cancelled";
  observation?: string;
  createdAt: Date;
  brokerVendedor?: string;
  businessType?: string;
  proposalDocumentUrl?: string;
}

export default function SalesApproval() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [observation, setObservation] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carregar vendas pendentes
  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true);
        // TODO: Usar tRPC quando estiver pronto
        // const { data } = await trpc.sales.listAllSales.useQuery({});
        // setSales(data);
        
        // Por enquanto, dados mock
        setSales([
          {
            id: "1",
            buyerName: "João Silva",
            saleValue: 450000,
            status: "pending",
            businessType: "venda",
            createdAt: new Date(),
          },
          {
            id: "2",
            buyerName: "Maria Santos",
            saleValue: 650000,
            status: "pending",
            businessType: "angariacao",
            createdAt: new Date(),
          },
        ]);
      } catch (err) {
        setError("Erro ao carregar vendas");
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, []);

  const handleStatusChange = async (newStatus: "received" | "paid" | "cancelled") => {
    if (!selectedSale) return;

    setUpdatingStatus(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Usar tRPC quando estiver pronto
      // await trpc.sales.updateSaleStatus.useMutation({
      //   saleId: selectedSale.id,
      //   status: newStatus,
      //   observation: observation,
      // });

      // Atualizar estado local
      setSales(
        sales.map((s) =>
          s.id === selectedSale.id
            ? { ...s, status: newStatus, observation: observation }
            : s
        )
      );

      setSuccess(`Venda atualizada para ${newStatus}`);
      setSelectedSale(null);
      setObservation("");

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Erro ao atualizar status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "received":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "received":
        return "Recebido";
      case "paid":
        return "Pago";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  if (user?.role !== "finance" && user?.role !== "manager") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <p>Acesso restrito a financeiro e gerente</p>
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
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
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
            <h1 className="text-2xl font-bold text-slate-900">Aprovação de Vendas</h1>
            <p className="text-sm text-slate-600">
              Gerencie o status das vendas e comissões
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <p>{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de vendas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Vendas Pendentes</CardTitle>
                <CardDescription>
                  {sales.filter((s) => s.status === "pending").length} vendas aguardando aprovação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-500">
                    Carregando vendas...
                  </div>
                ) : sales.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Nenhuma venda encontrada
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sales.map((sale) => (
                      <div
                        key={sale.id}
                        onClick={() => setSelectedSale(sale)}
                        className={`p-4 border rounded-lg cursor-pointer transition ${
                          selectedSale?.id === sale.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">
                              {sale.buyerName}
                            </p>
                            <p className="text-sm text-slate-600">
                              Valor: R$ {typeof sale.saleValue === "string" ? parseFloat(sale.saleValue).toFixed(2) : sale.saleValue.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Tipo: {sale.businessType || "N/A"}
                            </p>
                            {sale.proposalDocumentUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(sale.proposalDocumentUrl, '_blank');
                                }}
                                className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                              >
                                <FileText className="h-3 w-3" /> Ver Anexo
                              </button>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              sale.status
                            )}`}
                          >
                            {getStatusLabel(sale.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Painel de detalhes e ações */}
          <div>
            {selectedSale ? (
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da Venda</CardTitle>
                  <CardDescription>
                    ID: {selectedSale.id}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-slate-600">Comprador</Label>
                    <p className="font-semibold text-slate-900 mt-1">
                      {selectedSale.buyerName}
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-600">Valor da Venda</Label>
                    <p className="font-semibold text-slate-900 mt-1">
                      R$ {typeof selectedSale.saleValue === "string" ? parseFloat(selectedSale.saleValue).toFixed(2) : selectedSale.saleValue.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-600">Status Atual</Label>
                    <p className={`font-semibold mt-1 px-3 py-1 rounded-full text-sm w-fit ${getStatusBadgeColor(selectedSale.status)}`}>
                      {getStatusLabel(selectedSale.status)}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="observation">Observação</Label>
                    <Textarea
                      id="observation"
                      placeholder="Adicione uma observação sobre a aprovação..."
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      className="mt-2"
                      rows={4}
                    />
                  </div>

                  {selectedSale.status === "pending" && (
                    <div className="space-y-2 pt-4 border-t">
                      <Button
                        onClick={() => handleStatusChange("received")}
                        disabled={updatingStatus}
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Marcar como Recebido
                      </Button>
                      <Button
                        onClick={() => handleStatusChange("cancelled")}
                        disabled={updatingStatus}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>
                  )}

                  {selectedSale.status === "received" && (
                    <div className="space-y-2 pt-4 border-t">
                      <Button
                        onClick={() => handleStatusChange("paid")}
                        disabled={updatingStatus}
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Marcar como Pago
                      </Button>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => setSelectedSale(null)}
                    >
                      Fechar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-slate-500">
                    <p>Selecione uma venda para ver os detalhes</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

