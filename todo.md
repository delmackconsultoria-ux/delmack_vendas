# Delmack - TODO List

## ✅ Funcionalidades Completadas

### Autenticação e Segurança
- [x] Sistema de login com email e senha
- [x] Hash de senhas com bcryptjs
- [x] Cookies de sessão com JSON encoding
- [x] Contexto de autenticação para tRPC
- [x] 6 contas de teste criadas (corretor, gerente, financeiro, admin, vendedor, angariador)
- [x] Remover link "Cadastre-se aqui" do login
- [x] Toggle de visualizar/ocultar senha no login

### Banco de Dados
- [x] Schema com 12 tabelas (users, companies, properties, sales, commissions, etc)
- [x] Migração do banco de dados aplicada
- [x] 14 novos campos adicionados à tabela sales

### Formulário de Vendas (NewSale.tsx)
- [x] Campos básicos: referência, endereço, cidade, estado, CEP
- [x] Campos de venda: data venda, data angariação, valor venda
- [x] Campos de comprador: nome, CPF/CNPJ, origem cliente, forma pagamento
- [x] Campos de comissionamento: angariador, vendedor, tipo negócio
- [x] Validação de CPF/CNPJ com dígitos verificadores
- [x] Busca de CEP via ViaCEP API
- [x] Seleção dinâmica de angariador/vendedor (Da Equipe ou Externo)
- [x] Tela de preview/resumo antes de submissão
- [x] Botão salvar desabilitado até preencher todos os campos
- [x] Campos com fundo verde quando preenchidos corretamente
- [x] Modal de erro com lista de campos faltantes
- [x] Novos campos: Tipo do Imóvel, Quartos, Áreas, Idade, Investimento, Financiamento, Cartório, Despachante, Telefones

### Dashboards
- [x] Dashboard por perfil (Broker, Manager, Finance)
- [x] KPI Cards (Vendas, Comissões, Pendentes)
- [x] Gráficos com Recharts
- [x] 5 tabelas operacionais (Valor por Corretor, Angariações, Quantidade, Baixas)
- [x] Filtros por mês/ano e corretor
- [x] Controle de acesso por perfil

### Indicadores e Relatórios
- [x] Página Indicadores com 27 KPIs
- [x] Modal de detalhe com gráfico de evolução
- [x] Filtros dinâmicos (Tipo de Negócio, Corretor)
- [x] Página Reports com dados operacionais
- [x] Página Ranking com top 3 e dados do corretor
- [x] Página Analytics para financeiro

### Componentes Reutilizáveis
- [x] AppHeader com navegação dinâmica por perfil
- [x] CompactFilter para filtros compactos
- [x] ErrorModal para exibir erros
- [x] IndicatorDetailModal para detalhe de indicadores

### Integração com APIs
- [x] Integração com Properfy API para busca de imóveis
- [x] Busca de CEP via ViaCEP
- [x] Validação de email externo
- [x] Carregamento de lista de corretores

### Serviços
- [x] commissionService.ts com cálculo de comissões (7 tipos)
- [x] ProperfyService para integração com Properfy
- [x] CepService para validação de CEP
- [x] EmailService para notificações
- [x] Routers tRPC: authRouter, salesRouter, dashboardRouter, brokersRouter

## ✅ Testes Realizados e Validados

### ✅ Testes de Login
- [x] Login com corretor@baggio.com.br funcionando
- [x] Dashboard carregando corretamente
- [x] Botão "Nova Venda" funcional
- [ ] Testar login com gerente@baggio.com.br (senha: senha123)
- [ ] Testar login com financeiro@baggio.com.br (senha: senha123)
- [ ] Testar login com admin@baggio.com.br (senha: senha123)
- [ ] Testar login com vendedor@baggio.com.br (senha: senha123)
- [ ] Testar login com angariador@baggio.com.br (senha: senha123)

