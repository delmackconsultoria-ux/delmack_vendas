import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, User, Home, DollarSign, Calendar, Phone, Mail, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { useLocation, useParams } from "wouter";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Rascunho", color: "text-slate-600", bgColor: "bg-slate-100" },
  pending: { label: "Pendente", color: "text-amber-600", bgColor: "bg-amber-100" },
  sale: { label: "Venda", color: "text-blue-600", bgColor: "bg-blue-100" },
  manager_review: { label: "Em análise (Gerente)", color: "text-purple-600", bgColor: "bg-purple-100" },
  finance_review: { label: "Em análise (Financeiro)", color: "text-indigo-600", bgColor: "bg-indigo-100" },
  commission_paid: { label: "Comissão Paga", color: "text-green-600", bgColor: "bg-green-100" },
  cancelled: { label: "Cancelada", color: "text-red-600", bgColor: "bg-red-100" },
};

export default function ProposalDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { data: sale, isLoading } = trpc.sales.getSaleById.useQuery({ saleId: params.id || "" }, { enabled: !!params.id });

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Carregando...</div>;
  if (!sale) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Proposta não encontrada</div>;

  const formatCurrency = (value: string | number | null | undefined) => {
    if (!value) return "R$ 0,00";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => setLocation("/proposals")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Detalhes da Proposta</h1>
          <Badge className={`${STATUS_CONFIG[sale.status]?.bgColor} ${STATUS_CONFIG[sale.status]?.color} border-0`}>
            {STATUS_CONFIG[sale.status]?.label || sale.status}
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Imóvel */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Imóvel</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div><p className="text-sm text-slate-500">Endereço</p><p className="font-medium">{sale.property?.address || "-"}, {sale.property?.number || "S/N"}</p></div>
              <div><p className="text-sm text-slate-500">Bairro</p><p className="font-medium">{sale.property?.neighborhood || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Cidade/Estado</p><p className="font-medium">{sale.property?.city || "-"}/{sale.property?.state || "-"}</p></div>
              <div><p className="text-sm text-slate-500">CEP</p><p className="font-medium">{sale.property?.zipCode || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Referência</p><p className="font-medium">{sale.property?.propertyReference || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Condomínio</p><p className="font-medium">{sale.condominiumName || "-"}</p></div>
            </CardContent>
          </Card>

          {/* Comprador */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Comprador</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div><p className="text-sm text-slate-500">Nome</p><p className="font-medium">{sale.buyerName || "-"}</p></div>
              <div><p className="text-sm text-slate-500">CPF/CNPJ</p><p className="font-medium">{sale.buyerCpfCnpj || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Telefone</p><p className="font-medium">{sale.buyerPhone || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Origem</p><p className="font-medium">{sale.clientOrigin || "-"}</p></div>
            </CardContent>
          </Card>

          {/* Vendedor */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Vendedor</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div><p className="text-sm text-slate-500">Nome</p><p className="font-medium">{sale.sellerName || "-"}</p></div>
              <div><p className="text-sm text-slate-500">CPF/CNPJ</p><p className="font-medium">{sale.sellerCpfCnpj || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Telefone</p><p className="font-medium">{sale.sellerPhone || "-"}</p></div>
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Valores e Comissões</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div><p className="text-sm text-slate-500">Valor da Venda</p><p className="font-bold text-lg text-green-600">{formatCurrency(sale.saleValue)}</p></div>
              <div><p className="text-sm text-slate-500">Valor Divulgação</p><p className="font-medium">{formatCurrency(sale.advertisementValue)}</p></div>
              <div><p className="text-sm text-slate-500">Forma Pagamento</p><p className="font-medium">{sale.paymentMethod || "-"}</p></div>
              <div><p className="text-sm text-slate-500">Comissão Total</p><p className="font-medium">{formatCurrency(sale.totalCommission)} ({sale.totalCommissionPercent || 0}%)</p></div>
              <div><p className="text-sm text-slate-500">Comissão Angariador</p><p className="font-medium">{formatCurrency(sale.angariadorCommission)}</p></div>
              <div><p className="text-sm text-slate-500">Comissão Vendedor</p><p className="font-medium">{formatCurrency(sale.vendedorCommission)}</p></div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Datas</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div><p className="text-sm text-slate-500">Data da Venda</p><p className="font-medium">{formatDate(sale.saleDate)}</p></div>
              <div><p className="text-sm text-slate-500">Data Angariação</p><p className="font-medium">{formatDate(sale.angariationDate)}</p></div>
              <div><p className="text-sm text-slate-500">Previsão Recebimento</p><p className="font-medium">{formatDate(sale.expectedPaymentDate)}</p></div>
              <div><p className="text-sm text-slate-500">Criado em</p><p className="font-medium">{formatDate(sale.createdAt)}</p></div>
            </CardContent>
          </Card>

          {/* Observações */}
          {sale.observation && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Observações</CardTitle></CardHeader>
              <CardContent><p className="text-slate-700 whitespace-pre-wrap">{sale.observation}</p></CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
