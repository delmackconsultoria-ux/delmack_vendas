import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Reports() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<"team" | "broker">("team");

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
  const canViewBrokerData = ["manager", "finance"].includes(user.role);

  // Mock data - será substituído por dados reais da API
  const brokerData = [
    { name: "João Silva", angariações: "R$ 2.500.000", vendas: "R$ 1.800.000", total: "R$ 4.300.000" },
    { name: "Maria Santos", angariações: "R$ 1.900.000", vendas: "R$ 2.100.000", total: "R$ 4.000.000" },
    { name: "Pedro Costa", angariações: "R$ 2.100.000", vendas: "R$ 1.600.000", total: "R$ 3.700.000" },
    { name: "Ana Oliveira", angariações: "R$ 1.800.000", vendas: "R$ 2.200.000", total: "R$ 4.000.000" },
  ];

  const brokerAngariações = [
    { name: "João Silva", angariações: "R$ 2.500.000" },
    { name: "Maria Santos", angariações: "R$ 1.900.000" },
    { name: "Pedro Costa", angariações: "R$ 2.100.000" },
    { name: "Ana Oliveira", angariações: "R$ 1.800.000" },
  ];

  const brokerAngariationsCount = [
    { name: "João Silva", quantidade: 25 },
    { name: "Maria Santos", quantidade: 19 },
    { name: "Pedro Costa", quantidade: 21 },
    { name: "Ana Oliveira", quantidade: 18 },
  ];

  const brokerBaixas = [
    { name: "João Silva", quantidade: 3 },
    { name: "Maria Santos", quantidade: 5 },
    { name: "Pedro Costa", quantidade: 2 },
    { name: "Ana Oliveira", quantidade: 4 },
  ];

  const brokerBaixasValue = [
    { name: "João Silva", valor: "R$ 450.000" },
    { name: "Maria Santos", valor: "R$ 750.000" },
    { name: "Pedro Costa", valor: "R$ 320.000" },
    { name: "Ana Oliveira", valor: "R$ 600.000" },
  ];

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
            <h1 className="text-xl font-bold text-slate-900">Relatórios</h1>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Section */}
        {(canViewTeamData || canViewBrokerData) && (
          <Card className="border-0 shadow-md mb-8">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {canViewTeamData && (
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
                )}
                {user.role === "broker" && (
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700 block mb-2">
                      Período
                    </label>
                    <Select defaultValue="month">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Esta Semana</SelectItem>
                        <SelectItem value="month">Este Mês</SelectItem>
                        <SelectItem value="quarter">Este Trimestre</SelectItem>
                        <SelectItem value="year">Este Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports Tabs */}
        <Tabs defaultValue="table1" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
            <TabsTrigger value="table1" className="text-xs sm:text-sm">
              Vendas + Angariações
            </TabsTrigger>
            <TabsTrigger value="table2" className="text-xs sm:text-sm">
              Angariações
            </TabsTrigger>
            <TabsTrigger value="table3" className="text-xs sm:text-sm">
              Qtd Angariações
            </TabsTrigger>
            <TabsTrigger value="table4" className="text-xs sm:text-sm">
              Qtd Baixas
            </TabsTrigger>
            <TabsTrigger value="table5" className="text-xs sm:text-sm">
              Valor Baixas
            </TabsTrigger>
          </TabsList>

          {/* Table 1: Vendas + Angariações */}
          <TabsContent value="table1">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Valor por Corretor - Vendas e Angariações</CardTitle>
                <CardDescription>
                  Mostra o valor total de vendas e angariações por corretor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Corretor</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900">Angariações</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900">Vendas</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brokerData.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-900 font-medium">{row.name}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{row.angariações}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{row.vendas}</td>
                          <td className="py-3 px-4 text-right text-slate-900 font-semibold">{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Table 2: Angariações */}
          <TabsContent value="table2">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Valor por Corretor - Angariações</CardTitle>
                <CardDescription>
                  Mostra apenas o valor de angariações por corretor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Corretor</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900">Angariações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brokerAngariações.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-900 font-medium">{row.name}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{row.angariações}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Table 3: Quantidade de Angariações */}
          <TabsContent value="table3">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Quantidade de Angariações por Corretor</CardTitle>
                <CardDescription>
                  Mostra a quantidade de angariações por corretor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Corretor</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brokerAngariationsCount.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-900 font-medium">{row.name}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{row.quantidade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Table 4: Quantidade de Baixas */}
          <TabsContent value="table4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Quantidade de Baixas por Corretor</CardTitle>
                <CardDescription>
                  Mostra a quantidade de baixas/cancelamentos por corretor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Corretor</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brokerBaixas.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-900 font-medium">{row.name}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{row.quantidade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Table 5: Valor de Baixas */}
          <TabsContent value="table5">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Valor de Baixas por Corretor</CardTitle>
                <CardDescription>
                  Mostra o valor total de baixas/cancelamentos por corretor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Corretor</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brokerBaixasValue.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-900 font-medium">{row.name}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{row.valor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

