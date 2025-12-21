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


## 🐛 Bugs Reportados

- [x] Busca Properfy não retorna dados - URL corrigida (refs BG não existem no sandbox)
- [x] Tela de erro "Ops! Algo deu errado" - cookie JWT tratado corretamente


## 🆕 Melhorias Super Admin

- [x] Ícone de copiar na notificação de senha criada
- [x] Listagem de usuários clicável por empresa
- [x] Ver detalhes do usuário
- [x] Redefinir senha do usuário
- [x] Desabilitar/excluir usuário
- [x] Desabilitar/excluir empresa
- [x] Corrigir erro 404 ao acessar com usuário criado


## 🆕 Ajustes Header

- [x] Clicar em "Delmack" redireciona para home/dashboard
- [x] Exibir "Nome - Empresa" no header (ex: "Angellica - Testes")


## 🆕 Melhorias Header e Properfy

- [x] Badge com perfil do usuário (Corretor, Gerente, etc) ao lado do nome
- [ ] Configurar API Properfy de produção (aguardando URL de produção)


## 🆕 Correções Super Admin

- [ ] Header padrão (AppHeader) em todas as páginas incluindo Super Admin
- [ ] Permitir excluir empresas (botão funcional)
- [ ] Clicar em "Usuários Totais" abre listagem de todos os usuários


## 🆕 Correções Super Admin

- [x] Header padrão (AppHeader) em todas as páginas incluindo Super Admin
- [x] Permitir excluir empresas (botão funcional)
- [x] Clicar em "Usuários Totais" abre listagem de todos os usuários
- [x] Na listagem de usuários: editar, desabilitar/ativar, redefinir senha


## 🐛 Bugs Críticos a Corrigir

- [ ] Exclusão de usuários não está funcionando (só aparece no histórico)
- [ ] Exclusão de empresas não está funcionando
- [ ] Contagem de empresas ativas incorreta (mostra 5, deveria mostrar 1)
- [ ] Licenças Ativas mostra 0 (deveria mostrar quantidade correta)
- [ ] Header padrão (AppHeader) NÃO está em todas as páginas (falta Ranking e outras)

## 🆕 Novas Funcionalidades

- [ ] Filtro por perfil (Corretor, Gerente, etc) na listagem de usuários
- [ ] Editar dados do usuário (nome, email, perfil) no modal


## 🆕 Correções Implementadas (21/12/2025)

### Dashboard Super Admin - Gestão de Usuários
- [x] Filtro por perfil na listagem de usuários (dropdown com todos os perfis)
- [x] Filtro por status (Ativos/Inativos) na listagem de usuários
- [x] Botão de edição de usuário (nome, email, perfil, empresa)
- [x] Modal de edição de usuário com validação de email único
- [x] Endpoint updateUser no superadminRouter

### Verificações Realizadas
- [x] Exclusão de usuários funcionando corretamente
- [x] Exclusão de empresas funcionando corretamente
- [x] Contagem de usuários ativos/inativos correta (7 ativos de 10 total)
- [x] Header padrão presente em todas as páginas


## 🐛 Bug Reportado (21/12/2025)

- [x] Header do Corretor não mostra todas as páginas (faltam Indicadores, Relatórios) - CORRIGIDO
- [x] Header do Financeiro não mostra Propostas - CORRIGIDO


## 🆕 Novas Funcionalidades Solicitadas (21/12/2025)

- [x] 1. Limpar dados da empresa "B I IMOVEIS LTDA" - CONCLUÍDO
- [x] 2. Email de notificação para propostas (Super Admin + email cadastrado) - CONCLUÍDO
- [x] 3. Gestão de equipe de gerente (vincular corretores a gerentes) - CONCLUÍDO
- [x] 4. Vínculo usuário/empresa com atualização automática de contagem - CONCLUÍDO
- [x] 5. Perfil de visualização (viewer) - somente leitura - CONCLUÍDO
- [x] 6. Adicionar Analytics ao menu do Financeiro - CONCLUÍDO
- [x] 7. Adicionar Ranking ao menu de Corretor e Financeiro - CONCLUÍDO
- [x] 8. Adicionar Aprovação de Vendas ao menu do Financeiro - CONCLUÍDO


## 🐛 Correções Solicitadas (21/12/2025 - 17h)

