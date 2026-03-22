# TODO - Sistema Delmack

## ✅ Concluído

### Filtros Avançados nos Relatórios (05/02/2026)
- [x] Adicionar seção de filtros avançados colapsável na UI
- [x] Adicionar campos: tipo de imóvel, região, faixa de valor
- [x] Implementar lógica de filtragem no frontend
- [x] Botão "Limpar Filtros Avançados"
- [x] Testar filtros combinados
- [x] Salvar checkpoint

---

## 🔄 Em Andamento - Migração do Excel para Sistema

### FASE 1: Atualizar Banco de Dados
- [x] Atualizar schema Prisma com novos campos:
  - [x] `listingDate` (Data da Angariação - Properfy)
  - [x] `listingStore` (Loja Angariadora: Baggio/Rede UNA/Outros)
  - [x] `sellingStore` (Loja Vendedora: Baggio/Rede UNA/Outros)
  - [x] `team` (Equipe: TIME PRONTOS, TIME NOVOS)
  - [x] `region` (Região: Campo Comprido/Vila Izabel/Ecoville/Outros)
  - [x] `businessType` já existe no schema
  - [x] `managementResponsible` (Gestão: Camila/Lucas/Marcio/Lucas e Camila)
  - [x] `deedStatus` (Escriturada/A Escriturar/Não se aplica)
  - [x] `bankName` (Banco)
  - [x] `financedAmount` (Valor Financiado)
  - [x] `bankReturnPercentage` (% Retorno)
  - [x] `bankReturnAmount` (Valor Retorno - calculado)
  - [x] `observations` (Observações)
  - [x] `wasRemoved` (Boolean: baixado)
  - [x] `priceDiscount` (Calculado: listPrice - salePrice)
  - [x] `listingToSaleDays` (Calculado: saleDate - listingDate)
  - [x] `commissionPaymentDate` (Data de Recebimento)
  - [x] `commissionAmountReceived` (Valor Recebido)
  - [x] `commissionPaymentBank` (Banco Pagador)
  - [x] `commissionPaymentMethod` (PIX/TED/Boleto/Dinheiro)
  - [x] `commissionPaymentObservations` (Observações do pagamento)
- [x] Campo `expectedPaymentDate` já existe (renomear label no frontend)
- [x] Criar tabela `salePaymentHistory` para rastrear alterações
- [x] Executar migration: `pnpm db:push` ✅ SUCESSO

### FASE 2: Atualizar Formulário de Nova Venda
- [ ] Adicionar campo "Loja Angariadora" (dropdown)
- [ ] Adicionar campo "Loja Vendedora" (dropdown)
- [ ] Adicionar campo "Equipe" (dropdown)
- [ ] Adicionar campo "Região" (dropdown)
- [ ] Adicionar campo "Tipo de Negócio" (dropdown: Prontos/Lançamentos/Outros)
- [ ] Adicionar campo "Responsável pela Gestão" (dropdown editável)
- [ ] Implementar lógica: Prontos → Camila, Lançamentos → Lucas (editável)
- [ ] Adicionar campo "Status de Escrituração" (dropdown)
- [ ] Adicionar campo "Banco" (text input)
- [ ] Adicionar campo "Valor Financiado" (number)
- [ ] Adicionar campo "% Retorno Bancário" (number)
- [ ] Adicionar campo "Valor Retorno Bancário" (calculado, read-only)
- [ ] Renomear label: "Previsão de recebimento" → "Previsão de pagamento"
- [ ] Implementar preenchimento automático do Properfy
- [ ] Atualizar tRPC router para salvar novos campos

### FASE 3: Rastreamento de Alterações
- [ ] Detectar alterações em "Previsão de Pagamento"
- [ ] Salvar histórico na tabela `salePaymentHistory`
- [ ] Notificar financeiro quando alterado
- [ ] Mostrar histórico de alterações na página de detalhes da venda

### FASE 4: Comissões Recebidas
- [ ] Adicionar abas na página `/sales/history`:
  - [ ] Aba 1: "Histórico de Vendas" (atual)
  - [ ] Aba 2: "Comissões Recebidas" (nova)
