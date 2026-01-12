import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Video, 
  FileText, 
  CheckCircle2, 
  Search,
  ChevronRight,
  Home,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useState } from "react";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  steps: string[];
  icon: any;
  roles: string[];
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  roles: string[];
}

const tutorials: Tutorial[] = [
  // Tutoriais para Corretor (Broker)
  {
    id: "broker-register-sale",
    title: "Como Registrar uma Nova Venda",
    description: "Aprenda a registrar uma proposta de venda passo a passo no sistema",
    category: "Vendas",
    duration: "5 min",
    icon: FileText,
    roles: ["broker"],
    steps: [
      "Acesse o menu lateral e clique em 'Nova Proposta'",
      "Escolha o tipo de imóvel: Baggio (use a referência) ou Externo (preencha manualmente)",
      "Se for Baggio, digite a referência (ex: BG66206001) e clique em 'Buscar no Properfy'",
      "Preencha os dados do comprador: nome, CPF/CNPJ, telefone",
      "Preencha os dados do vendedor (se aplicável)",
      "Informe o valor da venda e a data",
      "Selecione o tipo de negócio (Venda, Locação, Permuta)",
      "Escolha os corretores: Angariador e Vendedor",
      "Adicione observações se necessário",
      "Clique em 'Registrar Venda' para finalizar",
      "Você receberá confirmação com o ID da venda e comissões calculadas"
    ]
  },
  {
    id: "broker-view-commissions",
    title: "Como Visualizar Suas Comissões",
    description: "Acompanhe suas comissões pendentes, recebidas e pagas",
    category: "Comissões",
    duration: "3 min",
    icon: DollarSign,
    roles: ["broker"],
    steps: [
      "No dashboard, veja o card 'Suas Comissões' com o resumo",
      "Clique em 'Ver Detalhes' para abrir a página completa",
      "Use os filtros para buscar por período, status ou tipo",
      "Status 'Pendente': aguardando recebimento da imobiliária",
      "Status 'Recebido': imobiliária recebeu, aguardando pagamento",
      "Status 'Pago': você já recebeu a comissão",
      "Clique em uma comissão para ver detalhes da venda relacionada"
    ]
  },
  {
    id: "broker-upload-documents",
    title: "Como Fazer Upload de Documentos",
    description: "Envie documentos de propostas para o sistema",
    category: "Documentos",
    duration: "2 min",
    icon: FileText,
    roles: ["broker"],
    steps: [
      "Acesse 'Minhas Propostas' no menu lateral",
      "Encontre a proposta desejada e clique nela",
      "Na página de detalhes, role até a seção 'Documentos'",
      "Clique em 'Fazer Upload de Documento'",
      "Selecione o arquivo PDF do seu computador",
      "Aguarde o upload completar",
      "O documento ficará disponível para download por gerentes e financeiro"
    ]
  },

  // Tutoriais para Gerente (Manager)
  {
    id: "manager-approve-sales",
    title: "Como Aprovar Vendas",
    description: "Processo de aprovação de propostas registradas pelos corretores",
    category: "Aprovações",
    duration: "4 min",
    icon: CheckCircle2,
    roles: ["manager"],
    steps: [
      "Acesse 'Aprovação de Vendas' no menu lateral",
      "Veja a lista de vendas pendentes de aprovação",
      "Clique em uma venda para ver todos os detalhes",
      "Revise: dados do imóvel, comprador, vendedor, valores e comissões",
      "Verifique se há documentos anexados",
      "Se tudo estiver correto, clique em 'Aprovar Venda'",
      "Se houver problemas, clique em 'Rejeitar' e informe o motivo",
      "O corretor receberá notificação da decisão"
    ]
  },
  {
    id: "manager-configure-goals",
    title: "Como Configurar Metas Mensais",
    description: "Defina metas de vendas para acompanhamento da equipe",
    category: "Metas",
    duration: "3 min",
    icon: TrendingUp,
    roles: ["manager"],
    steps: [
      "Acesse 'Configurar Metas' no menu lateral",
      "Selecione o mês e ano desejados",
      "Digite o valor da meta (ex: R$ 15.000.000)",
      "Clique em 'Salvar Meta'",
      "A meta será usada no Dashboard de Metas",
      "Você receberá notificações automáticas em 50%, 75% e 100%",
      "Se não configurar, o sistema usa meta padrão de R$ 15 milhões"
    ]
  },
  {
    id: "manager-goals-dashboard",
    title: "Como Usar o Dashboard de Metas",
    description: "Acompanhe o progresso de vendas em tempo real",
    category: "Metas",
    duration: "5 min",
    icon: BarChart3,
    roles: ["manager"],
    steps: [
      "Acesse 'Dashboard de Metas' no menu lateral",
      "Veja o card de status: 'No Caminho Certo' ou 'Atenção Necessária'",
      "Analise os 4 KPIs principais: Meta, VGV Acumulado, Projeção, Tempo Restante",
      "O gráfico de pizza mostra visualmente o progresso",
      "Compare 'Progresso Atual' vs 'Progresso Esperado' nas barras",
      "Veja a média diária atual e a média necessária para bater a meta",
      "Use os filtros para visualizar meses anteriores",
      "Clique em 'Configurar Metas' para ajustar valores"
    ]
  },
  {
    id: "manager-sales-by-responsible",
    title: "Relatório de Vendas por Responsável",
    description: "Compare performance de Lucas (Lançamentos) vs Camila (Prontos)",
    category: "Relatórios",
    duration: "4 min",
    icon: Users,
    roles: ["manager", "finance"],
    steps: [
      "Acesse 'Vendas por Responsável' no menu lateral",
      "Selecione o ano e mês para análise",
      "Veja os 3 KPI cards: VGV Total, Lucas, Camila",
      "O gráfico de barras compara o VGV de cada um",
      "O gráfico de pizza mostra a distribuição percentual",
      "A tabela detalhada inclui: quantidade, VGV, ticket médio, % do total",
      "Use para avaliar performance individual e balanceamento da equipe"
    ]
  },
  {
    id: "manager-listing-rejections",
    title: "Relatório de Baixas de Angariação",
    description: "Analise imóveis recusados e motivos de rejeição",
    category: "Relatórios",
    duration: "4 min",
    icon: FileText,
    roles: ["manager"],
    steps: [
      "Acesse 'Baixas de Angariação' no menu lateral",
      "Use os filtros: Data Inicial, Data Final, Nome do Corretor",
      "Clique em 'Aplicar Filtros' para refinar a busca",
      "Veja o total de baixas no card de destaque",
      "O gráfico de barras mostra as principais razões de recusa",
      "O segundo gráfico mostra distribuição por corretor",
      "A tabela lista: referência, endereço, corretor, motivo, data",
      "Use para identificar padrões e melhorar processo de angariação"
    ]
  },
  {
    id: "manager-broker-management",
    title: "Como Gerenciar Corretores",
    description: "Adicione, edite e gerencie a equipe de corretores",
    category: "Equipe",
    duration: "5 min",
    icon: Users,
    roles: ["manager"],
    steps: [
      "Acesse 'Gestão de Corretores' no menu lateral",
      "Clique em 'Adicionar Corretor' para cadastrar novo membro",
      "Preencha: nome, email, telefone, CRECI",
      "Defina se é corretor interno ou externo",
      "Configure percentuais de comissão padrão",
      "Clique em 'Salvar' para adicionar à equipe",
      "Para editar, clique no corretor e altere os dados",
      "Para desativar, mude o status para 'Inativo'",
      "Corretores inativos não aparecem nas listas de seleção"
    ]
  },

  // Tutoriais para Financeiro (Finance)
  {
    id: "finance-manage-commissions",
    title: "Como Gerenciar Comissões",
    description: "Controle o fluxo de pagamento de comissões aos corretores",
    category: "Comissões",
    duration: "5 min",
    icon: DollarSign,
    roles: ["finance"],
    steps: [
      "Acesse 'Indicadores' ou 'Relatórios' no menu lateral",
      "Veja o resumo de comissões: Pendentes, Recebidas, Pagas",
      "Filtre por período, corretor ou status",
      "Para marcar como 'Recebido': imobiliária recebeu o valor",
      "Para marcar como 'Pago': você já pagou o corretor",
      "Clique na comissão para ver detalhes da venda",
      "Exporte relatórios para Excel (funcionalidade futura)",
      "Use para controle de fluxo de caixa e pagamentos"
    ]
  },
  {
    id: "finance-financial-reports",
    title: "Relatórios Financeiros",
    description: "Acesse relatórios consolidados de vendas e comissões",
    category: "Relatórios",
    duration: "4 min",
    icon: BarChart3,
    roles: ["finance"],
    steps: [
      "Acesse 'Relatórios' no menu lateral",
      "Selecione o tipo de relatório: Vendas, Comissões, Metas",
      "Use filtros de período para refinar análise",
      "Veja gráficos de evolução temporal",
      "Analise indicadores financeiros: VGV, comissões totais, ticket médio",
      "Compare períodos (mês atual vs anterior)",
      "Use 'Vendas por Responsável' para análise por corretor",
      "Acesse 'Dashboard de Metas' para acompanhar progresso mensal"
    ]
  },

  // Tutoriais para Admin
  {
    id: "admin-company-management",
    title: "Gestão de Empresas",
    description: "Gerencie múltiplas imobiliárias no sistema",
    category: "Administração",
    duration: "6 min",
    icon: Settings,
    roles: ["admin"],
    steps: [
      "Acesse 'Gestão de Empresas' no menu lateral",
      "Veja a lista de todas as empresas cadastradas",
      "Clique em 'Adicionar Empresa' para cadastrar nova imobiliária",
      "Preencha: nome, CNPJ, endereço, telefone, email",
      "Configure percentuais de comissão padrão da empresa",
      "Defina o plano de assinatura e limites",
      "Clique em 'Salvar' para criar a empresa",
      "Para editar, clique na empresa e altere os dados",
      "Para desativar, mude o status para 'Inativo'"
    ]
  },
  {
    id: "admin-user-management",
    title: "Gestão de Usuários",
    description: "Adicione e gerencie usuários do sistema",
    category: "Administração",
    duration: "5 min",
    icon: Users,
    roles: ["admin"],
    steps: [
      "Acesse 'Gestão de Usuários' no menu lateral",
      "Veja todos os usuários de todas as empresas",
      "Clique em 'Adicionar Usuário' para criar novo acesso",
      "Preencha: nome, email, empresa vinculada",
      "Selecione o perfil: Corretor, Gerente, Financeiro, Admin",
      "Defina senha inicial (usuário pode alterar depois)",
      "Clique em 'Salvar' para criar o usuário",
      "Para editar perfil ou empresa, clique no usuário",
      "Para desativar acesso, mude status para 'Inativo'"
    ]
  },
  {
    id: "admin-system-settings",
    title: "Configurações do Sistema",
    description: "Ajuste configurações globais e parâmetros",
    category: "Administração",
    duration: "4 min",
    icon: Settings,
    roles: ["admin"],
    steps: [
      "Acesse 'Configurações' no menu lateral",
      "Aba 'Geral': configure nome do sistema, logo, timezone",
      "Aba 'Comissões': defina percentuais padrão por tipo de negócio",
      "Aba 'Notificações': configure emails automáticos",
      "Aba 'Integrações': gerencie conexões com Properfy e outros sistemas",
      "Aba 'Segurança': configure políticas de senha e sessão",
      "Clique em 'Salvar' em cada aba para aplicar mudanças",
      "Mudanças são aplicadas imediatamente para todos os usuários"
    ]
  },

  // Tutoriais Gerais
  {
    id: "general-dashboard",
    title: "Entendendo o Dashboard",
    description: "Navegue pelo painel principal e entenda os indicadores",
    category: "Geral",
    duration: "4 min",
    icon: Home,
    roles: ["broker", "manager", "finance", "admin"],
    steps: [
      "O Dashboard é a primeira página após o login",
      "Cards de KPI mostram métricas principais do seu perfil",
      "Corretores veem: suas vendas, comissões, propostas pendentes",
      "Gerentes veem: vendas totais, metas, aprovações pendentes",
      "Financeiro vê: VGV total, comissões a pagar, fluxo de caixa",
      "Gráficos mostram evolução temporal das métricas",
      "Use o menu lateral para acessar funcionalidades específicas",
      "Clique no seu nome (canto superior) para acessar perfil e sair"
    ]
  },
  {
    id: "general-search-proposals",
    title: "Como Buscar Propostas",
    description: "Encontre rapidamente vendas usando filtros e busca",
    category: "Geral",
    duration: "3 min",
    icon: Search,
    roles: ["broker", "manager", "finance"],
    steps: [
      "Acesse 'Propostas' ou 'Minhas Propostas' no menu lateral",
      "Use a barra de busca para procurar por: nome, referência, endereço",
      "Use os filtros: Status, Período, Corretor, Tipo de Negócio",
      "Clique em 'Aplicar Filtros' para refinar resultados",
      "Clique em uma proposta para ver detalhes completos",
      "Use 'Limpar Filtros' para resetar a busca",
      "Propostas são ordenadas por data (mais recentes primeiro)"
    ]
  },
  {
    id: "general-notifications",
    title: "Sistema de Notificações",
    description: "Entenda como funcionam as notificações automáticas",
    category: "Geral",
    duration: "3 min",
    icon: CheckCircle2,
    roles: ["manager", "finance"],
    steps: [
      "O sistema envia notificações por email automaticamente",
      "Corretores recebem: aprovação/rejeição de vendas",
      "Gerentes recebem: novas propostas, marcos de meta (50%, 75%, 100%)",
      "Gerentes recebem alerta quando progresso está abaixo do esperado",
      "Financeiro recebe: vendas aprovadas, comissões a pagar",
      "Notificações de meta são enviadas apenas 1x por mês por marco",
      "Acesse 'Notificações de Metas' para entender o sistema completo",
      "Configure email de notificação no seu perfil"
    ]
  }
];

