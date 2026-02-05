import { AppHeader } from "@/components/AppHeader";
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ReportsPage() {
  const { user } = useAuth();
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

  // Buscar dados reais de vendas da empresa
  const { data: salesData } = trpc.sales.listMySales.useQuery();
  const sales = salesData?.sales || [];
  const { data: brokers = [] } = trpc.brokers.listBrokers.useQuery();

  // Calcular dados agregados por corretor
  const salesByBroker = brokers.map((broker: any) => {
    // Vendas onde o corretor é vendedor OU angariador
    const brokerSales = sales.filter((s: any) => 
      s.brokerVendedor === broker.id || s.brokerAngariador === broker.id
    );
    
    // Vendas onde o corretor é VENDEDOR
    const vendasComoVendedor = sales.filter((s: any) => s.brokerVendedor === broker.id);
    const totalVendas = vendasComoVendedor.reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);
    
    // Angariações onde o corretor é ANGARIADOR
    const angariaçõesComoAngariador = sales.filter((s: any) => s.brokerAngariador === broker.id);
    const totalAngariações = angariaçõesComoAngariador.reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);
    const qtdAngariações = angariaçõesComoAngariador.length;
    
    // Baixas (canceladas)
    const qtdBaixas = brokerSales.filter((s: any) => s.status === 'cancelled' || s.wasRemoved).length;
    const valorBaixas = brokerSales.filter((s: any) => s.status === 'cancelled' || s.wasRemoved).reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);
    
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

  // Totais gerais
  const totalVendas = salesByBroker.reduce((sum: number, b: any) => sum + b.vendas, 0);
  const totalAngariações = salesByBroker.reduce((sum: number, b: any) => sum + b.angariações, 0);
  const totalQtdAngariações = salesByBroker.reduce((sum: number, b: any) => sum + b.qtdAngariações, 0);
  const totalQtdBaixas = salesByBroker.reduce((sum: number, b: any) => sum + b.qtdBaixas, 0);

  // Determinar dados a exibir baseado no filtro
  const getChartData = () => {
    // Filtrar vendas primeiro
    let filteredSales = sales;
    
    // Filtro de Mês/Ano (prioridade sobre data customizada)
    if (selectedMonth !== "all" || selectedYear !== "all") {
      filteredSales = filteredSales.filter((s: any) => {
        if (!s.saleDate) return false;
        const saleDate = new Date(s.saleDate);
        const saleMonth = saleDate.getMonth() + 1; // 1-12
        const saleYear = saleDate.getFullYear();
        
        const monthMatch = selectedMonth === "all" || saleMonth === parseInt(selectedMonth);
        const yearMatch = selectedYear === "all" || saleYear === parseInt(selectedYear);
        
        return monthMatch && yearMatch;
      });
    } else {
      // Filtro de data customizada (apenas se mês/ano não estiver selecionado)
      if (startDate) {
        filteredSales = filteredSales.filter((s: any) => new Date(s.saleDate || s.createdAt) >= new Date(startDate));
      }
      if (endDate) {
        filteredSales = filteredSales.filter((s: any) => new Date(s.saleDate || s.createdAt) <= new Date(endDate));
      }
    }
    
    // Filtro de tipo de imóvel
    if (propertyType !== "all") {
      filteredSales = filteredSales.filter((s: any) => s.propertyType === propertyType);
    }
    
    // Filtro de região
    if (region !== "all") {
      filteredSales = filteredSales.filter((s: any) => s.region === region);
    }
    
    // Filtro de faixa de valor
    if (minValue) {
      filteredSales = filteredSales.filter((s: any) => Number(s.saleValue) >= Number(minValue));
    }
    if (maxValue) {
      filteredSales = filteredSales.filter((s: any) => Number(s.saleValue) <= Number(maxValue));
    }
    
    // Recalcular dados por corretor com vendas filtradas
    let data = brokers.map((broker: any) => {
      const brokerSales = filteredSales.filter((s: any) => 
        s.brokerVendedor === broker.id || s.brokerAngariador === broker.id
      );
      
      const vendasComoVendedor = filteredSales.filter((s: any) => s.brokerVendedor === broker.id);
      const totalVendas = vendasComoVendedor.reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);
      
      const angariaçõesComoAngariador = filteredSales.filter((s: any) => s.brokerAngariador === broker.id);
      const totalAngariações = angariaçõesComoAngariador.reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);
      const qtdAngariações = angariaçõesComoAngariador.length;
      
      const qtdBaixas = brokerSales.filter((s: any) => s.status === 'cancelled' || s.wasRemoved).length;
      const valorBaixas = brokerSales.filter((s: any) => s.status === 'cancelled' || s.wasRemoved).reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);
      
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
    
    if (selectedBroker !== "all") {
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
      // Tabela pivotada: retornar dados em formato especial
      return data.map((d: any) => ({ name: d.name, vendas: d.vendas, angariações: d.angariações }));
    } else if (reportType === "sales-by-region") {
      // Vendas por Região
      const regions = ["Campo Comprido", "Vila Izabel", "Ecoville", "Outros"];
      return regions.map((reg) => {
        const regionSales = filteredSales.filter((s: any) => s.region === reg);
        const quantidade = regionSales.length;
        const valor = regionSales.reduce((sum: number, s: any) => sum + (Number(s.saleValue) || 0), 0);
        return { name: reg, quantidade, valor };
      });
    } else if (reportType === "avg-sale-time") {
      // Tempo Médio de Venda (em dias, por mês)
      const salesByMonth: Record<string, { total: number; count: number }> = {};
      filteredSales.forEach((s: any) => {
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
      // Atingimento de Metas (meta vs realizado por corretor)
      // Assumindo meta fixa de R$ 1.000.000 por corretor (pode ser ajustado)
      const metaFixa = 1000000;
      return data.map((d: any) => {
        const realizado = d.vendas;
        const percentual = (realizado / metaFixa) * 100;
        return {
          name: d.name,
          meta: metaFixa,
          realizado,
          percentual: Math.round(percentual),
        };
      });
    } else if (reportType === "partnership-analysis") {
      // Análise de Parcerias (Baggio-Baggio, Baggio-Outros, Outros-Baggio)
      const partnerships: Record<string, { quantidade: number; valor: number }> = {
        "Baggio-Baggio": { quantidade: 0, valor: 0 },
        "Baggio-Outros": { quantidade: 0, valor: 0 },
        "Outros-Baggio": { quantidade: 0, valor: 0 },
        "Outros-Outros": { quantidade: 0, valor: 0 },
      };
      filteredSales.forEach((s: any) => {
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
    }
    return [];
  };

  const getChartTitle = () => {
    switch (reportType) {
      case "sales-engagement":
        return "Vendas + Angariações por Corretor";
      case "engagement-value":
        return "Valor de Angariações por Corretor";
      case "engagement-qty":
        return "Quantidade de Angariações por Corretor";
      case "cancellations-qty":
        return "Quantidade de Baixas por Corretor";
      case "cancellations-value":
        return "Valor de Baixas por Corretor";
      case "pivot-table":
        return "Tabela Pivotada (Valor x Corretor)";
      case "sales-by-region":
        return "Vendas por Região";
      case "avg-sale-time":
        return "Tempo Médio de Venda";
      case "goal-achievement":
        return "Atingimento de Metas";
      case "partnership-analysis":
        return "Análise de Parcerias";
      default:
        return "Relatório";
    }
  };

  const getChartDescription = () => {
    switch (reportType) {
      case "sales-engagement":
        return "Mostra o valor total de vendas e angariações por corretor";
      case "engagement-value":
        return "Mostra o valor total de angariações por corretor";
      case "engagement-qty":
        return "Mostra a quantidade de angariações realizadas por corretor";
      case "cancellations-qty":
        return "Mostra a quantidade de cancelamentos/baixas por corretor";
      case "cancellations-value":
        return "Mostra o valor total de cancelamentos/baixas por corretor";
      case "pivot-table":
        return "Mostra valores de vendas e angariações em formato de tabela pivotada";
      case "sales-by-region":
        return "Distribuição de vendas por região geográfica";
      case "avg-sale-time":
        return "Tempo médio entre angariação e venda por período";
      case "goal-achievement":
        return "Comparação entre meta e realizado por corretor";
      case "partnership-analysis":
        return "Análise de vendas por tipo de parceria (Baggio x Outros)";
      default:
        return "";
    }
  };

  const chartData = getChartData();
  const hasData = sales.length > 0;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-slate-50 pt-16">
        <div className="px-6 py-8 max-w-7xl mx-auto">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Relatórios e Gráficos</h1>
            <p className="text-slate-600 mt-2">
              Acompanhe o desempenho de vendas, angariações e indicadores com gráficos interativos
            </p>
          </div>

          {!hasData ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-16 text-center">
                <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum dado disponível</h3>
                <p className="text-slate-500">
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
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tipo de Relatório
                      </label>
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      </select>
                    </div>

                    {/* Corretor */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Corretor
                      </label>
                      <select
                        value={selectedBroker}
                        onChange={(e) => setSelectedBroker(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">Todos</option>
                        {brokers.map((broker: any) => (
                          <option key={broker.id} value={broker.id}>
                            {broker.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mês */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Mês
                      </label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                    {/* Ano */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Ano
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">Todos os anos</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                      </select>
                    </div>

                    {/* Botão Filtros Avançados */}
                    <div className="flex items-end">
                      <button 
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center justify-center gap-2 border border-slate-300"
                      >
                        {showAdvancedFilters ? "Ocultar" : "Mostrar"} Filtros Avançados
                      </button>
                    </div>
                  </div>
                  
                  {/* Filtros Avançados (Colisável) */}
                  {showAdvancedFilters && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4">Filtros Avançados</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Período */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Data Inicial</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Data Final</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        {/* Tipo de Imóvel */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Imóvel</label>
                          <select
                            value={propertyType}
                            onChange={(e) => setPropertyType(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="all">Todos</option>
                            <option value="casa">Casa</option>
                            <option value="apartamento">Apartamento</option>
                            <option value="terreno">Terreno</option>
                            <option value="comercial">Comercial</option>
                            <option value="rural">Rural</option>
                          </select>
                        </div>
                        
                        {/* Região */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Região/Cidade</label>
                          <input
                            type="text"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="Digite a região"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        {/* Faixa de Valor */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Valor Mínimo (R$)</label>
                          <input
                            type="number"
                            value={minValue}
                            onChange={(e) => setMinValue(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Valor Máximo (R$)</label>
                          <input
                            type="number"
                            value={maxValue}
                            onChange={(e) => setMaxValue(e.target.value)}
                            placeholder="Sem limite"
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      {/* Botão Limpar Filtros */}
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
                          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
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
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Total Vendas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-900">
                      {formatCurrency(totalVendas)}
                    </p>
                    <p className="text-xs text-slate-600 mt-2">Período selecionado</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Total Angariações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-900">
                      {formatCurrency(totalAngariações)}
                    </p>
                    <p className="text-xs text-slate-600 mt-2">Período selecionado</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Qtd Angariações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-900">{totalQtdAngariações}</p>
                    <p className="text-xs text-slate-600 mt-2">Período selecionado</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Qtd Baixas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-900">{totalQtdBaixas}</p>
                    <p className="text-xs text-slate-600 mt-2">Período selecionado</p>
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
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      {reportType === "sales-engagement" || reportType === "pivot-table" ? (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
                          <Bar dataKey="angariações" fill="#8b5cf6" name="Angariações" />
                        </BarChart>
                      ) : reportType === "engagement-value" || reportType === "cancellations-value" ? (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="valor" fill="#3b82f6" name="Valor" />
                        </BarChart>
                      ) : reportType === "sales-by-region" ? (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="quantidade" fill="#10b981" name="Quantidade" />
                          <Bar dataKey="valor" fill="#3b82f6" name="Valor" />
                        </BarChart>
                      ) : reportType === "avg-sale-time" ? (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => `${value} dias`} />
                          <Legend />
                          <Line type="monotone" dataKey="dias" stroke="#f59e0b" strokeWidth={2} name="Dias" />
                        </LineChart>
                      ) : reportType === "goal-achievement" ? (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="meta" fill="#94a3b8" name="Meta" />
                          <Bar dataKey="realizado" fill="#10b981" name="Realizado" />
                        </BarChart>
                      ) : reportType === "partnership-analysis" ? (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="quantidade" fill="#8b5cf6" name="Quantidade" />
                          <Bar dataKey="valor" fill="#3b82f6" name="Valor" />
                        </BarChart>
                      ) : (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="quantidade" fill="#3b82f6" name="Quantidade" />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      Nenhum dado para exibir
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