- [ ] Implementar filtro: status = 'Comissão paga'
- [ ] Adicionar colunas extras: Data Recebimento, Valor Recebido, Banco, Forma, Observações
- [ ] Criar modal "Registrar Pagamento" para preencher dados

### FASE 5: Gráficos Faltantes em Relatórios
- [ ] Gráfico: Vendas por Região (pizza/barras)
- [ ] Gráfico: Tempo Médio de Venda (linha temporal)
- [ ] Gráfico: Atingimento de Metas (barras horizontais)
- [ ] Gráfico: Análise de Parcerias (barras agrupadas: Baggio-Baggio, Baggio-Outros, Outros-Baggio)

### FASE 6: Script de Importação do Excel
- [x] Criar script Python para ler Excel por mês/ano
- [x] Mapear colunas do Excel para campos do banco
- [x] Implementar lógica de importação:
  - [x] Aba GERAL (vendas)
  - [ ] Aba Comissões Pendentes (pendente)
  - [ ] Aba Comissões Recebidas (pendente)
- [x] Validar e normalizar dados
- [x] Gerar relatório de importação
- [x] Testar com `01Relatório_Jan_2025.xlsx` ✅ 29 vendas importadas com sucesso

### FASE 7: Indicadores de Tempo
- [ ] Adicionar indicador: "Tempo Médio de Venda" (média de listingToSaleDays)
- [ ] Adicionar indicador: "Tempo Médio de Pagamento" (média de saleDate → paymentDate)
- [ ] Adicionar indicador: "Alterações de Previsão" (quantidade de vendas com previsão alterada)

---

## ✅ Decisões Confirmadas

1. **Gestão:** Dropdown "Tipo de Negócio" (Prontos/Lançamentos/Outros) + Campo "Responsável" (auto-preenchido mas editável)
2. **Comissões Recebidas:** Aba separada dentro de Histórico
3. **Fechamento por Região:** Ignorar (não implementar)
4. **Previsão de Pagamento:** Renomear e rastrear alterações (crítico para financeiro)
5. **Importação:** Um Excel por mês/ano, manter dados organizados para histórico


## 🔄 Novas Solicitações do Usuário (05/02/2026)

### Correções de Nomenclatura
- [x] Substituir "Proposta" por "Nova Venda" em toda a interface
- [x] Verificar Home, Dashboard, Formulários, Botões, Mensagens

### Formulário de Nova Venda - Campos Manuais
- [x] Adicionar campo: Loja Angariadora (dropdown: Baggio/Rede UNA/Outros)
- [x] Adicionar campo: Loja Vendedora (dropdown: Baggio/Rede UNA/Outros)
- [x] Adicionar campo: Equipe (dropdown: TIME PRONTOS/TIME NOVOS)
- [x] Adicionar campo: Região (dropdown: Campo Comprido/Vila Izabel/Ecoville/Outros)
- [x] Adicionar campo: Gestão/Responsável (dropdown com lógica manual):
  - Camila, Lucas, Marcio, Lucas e Camila
  - Permite edição manual completa
- [x] Adicionar campo: Status de Escrituração (dropdown: Escriturada/A Escriturar/Não se aplica)
- [x] Adicionar campo: Banco (text input)
- [x] Adicionar campo: Valor Financiado (currency input)
- [x] Adicionar campo: % Retorno Bancário (percentage input)
- [x] Campo calculado automático: Valor Retorno = Valor Financiado × (% Retorno / 100)

### Análise de Equivalência Excel vs Sistema
- [x] Comparar todas as abas do Excel com funcionalidades do sistema
- [x] Listar funcionalidades/campos que ainda faltam
- [x] Criar relatório de pendências para o usuário ✅ Ver `EQUIVALENCIA_EXCEL_SISTEMA.md`


## 🚀 Implementação Final para 100% de Equivalência (05/02/2026)

