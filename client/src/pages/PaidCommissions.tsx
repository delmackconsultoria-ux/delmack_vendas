import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Download, FileText, Loader, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PaidCommission {
  saleId: string;
  buyerName: string;
  propertyReference?: string;
  brokerName: string;
  saleValue: number;
  commissionAmount: number;
  commissionPaymentDate: string;
  commissionPaymentMethod: string;
  commissionPaymentBank: string;
  commissionInvoiceUrl?: string;
}

export default function PaidCommissions() {
  const [filterBroker, setFilterBroker] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  // Buscar vendas com comissões pagas
  const { data: salesData, isLoading } = trpc.sales.listMySales.useQuery();

  // Filtrar apenas vendas com comissão paga
  const paidCommissions: PaidCommission[] = useMemo(() => {
    if (!salesData?.sales) return [];
    
    return salesData.sales
      .filter((sale: any) => sale.commissionPaymentDate)
      .map((sale: any) => ({
        saleId: sale.id,
        buyerName: sale.buyerName,
        propertyReference: sale.propertyReference,
        brokerName: sale.brokerVendedorName || "N/A",
        saleValue: parseFloat(sale.saleValue || "0"),
        commissionAmount: parseFloat(sale.totalCommission || "0"),
        commissionPaymentDate: sale.commissionPaymentDate,
        commissionPaymentMethod: sale.commissionPaymentMethod || "N/A",
        commissionPaymentBank: sale.commissionPaymentBank || "N/A",
        commissionInvoiceUrl: sale.commissionInvoiceUrl,
      }));
  }, [salesData]);

  // Filtrar comissões
  const filteredCommissions = useMemo(() => {
    return paidCommissions.filter((c) => {
      const paymentDate = new Date(c.commissionPaymentDate);
      const matchesBroker = filterBroker === "all" || c.brokerName === filterBroker;
      const matchesYear = paymentDate.getFullYear().toString() === filterYear;
      const matchesMonth = filterMonth === "all" || (paymentDate.getMonth() + 1).toString() === filterMonth;
      
      return matchesBroker && matchesYear && matchesMonth;
    });
  }, [paidCommissions, filterBroker, filterMonth, filterYear]);

  // Dados para o gráfico de evolução mensal
  const chartData = useMemo(() => {
    const monthlyData: Record<string, { month: string; total: number; count: number }> = {};
    
    filteredCommissions.forEach((c) => {
      const date = new Date(c.commissionPaymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthLabel, total: 0, count: 0 };
      }
      
      monthlyData[monthKey].total += c.commissionAmount;
      monthlyData[monthKey].count += 1;
    });
    
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredCommissions]);

  // Lista de corretores únicos
  const brokers = useMemo(() => {
    const uniqueBrokers = Array.from(new Set(paidCommissions.map((c) => c.brokerName)));
    return uniqueBrokers.sort();
  }, [paidCommissions]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = filteredCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const count = filteredCommissions.length;
    const average = count > 0 ? total / count : 0;
    
    return { total, count, average };
  }, [filteredCommissions]);

  // Exportar para Excel
  const handleExportExcel = () => {
    if (filteredCommissions.length === 0) {
      toast.error("Nenhuma comissão para exportar");
      return;
    }

    // Criar CSV
    const headers = ["Data Pagamento", "Corretor", "Comprador", "Ref. Properfy", "Valor Venda", "Comissão", "Método", "Banco"];
    const rows = filteredCommissions.map((c) => [
      new Date(c.commissionPaymentDate).toLocaleDateString('pt-BR'),
      c.brokerName,
      c.buyerName,
      c.propertyReference || "N/A",
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.saleValue),
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.commissionAmount),
      c.commissionPaymentMethod,
      c.commissionPaymentBank,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `comissoes-pagas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success("Relatório exportado com sucesso!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Comissões Pagas
            </h1>
            <p className="text-slate-600 mt-1">Histórico e análise de comissões pagas</p>
          </div>
          <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total)}
              </div>
              <p className="text-xs text-slate-500 mt-1">em comissões pagas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Quantidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.count}
              </div>
              <p className="text-xs text-slate-500 mt-1">pagamentos realizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Média por Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.average)}
              </div>
              <p className="text-xs text-slate-500 mt-1">valor médio</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filterBroker">Corretor</Label>
                <Select value={filterBroker} onValueChange={setFilterBroker}>
                  <SelectTrigger id="filterBroker">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Corretores</SelectItem>
                    {brokers.map((broker) => (
                      <SelectItem key={broker} value={broker}>
                        {broker}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filterYear">Ano</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger id="filterYear">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filterMonth">Mês</Label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger id="filterMonth">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Meses</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2000, month - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Evolução Mensal */}
        {chartData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
               <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) =>
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                    }
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#3b82f6" name="Comissões Pagas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Comissões Pagas */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pagamentos ({filteredCommissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCommissions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Nenhuma comissão paga encontrada com os filtros selecionados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Data</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Corretor</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Comprador</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Ref.</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Venda</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Comissão</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Método</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Banco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommissions.map((commission) => (
                      <tr key={commission.saleId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-900">
                          {new Date(commission.commissionPaymentDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900">{commission.brokerName}</td>
                        <td className="py-3 px-4 text-sm text-slate-900">{commission.buyerName}</td>
                        <td className="py-3 px-4 text-sm">
                          {commission.propertyReference && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {commission.propertyReference}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-slate-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.saleValue)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.commissionAmount)}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 capitalize">{commission.commissionPaymentMethod}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{commission.commissionPaymentBank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
