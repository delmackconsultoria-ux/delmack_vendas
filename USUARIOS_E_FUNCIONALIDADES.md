# Delmack - Sistema de Gestão de Vendas Imobiliárias

## 👥 Usuários e Senhas

| Email | Senha | Perfil | Descrição |
|-------|-------|--------|-----------|
| corretor@testes.com.br | senha123 | Broker (Corretor) | Acesso ao dashboard de vendas pessoais |
| gerente@testes.com.br | senha123 | Manager (Gerente) | Acesso ao painel de gestão da equipe |
| finance@testes.com.br | senha123 | Finance (Financeiro) | Acesso aos relatórios financeiros |
| admin@testes.com.br | senha123 | Admin (Administrador) | Acesso completo ao sistema |

---

## 🎯 Funcionalidades por Perfil

### 1️⃣ **BROKER (Corretor)**
- ✅ Dashboard pessoal com KPIs
  - Vendas do mês
  - Comissões ganhas
  - Propostas pendentes de aprovação
- ✅ Registrar nova venda
- ✅ Visualizar histórico de vendas
- ✅ Acompanhar comissões em tempo real
- ✅ Visualizar gráficos de desempenho
  - Minhas vendas por tipo
  - Comissões por tipo de negócio
- ✅ Acessar ranking de corretores
- ✅ Upload de documentos
- ✅ Visualizar indicadores pessoais

### 2️⃣ **MANAGER (Gerente)**
- ✅ Painel de gestão da equipe
  - Vendas totais da equipe (55 este mês)
  - Corretores ativos (3 membros)
  - Comissões geradas (R$ 145k)
  - Meta realizada (92% do objetivo)
- ✅ Performance da equipe
  - Gráfico de vendas vs meta por corretor
  - Evolução de vendas (últimos 6 meses)
- ✅ Gerenciar corretores
- ✅ Visualizar relatórios detalhados
- ✅ Acompanhar indicadores de equipe
- ✅ Aprovar/rejeitar vendas
- ✅ Gerar relatórios customizados

### 3️⃣ **FINANCE (Financeiro)**
- ✅ Relatórios financeiros
  - Análise detalhada de vendas
  - Comissões por período
  - Fluxo de caixa
- ✅ Indicadores financeiros
  - KPIs de receita
  - Métricas de desempenho
- ✅ Exportar dados em múltiplos formatos
- ✅ Visualizar histórico de transações

### 4️⃣ **ADMIN (Administrador)**
- ✅ Acesso completo a todas as funcionalidades
- ✅ Gerenciar usuários
- ✅ Configurar permissões
- ✅ Visualizar logs do sistema
- ✅ Backup e restauração de dados

---

## 📊 Funcionalidades Globais

### Dashboard
- 📈 KPIs em tempo real
- 📊 Gráficos interativos (Recharts)
- 🎯 Metas e objetivos
- 📱 Design responsivo

### Vendas
- ➕ Registrar nova venda
- 📋 Listar todas as vendas
- ✏️ Editar venda existente
- 🗑️ Deletar venda
- 📄 Gerar proposta

### Relatórios
- 📑 Relatório de vendas
- 💰 Relatório de comissões
- 📊 Relatório de desempenho
- 📈 Análise de tendências

### Indicadores
- 🎯 KPIs por período
- 📊 Métricas de desempenho
- 🏆 Ranking de corretores
- 💡 Insights e recomendações

### Autenticação
- 🔐 Login seguro com OAuth Manus
- 🍪 Sessão persistente
- 🚪 Logout
- 🔄 Recuperação de senha

### Notificações (Socket.io)
- 🔔 Notificação de nova venda
- 💬 Notificação de comissão atualizada
- ⏰ Notificações em tempo real
- 📢 Broadcast para equipe

---

## 🔧 Stack Técnico

### Frontend
- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component Library
- **Recharts** - Data Visualization
- **tRPC** - Type-safe API
- **Socket.io Client** - Real-time notifications
- **Wouter** - Routing

### Backend
- **Express 4** - Web Server
- **Node.js** - Runtime
- **tRPC** - API Framework
- **Drizzle ORM** - Database
- **MySQL/TiDB** - Database
- **Socket.io** - Real-time communication
- **OAuth Manus** - Authentication

### Testing
- **Vitest** - Unit Testing
- **Auth Flow Tests** - Login validation

---

## 🚀 Como Usar

### 1. Fazer Login
1. Acesse a página de login
2. Digite o email e senha (veja tabela acima)
3. Clique em "Entrar"

### 2. Navegar pelo Dashboard
- **Broker**: Veja suas vendas e comissões pessoais
- **Manager**: Gerencie sua equipe
- **Finance**: Analise dados financeiros
- **Admin**: Controle total do sistema

### 3. Registrar uma Venda
1. Clique em "Nova Venda"
2. Preencha os dados da propriedade
3. Defina o tipo de negócio
4. Clique em "Registrar"

### 4. Visualizar Relatórios
1. Clique em "Relatórios"
2. Escolha o tipo de relatório
3. Selecione o período
4. Exporte em PDF ou Excel

---

## 📝 Notas Importantes

- ✅ Todas as rotas estão protegidas por autenticação
- ✅ Redirecionamento automático para dashboard apropriado por perfil
- ✅ Dados em tempo real com Socket.io
- ✅ Sem erros de TypeScript
- ✅ Responsivo em todos os dispositivos

---

## 🔗 URLs Importantes

| Página | URL |
|--------|-----|
| Login | `/` |
| Dashboard Broker | `/` (redireciona automaticamente) |
| Dashboard Manager | `/` (redireciona automaticamente) |
| Dashboard Finance | `/` (redireciona automaticamente) |
| Dashboard Admin | `/` (redireciona automaticamente) |
| Nova Venda | `/sales/new` |
| Relatórios | `/reports` |
| Indicadores | `/indicators` |
| Ranking | `/ranking` |
| Upload de Documentos | `/document-upload` |
| Aprovação de Vendas | `/sales-approval` |

---

**Última atualização**: 15 de Dezembro de 2025
**Versão**: 1.0.0
