import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Users, 
  BarChart3, 
  CheckCircle2,
  ArrowRight,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Target,
      title: "Gestão de Metas",
      description: "Defina e acompanhe metas mensais com progresso em tempo real, projeções inteligentes e notificações automáticas"
    },
    {
      icon: TrendingUp,
      title: "Pipeline de Vendas",
      description: "Organize todo o ciclo de vendas desde a proposta até o fechamento com aprovações e rastreamento completo"
    },
    {
      icon: DollarSign,
      title: "Controle de Comissões",
      description: "Calcule e gerencie comissões automaticamente com transparência total para corretores e equipe financeira"
    },
    {
      icon: BarChart3,
      title: "Relatórios Avançados",
      description: "Dashboards interativos com análises de performance, VGV, rankings e indicadores estratégicos"
    },
    {
      icon: Users,
      title: "Gestão de Equipe",
      description: "Controle completo de corretores, gerentes e equipe financeira com permissões personalizadas"
    },
    {
      icon: Zap,
      title: "Integração Properfy",
      description: "Busca automática de imóveis Baggio e sincronização de dados para agilizar cadastros"
    }
  ];

  const profiles = [
    {
      name: "Corretores",
      color: "bg-orange-500",
      features: [
        "Registrar vendas rapidamente",
        "Acompanhar comissões em tempo real",
        "Visualizar ranking de performance",
        "Upload de documentos",
        "Histórico completo de propostas"
      ]
    },
    {
      name: "Gerentes",
      color: "bg-green-600",
      features: [
        "Aprovar vendas e propostas",
        "Configurar metas mensais",
        "Dashboard de progresso",
        "Relatórios por responsável",
        "Gestão de corretores",
        "Análise de baixas de angariação"
      ]
    },
    {
      name: "Financeiro",
      color: "bg-cyan-600",
      features: [
        "Gerenciar status de comissões",
        "Relatórios financeiros completos",
        "Controle de VGV",
        "Acompanhamento de metas",
        "Análises estratégicas"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-200">
            Sistema de Gestão Imobiliária
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Delmack
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-4 font-medium">
            Pipeline de Vendas Inteligente
          </p>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Organize e gerencie metas, vendas e comissões com eficiência máxima. 
            Focado em corretores, gerentes e equipe financeira.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700 text-lg px-8"
              onClick={() => setLocation("/login")}
            >
              Acessar Sistema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Funcionalidades Principais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow border-slate-200">
                  <CardHeader>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Profiles Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            Funcionalidades por Perfil
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Cada perfil tem acesso personalizado às ferramentas necessárias para seu dia a dia
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {profiles.map((profile, index) => (
              <Card key={index} className="border-2 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${profile.color}`} />
                    <CardTitle className="text-2xl">{profile.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {profile.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-orange-600 to-orange-700 text-white border-0">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Pronto para otimizar sua gestão de vendas?
            </h2>
            <p className="text-xl mb-8 text-orange-50 max-w-2xl mx-auto">
              Acesse o sistema e comece a gerenciar suas vendas, metas e comissões de forma profissional
            </p>
            <Button 
              size="lg" 
              className="bg-white text-orange-600 hover:bg-slate-50 text-lg px-8"
              onClick={() => setLocation("/login")}
            >
              Fazer Login
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-16 text-slate-600">
          <p>© 2025 Delmack. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
