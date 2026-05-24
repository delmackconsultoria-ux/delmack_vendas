import { AppHeader } from "@/components/AppHeader";
import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Download, AlertCircle } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const REGION_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

// Helper: abrevia nomes longos (ex: "Sandra Maria Alves de Lima P.")
const abbreviateName = (name: string) => {
  if (!name) return name;
  const parts = name.split(" ");
  if (parts.length <= 2) return name;
  return parts.map((w, i) => (i === 0 ? w : w[0] + ".")).join(" ");
};

// Props comuns para XAxis com nomes de corretores
const brokerXAxisProps = {
  angle: -35 as const,
  textAnchor: "end" as const,
  interval: 0,
  tick: { fontSize: 11 },
};

export default function ReportsPage() {
  const { user } = useAuth();
  const isBroker = user?.role === "broker";

  const [reportType, setReportType] = useState("sales-engagement");
  const [selectedBroker, setSelectedBroker] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [region, setRegion] = useState("all");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  // Filtros de Mês/Ano
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  // Buscar anos com dados históricos disponíveis
  const { data: availableYearsData } = trpc.indicators.listAvailableYears.useQuery();
  const availableHistoricalYears = availableYearsData?.years || [];

  // Verificar se ano selecionado tem dados históricos
  const selectedYearNum = selectedYear !== "all" ? parseInt(selectedYear) : null;
  const hasHistoricalData = selectedYearNum && availableHistoricalYears.includes(selectedYearNum);

  // Buscar dados históricos se disponíveis
  const { data: historicalData } = trpc.indicators.getYearData.useQuery(
    { year: selectedYearNum! },
    { enabled: !!hasHistoricalData }
  );

  // Buscar dados reais de vendas da empresa (apenas se não usar histórico)
  const { data: salesData, isLoading: salesLoading } = trpc.sales.listMySales.useQuery(undefined, {
    enabled: !hasHistoricalData,
  });
  const sales = salesData?.sales || [];
  const { data: brokers = [] } = trpc.brokers.list.useQuery();

  // Se for corretor, forçar selectedBroker para o próprio ID e não permitir alterar
  useEffect(() => {
    if (isBroker && user?.id) {
      setSelectedBroker(user.id);
    }
  }, [isBroker, user?.id]);

  // Calcular dados agregados por corretor
  const salesByBroker = brokers.map((broker: any) => {
    const brokerSalesCancelled = sales.filter(
      (s: any) => (s.brokerVendedor === broker.id || s.brokerAngariador === broker.id)
        && (s.status === "cancelled" || s.wasRemoved)
    );

    const vendasComoVendedor = sales.filter(
      (s: any) => s.brokerVendedor === broker.id && s.status !== "draft" && s.status !== "cancelled"
    );
    const totalVendas = vendasComoVendedor.reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);

    const angariaçõesComoAngariador = sales.filter(
      (s: any) => s.brokerAngariador === broker.id && s.status !== "draft" && s.status !== "cancelled"
    );
    const totalAngariações = angariaçõesComoAngariador.reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);
    const qtdAngariações = angariaçõesComoAngariador.length;

    const qtdBaixas = brokerSalesCancelled.length;
    const valorBaixas = brokerSalesCancelled
      .reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);

    return {
      id: broker.id,
      name: broker.name,
      vendas: totalVendas,
      angariações: totalAngariações,
      qtdAngariações,
      qtdBaixas,
      valorBaixas,
    };
  });

  // Totais gerais (filtrados pelo perfil)
  const filteredSalesByBroker = isBroker
    ? salesByBroker.filter((b: any) => b.id === user?.id)
    : salesByBroker;

  const totalVendas = filteredSalesByBroker.reduce((sum: number, b: any) => sum + b.vendas, 0);
  const totalAngariações = filteredSalesByBroker.reduce((sum: number, b: any) => sum + b.angariações, 0);
  const totalQtdAngariações = filteredSalesByBroker.reduce((sum: number, b: any) => sum + b.qtdAngariações, 0);
  const totalQtdBaixas = filteredSalesByBroker.reduce((sum: number, b: any) => sum + b.qtdBaixas, 0);

  // Determinar dados a exibir baseado no filtro
  const getChartData = () => {
    let filteredSales = sales;

    // Se for corretor, filtrar apenas as próprias vendas
    if (isBroker && user?.id) {
      filteredSales = filteredSales.filter(
        (s: any) => s.brokerVendedor === user.id || s.brokerAngariador === user.id
      );
    }

    // Filtro de Mês/Ano
    if (selectedMonth !== "all" || selectedYear !== "all") {
      filteredSales = filteredSales.filter((s: any) => {
        if (!s.saleDate) return false;
        const saleDate = new Date(s.saleDate);
        const saleMonth = saleDate.getMonth() + 1;
        const saleYear = saleDate.getFullYear();
        const monthMatch = selectedMonth === "all" || saleMonth === parseInt(selectedMonth);
        const yearMatch = selectedYear === "all" || saleYear === parseInt(selectedYear);
        return monthMatch && yearMatch;
      });
    } else {
      if (startDate) {
        filteredSales = filteredSales.filter((s: any) => new Date(s.saleDate || s.createdAt) >= new Date(startDate));
      }
      if (endDate) {
        filteredSales = filteredSales.filter((s: any) => new Date(s.saleDate || s.createdAt) <= new Date(endDate));
      }
    }

    if (propertyType !== "all") {
      filteredSales = filteredSales.filter((s: any) => s.propertyType === propertyType);
    }
    if (region !== "all") {
      filteredSales = filteredSales.filter((s: any) => s.region === region);
    }
    if (minValue) {
      filteredSales = filteredSales.filter((s: any) => Number(s.saleValue) >= Number(minValue));
    }
    if (maxValue) {
      filteredSales = filteredSales.filter((s: any) => Number(s.saleValue) <= Number(maxValue));
    }

    // Recalcular dados por corretor com vendas filtradas (excluindo rascunhos em todos os cálculos)
    let data = brokers.map((broker: any) => {
      // Baixas: canceladas ou removidas (não são rascunhos)
      const brokerSalesCancelled = filteredSales.filter(
        (s: any) => (s.brokerVendedor === broker.id || s.brokerAngariador === broker.id)
          && (s.status === "cancelled" || s.wasRemoved)
      );

      // Vendas: apenas status diferente de draft e cancelled
      const vendasComoVendedor = filteredSales.filter(
        (s: any) => s.brokerVendedor === broker.id
          && s.status !== "draft"
          && s.status !== "cancelled"
      );
      const totalVendas = vendasComoVendedor.reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);

      // Angariações: apenas status diferente de draft e cancelled
      const angariaçõesComoAngariador = filteredSales.filter(
        (s: any) => s.brokerAngariador === broker.id
          && s.status !== "draft"
          && s.status !== "cancelled"
      );
      const totalAngariações = angariaçõesComoAngariador.reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);
      const qtdAngariações = angariaçõesComoAngariador.length;

      const qtdBaixas = brokerSalesCancelled.length;
      const valorBaixas = brokerSalesCancelled
        .reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);

      return {
        id: broker.id,
        name: broker.name,
        vendas: totalVendas,
        angariações: totalAngariações,
        qtdAngariações,
        qtdBaixas,
        valorBaixas,
      };
    });

    // Filtro por corretor (manager/finance podem escolher; broker é forçado)
    if (isBroker && user?.id) {
      data = data.filter((b: any) => b.id === user.id);
    } else if (selectedBroker !== "all") {
      data = data.filter((b: any) => b.id === selectedBroker);
    }

    if (reportType === "sales-engagement") {
      return data.map((d: any) => ({ name: d.name, vendas: d.vendas, angariações: d.angariações }));
    } else if (reportType === "engagement-value") {
      return data.map((d: any) => ({ name: d.name, valor: d.angariações }));
    } else if (reportType === "engagement-qty") {
      return data.map((d: any) => ({ name: d.name, quantidade: d.qtdAngariações }));
    } else if (reportType === "cancellations-qty") {
      return data.map((d: any) => ({ name: d.name, quantidade: d.qtdBaixas }));
    } else if (reportType === "cancellations-value") {
      return data.map((d: any) => ({ name: d.name, valor: d.valorBaixas }));
    } else if (reportType === "pivot-table") {
      return data.map((d: any) => ({ name: d.name, vendas: d.vendas, angariações: d.angariações }));
    } else if (reportType === "sales-by-region") {
      // Usar campo 'region' se preenchido, caso contrário usar 'listingStore' como proxy
      const validSales = filteredSales.filter((s: any) => s.status !== "draft" && s.status !== "cancelled");
      const hasRegionData = validSales.some((s: any) => s.region && s.region.trim() !== "");
      
      if (hasRegionData) {
        // Usar campo region
        const regions = ["Campo Comprido", "Vila Izabel", "Ecoville", "Outros"];
        return regions.map((reg) => {
          const regionSales = validSales.filter((s: any) => s.region === reg);
          const quantidade = regionSales.length;
          const valor = regionSales.reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);
          return { name: reg, quantidade, valor };
        }).filter((r) => r.quantidade > 0);
      } else {
        // Fallback: usar listingStore como proxy de região
        const storeMap: Record<string, { quantidade: number; valor: number }> = {};
        validSales.forEach((s: any) => {
          const store = s.listingStore || s.sellingStore || "Outros";
          if (!storeMap[store]) storeMap[store] = { quantidade: 0, valor: 0 };
          storeMap[store].quantidade += 1;
          storeMap[store].valor += Number(s.saleValue) || 0;
        });
        return Object.entries(storeMap)
          .map(([name, data]) => ({ name, ...data }))
          .filter((r) => r.quantidade > 0)
          .sort((a, b) => b.quantidade - a.quantidade);
      }
    } else if (reportType === "avg-sale-time") {
      const salesByMonth: Record<string, { total: number; count: number }> = {};
      filteredSales.filter((s: any) => s.status !== "draft" && s.status !== "cancelled").forEach((s: any) => {
        if (s.listingDate && s.saleDate) {
          const listing = new Date(s.listingDate);
          const sale = new Date(s.saleDate);
          const days = Math.ceil((sale.getTime() - listing.getTime()) / (1000 * 60 * 60 * 24));
          const month = sale.toLocaleDateString("pt-BR", { year: "numeric", month: "short" });
          if (!salesByMonth[month]) salesByMonth[month] = { total: 0, count: 0 };
          salesByMonth[month].total += days;
          salesByMonth[month].count += 1;
        }
      });
      return Object.entries(salesByMonth).map(([month, data]) => ({
        name: month,
        dias: Math.round(data.total / data.count),
      }));
    } else if (reportType === "goal-achievement") {
      const metaFixa = 1000000;
      return data.map((d: any) => {
        const realizado = d.vendas;
        const percentual = (realizado / metaFixa) * 100;
        return { name: d.name, meta: metaFixa, realizado, percentual: Math.round(percentual) };
      });
    } else if (reportType === "partnership-analysis") {
      const partnerships: Record<string, { quantidade: number; valor: number }> = {
        "Baggio-Baggio": { quantidade: 0, valor: 0 },
        "Baggio-Outros": { quantidade: 0, valor: 0 },
        "Outros-Baggio": { quantidade: 0, valor: 0 },
        "Outros-Outros": { quantidade: 0, valor: 0 },
      };
      filteredSales.filter((s: any) => s.status !== "draft" && s.status !== "cancelled").forEach((s: any) => {
        const listing = s.listingStore || "Outros";
        const selling = s.sellingStore || "Outros";
        const key = `${listing}-${selling}`;
        if (partnerships[key]) {
          partnerships[key].quantidade += 1;
          partnerships[key].valor += Number(s.saleValue) || 0;
        }
      });
      return Object.entries(partnerships).map(([name, data]) => ({
        name,
        quantidade: data.quantidade,
        valor: data.valor,
      }));
    } else if (reportType === "sinal-negocio") {
      const tipos: Record<string, { quantidade: number; valor: number; pago: number; pendente: number }> = {
        "Sem sinal de negócio": { quantidade: 0, valor: 0, pago: 0, pendente: 0 },
        "Baggio": { quantidade: 0, valor: 0, pago: 0, pendente: 0 },
        "Outra": { quantidade: 0, valor: 0, pago: 0, pendente: 0 },
        "Imobiliária Parceira": { quantidade: 0, valor: 0, pago: 0, pendente: 0 },
        "Nota Promissória": { quantidade: 0, valor: 0, pago: 0, pendente: 0 },
      };
      filteredSales.filter((s: any) => s.status !== "draft" && s.status !== "cancelled").forEach((s: any) => {
        const tipo = s.sinalNegocio || "Sem sinal de negócio";
        if (!tipos[tipo]) return;
        const val = Number(s.sinalNegocioValor) || 0;
        tipos[tipo].quantidade += 1;
        tipos[tipo].valor += val;
        if (s.status === "commission_paid") {
          tipos[tipo].pago += val;
        } else {
          tipos[tipo].pendente += val;
        }
      });
      return Object.entries(tipos).map(([name, data]) => ({
        name,
        quantidade: data.quantidade,
        valor: data.valor,
        pago: data.pago,
        pendente: data.pendente,
      }));
    }
    return [];
  };

  const getChartTitle = () => {
    switch (reportType) {
      case "sales-engagement": return "Vendas + Angariações por Corretor";
      case "engagement-value": return "Valor de Angariações por Corretor";
      case "engagement-qty": return "Quantidade de Angariações por Corretor";
      case "cancellations-qty": return "Quantidade de Baixas por Corretor";
      case "cancellations-value": return "Valor de Baixas por Corretor";
      case "pivot-table": return "Tabela Pivotada (Valor x Corretor)";
      case "sales-by-region": return "Vendas por Região";
      case "avg-sale-time": return "Tempo Médio de Venda";
      case "goal-achievement": return "Atingimento de Metas";
      case "partnership-analysis": return "Análise de Parcerias";
      case "sinal-negocio": return "Sinal de Negócio por Tipo";
      default: return "Relatório";
    }
  };

  const getChartDescription = () => {
    switch (reportType) {
      case "sales-engagement": return "Mostra o valor total de vendas e angariações por corretor";
      case "engagement-value": return "Mostra o valor total de angariações por corretor";
      case "engagement-qty": return "Mostra a quantidade de angariações realizadas por corretor";
      case "cancellations-qty": return "Mostra a quantidade de cancelamentos/baixas por corretor";
      case "cancellations-value": return "Mostra o valor total de cancelamentos/baixas por corretor";
      case "pivot-table": return "Mostra valores de vendas e angariações em formato de tabela pivotada";
      case "sales-by-region": return "Distribuição de vendas por região geográfica";
      case "avg-sale-time": return "Tempo médio entre angariação e venda por período";
      case "goal-achievement": return "Comparação entre meta e realizado por corretor";
      case "partnership-analysis": return "Análise de vendas por tipo de parceria (Baggio x Outros)";
      case "sinal-negocio": return "Distribuição de vendas por tipo de sinal de negócio";
      default: return "";
    }
  };

  const chartData = getChartData();
  const hasData = sales.length > 0;

  // Comparativo mensal de Sinal de Negócio
  const sinalNegocioMensalData = React.useMemo(() => {
    if (reportType !== "sinal-negocio") return [];
    const TIPOS = ["Sem sinal de negócio", "Baggio", "Outra", "Imobiliária Parceira", "Nota Promissória"];
    const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const yearFilter = selectedYear !== "all" ? parseInt(selectedYear) : null;
    let baseSales = sales.filter((s: any) => s.status !== "draft" && s.status !== "cancelled");
    if (isBroker && user?.id) baseSales = baseSales.filter((s: any) => s.brokerVendedor === user.id || s.brokerAngariador === user.id);
    if (yearFilter) baseSales = baseSales.filter((s: any) => s.saleDate && new Date(s.saleDate).getFullYear() === yearFilter);
    return MESES.map((mes, idx) => {
      const monthSales = baseSales.filter((s: any) => s.saleDate && new Date(s.saleDate).getMonth() === idx);
      const entry: any = { mes };
      TIPOS.forEach(tipo => {
        const key = tipo === "Sem sinal de negócio" ? "Sem sinal" : tipo;
        entry[key] = monthSales.filter((s: any) => (s.sinalNegocio || "Sem sinal de negócio") === tipo).reduce((sum: number, s: any) => sum + (Number(s.sinalNegocioValor) || 0), 0);
      });
      return entry;
    });
  }, [reportType, sales, selectedYear, isBroker, user?.id]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  // Gráficos que têm nomes de corretores no eixo X
  const isBrokerChart = [
    "sales-engagement", "pivot-table", "engagement-value", "engagement-qty",
    "cancellations-qty", "cancellations-value", "goal-achievement",
  ].includes(reportType);

  // Dados com nomes abreviados para gráficos de corretores
  const chartDataAbbrev = isBrokerChart
    ? chartData.map((d: any) => ({ ...d, name: abbreviateName(d.name) }))
    : chartData;

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-background">
        <div className="px-6 py-6 max-w-7xl mx-auto">
          {/* Title Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios e Gráficos</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Acompanhe o desempenho de vendas, angariações e indicadores com gráficos interativos
            </p>
          </div>

          {/* Alerta para anos com dados históricos */}
          {hasHistoricalData && (
            <Card className="border-l-4 border-l-blue-500 bg-blue-50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Dados Históricos de {selectedYear}
                    </h3>
                    <p className="text-sm text-blue-800">
                      Os dados consolidados de {selectedYear} estão disponíveis na página{" "}
                      <a href="/indicadores" className="underline font-medium">Indicadores</a>.
                      Esta página mostra apenas vendas registradas diretamente no sistema.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {salesLoading ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-16 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Carregando dados...</h3>
              </CardContent>
            </Card>
          ) : !hasData ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-16 text-center">
                <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum dado disponível</h3>
                <p className="text-muted-foreground">
                  Ainda não há propostas cadastradas para sua empresa.
                  <br />
                  Os relatórios serão exibidos quando houver dados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filters */}
              <Card className="border-0 shadow-md mb-8 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tipo de Relatório */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Tipo de Relatório</label>
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="sales-engagement">Vendas + Angariações</option>
                        <option value="engagement-value">Valor Angariações</option>
                        <option value="engagement-qty">Qtd Angariações</option>
                        <option value="cancellations-qty">Qtd Baixas</option>
                        <option value="cancellations-value">Valor Baixas</option>
                        <option value="pivot-table">Tabela Pivotada</option>
                        <option value="sales-by-region">Vendas por Região</option>
                        <option value="avg-sale-time">Tempo Médio de Venda</option>
                        <option value="goal-achievement">Atingimento de Metas</option>
                        <option value="partnership-analysis">Análise de Parcerias</option>
                        <option value="sinal-negocio">Sinal de Negócio por Tipo</option>
                      </select>
                    </div>

                    {/* Corretor — apenas para manager/finance */}
                    {!isBroker && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Corretor</label>
                        <select
                          value={selectedBroker}
                          onChange={(e) => setSelectedBroker(e.target.value)}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">Todos</option>
                          {brokers.map((broker: any) => (
                            <option key={broker.id} value={broker.id}>
                              {broker.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Botão Filtros Avançados */}
                    <div className="flex items-end">
                      <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="w-full px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted flex items-center justify-center gap-2 border border-border"
                      >
                        {showAdvancedFilters ? "Ocultar" : "Mostrar"} Filtros Avançados
                      </button>
                    </div>
                  </div>

                  {/* Filtros Avançados */}
                  {showAdvancedFilters && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-4">Filtros Avançados</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Mês</label>
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="all">Todos os meses</option>
                            <option value="1">Janeiro</option>
                            <option value="2">Fevereiro</option>
                            <option value="3">Março</option>
                            <option value="4">Abril</option>
                            <option value="5">Maio</option>
                            <option value="6">Junho</option>
                            <option value="7">Julho</option>
                            <option value="8">Agosto</option>
                            <option value="9">Setembro</option>
                            <option value="10">Outubro</option>
                            <option value="11">Novembro</option>
                            <option value="12">Dezembro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Ano</label>
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="all">Todos os anos</option>
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Data Inicial</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Data Final</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de Imóvel</label>
                          <select
                            value={propertyType}
                            onChange={(e) => setPropertyType(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="all">Todos</option>
                            <option value="casa">Casa</option>
                            <option value="apartamento">Apartamento</option>
                            <option value="terreno">Terreno</option>
                            <option value="comercial">Comercial</option>
                            <option value="rural">Rural</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Região/Cidade</label>
                          <input
                            type="text"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="Digite a região"
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Valor Mínimo (R$)</label>
                          <input
                            type="number"
                            value={minValue}
                            onChange={(e) => setMinValue(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Valor Máximo (R$)</label>
                          <input
                            type="number"
                            value={maxValue}
                            onChange={(e) => setMaxValue(e.target.value)}
                            placeholder="Sem limite"
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedMonth("all");
                            setSelectedYear("all");
                            setStartDate("");
                            setEndDate("");
                            setPropertyType("all");
                            setRegion("all");
                            setMinValue("");
                            setMaxValue("");
                          }}
                          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          Limpar Filtros Avançados
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(totalVendas)}</p>
                    <p className="text-xs text-muted-foreground mt-2">Período selecionado</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Angariações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(totalAngariações)}</p>
                    <p className="text-xs text-muted-foreground mt-2">Período selecionado</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Qtd Angariações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">{totalQtdAngariações}</p>
                    <p className="text-xs text-muted-foreground mt-2">Período selecionado</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Qtd Baixas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">{totalQtdBaixas}</p>
                    <p className="text-xs text-muted-foreground mt-2">Período selecionado</p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Chart */}
              <Card className="border-0 shadow-md mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {getChartTitle()}
                  </CardTitle>
                  <CardDescription>{getChartDescription()}</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartDataAbbrev.length > 0 ? (
                    <ResponsiveContainer width="100%" height={420}>
                      {reportType === "sales-engagement" || reportType === "pivot-table" ? (
                        <BarChart data={chartDataAbbrev} margin={{ bottom: 70 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" {...brokerXAxisProps} />
                          <YAxis tickFormatter={(v: any) => formatCurrency(v)} width={75} />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Legend verticalAlign="top" />
                          <Bar dataKey="vendas" fill="#0b0bb5" name="Vendas" />
                          <Bar dataKey="angariações" fill="#2563eb" name="Angariações" />
                        </BarChart>
                      ) : reportType === "engagement-value" || reportType === "cancellations-value" ? (
                        <BarChart data={chartDataAbbrev} margin={{ bottom: 70 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" {...brokerXAxisProps} />
                          <YAxis tickFormatter={(v: any) => formatCurrency(v)} width={75} />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Legend verticalAlign="top" />
                          <Bar dataKey="valor" fill="#0b0bb5" name="Valor" />
                        </BarChart>
                      ) : reportType === "engagement-qty" || reportType === "cancellations-qty" ? (
                        <BarChart data={chartDataAbbrev} margin={{ bottom: 70 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" {...brokerXAxisProps} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend verticalAlign="top" />
                          <Bar dataKey="quantidade" fill="#0b0bb5" name="Quantidade" />
                        </BarChart>
                      ) : reportType === "sales-by-region" ? (
                        <PieChart>
                          <Pie
                            data={chartDataAbbrev}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={110}
                            dataKey="quantidade"
                          >
                            {chartDataAbbrev.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={REGION_COLORS[index % REGION_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any, name: string) => [value, 'Vendas']} />
                          <Legend />
                        </PieChart>
                      ) : reportType === "avg-sale-time" ? (
                        <LineChart data={chartDataAbbrev} margin={{ bottom: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip formatter={(value: any) => `${value} dias`} />
                          <Legend verticalAlign="top" />
                          <Line type="monotone" dataKey="dias" stroke="#f59e0b" strokeWidth={2} name="Dias" />
                        </LineChart>
                      ) : reportType === "goal-achievement" ? (
                        <BarChart data={chartDataAbbrev} margin={{ bottom: 70 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" {...brokerXAxisProps} />
                          <YAxis tickFormatter={(v: any) => formatCurrency(v)} width={75} />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Legend verticalAlign="top" />
                          <Bar dataKey="meta" fill="#94a3b8" name="Meta" />
                          <Bar dataKey="realizado" fill="#3b82f6" name="Realizado" />
                        </BarChart>
                      ) : reportType === "partnership-analysis" ? (
                        <BarChart data={chartDataAbbrev} margin={{ bottom: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tickFormatter={(v: any) => formatCurrency(v)} width={75} />
                          <Tooltip formatter={(value: any, name: string) => name === "valor" ? formatCurrency(value) : value} />
                          <Legend verticalAlign="top" />
                          <Bar dataKey="quantidade" fill="#2563eb" name="Quantidade" />
                          <Bar dataKey="valor" fill="#0b0bb5" name="Valor" />
                        </BarChart>
                      ) : reportType === "sinal-negocio" ? (
                        <BarChart data={chartData} margin={{ bottom: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(v: any) => formatCurrency(v)} width={80} />
                          <Tooltip formatter={(value: any, name: string) => ["valor","pago","pendente"].includes(name) ? formatCurrency(value) : value} />
                          <Legend verticalAlign="top" />
                          <Bar dataKey="quantidade" fill="#2563eb" name="Quantidade" />
                          <Bar dataKey="pago" fill="#16a34a" name="Pago" />
                          <Bar dataKey="pendente" fill="#f59e0b" name="Pendente" />
                        </BarChart>
                      ) : (
                        <BarChart data={chartDataAbbrev} margin={{ bottom: 70 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" {...brokerXAxisProps} />
                          <YAxis />
                          <Tooltip />
                          <Legend verticalAlign="top" />
                          <Bar dataKey="quantidade" fill="#0b0bb5" name="Quantidade" />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      Nenhum dado para exibir
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Segundo gráfico: Sinal de Negócio Comparativo Mensal */}
          {reportType === "sinal-negocio" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Sinal de Negócio Comparativo Mensal</CardTitle>
                <CardDescription>Valor do sinal por tipo, mês a mês</CardDescription>
              </CardHeader>
              <CardContent>
                {sinalNegocioMensalData.some((d: any) => Object.keys(d).filter(k => k !== "mes").some(k => d[k] > 0)) ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={sinalNegocioMensalData} margin={{ bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v: any) => formatCurrency(v)} width={80} />
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      <Legend verticalAlign="top" />
                      <Bar dataKey="Sem sinal" stackId="a" fill="#94a3b8" name="Sem sinal" />
                      <Bar dataKey="Baggio" stackId="a" fill="#2563eb" name="Baggio" />
                      <Bar dataKey="Outra" stackId="a" fill="#f59e0b" name="Outra" />
                      <Bar dataKey="Imobiliária Parceira" stackId="a" fill="#10b981" name="Imobiliária Parceira" />
                      <Bar dataKey="Nota Promissória" stackId="a" fill="#8b5cf6" name="Nota Promissória" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Nenhum dado para exibir
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