### Aba Comissões Recebidas
- [x] Criar nova aba "Comissões Recebidas" na página Histórico
- [x] Implementar formulário de registro de pagamento:
  - [x] Data de Recebimento
  - [x] Valor Recebido
  - [x] Banco Pagador
  - [x] Forma de Pagamento (PIX/TED/Boleto/Dinheiro)
  - [x] Observações
- [x] Atualizar backend (router) para salvar dados de pagamento
- [x] Atualizar status da comissão de "pending" para "paid"
- [x] Exibir lista de comissões recebidas com filtros

### Gráficos Faltantes nos Relatórios
- [x] Gráfico: Vendas por Região (barras agrupadas)
  - [x] Dados: Campo Comprido, Vila Izabel, Ecoville, Outros
  - [x] Métricas: Quantidade e valor total
- [x] Gráfico: Tempo Médio de Venda (linha temporal)
  - [x] Dados: Média de dias (angariação → venda) por mês
  - [x] Permite identificar tendências
- [x] Gráfico: Atingimento de Metas (barras comparativas)
  - [x] Dados: Meta vs Realizado por corretor
  - [x] Meta fixa de R$ 1.000.000 por corretor (ajustável)
- [x] Gráfico: Análise de Parcerias (barras agrupadas)
  - [x] Categorias: Baggio-Baggio, Baggio-Outros, Outros-Baggio, Outros-Outros
  - [x] Métricas: Quantidade e valor total

### Checklist de Equivalência 100%
- [x] Criar documento CHECKLIST_100_EQUIVALENCIA.md
- [x] Listar TODOS os campos, tabelas, gráficos e funcionalidades
- [x] Marcar status: ✅ Implementado | ⚠️ Parcial | ❌ Falta
- [x] Incluir instruções para importação de histórico


## 🐛 BUG REPORTADO (05/02/2026 - 19:15)

### Dados não aparecem para corretores
- [x] Investigar: Carolina Cardoso (corretora) não vê dados importados
- [x] Verificar: Empresa da Carolina vs Empresa dos dados importados
- [x] Problema identificado: Filtros do sistema estão incorretos
  - Gerentes/Financeiro devem ver TODAS as vendas da empresa
  - Corretores devem ver APENAS suas próprias vendas
- [x] ETAPA 1: Corrigir queries do backend (salesRouter já estava correto, Reports corrigido)
- [x] ETAPA 2: Analisar nomes de corretores no Excel (15 corretores encontrados)
- [ ] ETAPA 3: Aguardando mapeamento de nomes completos do usuário
- [ ] ETAPA 4: Atualizar script de importação com normalização
- [ ] ETAPA 5: Testar com perfil de corretor após mapeamento


## 🔄 NOVA SOLICITAÇÃO (05/02/2026 - 19:35)

### Filtros de Mês/Ano nas Páginas Principais
**Motivo:** Dados importados são de Janeiro/2025, sistema pode estar filtrando apenas mês/ano atual

- [x] Adicionar filtro de Mês/Ano na página **Relatórios** (`/reports`)
  - [x] Dropdown de Mês (Janeiro-Dezembro)
  - [x] Dropdown de Ano (2024, 2025, 2026...)
  - [x] Opção "Todos os períodos"
  - [x] Aplicar filtro em todas as visualizações e gráficos

- [x] Adicionar filtro de Mês/Ano na página **Indicadores** (`/indicators`)
  - [x] Dropdown de Mês (Janeiro-Dezembro)
  - [x] Dropdown de Ano (2024, 2025, 2026...)
  - [x] Opção "Todos os períodos"
  - [ ] Recalcular indicadores com base no período selecionado (aguardando conexão com dados reais)

- [x] Adicionar filtro de Mês/Ano na página **Histórico** (`/proposals`)
  - [x] Dropdown de Mês (Janeiro-Dezembro)
  - [x] Dropdown de Ano (2024, 2025, 2026...)
  - [x] Opção "Todos os períodos"
  - [x] Filtrar tabela de vendas por período

- [ ] Testar com perfil Gerente (Camila Pires)
  - [ ] Selecionar Janeiro/2025 e verificar se aparecem as 29 vendas importadas
  - [ ] Validar que gráficos e indicadores refletem dados corretos


