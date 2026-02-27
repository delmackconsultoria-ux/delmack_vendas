import { useState } from "react";
import {
  Dialog,
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
      {/* Modal customizado que ocupa quase toda a tela */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl w-[98vw] h-[96vh] flex flex-col">
            {/* Header com título e fechar */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold">{indicatorName}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Histórico e evolução do ano por mês
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light"
              >
                ×
              </button>
            </div>

            {/* Conteúdo scrollável */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
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
                      <SelectTrigger className="w-40">
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

                {/* Cards de resumo - 5 colunas */}
                <div className="grid grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold mt-2">{formatNumber(data.total)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Média</p>
                        <p className="text-xl font-bold mt-2">{formatNumber(data.average)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Máximo</p>
                        <p className="text-xl font-bold text-green-600 mt-2">{formatNumber(data.maximum)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Mínimo</p>
                        <p className="text-xl font-bold text-red-600 mt-2">{formatNumber(data.minimum)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Tendência</p>
                        <p className={`text-xl font-bold mt-2 flex items-center justify-center gap-1 ${getTrendColor(data.trend)}`}>
                          <TrendingUp size={20} />
                          {data.trend.toFixed(1)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Evolução Mensal</h3>
                  <div className="bg-gray-50 rounded-lg p-4" style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatNumber(value as number)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          dot={{ fill: "#3b82f6", r: 5 }}
                          activeDot={{ r: 7 }}

                          name="Realizado"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabela de detalhes por mês */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Detalhes por Mês</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Mês</th>
                          <th className="px-4 py-2 text-right">Valor</th>
                          <th className="px-4 py-2 text-right">Qtd Vendas</th>
                          <th className="px-4 py-2 text-right">Ticket Médio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.monthlyData.map((item, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{item.month}</td>
                            <td className="px-4 py-2 text-right">{formatCurrency(item.value)}</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
