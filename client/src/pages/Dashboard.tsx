import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, FileText, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";
import { useMemo } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch data from dashboard router
  const { data: salesAndAngariations, isLoading: loadingSalesAndAngariations } =
    trpc.dashboard.getSalesAndAngariationsByBroker.useQuery();
  const { data: angariationValues, isLoading: loadingAngariationValues } =
    trpc.dashboard.getAngariationValueByBroker.useQuery();
  const { data: angariationQuantities, isLoading: loadingAngariationQuantities } =
    trpc.dashboard.getAngariationQuantityByBroker.useQuery();
  const { data: cancelledQuantities, isLoading: loadingCancelledQuantities } =
    trpc.dashboard.getCancelledSalesQuantityByBroker.useQuery();
  const { data: cancelledValues, isLoading: loadingCancelledValues } =
    trpc.dashboard.getCancelledSalesValueByBroker.useQuery();

  const isLoading =
    loadingSalesAndAngariations ||
    loadingAngariationValues ||
    loadingAngariationQuantities ||
    loadingCancelledQuantities ||
    loadingCancelledValues;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Bem-vindo ao Dashboard</h2>
          <p className="text-slate-600 mt-2">
            Visualize seus dados operacionais e de comissões em tempo real
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
            <p className="ml-2 text-slate-600">Carregando dados...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Table 1: Sales and Angariations by Broker */}
            <Card className="border-0 shadow-sm mb-8">
              <CardHeader>
                <CardTitle>Tabela 1: Valor por Corretor (Angariações + Vendas)</CardTitle>
                <CardDescription>
                  Mostrando valor total de angariações e vendas por corretor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Corretor
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">
                          Valor Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesAndAngariations && salesAndAngariations.length > 0 ? (
                        salesAndAngariations.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-900">{row.brokerName || "N/A"}</td>
                            <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                              R$ {Number(row.salesValue).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-4 px-4 text-center text-slate-600">
                            Sem dados disponíveis
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Table 2: Angariations Value by Broker */}
            <Card className="border-0 shadow-sm mb-8">
              <CardHeader>
                <CardTitle>Tabela 2: Valor por Corretor (Angariações)</CardTitle>
                <CardDescription>Mostrando apenas valor de angariações por corretor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Corretor
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">
                          Valor de Angariações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {angariationValues && angariationValues.length > 0 ? (
                        angariationValues.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-900">{row.brokerName || "N/A"}</td>
                            <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                              R$ {Number(row.angariationValue).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-4 px-4 text-center text-slate-600">
                            Sem dados disponíveis
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Table 3: Angariations Quantity by Broker */}
            <Card className="border-0 shadow-sm mb-8">
              <CardHeader>
                <CardTitle>Tabela 3: Quantidade de Angariações por Corretor</CardTitle>
                <CardDescription>Mostrando quantidade de angariações por corretor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Corretor
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">
                          Quantidade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {angariationQuantities && angariationQuantities.length > 0 ? (
                        angariationQuantities.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-900">{row.brokerName || "N/A"}</td>
                            <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                              {Number(row.quantity)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-4 px-4 text-center text-slate-600">
                            Sem dados disponíveis
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Table 4: Cancelled Sales Quantity by Broker */}
            <Card className="border-0 shadow-sm mb-8">
              <CardHeader>
                <CardTitle>Tabela 4: Quantidade de Baixas por Corretor</CardTitle>
                <CardDescription>Mostrando quantidade de vendas canceladas por corretor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Corretor
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">
                          Quantidade de Baixas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelledQuantities && cancelledQuantities.length > 0 ? (
                        cancelledQuantities.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-900">{row.brokerName || "N/A"}</td>
                            <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                              {Number(row.quantity)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-4 px-4 text-center text-slate-600">
                            Sem dados disponíveis
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Table 5: Cancelled Sales Value by Broker */}
            <Card className="border-0 shadow-sm mb-8">
              <CardHeader>
                <CardTitle>Tabela 5: Valor de Baixas por Corretor</CardTitle>
                <CardDescription>Mostrando valor total de vendas canceladas por corretor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Corretor
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">
                          Valor de Baixas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelledValues && cancelledValues.length > 0 ? (
                        cancelledValues.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-900">{row.brokerName || "N/A"}</td>
                            <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                              R$ {Number(row.value).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-4 px-4 text-center text-slate-600">
                            Sem dados disponíveis
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

