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

## 🔄 Funcionalidades em Testes

### Testes de Login
- [ ] Testar login com corretor@baggio.com.br (senha: senha123)
- [ ] Testar login com gerente@baggio.com.br (senha: senha123)
- [ ] Testar login com financeiro@baggio.com.br (senha: senha123)
- [ ] Testar login com admin@baggio.com.br (senha: senha123)
- [ ] Testar login com vendedor@baggio.com.br (senha: senha123)
- [ ] Testar login com angariador@baggio.com.br (senha: senha123)

### Testes de Formulário
- [ ] Testar preenchimento completo do formulário
- [ ] Testar validação de CPF/CNPJ
- [ ] Testar busca de CEP
- [ ] Testar seleção de angariador/vendedor
- [ ] Testar cálculo de comissão
- [ ] Testar preview/resumo
- [ ] Testar submissão de venda
- [ ] Verificar que todos os 14 novos campos foram salvos no banco

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

## 🐛 Bugs Conhecidos

- [ ] Erro no servidor ao processar requisições (aviso em logs, não impede funcionamento)
- [ ] Validar se erro afeta performance ou estabilidade

## 📋 Próximos Passos

1. Executar testes de login com todas as 6 contas
2. Testar preenchimento completo do formulário de vendas
3. Verificar que todos os 14 novos campos são salvos no banco
4. Testar dashboards com diferentes perfis
5. Testar indicadores e filtros
6. Corrigir qualquer bug encontrado
7. Criar checkpoint final

## 📊 Estatísticas

- **Total de Tabelas:** 12
- **Total de Campos no Schema:** 100+
- **Total de Routers tRPC:** 5
- **Total de Páginas:** 10+
- **Total de Componentes:** 20+
- **Contas de Teste:** 6
- **Novos Campos de Vendas:** 14