## 🐛 BUGS REPORTADOS (05/02/2026 - 20:10)

### Filtros de Mês/Ano - Problemas
- [x] **Relatórios**: Filtros movidos para fora do condicional hasData (agora sempre visíveis)
- [ ] **Indicadores**: Dados mockados (hardcoded) em vez de dados reais do banco
- [x] **Todos os filtros**: Redesenhados para serem mais discretos e compactos

### Tarefas de Correção
- [x] Verificar por que filtros não renderizam em Reports.tsx (estavam dentro do condicional hasData)
- [ ] Conectar Indicadores aos dados reais via trpc.sales.listMySales- [x] Redesenhar filtros para serem mais discretos:
  - [x] Reduzir tamanho dos dropdowns (px-2 py-1 text-sm)
  - [x] Usar cores neutras (border-slate-200 bg-white)
  - [x] Agrupar em linha única com separadores
  - [x] Remover Cards grandes e gradientes


## 🔄 NOVA SOLICITAÇÃO (05/02/2026 - 20:35)

### Ajustes nos Filtros
- [x] Remover filtro "Equipe/Corretor" da página Indicadores
- [ ] Manter apenas filtros de Mês e Ano
- [x] Garantir que filtros estejam funcionais para buscar dados im


---

## ✅ NOVA FASE: Job de Snapshot Mensal de Indicadores (22/03/2026)

### Implementação Completa
- [x] Criar arquivo `indicatorSnapshotJob.ts` com job cron
- [x] Configurar para rodar no último dia do mês às 23:00
- [x] Implementar lógica de detecção de último dia (verifica se amanhã é dia 1)
- [x] Salvar todos os 27 indicadores em formato "long" (uma linha por indicador)
- [x] Adicionar indicador faltante: "Valor médio do imóvel de venda"
- [x] Integrar ao arquivo `_core/index.ts` para inicializar ao ligar o servidor
- [x] Criar tabela `indicatorSnapshots` com campos: id, companyId, month, indicatorName, value, unit, createdAt
- [x] Implementar cálculo de todos os 27 indicadores:
  - [x] 16 indicadores do sistema de vendas (incluindo Valor médio do imóvel)
  - [x] 6 indicadores do Properfy
  - [x] 5 indicadores manuais

### Indicadores Capturados no Snapshot (27 Total)

**Sistema de Vendas (16 indicadores):**
1. Negócios no mês (valor)
2. Negócios no mês (unidades)
3. Vendas Canceladas
4. VSO - venda/oferta
5. Comissão Recebida
6. Comissão Vendida
7. Comissão Pendente Final do mês
8. % comissão vendida
9. Negócios acima de 1 milhão
10. Prazo médio recebimento de venda
11. % Com cancelada / com pendente
12. Negócios na Rede
13. Negócios Internos
14. Negócios Parceria Externa
15. Negócios Lançamentos
16. Valor médio do imóvel de venda ← **Adicionado**

**Properfy (6 indicadores):**
17. Carteira de Divulgação (em número)
18. Angariações mês
19. Baixas no mês (em quantidade)
20. Número de atendimentos Prontos
21. Número de atendimentos Lançamentos
22. Tempo médio de venda ang X venda

**Manuais (5 indicadores):**
23. Despesa Geral
24. Despesa com Impostos
25. Fundo Inovação
26. Resultado Sócios
27. Fundo Emergencial

### Testes Implementados
- [x] Teste 1: Verificar cálculo de todos os 27 indicadores
  - ✅ Carteira de Divulgação: 475 (março)
  - ✅ Angariações: 28 (março)
  - ✅ Baixas: 13 (março)
  - ✅ Atendimentos Prontos: 594 (março)
  - ✅ Atendimentos Lançamentos: 110 (março)
  - ✅ Valor médio do imóvel: 0 (adicionado)
- [x] Teste 2: Verificar detecção de último dia do mês
  - ✅ Funciona para 31/01, 28/02, 29/02 (bissexto), 31/03, 30/04
