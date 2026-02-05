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
