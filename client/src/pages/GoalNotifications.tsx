import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

export default function GoalNotifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return null;
  }

  // Apenas gerentes e admins podem acessar
  if (user.role !== "manager" && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <p className="text-slate-900 font-semibold mb-4">
              Acesso restrito a gerentes
            </p>
            <Button onClick={() => setLocation("/dashboard")}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Notificações de Metas
            </h1>
          </div>
          <p className="text-slate-600">
            Sistema automático de alertas de progresso de vendas
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-6 border-l-4 border-l-green-600 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Sistema de Notificações Ativo
                </h2>
                <p className="text-slate-600 mt-1">
                  Você receberá alertas automáticos sobre o progresso das metas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Notificações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Marco 50% */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Marco: 50% da Meta
                </CardTitle>
                <Badge className="bg-green-600">Ativo</Badge>
              </div>
              <CardDescription>Notificação de progresso intermediário</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm mb-3">
                Você receberá um email de parabéns quando atingir 50% da meta mensal, 
                incluindo estatísticas de progresso e projeção de fechamento.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600">
                <strong>Exemplo:</strong> "🎯 Meta de Janeiro: 50% Atingido! Continue assim! 💪"
              </div>
            </CardContent>
          </Card>

          {/* Marco 75% */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Marco: 75% da Meta
                </CardTitle>
                <Badge className="bg-blue-600">Ativo</Badge>
              </div>
              <CardDescription>Notificação de reta final</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm mb-3">
                Alerta de motivação quando você estiver próximo de bater a meta, 
                mostrando quanto falta e a média necessária para os dias restantes.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600">
                <strong>Exemplo:</strong> "🎯 Meta de Janeiro: 75% Atingido! Está quase lá! 🚀"
              </div>
            </CardContent>
          </Card>

          {/* Marco 100% */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  Marco: 100% da Meta
                </CardTitle>
                <Badge className="bg-purple-600">Ativo</Badge>
              </div>
              <CardDescription>Notificação de conquista</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm mb-3">
                Celebração automática quando você bater a meta do mês, 
                com resumo completo do resultado e excedente alcançado.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600">
                <strong>Exemplo:</strong> "🎉 Meta de Janeiro: 100% ATINGIDA! Time está de parabéns! 🏆"
              </div>
            </CardContent>
          </Card>

          {/* Alerta: Abaixo do Esperado */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Alerta: Abaixo do Esperado
                </CardTitle>
                <Badge className="bg-orange-600">Ativo</Badge>
              </div>
              <CardDescription>Notificação de atenção necessária</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm mb-3">
                Alerta preventivo quando o progresso estiver mais de 5% abaixo do esperado 
                para o período, com sugestões de média diária necessária.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600">
                <strong>Exemplo:</strong> "⚠️ Atenção: Meta de Janeiro Abaixo do Esperado. Vamos acelerar! 🚀"
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Como Funciona */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Como Funciona
            </CardTitle>
            <CardDescription>Funcionamento do sistema de notificações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Monitoramento Automático
                  </h3>
                  <p className="text-sm text-slate-600">
                    O sistema verifica automaticamente o progresso de vendas após cada venda registrada
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Detecção de Marcos
                  </h3>
                  <p className="text-sm text-slate-600">
                    Quando um marco é atingido (50%, 75%, 100%), o sistema envia notificação automaticamente
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Alertas Preventivos
                  </h3>
                  <p className="text-sm text-slate-600">
                    Se o progresso estiver abaixo do esperado, você recebe um alerta com sugestões de ação
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Notificações Únicas
                  </h3>
                  <p className="text-sm text-slate-600">
                    Cada notificação é enviada apenas uma vez por mês para evitar spam
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="mt-6 flex gap-4">
          <Button 
            onClick={() => setLocation("/goals-dashboard")}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Ver Dashboard de Metas
          </Button>
          <Button 
            onClick={() => setLocation("/goals-config")}
            variant="outline"
          >
            Configurar Metas
          </Button>
        </div>
      </div>
    </div>
  );
}