- [x] Teste 3: Verificar formato "long" de snapshots
  - ✅ Todos os 27 indicadores salvos como linhas separadas com indicatorName, value, unit
  - ✅ Total de 27 snapshots salvos corretamente

### Verificação em Produção
- [x] Servidor compilou sem erros
- [x] Página de Indicadores carregando corretamente com 27 indicadores
- [x] Tabela `indicatorSnapshots` vazia (esperado - não é último dia do mês)
- [x] Job agendado para rodar automaticamente no último dia do mês
- [x] Todos os 27 indicadores sendo capturados corretamente

### Próximos Passos
- [ ] Aguardar último dia do mês (31/03/2026) para verificar se snapshot é salvo automaticamente
- [ ] Validar que snapshot contém todos os 27 indicadores com valores corretos
- [ ] Implementar endpoint tRPC para visualizar histórico de snapshots
- [ ] Criar página de auditoria para visualizar snapshots salvos


---

## 🔧 NOVA FASE: Correção de Formatação de Indicadores (22/03/2026)

### Problema Identificado
- [ ] 3 indicadores exibindo em real, mas devem ser %:
  - [ ] VSO - venda/oferta (Vendas do mês / Carteira do mês anterior)
  - [ ] % comissão vendida
  - [ ] % Com cancelada / com pendente (Canceladas / Pendentes)
- [ ] 6 indicadores exibindo em real, mas devem ser unidades:
  - [ ] Negócios no mês (unidades)
  - [ ] Vendas Canceladas
  - [ ] Negócios na Rede
  - [ ] Negócios Internos
  - [ ] Negócios Parceria Externa
  - [ ] Negócios Lançamentos

### Solução
- [ ] Localizar onde os indicadores são formatados (Indicators.tsx ou IndicatorsConsolidatedTable.tsx)
- [ ] Corrigir a formatação de cada indicador de acordo com seu tipo
- [ ] Testar na página de indicadores
- [ ] Salvar checkpoint


---

## ✅ NOVA FASE: Correções de Formatação de Indicadores (22/03/2026)

### Correção de Cálculos e Formatação
- [x] Corrigir função calculateVSO para usar startDate e endDate corretamente
- [x] Remover multiplicação por 100 nos cálculos de percentuais (calculatePercentCommissionSold, calculatePercentCancelledPending, calculateVSO)
- [x] Adicionar suporte a formatação de percentuais (X,XX%) e unidades (sem decimais)
- [x] Adicionar propriedades isPercentage e isInteger aos indicadores
- [x] VSO agora exibe corretamente como 2,74% em vez de 321,47%
- [x] Indicadores de unidades agora exibem sem decimais (10 em vez de 10,0)
- [x] Remover valores "0" dos campos vazios
- [x] Deixar campos vazios em branco sem cor vermelha
- [x] Testar todas as mudanças na página de indicadores


---

## ✅ NOVA FASE: Limpeza do Repositório GitHub (22/03/2026)

### Remoção de Arquivos Desnecessários
- [x] Remover 5 arquivos CSV de usuários (LISTA_USUARIOS*.csv)
- [x] Remover 9 arquivos .md de documentação de teste
- [x] Remover 19 scripts .mjs de teste e debug
- [x] Atualizar .gitignore para evitar futuros commits
- [x] Testar aplicação após limpeza - ✅ 100% funcional
- [x] Manter arquivos críticos (import_to_db.mjs, scripts SQL, seed-users.ts)

### Arquivos Removidos (Total: ~193KB)
- LISTA_USUARIOS*.csv (5 arquivos)
- ANALISE_*.md, CHECKLIST_*.md, CONTRATO_*.md, EQUIVALENCIA_*.md, GUIA_*.md, IMPORTACAO_*.md, PRODUCTION_*.md (9 arquivos)
- check_*.mjs, test-*.mjs, debug-*.mjs, export_*.mjs, investigate-*.mjs, send-test-*.mjs, list-*.mjs, quick-*.mjs (19 arquivos)

### Impacto: ZERO
- Nenhum arquivo removido é referenciado no código
- Todos os dados reais estão nos arquivos SQL mantidos
- Aplicação funciona perfeitamente após limpeza
