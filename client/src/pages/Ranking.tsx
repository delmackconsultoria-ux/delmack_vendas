import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
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

export default function Ranking() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  if (!user) {
    return null;
  }

  const isBroker = user.role === "broker";

  // Mock data for rankings
  const salesRankingData = [
    { name: "Ana Silva", sales: 2500000, angariations: 1500000 },
    { name: "Carlos Santos", sales: 2200000, angariations: 1200000 },
    { name: "Beatriz Costa", sales: 1900000, angariations: 1100000 },
    { name: "Diego Oliveira", sales: 1700000, angariations: 900000 },
    { name: "Elena Martins", sales: 1500000, angariations: 800000 },
  ];

  const commissionRankingData = [
    { name: "Ana Silva", commission: 150000, fill: "#ef4444" },
    { name: "Carlos Santos", commission: 132000, fill: "#f97316" },
    { name: "Beatriz Costa", commission: 114000, fill: "#eab308" },
    { name: "Diego Oliveira", commission: 102000, fill: "#22c55e" },
    { name: "Elena Martins", commission: 90000, fill: "#3b82f6" },
  ];

  const topBrokersData = [
    { name: "Ana Silva", value: 2500000, fill: "#ef4444" },
    { name: "Carlos Santos", value: 2200000, fill: "#f97316" },
    { name: "Beatriz Costa", value: 1900000, fill: "#eab308" },
    { name: "Diego Oliveira", value: 1700000, fill: "#22c55e" },
    { name: "Elena Martins", value: 1500000, fill: "#3b82f6" },
  ];

  const topAngariadores = [
    { name: "Ana Silva", value: 1500000, fill: "#ec4899" },
    { name: "Carlos Santos", value: 1200000, fill: "#f43f5e" },
    { name: "Beatriz Costa", value: 1100000, fill: "#f97316" },
    { name: "Pedro Costa", value: 1562500, fill: "#8b5cf6" },
    { name: "João Silva", value: 750000, fill: "#3b82f6" },
    { name: "Maria Santos", value: 500000, fill: "#10b981" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Ranking de Vendas e Angariações
          </h2>
          <p className="text-slate-600 mt-2">
            {isBroker
              ? "Seu desempenho em relação aos colegas"
              : "Desempenho de toda a equipe"}
          </p>
        </div>

        {/* Sales Ranking Table */}
        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <CardTitle>Ranking de Vendas</CardTitle>
            <CardDescription>Vendas e angariações por corretor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Posição</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Corretor</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Vendas</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Angariações</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRankingData.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-lg font-bold">
                          {idx + 1}º
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{row.name}</td>
                      <td className="text-right py-3 px-4 text-slate-900">
                        R$ {row.sales.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="text-right py-3 px-4 text-slate-900">
                        R$ {row.angariations.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-blue-600">
                        R$ {(row.sales + row.angariations).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Commission Ranking Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Ranking de Comissões</CardTitle>
              <CardDescription>Comissões ganhas no período</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={commissionRankingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`} />
                  <Bar dataKey="commission" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Brokers Pie Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Top 5 Vendedores</CardTitle>
              <CardDescription>Distribuição de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topBrokersData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${(value / 1000000).toFixed(1)}M`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topBrokersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Angariadores Ranking */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Top Angariadores</CardTitle>
            <CardDescription>Angariações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topAngariadores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`} />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