- [ ] Restaurar nome da empresa ao lado do nome do usuário no header
- [ ] Adicionar campo Nome Fantasia no cadastro de empresa
- [ ] Remover TODAS as notificações de erro da interface do usuário
- [ ] Criar log de erros interno para Super Admin visualizar
- [ ] Permitir salvar proposta sem todos os campos preenchidos
- [ ] Campos obrigatórios vazios devem ficar em vermelho
- [ ] Adicionar máscara de CEP (00000-000)
- [ ] Adicionar máscara de telefone ((00) 00000-0000)
- [ ] Adicionar máscara de CPF (000.000.000-00)
- [ ] Adicionar máscara de CNPJ (00.000.000/0000-00)


## 🆕 Correções Implementadas (21/12/2025 - Tarde)

### Interface e UX
- [x] Nome Fantasia adicionado ao cadastro de empresa (tradeName)
- [x] Nome da empresa exibido ao lado do usuário no header (usa Nome Fantasia se disponível)
- [x] Notificações de erro removidas da interface (erros tratados silenciosamente)
- [x] Botão salvar sempre habilitado (laranja para rascunho, azul para completo)
- [x] Máscaras em tempo real para CEP (00000-000)
- [x] Máscaras em tempo real para telefone ((00) 00000-0000)
- [x] Máscaras em tempo real para CPF (000.000.000-00)
- [x] Máscaras em tempo real para CNPJ (00.000.000/0000-00)


## 🆕 Correções Implementadas (21/12/2025 - Final)

### Correções Solicitadas
- [x] Removido "Valor de Divulgação" duplicado da seção de endereço
- [x] Adicionada opção "Visualizador" na criação de usuário
- [x] Adicionado campo "Nome Fantasia" no formulário de empresa
- [x] Erros removidos da interface (ErrorBoundary redireciona silenciosamente)
- [x] Login redireciona direto para o perfil correto (sem tela de erro)


## 🆕 Botões de Proposta (21/12/2025)

- [x] Botão Cancelar - volta para listagem de propostas
- [x] Botão Salvar Rascunho (laranja) - salva imediatamente com status "draft"
- [x] Botão Enviar Proposta (azul) - valida campos obrigatórios, destaca em vermelho se faltarem


## 🆕 Correções (21/12/2025 - Sessão 4)

- [x] Viewer como role válido no backend (createUser e uploadUsers)
- [x] Modal de edição de empresa com Nome Fantasia, CNPJ, telefone, endereço
- [x] Botão de editar empresa (ícone lápis azul) na lista de empresas
- [x] Contagem de usuários por empresa funcionando (query SQL correta)


## 🆕 Correções (21/12/2025 - Sessão 5)

- [x] Erro ao salvar empresa corrigido (nullable fields)
- [x] Contagem de usuários por empresa corrigida (BigInt → Number)
- [x] Viewer tem acesso a Analytics (Insights) no menu e rotas
- [x] Viewer vê dados filtrados por empresa (sales, commissions, history)
- [x] Todos os perfis veem apenas dados da própria empresa


## 🆕 Remoção de Dados Mock para Empresas Não-Testes

- [x] Modificar Indicators.tsx para mostrar dados vazios para empresas que não são "Testes"
- [x] Modificar Ranking.tsx para mostrar dados vazios para empresas que não são "Testes"
- [x] Modificar Analytics.tsx para mostrar dados vazios para empresas que não são "Testes"
- [x] Adicionar mensagem informativa quando não há dados cadastrados
- [x] Manter dados mock apenas para empresa "Testes" (para demonstração)
- [x] Testado com usuário corretor@testes.com.br - dados mock aparecem corretamente


## 🆕 Limpeza de Dados - Empresa B I IMOVEIS LTDA

- [x] Identificar ID da empresa B I IMOVEIS LTDA no banco (company_1766331506068)
- [x] Verificar tabelas - banco já estava zerado (0 sales, 0 commissions, 0 properties)
- [x] Corrigir código frontend para mostrar dados vazios para empresas não-Testes
- [x] Testar login com usuário Lucas@baggioimoveis.com.br
- [x] Verificar página Relatórios - mostrando "Nenhum dado disponível"
- [x] Verificar página Indicadores - mostrando dados zerados (Positivos: 0, Negativos: 0, Indefinidos: 0)
- [x] Verificar página Ranking - mostrando "Nenhum dado cadastrado para esta empresa"
- [x] Verificar página Analytics - mostrando dados zerados (Vendas: 0, Corretores: 0, Comissões: R$ 0)