const faqs: FAQ[] = [
  // FAQs para Corretor (Broker)
  {
    id: "faq-broker-commission-payment",
    question: "Quando recebo minha comissão?",
    answer: "A comissão é paga após a imobiliária receber o valor do cliente e o financeiro processar o pagamento. Você pode acompanhar o status em 'Minhas Comissões': Pendente (aguardando recebimento), Recebido (imobiliária recebeu, aguardando pagamento) e Pago (você já recebeu).",
    category: "Comissões",
    roles: ["broker"]
  },
  {
    id: "faq-broker-edit-sale",
    question: "Posso editar uma venda já registrada?",
    answer: "Sim, você pode editar vendas com status 'Rascunho' ou 'Pendente'. Acesse 'Minhas Propostas', clique na venda desejada e depois em 'Editar'. Vendas aprovadas ou canceladas não podem ser editadas.",
    category: "Vendas",
    roles: ["broker"]
  },
  {
    id: "faq-broker-properfy-reference",
    question: "Onde encontro a referência do imóvel Baggio?",
    answer: "A referência do imóvel Baggio começa com 'BG' seguido de números (ex: BG66206001). Você encontra no site da Baggio, no material de divulgação ou no sistema Properfy. Use essa referência para buscar automaticamente os dados do imóvel.",
    category: "Vendas",
    roles: ["broker"]
  },
  {
    id: "faq-broker-rejected-sale",
    question: "Por que minha venda foi rejeitada?",
    answer: "Vendas podem ser rejeitadas por: dados incompletos, valores incorretos, documentação pendente ou duplicidade. Quando rejeitada, você recebe notificação por email com o motivo. Corrija as informações e registre novamente.",
    category: "Vendas",
    roles: ["broker"]
  },
  {
    id: "faq-broker-external-property",
    question: "Como registro imóvel que não é Baggio?",
    answer: "Ao criar nova proposta, selecione 'Imóvel Externo' e preencha manualmente: endereço completo, CEP, cidade, estado, valor de anúncio. Não é necessário referência para imóveis externos.",
    category: "Vendas",
    roles: ["broker"]
  },

  // FAQs para Gerente (Manager)
  {
    id: "faq-manager-goal-calculation",
    question: "Como é calculada a meta mensal?",
    answer: "Você define a meta em 'Configurar Metas'. O sistema calcula o progresso baseado no VGV (Valor Geral de Vendas) acumulado no mês. A projeção é calculada pela média diária multiplicada pelos dias do mês. Se não configurar, a meta padrão é R$ 15 milhões.",
    category: "Metas",
    roles: ["manager"]
  },
  {
    id: "faq-manager-notifications",
    question: "Quando recebo notificações de meta?",
    answer: "Você recebe notificações automáticas por email quando atingir 50%, 75% e 100% da meta mensal. Também recebe alerta se o progresso estiver mais de 5% abaixo do esperado para o período. Cada notificação é enviada apenas uma vez por mês.",
    category: "Metas",
    roles: ["manager"]
  },
  {
    id: "faq-manager-approve-criteria",
    question: "Quais critérios usar para aprovar vendas?",
    answer: "Verifique: dados completos do comprador e vendedor, valor de venda coerente com mercado, documentação anexada, comissões calculadas corretamente, corretores válidos. Se houver dúvidas, entre em contato com o corretor antes de aprovar.",
    category: "Aprovações",
    roles: ["manager"]
  },
  {
    id: "faq-manager-broker-inactive",
    question: "Como desativar um corretor?",
    answer: "Acesse 'Gestão de Corretores', clique no corretor desejado e altere o status para 'Inativo'. Corretores inativos não aparecem nas listas de seleção, mas suas vendas anteriores permanecem no sistema.",
    category: "Equipe",
    roles: ["manager"]
  },
  {
    id: "faq-manager-sales-responsible",
    question: "Qual a diferença entre Lucas e Camila no relatório?",
    answer: "Lucas é responsável por Lançamentos (imóveis novos) e Camila por Prontos (imóveis usados/prontos). O relatório 'Vendas por Responsável' compara o VGV e performance de cada um para avaliar balanceamento da equipe.",
    category: "Relatórios",
    roles: ["manager", "finance"]
  },
  {
    id: "faq-manager-listing-rejections",
    question: "Para que serve o relatório de baixas de angariação?",
    answer: "Mostra imóveis que foram recusados/rejeitados com os motivos. Use para identificar padrões (ex: preço alto, localização ruim) e melhorar o processo de angariação. Também ajuda a avaliar performance individual dos corretores.",
    category: "Relatórios",
    roles: ["manager"]
  },

  // FAQs para Financeiro (Finance)
  {
    id: "faq-finance-commission-status",
    question: "Qual a diferença entre os status de comissão?",
    answer: "Pendente: imobiliária ainda não recebeu do cliente. Recebido: imobiliária recebeu, aguardando pagamento ao corretor. Pago: corretor já recebeu. Atualize os status conforme o fluxo de pagamentos para controle preciso.",
    category: "Comissões",
    roles: ["finance"]
  },
  {
    id: "faq-finance-vgv-calculation",
    question: "Como é calculado o VGV?",
    answer: "VGV (Valor Geral de Vendas) é a soma de todos os valores de venda no período selecionado, excluindo vendas canceladas e rascunhos. Inclui vendas pendentes e aprovadas. Use os filtros de período para análises específicas.",
    category: "Relatórios",
    roles: ["finance", "manager"]
  },
  {
    id: "faq-finance-payment-schedule",
    question: "Existe um calendário de pagamentos?",
    answer: "Atualmente não há calendário automático. Recomenda-se estabelecer uma data fixa mensal (ex: dia 5) e filtrar comissões com status 'Recebido' para processar pagamentos. Marque como 'Pago' após transferência.",
    category: "Comissões",
    roles: ["finance"]
  },

  // FAQs para Admin
  {
    id: "faq-admin-user-roles",
    question: "Quais são os perfis de usuário disponíveis?",
    answer: "Corretor (registra vendas, vê suas comissões), Gerente (aprova vendas, configura metas, acessa relatórios), Financeiro (gerencia comissões, relatórios financeiros), Admin (gestão completa do sistema). Cada perfil tem permissões específicas.",
    category: "Administração",
    roles: ["admin"]
  },
  {
    id: "faq-admin-company-setup",
    question: "Como adicionar uma nova imobiliária?",
    answer: "Acesse 'Gestão de Empresas', clique em 'Adicionar Empresa', preencha: nome, CNPJ, endereço, contatos. Configure percentuais de comissão padrão e plano de assinatura. Depois adicione usuários vinculados à empresa.",
    category: "Administração",
    roles: ["admin"]
  },
  {
    id: "faq-admin-reset-password",
    question: "Como resetar senha de um usuário?",
    answer: "Acesse 'Gestão de Usuários', clique no usuário desejado, depois em 'Resetar Senha'. O usuário receberá email com link para criar nova senha. Alternativamente, defina uma senha temporária e informe ao usuário.",
    category: "Administração",
    roles: ["admin"]
  },

  // FAQs Gerais
  {
    id: "faq-general-forgot-password",
    question: "Esqueci minha senha, como recuperar?",
    answer: "Na tela de login, clique em 'Esqueci minha senha', digite seu email cadastrado e clique em 'Enviar'. Você receberá um email com link para criar nova senha. O link é válido por 24 horas.",
    category: "Geral",
    roles: ["broker", "manager", "finance", "admin"]
  },
  {
    id: "faq-general-update-profile",
    question: "Como atualizar meus dados pessoais?",
    answer: "Clique no seu nome no canto superior direito e selecione 'Perfil'. Você pode atualizar: nome, telefone, foto. Para alterar email, entre em contato com o administrador do sistema.",
    category: "Geral",
    roles: ["broker", "manager", "finance", "admin"]
  },
  {
    id: "faq-general-mobile-access",
    question: "O sistema funciona no celular?",
    answer: "Sim! O sistema é totalmente responsivo e funciona em smartphones e tablets. Acesse pelo navegador do seu dispositivo usando o mesmo login. Todas as funcionalidades estão disponíveis na versão mobile.",
    category: "Geral",
    roles: ["broker", "manager", "finance", "admin"]
  },
  {
    id: "faq-general-notifications",
    question: "Não estou recebendo notificações por email",
    answer: "Verifique: 1) Email cadastrado está correto no seu perfil, 2) Verifique caixa de spam/lixo eletrônico, 3) Adicione noreply@delmack.com aos contatos confiáveis. Se o problema persistir, contate o suporte.",
    category: "Geral",
    roles: ["broker", "manager", "finance", "admin"]
  },
  {
    id: "faq-general-search-tips",
    question: "Como buscar vendas mais rapidamente?",
    answer: "Use a busca por: nome do comprador, referência do imóvel, endereço. Combine com filtros de período, status e corretor para refinar resultados. Vendas são ordenadas por data (mais recentes primeiro).",
    category: "Geral",
    roles: ["broker", "manager", "finance"]
  },
  {
    id: "faq-general-data-security",
    question: "Meus dados estão seguros?",
    answer: "Sim! O sistema usa criptografia SSL/TLS para todas as comunicações, senhas são armazenadas com hash seguro, backups automáticos diários e acesso controlado por perfil. Seus dados são protegidos conforme LGPD.",
    category: "Geral",
    roles: ["broker", "manager", "finance", "admin"]
  }
];

