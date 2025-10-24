import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import React from "react";

interface Indicator {
  name: string;
  meta: string;
  media: string;
  percentual: string;
  trend?: "up" | "down";
}

export default function Indicators() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<"team" | "broker">("team");

  // Scroll para topo ao entrar na página
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!user || !["manager", "finance", "broker"].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">Acesso restrito</p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canViewTeamData = ["manager", "finance"].includes(user.role);

  const indicators: Indicator[] = [
    { name: "Negócios no mês", meta: "R$ 15.000.000,00", media: "R$ 6.071.208,23", percentual: "40%", trend: "up" },
    { name: "Negócios no mês (unidades)", meta: "24", media: "R$ 12,13", percentual: "51%", trend: "up" },
    { name: "Vendas Canceladas", meta: "", media: "R$ 104.375,00", percentual: "#DIV/0!" },
    { name: "VSO - venda/oferta", meta: "5,00%", media: "#DIV/0!", percentual: "#DIV/0!" },
    { name: "Comissão Recebida", meta: "R$ 525.000,00", media: "R$ 238.250,81", percentual: "45%", trend: "up" },
    { name: "Comissão Vendida", meta: "R$ 600.000,00", media: "R$ 191.652,06", percentual: "32%", trend: "down" },
    { name: "Comissão Pendentes Final do mês", meta: "R$ 1.000.000,00", media: "R$ 613.863,85", percentual: "61%", trend: "up" },
    { name: "Carteira de Divulgação (em número)", meta: "410", media: "258", percentual: "63%", trend: "up" },
    { name: "Angariações mês", meta: "50", media: "32", percentual: "64%", trend: "up" },
    { name: "Baixas no mês (em quantidade)", meta: "17", media: "20", percentual: "120%", trend: "down" },
    { name: "% comissão vendida", meta: "4,00%", media: "3%", percentual: "65%", trend: "down" },
    { name: "Negócios acima de 1 milhão", meta: "5", media: "1", percentual: "23%", trend: "down" },
    { name: "Número de atendimentos Prontos", meta: "450", media: "271", percentual: "60%", trend: "up" },
    { name: "Número de atendimentos Lançamentos", meta: "400", media: "252", percentual: "63%", trend: "up" },
    { name: "Prazo médio recebimento de venda", meta: "60", media: "44", percentual: "73%", trend: "up" },
    { name: "% Com cancelada/ com pendente", meta: "5,00%", media: "#DIV/0!", percentual: "#DIV/0!" },
    { name: "Tempo médio de venda ang X venda", meta: "150", media: "99", percentual: "66%", trend: "up" },
    { name: "Valor médio do imóvel de venda", meta: "R$ 625.000,00", media: "R$ 307.518,50", percentual: "49%", trend: "down" },
    { name: "Negócios na Rede", meta: "5", media: "3", percentual: "53%", trend: "up" },
    { name: "Negócios Internos", meta: "12", media: "7", percentual: "55%", trend: "up" },
    { name: "Negócios Parceria Externa", meta: "12", media: "3", percentual: "24%", trend: "down" },
    { name: "Negócios Lançamentos", meta: "7", media: "-", percentual: "0%", trend: "down" },
    { name: "Despesa Geral", meta: "R$ 50.000,00", media: "R$ 46.796,51", percentual: "94%", trend: "up" },
    { name: "Despesa com impostos", meta: "R$ 20.000,00", media: "R$ 32.161,61", percentual: "161%", trend: "down" },
    { name: "Fundo Inovação", meta: "R$ 100.000,00", media: "R$ 42.112,94", percentual: "42%", trend: "down" },
    { name: "Resultado Sócios", meta: "R$ 60.000,00", media: "R$ 26.860,90", percentual: "45%", trend: "down" },
    { name: "Fundo emergencial", meta: "R$ 105.228,04", media: "#DIV/0!", percentual: "#DIV/0!" },
  ];

  const getTrendIcon = (trend?: string) => {
    if (!trend) return null;
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTrendColor = (trend?: string) => {
    if (!trend) return "text-slate-600";
    if (trend === "up") return "text-green-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold text-slate-900">Indicadores de Vendas</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Card - MOVED TO TOP */}
        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <CardTitle>Resumo de Performance</CardTitle>
            <CardDescription>
              {user.role === "broker"
                ? "Seus dados e comparação com a média da equipe"
                : "Dados da equipe e análise de performance"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-1">Indicadores Positivos</p>
                <p className="text-2xl font-bold text-green-600">14</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium mb-1">Indicadores Negativos</p>
                <p className="text-2xl font-bold text-red-600">8</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700 font-medium mb-1">Indicadores Indefinidos</p>
                <p className="text-2xl font-bold text-slate-600">5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Section */}
        {canViewTeamData && (
          <Card className="border-0 shadow-md mb-8">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Visualizar por
                  </label>
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team">Equipe</SelectItem>
                      <SelectItem value="broker">Corretor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {indicators.map((indicator, idx) => (
            <Card key={idx} className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-700">
                  {indicator.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Meta Mensal</p>
                    <p className="text-sm font-semibold text-slate-900">{indicator.meta || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Média Anual</p>
                    <p className="text-sm font-semibold text-slate-900">{indicator.media}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">Percentual</p>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(indicator.trend)}
                      <p className={`text-sm font-semibold ${getTrendColor(indicator.trend)}`}>
                        {indicator.percentual}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

