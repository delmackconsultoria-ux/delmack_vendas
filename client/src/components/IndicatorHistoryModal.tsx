import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface IndicatorHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorName: string;
  indicatorData?: {
    total: number;
    average: number;
    maximum: number;
    minimum: number;
    trend: number;
    monthlyData: Array<{
      month: string;
      value: number;
    }>;
  };
}

const BUSINESS_TYPES = [
  { value: "todos", label: "Todos" },
  { value: "prontos", label: "Prontos" },
  { value: "lancamentos", label: "Lançamentos" },
  { value: "rede", label: "Rede" },
  { value: "internos", label: "Internos" },
];

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function IndicatorHistoryModal({
  isOpen,
  onClose,
  indicatorName,
  indicatorData,
}: IndicatorHistoryModalProps) {
  const [selectedBusinessType, setSelectedBusinessType] = useState("todos");
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Query para buscar dados historicos do indicador
  const { data: historyData, isLoading } = trpc.indicators.getIndicatorHistory.useQuery(
    {
      indicatorName,
      year,
      businessType: selectedBusinessType,
    },
    {
      enabled: isOpen,
    }
  );

  // Usar dados reais do banco ou mock como fallback
  const mockData = {
    total: 66100000,
    average: 6610000,
    maximum: 8000000,
    minimum: 5200000,
    trend: 10.2,
    monthlyData: [
      { month: "Jan", value: 5500000 },
      { month: "Fev", value: 5800000 },
      { month: "Mar", value: 6200000 },
      { month: "Abr", value: 6500000 },
      { month: "Mai", value: 6800000 },
      { month: "Jun", value: 7000000 },
      { month: "Jul", value: 7200000 },
      { month: "Ago", value: 6900000 },
      { month: "Set", value: 7100000 },
      { month: "Out", value: 7300000 },
      { month: "Nov", value: 7500000 },
      { month: "Dez", value: 7800000 },
    ],
  };

  const data = (historyData?.statistics && historyData?.monthlyData) ? {
    total: historyData.statistics.total,
    average: historyData.statistics.average,
    maximum: historyData.statistics.maximum,
    minimum: historyData.statistics.minimum,
    trend: historyData.statistics.trend,
    monthlyData: historyData.monthlyData,
  } : (indicatorData || mockData);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  const getTrendColor = (trend: number): string => {
    if (trend > 0) return "text-green-600";
    if (trend < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">{indicatorName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Histórico e evolução do ano por mês
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 mt-4">
          {/* Filtros - Ano e Tipo de Negócio */}
          <div className="flex gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Ano</label>
              <Select value={String(year)} onValueChange={(val) => setYear(parseInt(val))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Negócio</label>
              <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
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

          {/* Cards de Resumo */}
          <div className="grid grid-cols-5 gap-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-lg font-bold">
                  {data.total > 1000 ? formatCurrency(data.total) : formatNumber(data.total)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Média</p>
                <p className="text-lg font-bold">
                  {data.average > 1000 ? formatCurrency(data.average) : formatNumber(data.average)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Máximo</p>
                <p className="text-lg font-bold text-green-600">
                  {data.maximum > 1000 ? formatCurrency(data.maximum) : formatNumber(data.maximum)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Mínimo</p>
                <p className="text-lg font-bold text-red-600">
                  {data.minimum > 1000 ? formatCurrency(data.minimum) : formatNumber(data.minimum)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Tendência</p>
                <p className={`text-lg font-bold flex items-center gap-1 ${getTrendColor(data.trend)}`}>
                  <TrendingUp className="w-4 h-4" />
                  {data.trend > 0 ? "+" : ""}{data.trend.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Evolução Mensal */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Evolução Mensal</h3>
            <div className="w-full h-96 bg-white rounded-lg border">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => {
                      if (value > 1000) {
                        return `R$ ${(value / 1000000).toFixed(1)}M`;
                      }
                      return formatNumber(value);
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    name="Realizado"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4, cursor: "pointer" }}
                    activeDot={{ r: 6 }}
                    onClick={(data: any) => {
                      setSelectedMonth(data);
                      setShowDetailsModal(true);
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Modal de Detalhes do Mês */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMonth?.month} - Detalhes de Vendas
            </DialogTitle>
          </DialogHeader>
          
          {selectedMonth && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground mb-1">Total de Vendas</p>
                    <p className="text-lg font-bold">{selectedMonth.salesCount || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedMonth.value || 0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground mb-1">Ticket Médio</p>
                    <p className="text-lg font-bold">
                      {formatCurrency((selectedMonth.value || 0) / (selectedMonth.salesCount || 1))}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {selectedMonth.sales && selectedMonth.sales.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Vendas do Período</h4>
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">Data</th>
                          <th className="px-4 py-2 text-left">Corretor</th>
                          <th className="px-4 py-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMonth.sales.map((sale: any, idx: number) => (
                          <tr key={idx} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-2">
                              {new Date(sale.saleDate).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-4 py-2">{sale.brokerName || "N/A"}</td>
                            <td className="px-4 py-2 text-right font-semibold">
                              {formatCurrency(sale.saleValue || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
