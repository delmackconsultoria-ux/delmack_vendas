import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MonthlyData {
  month: string;
  value: number;
  prontos: number;
  lancamentos: number;
  todos: number;
}

interface IndicatorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorName: string;
  indicatorType: "value" | "units" | "cancelled";
  monthlyData: MonthlyData[];
  brokers: Array<{ id: string; name: string }>;
  userRole: "broker" | "manager" | "finance" | "admin";
}

const BUSINESS_TYPE_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "prontos", label: "Prontos" },
  { value: "lancamentos", label: "Lançamentos" },
  { value: "prontos_lancamentos", label: "Prontos e Lançamentos" },
];

export default function IndicatorDetailModal({
  isOpen,
  onClose,
  indicatorName,
  indicatorType,
  monthlyData,
  brokers,
  userRole,
}: IndicatorDetailModalProps) {
  const [selectedBusinessType, setSelectedBusinessType] = useState("todos");
  const [selectedBroker, setSelectedBroker] = useState<string>("all");

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return monthlyData.map((month) => {
      let value = 0;

      if (selectedBusinessType === "prontos") {
        value = month.prontos;
      } else if (selectedBusinessType === "lancamentos") {
        value = month.lancamentos;
      } else if (selectedBusinessType === "prontos_lancamentos") {
        value = month.prontos + month.lancamentos;
      } else {
        value = month.todos;
      }

      return {
        month: month.month,
        value,
      };
    });
  }, [monthlyData, selectedBusinessType]);

  // Calculate statistics
  const stats = useMemo(() => {
    const values = filteredData.map((d) => d.value);
    const total = values.reduce((a, b) => a + b, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Calculate trend (comparing last 3 months with previous 3 months)
    const lastThreeMonths = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previousThreeMonths = values.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    const trend = lastThreeMonths > previousThreeMonths ? "up" : "down";
    const trendPercentage = (
      ((lastThreeMonths - previousThreeMonths) / previousThreeMonths) *
      100
    ).toFixed(1);

    return {
      total,
      average: average.toFixed(2),
      max,
      min,
      trend,
      trendPercentage,
    };
  }, [filteredData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-white border-b">
          <div>
            <CardTitle>{indicatorName}</CardTitle>
            <CardDescription>Histórico e evolução do ano por mês</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Tipo de Negócio
              </label>
              <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Corretor - apenas para gerentes e financeiro */}
            {userRole !== "broker" && (
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Corretor
                </label>
                <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Corretores</SelectItem>
                    {brokers.map((broker) => (
                      <SelectItem key={broker.id} value={broker.id}>
                        {broker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Total</p>
              <p className="text-lg font-bold text-slate-900">
                {indicatorType === "value"
                  ? `R$ ${parseFloat(stats.total.toString()).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}`
                  : Math.round(stats.total)}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Média</p>
              <p className="text-lg font-bold text-slate-900">
                {indicatorType === "value"
                  ? `R$ ${parseFloat(stats.average).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}`
                  : Math.round(parseFloat(stats.average))}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-green-700 mb-1">Máximo</p>
              <p className="text-lg font-bold text-green-600">
                {indicatorType === "value"
                  ? `R$ ${stats.max.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : Math.round(stats.max)}
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-xs text-red-700 mb-1">Mínimo</p>
              <p className="text-lg font-bold text-red-600">
                {indicatorType === "value"
                  ? `R$ ${stats.min.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : Math.round(stats.min)}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${
              stats.trend === "up"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}>
              <p className={`text-xs mb-1 ${
                stats.trend === "up" ? "text-green-700" : "text-red-700"
              }`}>
                Tendência
              </p>
              <div className="flex items-center gap-1">
                {stats.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <p className={`text-lg font-bold ${
                  stats.trend === "up" ? "text-green-600" : "text-red-600"
                }`}>
                  {stats.trendPercentage}%
                </p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Evolução Mensal
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => {
                    if (indicatorType === "value") {
                      return `R$ ${parseFloat(value.toString()).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}`;
                    }
                    return Math.round(value as number);
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                  name={indicatorName}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-4 font-semibold text-slate-700">
                    Mês
                  </th>
                  <th className="text-right py-2 px-4 font-semibold text-slate-700">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-4 text-slate-900">{row.month}</td>
                    <td className="text-right py-2 px-4 text-slate-900 font-semibold">
                      {indicatorType === "value"
                        ? `R$ ${row.value.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}`
                        : Math.round(row.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Close Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