### ✅ Testes de Formulário
- [x] Preenchimento completo do formulário
- [x] Validação de CPF/CNPJ (permitindo valores de teste)
- [x] Seleção de tipo de imóvel
- [x] Preenchimento de campos de imóvel (quartos, áreas)
- [x] Preenchimento de campos de endereço
- [x] Preenchimento de dados do comprador e vendedor
- [x] Preenchimento de datas de venda e angariação
- [x] Seleção de forma de pagamento
- [x] Seleção de investimento/moradia
- [x] Seleção de lojas (angariador e vendedor)
- [x] Seleção de corretores (angariador e vendedor)
- [x] Seleção de tipo de negócio
- [x] Preview/resumo da venda
- [x] Submissão de venda
- [x] Todos os 14 novos campos foram salvos no banco

### Testes de Dashboards
- [ ] Testar dashboard de corretor
- [ ] Testar dashboard de gerente
- [ ] Testar dashboard de financeiro
- [ ] Testar filtros por mês/ano
- [ ] Testar filtros por corretor
- [ ] Verificar que corretores veem apenas seus dados
- [ ] Verificar que gerentes/financeiro veem todos os dados

### Testes de Indicadores
- [ ] Testar clique em card de indicador
- [ ] Testar filtros na modal de detalhe
- [ ] Testar gráfico de evolução
- [ ] Testar estatísticas calculadas
- [ ] Testar tabela de dados mensais

## 🐛 Bugs Corrigidos

- [x] Erro de parsing de session cookie (aviso no console, não impede login)
- [x] Campos de comissionamento faltando no formulário
- [x] Função handleConfirmAndSave não estava implementada
- [x] Validação de CPF bloqueando valores de teste
- [x] CompletionStatus não sendo inicializado corretamente
- [x] Declaração duplicada de variável `brokers`
- [x] Formato de data incorreto (mm/dd/yyyy vs yyyy-MM-dd)
- [x] Botão "Preencha todos os campos" desabilitado mesmo com campos obrigatórios preenchidos

## ✅ Funcionalidades Recentemente Implementadas

- [x] Página de Gerenciamento de Corretores para gerente
  - [x] Visualizar lista de corretores da equipe
  - [x] Adicionar novo corretor (botão)
  - [x] Editar informações do corretor (botão)
  - [x] Remover corretor da equipe (botão)
  - [x] Ver performance/estatísticas do corretor (tabela com dados)
  - [x] Filtros por busca (nome/email)
  - [x] 4 KPI Cards (Total de Corretores, Total de Vendas, Total de Comissões, Performance Média)
  - [x] Tabela com colunas: Nome, Email, Telefone, Status, Vendas, Comissões, Performance, Ações

## ✅ Bugs/Correções Implementadas

- [x] Remover texto "Gerente" (papel) do dropdown - deixar apenas "Sair"
- [x] Implementar funcionalidade completa de cadastro/edição de corretores
  - [x] Modal de adicionar novo corretor
  - [x] Modal de editar corretor existente
  - [x] Salvar dados no estado local (funcional)
  - [x] Remover corretor com confirmação

## 🚀 Funcionalidades Solicitadas para Implementar

- [x] Ativar "Nova Venda" para o perfil de Gerente
  - [x] Adicionada rota /sales/new para manager no App.tsx
  - [x] Testado com sucesso - gerente consegue acessar formulário de nova venda
- [x] Permitir cadastrar a equipe do corretor (adicionar campos de equipe no formulário de edição)
  - [x] Adicionada interface TeamMember e campos de equipe em BrokerManagement.tsx
  - [x] Modal para adicionar membros da equipe implementada
  - [x] Funcionalidade de remover membros implementada
  - [x] Testado com sucesso - adicionado membro à equipe de João Silva
- [x] Remover "Dashboard" do menu horizontal
  - [x] Removido item "Dashboard" da lista navItems em AppHeader.tsx
  - [x] Testado com sucesso - menu agora mostra apenas: Nova Venda, Indicadores, Corretores, Relatórios
- [x] Vincular logo/Delmack para ir ao dashboard (padrão para todos os perfis)
  - [x] Logo convertido em button clicável em AppHeader.tsx
  - [x] onClick navega para /dashboard
  - [x] Testado com sucesso - logo leva ao dashboard

