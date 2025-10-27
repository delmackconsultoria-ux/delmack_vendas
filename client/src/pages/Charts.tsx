import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

export default function ChartsPage() {
  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-slate-50 pt-16">
        <div className="px-6 py-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gráficos</h1>
            <p className="text-slate-600 mt-2">
              Visualize dados e métricas em gráficos interativos
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Vendas por Período
                </CardTitle>
                <CardDescription>
                  Últimos 12 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-100 rounded flex items-center justify-center">
                  <p className="text-slate-600">Gráfico em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Comissões por Corretor
                </CardTitle>
                <CardDescription>
                  Distribuição de comissões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-100 rounded flex items-center justify-center">
                  <p className="text-slate-600">Gráfico em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance da Equipe
                </CardTitle>
                <CardDescription>
                  Vendas vs Meta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-100 rounded flex items-center justify-center">
                  <p className="text-slate-600">Gráfico em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Evolução de Vendas
                </CardTitle>
                <CardDescription>
                  Tendência de crescimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-100 rounded flex items-center justify-center">
                  <p className="text-slate-600">Gráfico em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

