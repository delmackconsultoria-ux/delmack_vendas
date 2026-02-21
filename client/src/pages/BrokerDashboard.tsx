import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { formatCurrency } from "@/lib/commissionCalculator";

const MONTHS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export default function BrokerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [activeTab, setActiveTab] = useState<"summary" | "sales" | "commissions">(
    "summary"
  );

  const month = Number(selectedMonth);
  const year = Number(selectedYear);

  // Buscar resumo do corretor
  const { data: summary, isLoading: summaryLoading } =
    trpc.brokerDashboard.getSummary.useQuery({
      month,
      year,
    });

  // Buscar vendas do corretor
  const { data: mySales, isLoading: salesLoading } =
    trpc.brokerDashboard.listMySales.useQuery({
      month,
      year,
      role: "vendedor",
    });

  // Buscar comissões do corretor
  const { data: myCommissions, isLoading: commissionsLoading } =
    trpc.brokerDashboard.listMyCommissions.useQuery({
      month,
      year,
      status: "all",
    });

  // Gerar lista de anos disponíveis
  const years = useMemo(() => {
    const yearList = [];
    for (let i = 2024; i <= now.getFullYear() + 1; i++) {
      yearList.push({ value: String(i), label: String(i) });
    }
    return yearList;
  }, []);

  if (!user || user.role !== "broker") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">
            Apenas corretores podem acessar este dashboard.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meu Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe suas vendas, comissões e desempenho
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-8">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.value} value={y.value}>
                  {y.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Abas */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab("summary")}
            className={`pb-4 px-4 font-medium ${
              activeTab === "summary"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Resumo
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`pb-4 px-4 font-medium ${
              activeTab === "sales"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Minhas Vendas
          </button>
          <button
            onClick={() => setActiveTab("commissions")}
            className={`pb-4 px-4 font-medium ${
              activeTab === "commissions"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Minhas Comissões
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card: Vendas como Vendedor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Vendas (Vendedor)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryLoading ? "..." : summary?.sales.asVendedor || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {summaryLoading
                    ? "..."
                    : formatCurrency(summary?.sales.valueAsVendedor || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Card: Vendas como Angariador */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Vendas (Angariador)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryLoading ? "..." : summary?.sales.asAngariador || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {summaryLoading
                    ? "..."
                    : formatCurrency(summary?.sales.valueAsAngariador || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Card: Comissões Pagas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Comissões Pagas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryLoading ? "..." : summary?.commissions.paid || 0}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {summaryLoading
                    ? "..."
                    : formatCurrency(summary?.commissions.paidValue || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Card: Comissões Pendentes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Comissões Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryLoading ? "..." : summary?.commissions.pending || 0}
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  {summaryLoading
                    ? "..."
                    : formatCurrency(summary?.commissions.pendingValue || 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "sales" && (
          <Card>
            <CardHeader>
              <CardTitle>Minhas Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : !mySales || mySales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma venda registrada neste período.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Comprador</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mySales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            {sale.buyerName}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(Number(sale.saleValue) || 0)}
                          </TableCell>
                          <TableCell>{sale.tipoComissao}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                sale.status === "commission_paid" || sale.status === "sale"
                              ? "bg-green-100 text-green-800"
                              : sale.status === "pending" || sale.status === "draft"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                              }`}
                            >
                              {sale.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {sale.createdAt
                              ? new Date(sale.createdAt).toLocaleDateString(
                                  "pt-BR"
                                )
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "commissions" && (
          <Card>
            <CardHeader>
              <CardTitle>Minhas Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              {commissionsLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : !myCommissions || myCommissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma comissão registrada neste período.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Percentual</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myCommissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium">
                            {commission.type}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(Number(commission.commissionValue) || 0)}
                          </TableCell>
                          <TableCell>
                            {Number(commission.commissionPercentage)}%
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                commission.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : commission.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {commission.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {commission.createdAt
                              ? new Date(commission.createdAt).toLocaleDateString(
                                  "pt-BR"
                                )
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