export default function Tutorials() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [activeTab, setActiveTab] = useState<"tutorials" | "faq">("tutorials");
  const [faqSearchTerm, setFaqSearchTerm] = useState("");
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  // Filtrar tutoriais por perfil do usuário
  const userTutorials = tutorials.filter(t => t.roles.includes(user.role));

  // Aplicar filtros de busca e categoria
  const filteredTutorials = userTutorials.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Obter categorias únicas
  const categories = ["all", ...Array.from(new Set(userTutorials.map(t => t.category)))];

  // Filtrar FAQs por perfil do usuário
  const userFaqs = faqs.filter(f => f.roles.includes(user.role));

  // Aplicar filtros de busca e categoria no FAQ
  const filteredFaqs = userFaqs.filter(f => {
    const matchesSearch = f.question.toLowerCase().includes(faqSearchTerm.toLowerCase()) ||
                         f.answer.toLowerCase().includes(faqSearchTerm.toLowerCase());
    const matchesCategory = selectedFaqCategory === "all" || f.category === selectedFaqCategory;
    return matchesSearch && matchesCategory;
  });

  // Obter categorias únicas de FAQ
  const faqCategories = ["all", ...Array.from(new Set(userFaqs.map(f => f.category)))];

  const getRoleName = (role: string) => {
    const names: Record<string, string> = {
      broker: "Corretor",
      manager: "Gerente",
      finance: "Financeiro",
      admin: "Administrador"
    };
    return names[role] || role;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        {!selectedTutorial ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-8 w-8 text-orange-600" />
                <h1 className="text-3xl font-bold text-slate-900">
                  Tutoriais e Guias
                </h1>
              </div>
              <p className="text-slate-600">
                Aprenda a usar o sistema com guias passo a passo para {getRoleName(user.role)}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <Button
                onClick={() => setActiveTab("tutorials")}
                className={activeTab === "tutorials" 
                  ? "bg-orange-600 hover:bg-orange-700" 
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Tutoriais ({userTutorials.length})
              </Button>
              <Button
                onClick={() => setActiveTab("faq")}
                className={activeTab === "faq" 
                  ? "bg-orange-600 hover:bg-orange-700" 
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                FAQ ({userFaqs.length})
              </Button>
            </div>

            {/* Busca e Filtros */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder={activeTab === "tutorials" ? "Buscar tutoriais..." : "Buscar perguntas..."}
                      value={activeTab === "tutorials" ? searchTerm : faqSearchTerm}
                      onChange={(e) => activeTab === "tutorials" 
                        ? setSearchTerm(e.target.value) 
                        : setFaqSearchTerm(e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={activeTab === "tutorials" ? selectedCategory : selectedFaqCategory}
                    onChange={(e) => activeTab === "tutorials" 
                      ? setSelectedCategory(e.target.value)
                      : setSelectedFaqCategory(e.target.value)
                    }
                    className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {(activeTab === "tutorials" ? categories : faqCategories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "all" ? "Todas as Categorias" : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Conteúdo baseado na tab ativa */}
            {activeTab === "tutorials" ? (
              /* Lista de Tutoriais */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTutorials.map((tutorial) => {
                const Icon = tutorial.icon;
                return (
                  <Card 
                    key={tutorial.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedTutorial(tutorial)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Icon className="h-5 w-5 text-orange-600" />
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">
                            {tutorial.category}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="text-slate-600">
                          {tutorial.duration}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                      <CardDescription>{tutorial.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          {tutorial.steps.length} passos
                        </span>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                );
                  })}
                </div>

                {filteredTutorials.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">
                        Nenhum tutorial encontrado com os filtros selecionados
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              /* Lista de FAQs */
              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <Card key={faq.id} className="hover:shadow-md transition-shadow">
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <HelpCircle className="h-4 w-4 text-orange-600" />
                            <Badge className="bg-blue-100 text-blue-700">
                              {faq.category}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{faq.question}</CardTitle>
                        </div>
                        {openFaqId === faq.id ? (
                          <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </CardHeader>
                    {openFaqId === faq.id && (
                      <CardContent>
                        <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}

                {filteredFaqs.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">
                        Nenhuma pergunta encontrada com os filtros selecionados
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Tutorial Detalhado */}
            <Button 
              variant="outline" 
              onClick={() => setSelectedTutorial(null)}
              className="mb-6"
            >
              ← Voltar para Tutoriais
            </Button>

            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    {selectedTutorial.icon && <selectedTutorial.icon className="h-8 w-8 text-orange-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-700">
                        {selectedTutorial.category}
                      </Badge>
                      <Badge variant="outline" className="text-slate-600">
                        {selectedTutorial.duration}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl mb-2">{selectedTutorial.title}</CardTitle>
                    <CardDescription className="text-base">
                      {selectedTutorial.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Passo a Passo</CardTitle>
                <CardDescription>
                  Siga estas etapas para completar a tarefa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedTutorial.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-slate-700">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">
                        Tutorial Concluído!
                      </h4>
                      <p className="text-sm text-green-700">
                        Agora você sabe como usar esta funcionalidade. 
                        Pratique no sistema para fixar o aprendizado.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
