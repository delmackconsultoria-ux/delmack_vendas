import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp } from "lucide-react";

export default function GoalsPage() {
  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-slate-50 pt-16">
        <div className="px-6 py-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Metas</h1>
            <p className="text-slate-600 mt-2">
              Acompanhe e gerencie as metas de vendas da equipe
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  Meta Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">R$ 500.000</p>
                <p className="text-xs text-slate-600 mt-2">Realizado: R$ 380.000 (76%)</p>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: "76%" }}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Vendas Realizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">12</p>
                <p className="text-xs text-slate-600 mt-2">Meta: 15 vendas</p>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: "80%" }}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Comissões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">R$ 45.600</p>
                <p className="text-xs text-slate-600 mt-2">Meta: R$ 60.000</p>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: "76%" }}></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Metas por Corretor</CardTitle>
              <CardDescription>
                Desempenho individual de cada membro da equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "João Silva", role: "Corretor", realizado: 150000, meta: 200000, percentual: 75 },
                  { name: "Maria Santos", role: "Corretora", realizado: 180000, meta: 200000, percentual: 90 },
                  { name: "Pedro Costa", role: "Corretor", realizado: 50000, meta: 200000, percentual: 25 },
                ].map((corretor) => (
                  <div key={corretor.name} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-medium text-slate-900">{corretor.name}</p>
                      <p className="text-sm text-slate-600">{corretor.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        R$ {corretor.realizado.toLocaleString()} / R$ {corretor.meta.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-600">{corretor.percentual}% realizado</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