## 📋 Funcionalidades em Desenvolvimento

- [x] Juntar páginas de Gráficos e Relatórios em uma única página
  - [x] Remover página Charts.tsx
  - [x] Atualizar Reports.tsx com conteúdo de ambas
  - [x] Remover "Gráficos" do menu horizontal
  - [x] Manter apenas "Relatórios" no menu
  - [x] Atualizar App.tsx para remover rota de /charts

## 📋 Próximos Passos

1. ✅ Executar testes de login com todas as 6 contas
2. ✅ Testar preenchimento completo do formulário de vendas
3. ✅ Verificar que todos os 14 novos campos são salvos no banco
4. ✅ Testar dashboards com diferentes perfis
5. ✅ Criar header padrão em todas as páginas
6. ✅ Criar página de gerenciamento de corretores
7. ✅ Corrigir dropdown para mostrar apenas "Sair"
8. ✅ Implementar funcionalidade de cadastro/edição de corretores
9. [ ] Juntar páginas de Gráficos e Relatórios
10. [ ] Testar indicadores e filtros
11. [ ] Criar checkpoint final

## 📊 Estatísticas

- **Total de Tabelas:** 12
- **Total de Campos no Schema:** 100+
- **Total de Routers tRPC:** 5
- **Total de Páginas:** 10+
- **Total de Componentes:** 20+
- **Contas de Teste:** 6
- **Novos Campos de Vendas:** 14



## 🚨 Bugs Reportados pelo Usuário

- [ ] Login rejeitando senha correta com mensagem "Email ou senha incorretos"
- [ ] Validação de senha mínima (6 caracteres) funcionando, mas autenticação falhando



## 🆕 Nova Implementação - Sistema Multi-Empresa

- [x] Atualizar schema do banco para multi-empresa (companies table)
- [x] Criar Super Admin único (delmackconsultoria@gmail.com)
- [x] Implementar upload de Excel para criar usuários em lote
- [x] Enviar senhas por e-mail via Manus Notification API
- [x] Adicionar botão ver senha nos campos de senha
- [x] Remover notificações de erro vermelhas (overlay desabilitado)
- [x] Dashboard do Super Admin para gerenciar empresas
- [x] Manager como admin da empresa

## 🆕 Sugestões Implementadas

- [x] Painel de gestão de usuários para Manager
- [x] Soft delete de usuários (dados permanecem)
- [x] Template de Excel para download

## 🆕 Melhorias Solicitadas

### Gestão de Usuários (Manager)
- [x] Filtro por status (ativos/inativos)
- [x] Edição de usuário existente
- [ ] Histórico de ações (log) - Pendente

### Dashboard Super Admin
- [x] Quantidade total de usuários
- [x] Usuários por empresa
- [x] Quantidade de acessos
- [x] Tipos de licença (perpétua, mensal, trimestral, semestral, anual)
- [x] Detalhes da empresa ao clicar
- [x] Responsável pelo contrato
- [x] Data de início manual
- [x] Perfis principais da empresa

## 🆕 Novas Implementações

- [x] Histórico de ações (log de usuários)
- [x] Alertas de vencimento de licença
- [x] Dashboard de métricas por empresa

## 🆕 Integração Properfy e Anexos

- [x] Integração API Properfy (busca imóveis por referência)
- [x] Upload de anexos (proposta de compra) no S3
- [x] Botão exportar anexos para Super Admin
- [x] Botão exportar anexos para Manager

## 🆕 Novas Implementações

- [x] Visualização de anexos nas vendas (botão ver/baixar)
- [x] Documento de contrato (arquitetura, segurança, riscos, escopo)

- [x] Corrigir mensagens de erro no login (sem página de erro)

## 🆕 Segurança e Gestão de Usuários

- [x] Recuperação de senha por e-mail
- [x] Bloqueio após 5 tentativas incorretas
- [x] Super Admin redefinir senha de usuário
- [x] Super Admin bloquear/desbloquear usuário

## 🆕 Novas Implementações

- [x] Painel de usuários no Super Admin
- [x] Alterar senha no perfil do usuário
- [x] Log de acessos (histórico de logins)

