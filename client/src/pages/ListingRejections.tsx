import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, FileX, Calendar, User, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppHeader";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ListingRejections() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [brokerName, setBrokerName] = useState("");

  // Query para buscar baixas
  const { data: rejectionsData, isLoading, refetch } = trpc.properfy.getListingRejections.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    brokerName: brokerName || undefined,
  });

  if (!user) {
    return null;
  }

  // Apenas gerentes e admins podem acessar
  if (user.role !== "manager" && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <p className="text-slate-900 font-semibold mb-4">
              Acesso restrito a gerentes
            </p>
            <Button onClick={() => setLocation("/dashboard")}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApplyFilters = () => {
    refetch();
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setBrokerName("");
    refetch();
  };

  // Agrupar baixas por motivo para gráfico
  const reasonsCount = rejectionsData?.rejections?.reduce((acc: any, rejection) => {
    const reason = rejection.rejectionReason;
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});

  const reasonsChartData = reasonsCount
    ? Object.entries(reasonsCount).map(([reason, count]) => ({
        reason: reason.length > 30 ? reason.substring(0, 30) + "..." : reason,
        count,
      }))
    : [];

  // Agrupar baixas por corretor para gráfico
  const brokersCount = rejectionsData?.rejections?.reduce((acc: any, rejection) => {
    const broker = rejection.brokerName;
    acc[broker] = (acc[broker] || 0) + 1;
    return acc;
  }, {});

  const brokersChartData = brokersCount
    ? Object.entries(brokersCount).map(([broker, count]) => ({
        broker,
        count,
      }))
    : [];

  const COLORS = ["#f97316", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileX className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Baixas de Angariação
            </h1>
          </div>
          <p className="text-slate-600">
            Relatório de imóveis recusados com motivos e estatísticas
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refine a busca por período e corretor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="brokerName">Corretor</Label>
                <Input
                  id="brokerName"
                  type="text"
                  placeholder="Nome do corretor"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="bg-primary hover:bg-primary/90">
                Aplicar Filtros
              </Button>
              <Button onClick={handleClearFilters} variant="outline">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Carregando dados...</p>
          </div>
        ) : rejectionsData?.success && rejectionsData.rejections && rejectionsData.rejections.length > 0 ? (
          <>
            {/* KPI Card */}
            <Card className="mb-6 border-l-4 border-l-red-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Total de Baixas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {rejectionsData.total || rejectionsData.rejections.length}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Imóveis recusados no período
                </p>
              </CardContent>
            </Card>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfico de Barras - Motivos */}
              {reasonsChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Baixas por Motivo</CardTitle>
                    <CardDescription>Principais razões de recusa</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reasonsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="reason" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="count" name="Quantidade" fill="#f97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Gráfico de Barras - Corretores */}
              {brokersChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Baixas por Corretor</CardTitle>
                    <CardDescription>Distribuição por responsável</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={brokersChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="broker" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="count" name="Quantidade" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tabela de Baixas */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Baixas</CardTitle>
                <CardDescription>Detalhes de cada imóvel recusado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Referência
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Endereço
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Corretor
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Motivo
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rejectionsData.rejections.map((rejection) => (
                        <tr key={rejection.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {rejection.propertyReference}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                              <span>{rejection.propertyAddress}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-400" />
                              <span>{rejection.brokerName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              {rejection.rejectionReason}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span>{formatDate(rejection.rejectionDate)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileX className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">
                {rejectionsData?.error || "Nenhuma baixa encontrada para o período selecionado"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