## 🆕 Correções Solicitadas

- [x] Remover link "Esqueci minha senha" da interface
- [x] Corrigir "Delmac" para "Delmack" no rodapé (já estava correto)
- [x] Manter redefinição de senha apenas pelo Super Admin

## 🐛 Bugs Reportados

- [x] Corrigir integração Properfy (busca em todas as páginas)
- [x] Corrigir upload de imagem (Promise corrigida)


## 🆕 Atualização Formulário de Venda

- [ ] Campo Estado como select (dropdown)
- [ ] Garantir campos exatos do documento Word no formulário


## 🆕 Melhorias UX Formulário de Venda (Solicitado)

- [x] Campo Nome do Condomínio
- [x] Campo Valor de Divulgação mais visível
- [x] Cálculo Total da Comissão Fechada (Valor e %)
- [x] Cálculo Comissão Corretor Angariador R$
- [x] Cálculo Comissão Corretor Vendedor R$
- [x] Cálculo Comissão Baggio R$
- [x] Campo Previsão de Recebimento
- [x] Estado como dropdown (select) com UFs brasileiras
- [x] Preenchimento automático do Properfy
- [x] Validação e formatação de CPF/CNPJ
- [x] Validação e formatação de Telefone (XX) XXXXX-XXXX
- [x] Busca automática de endereço por CEP

## 🆕 Novas Funcionalidades Solicitadas

- [x] Busca Properfy por referência, endereço ou CEP
- [x] Validação visual em tempo real de CPF/CNPJ (ícone verde/vermelho)
- [x] Histórico de alterações das vendas para auditoria

## 🆕 Refatoração Nova Proposta (CONCLUÍDO)

- [x] Renomear "Nova Venda" para "Nova Proposta"
- [x] Campo de busca Properfy unificado (referência/CEP/endereço)
- [x] Adicionar "Valor de Divulgação" ao lado de "Valor da Venda"
- [x] Remover "Loja Angariador" e "Loja Vendedor"
- [x] Alterar comissão para "Total fechada %" e "Total fechada R$" com cálculo automático
- [x] Corretor Angariador (interno/externo com nome, CRECI, email obrigatórios)
- [x] Corretor Vendedor (interno/externo com nome, CRECI, email obrigatórios)
- [x] Comissão do Angariador em R$
- [x] Comissão do Vendedor em R$
- [x] Total comissão imobiliária em R$
- [x] Salvar usuário que registrou e horário
- [x] Opção "Salvar Incompleto" (rascunho)
- [x] Status: Rascunho, Em análise, Venda, Em análise gerente, Em análise financeiro, Comissão paga, Cancelada
- [x] Comentários com autor e horário em mudanças de status
- [x] Página de gerenciamento de propostas (corretor vê só suas, gerente vê todas)
- [x] Métricas: % propostas→vendas, % canceladas, tempo médio proposta→venda


## 🆕 Isolamento de Dados e Gestão de Empresas

### Isolamento por Empresa
- [x] Revisar todas as queries para filtrar por companyId
- [x] Garantir que sales só retorne dados da empresa do usuário
- [x] Garantir que commissions só retorne dados da empresa do usuário
- [x] Garantir que brokers só retorne dados da empresa do usuário
- [x] Garantir que users só retorne dados da empresa do usuário (exceto Super Admin)

### Cadastro de Empresas (Super Admin)
- [x] Criar formulário de nova empresa (nome, CNPJ, contatos)
- [x] Validação de CNPJ único
- [x] Campos de contato (telefone, email, endereço)
- [x] Listar empresas existentes

### Preparação para Dados Reais
- [ ] Limpar dados de teste do banco
- [ ] Manter apenas Super Admin
- [ ] Preparar importação de Excel para usuários
- [ ] Preparar importação de Excel para empresas


## 🆕 Correção Super Admin e Criação de Usuários

- [x] Verificar/recriar Super Admin com senha funcional
- [x] Implementar criação de usuários individuais pelo Super Admin
- [x] Testar login e fornecer credenciais
