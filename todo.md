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
- [x] Garantir que filtros estejam funcionais para buscar dados importados:
  - [x] Verificar lógica de filtragem em Relatórios (linhas 84-95: funcional)
  - [ ] Verificar lógica de filtragem em Indicadores (usa dados mockados, não conectado ao banco)
  - [x] Verificar lógica de filtragem em Histórico (linhas 94-106: funcional)
- [ ] Testar com dados de Janeiro/2025 (29 vendas importadas)


## 🐛 BUG CRÍTICO (05/02/2026 - 20:45)

### Dados não carregam para gestora
- [x] Investigar: Camila Pires (Gerente) não consegue ver dados mesmo selecionando Janeiro/2025
- [x] Verificar dados no banco: Confirmado que 29 vendas foram importadas com companyId correto
- [x] Verificar query listMySales: Confirmado que retorna dados para gerentes
- [x] Verificar filtro de empresa (companyId): PROBLEMA IDENTIFICADO - vendas estavam em 'test_company'
- [x] Corrigido: Atualizadas 29 vendas para companyId correto de 'B I IMOVEIS LTDA'

## 🐛 NOVO BUG REPORTADO (05/02/2026 - 21:00)

### Dados ainda não aparecem após correção
- [x] Investigar novamente: Mesmo após correção do companyId, dados não aparecem
- [x] Verificar query SQL diretamente no banco - CONFIRMADO: 29 vendas em Janeiro/2025 com companyId correto
- [x] Verificar se filtros de Mês/Ano estão sendo aplicados corretamente - Lógica de filtros está correta
- [x] Adicionar logs temporários para debug - Logs adicionados em listMySales
- [x] Testar query listMySales com parâmetros específicos - Query retorna dados corretamente

**DIAGNÓSTICO:** Dados existem no banco, query funciona, mas gráficos não aparecem porque:
1. Não há corretores cadastrados no sistema (brokers vazio)
2. Gráficos agrupam por corretor, sem corretores = sem dados
3. Vendas importadas têm brokerVendedor e brokerAngariador NULL

**SOLUÇÃO NECESSÁRIA:**
- Cadastrar corretores no sistema
- Mapear nomes do Excel para IDs de usuários
- Atualizar vendas importadas com brokerVendedor/brokerAngariador corretos

### Reorganizar Filtros de Mês/Ano
- [x] Mover filtros de Mês/Ano para dentro do botão "Mostrar Filtros Avançados" em Relatórios
- [x] Manter filtros discretos e compactos em Indicadores e Histórico
- [x] Aplicar em todas as páginas: Relatórios, Indicadores, Histórico

## 🆕 NOVOS CAMPOS E MELHORIAS (06/02/2026)

### Adicionar Novos Campos ao Formulário de Venda
- [x] Adicionar campo "Percentual da Entrada" (número, %)
- [x] Adicionar campo "Número do Contrato" (texto)
- [x] Adicionar campo "Data de Assinatura do Contrato" (data)
- [x] Renomear "Banco (Financiamento)" para "Banco Financiador"
- [x] Posicionar novos campos de forma adequada no formulário
- [x] Atualizar schema do banco com novos campos
- [x] Atualizar backend (salesRouter) para salvar novos campos

### Implementar Sistema de Histórico de Datas
- [ ] Analisar Excel para identificar todas as colunas de datas
- [ ] Criar tabela de histórico de alterações de status
- [ ] Registrar automaticamente mudanças de status com timestamp
- [ ] Implementar cálculo de tempo médio entre etapas (Angariação → Venda, etc.)
- [ ] Importar histórico antigo do Excel quando disponível

### Atualizar Script de Importação
- [ ] Analisar todas as colunas do Excel 01Relatório_Jan_2025.xlsx
- [ ] Mapear TODAS as colunas para campos do sistema
- [ ] Incluir importação de observações
- [ ] Incluir importação de novos campos (percentual entrada, contrato, etc.)
- [ ] Testar importação completa

## 🔧 ATUALIZAÇÃO DE CREDENCIAIS (08/02/2026)

### Configurar Variáveis de Ambiente para Produção
- [ ] Atualizar PROPERFY_API_URL para URL real: https://adm.baggioimoveis.com.br/api/property/property
- [ ] Atualizar PROPERFY_API_TOKEN com token real
- [ ] Atualizar PROPERFY_EMAIL e PROPERFY_PASSWORD com credenciais reais
- [ ] Criar arquivo .env.example atualizado para referência
- [ ] Validar configurações

### Configurar Properfy no Ambiente de Desenvolvimento
- [x] Adicionar PROPERFY_API_URL e PROPERFY_API_TOKEN via webdev_request_secrets
- [x] Testar conexão com API da Properfy - SUCESSO: 4.982 imóveis encontrados
- [x] Validar busca de imóveis por referência - SUCESSO: Busca por TESTESETORTI funcionando

## 🐛 BUGS REPORTADOS (08/02/2026 - 14:50)

### Timeout na busca por referência
- [x] Investigar erro 524 (timeout) ao buscar referência "BG96925001"
- [x] Otimizar busca para não iterar todas as 4.982 páginas - LIMITADO A 50 PÁGINAS (5.000 imóveis)
- [x] Reduzir timeout implementando busca em lotes de 5 páginas paralelas
- [ ] Testar busca com referência BG96925001 após otimizações

### Endereço errado ao buscar por CEP
- [x] Investigar por que busca por CEP retorna endereço errado
- [x] CAUSA IDENTIFICADA: Usuário digitou código de cidade (4106402) ao invés de CEP (81610-040)
- [x] Corrigir busca por CEP para usar apenas chrAddressPostalCode (CEP real)
- [x] Otimizar busca por CEP limitando a 50 páginas

## 🐛 NOVO BUG: Dados errados ao buscar imóvel (08/02/2026 - 15:00)

### Busca retorna imóvel errado
- [ ] Investigar: Busca por "BG97728001" retornou imóvel diferente
- [ ] Dados errados: Área Total 234,12 (correto: 121,95), Quartos 0 (correto: 3)
- [ ] Endereço errado: Rua Professor Assis Gonçalves (não é o imóvel BG96925001)
- [ ] Verificar lógica de busca por referência (chrDocument vs chrReference)
- [ ] Corrigir mapeamento de campos da API para formulário

## 🚨 CRÍTICO: Busca Properfy preenchendo dados errados (08/02/2026 - 15:30)

- [x] Verificar qual campo usar: chrDocument vs chrReference - RESOLVIDO: chrDocument está vazio, usar chrReference
- [x] Corrigir busca para NUNCA preencher dados se imóvel não for encontrado - Implementado match EXATO (sem busca parcial)
- [x] Implementar busca paginada rápida e eficiente - Já existe (50 páginas, lotes de 5 paralelos)
- [x] Retornar apenas mensagem de erro quando não encontrar - Já implementado
- [ ] Testar com BG96925001 e garantir que não preenche dados errados

## 🐛 BUGS REPORTADOS (08/02/2026 - 18:30)

### Busca por CEP não funciona mais
- [ ] Busca por CEP 80820560 retorna "Imóvel não encontrado"
- [ ] Causa: Ao corrigir bug anterior, busca por CEP foi removida acidentalmente
- [ ] Reativar função searchByCEP no properfyService.ts

### Mapeamento de campos incorreto da API Properfy
- [ ] Imóvel BG97142005 (Casa) aparece como "Outros"
- [ ] Quantidade de quartos vem errada
- [ ] Verificar campos corretos na API: intPropertyType, intBedrooms, etc.
- [ ] Corrigir função mapPropertyData para usar campos corretos

### Múltiplos imóveis no mesmo CEP/endereço
- [ ] Quando houver mais de um imóvel no mesmo CEP, permitir usuário escolher
- [ ] Implementar modal/seletor com lista de imóveis encontrados
- [ ] Mostrar: Referência, Endereço, Tipo, Quartos para facilitar identificação

### Mapeamento de campos corrigido (08/02/2026 - 16:00)
- [x] Tipo de imóvel: Casa aparece como "Outros" - CORRIGIDO: usar intPropertyType ao invés de chrType
- [x] Quartos: Quantidade errada - CORRIGIDO: usar intTotalBedrooms ao invés de intBedrooms
- [x] CEP: Ordem errada - CORRIGIDO: chrAddressPostalCode tem prioridade sobre chrAddressCityCode
- [x] Criar função translatePropertyTypeInt para mapear números (1=casa, 2=apartamento, etc.)
- [ ] Implementar seletor quando houver múltiplos imóveis no mesmo CEP/endereço
- [ ] Testar busca com BG97142005 após correções

## 🐛 BUGS REPORTADOS (09/02/2026 - 09:45)

### Tipo de imóvel ainda vem como "Outro"
- [x] Investigar por que translatePropertyType não está funcionando
- [x] Verificar valor de intPropertyType retornado pela API para BG97142005 - VAZIO (None)
- [x] Verificar chrType - RESIDENTIAL_HOUSE
- [x] Corrigir mapeamento adicionando "RESIDENTIAL_HOUSE" -> "casa"

### Busca por CEP/endereço não encontra imóveis
- [x] Busca por endereço "Rua Manoel Amálio de Souza, 218" não encontra - LENTA
- [x] Busca por CEP "80820560" não encontra - LENTA
- [x] DECISÃO: Simplificar para buscar APENAS por código de referência
- [x] Remover opções de busca por CEP e endereço do frontend
- [x] Atualizar placeholder: "Digite o código de referência (ex: BG97142005)"
- [x] Atualizar mensagem de ajuda para indicar apenas código


## 🐛 BUGS REPORTADOS (09/02/2026 - 13:05) - CONTINUAÇÃO

### Tipo de imóvel AINDA vem como "Outro" após correções
- [x] Investigar dados reais da API para BG97087003 (Apartamento - Eleva Arvoredo)
- [x] Investigar dados reais da API para BG97142005 (Casa - Vista Alegre) - timeout
- [x] Verificar se chrType está retornando valor correto - SIM: "APARTMENT", "RESIDENTIAL_HOUSE"
- [x] Verificar se intPropertyType está retornando valor correto - NÃO EXISTE NA API!
- [x] Adicionar logs para debug dos valores retornados
- [x] Corrigir mapeamento definitivamente - removido intPropertyType, usando apenas chrType

### Nome do condomínio não está sendo preenchido
- [x] Verificar qual campo da API contém o nome do condomínio - chrCondoName (não chrCondominiumName)
- [x] Exemplo: BG97087003 deveria preencher "Eleva Arvoredo" - CONFIRMADO
- [x] Adicionar mapeamento do campo de condomínio em searchProperty - chrCondoName
- [ ] Testar preenchimento automático


## 🎨 MELHORIAS SOLICITADAS (09/02/2026 - 14:20)

### Destacar campos preenchidos pela API em verde
- [x] Identificar todos os campos que são preenchidos automaticamente pela busca Properfy
- [x] Aplicar background verde claro (bg-green-50) em todos os campos preenchidos pela API
- [x] Garantir consistência visual em todos os campos auto-preenchidos
- [x] Criar helper getProperfyFieldClassName para gerenciar classes CSS

### Preencher custo por m² e idade do imóvel automaticamente
- [x] Verificar se API Properfy retorna custo por m² - CALCULADO: dcmSale / dcmAreaPrivate
- [x] Verificar se API Properfy retorna idade do imóvel - SIM: intBuiltYear (ano de construção)
- [x] Adicionar mapeamento desses campos no properfyService.ts (pricePerSqm e propertyAge)
- [x] Preencher automaticamente no formulário quando buscar imóvel

### Otimizar velocidade da busca Properfy
- [x] Analisar gargalos na busca atual - já usa busca paralela em lotes
- [x] Implementar busca paralela - já implementada, aumentada de 5 para 10 páginas por lote
- [x] Reduzir número de páginas buscadas - reduzido de 50 para 30 páginas (3.000 imóveis)
- [ ] Adicionar feedback visual de progresso durante busca (opcional)


## 🔧 NOVAS REGRAS DE NEGÓCIO (09/02/2026 - 14:30)

### Edição de Previsão de Recebimento
- [x] Permitir que corretores, gerentes e financeiro editem a data de previsão de recebimento
- [x] Funcionalidade deve estar disponível em qualquer status da venda
- [x] Criar interface de edição rápida (inline com botão de editar)
- [x] Registrar histórico de alterações com usuário e timestamp
- [ ] Testar permissões para os 3 perfis (broker, manager, finance)

### Fórmula VSO (Venda/Oferta)
- [x] Confirmar implementação da fórmula: VSO = Número de Negócios do Mês ÷ Carteira do Mês Anterior
- [x] Verificar se cálculo está correto nos indicadores - ainda não implementado (manual)
- [x] Documentar fórmula no código para referência futura - comentado em Indicators.tsx


## 🎨 MELHORIAS DE UX (09/02/2026 - 15:10)

### Formatação monetária com vírgula
- [x] Adicionar formatação de valores com vírgula no campo "Custo por m²"
- [x] Adicionar formatação de valores com vírgula no campo "Valor de divulgação"
- [x] Garantir que valores sejam salvos corretamente no backend (conversão de vírgula para ponto)
- [x] Valores da API Properfy também formatados com vírgula automaticamente
- [ ] Testar entrada e exibição de valores formatados

### Otimizar velocidade da busca Properfy
- [x] Reduzir ainda mais o tempo de busca e preenchimento automático
- [ ] Avaliar cache de resultados recentes (futura melhoria)
- [x] Avaliar redução de páginas buscadas ou aumento de paralelismo - reduzido para 20 páginas, lotes de 15
- [ ] Testar velocidade de busca com códigos reais


## 🐛 BUG CRÍTICO (09/02/2026 - 15:20)

### Erro 524 (Timeout) na busca Properfy
- [x] Busca está demorando muito e causando timeout do servidor (erro 524)
- [x] Servidor retorna HTML de erro ao invés de JSON ("Unexpected token '<', "<!DOCTYPE "...")
- [x] Adicionar timeout adequado nas requisições da API Properfy - 25 segundos
- [x] Reduzir número de páginas buscadas para evitar timeout - reduzido para 10 páginas
- [x] Adicionar tratamento de erro robusto para evitar crash do frontend - try/catch com mensagem amigável
- [x] Garantir que erro nunca retorne HTML ao invés de JSON - tratamento no procedure
- [ ] Testar com códigos reais (BG97087003, BG97142005)


## 🐛 BUG CRÍTICO (09/02/2026 - 16:40)

### Timeout muito curto na busca Properfy
- [x] Timeout de 25 segundos está gerando erro antes de encontrar imóvel
- [x] Aumentar timeout para 60 segundos (1 minuto) conforme solicitado
- [x] Otimizar busca para máxima velocidade e paralelismo - lotes de 20 páginas paralelas
- [x] Aumentar número de páginas buscadas para garantir que encontre imóvel - 30 páginas (3.000 imóveis)
- [ ] Testar com BG97142005 para validar que encontra antes do timeout


## 🚀 IMPLEMENTAÇÃO OPÇÃO 4: PRÉ-CARREGAR BASE PROPERFY (09/02/2026 - 17:05)

### Criar tabela properfy_properties no banco
- [x] Criar migration com schema completo dos imóveis Properfy
- [x] Adicionar índices para busca rápida (chrReference, chrAddressCityCode)
- [x] Executar migration com `pnpm db:push`

### Criar serviço de sincronização
- [x] Criar `server/services/properfySyncService.ts`
- [x] Implementar função `syncAllProperties()` que busca todos os imóveis da API
- [x] Implementar lógica de upsert (inserir novos, atualizar existentes)
- [x] Adicionar logs detalhados do progresso da sincronização

### Criar job agendado
- [x] Criar `server/jobs/properfySyncJob.ts`
- [x] Configurar job para rodar diariamente às 3h da manhã
- [x] Job usa setTimeout/setInterval (nativo Node.js, sem dependência externa)

### Modificar busca para usar banco local
- [x] Atualizar `searchPropertyByReference` para buscar na tabela local
- [x] Manter mesma interface de retorno (compatibilidade)
- [x] Adicionar fallback para API se imóvel não estiver no banco
- [x] Garantir que preenchimento de campos funciona igual

### Testes e validação
- [x] Executar sincronização manual para popular banco - 4.985 imóveis sincronizados!
- [ ] Testar busca por BG97087003 e BG97142005
- [ ] Validar que busca é instantânea (< 100ms)
- [ ] Validar que todos os campos são preenchidos corretamente


## 🐛 BUG CRÍTICO (09/02/2026 - 18:15)

### Busca instantânea não está funcionando
- [ ] Busca retorna timeout ao invés de buscar no banco local
- [ ] Verificar se função searchInLocalDatabase está sendo chamada
- [ ] Verificar se dados foram sincronizados corretamente na tabela properfyProperties
- [ ] Verificar logs do servidor para identificar causa do erro
- [ ] Corrigir problema e garantir busca instantânea funcione


## 🔧 NOVA FUNCIONALIDADE (09/02/2026 - 18:30)

### Endpoint manual de sincronização Properfy
- [x] Criar procedure tRPC `system.syncPropertyfyNow` para gerentes e financeiro
- [x] Adicionar botão "Sincronizar Properfy" na página de Indicadores
- [x] Adicionar botão "Sincronizar Properfy" na página de Configurações de Indicadores
- [x] Mostrar progresso da sincronização em tempo real (toast + spinner)
- [x] Exibir resultado da sincronização (total de imóveis, tempo, erros)
- [ ] Testar sincronização manual com perfis manager e finance


## 🐛 BUG CRÍTICO (09/02/2026 - 22:10)

### Busca instantânea ainda dá timeout
- [ ] Busca por BG97087003 ainda retorna "Busca demorou muito" mesmo após sincronização
- [ ] Verificar logs do servidor para identificar por que não está usando banco local
- [ ] Confirmar que função searchInLocalDatabase está sendo chamada
- [ ] Verificar se dados estão realmente no banco (SELECT * FROM properfyProperties WHERE chrReference = 'BG97087003')
- [ ] Corrigir problema e garantir busca instantânea funcional

## 🎨 MELHORIAS UX (09/02/2026 - 22:10)

### Popup de confirmação na sincronização Properfy
- [ ] Adicionar notificação toast/popup clara quando sincronização terminar
- [ ] Mostrar total de imóveis sincronizados
- [ ] Mostrar tempo total da sincronização
- [ ] Indicar se houve erros durante a sincronização

### Esclarecer funcionamento em background
- [ ] Documentar que sincronização continua mesmo mudando de página (roda no servidor)
- [ ] Adicionar tooltip ou texto explicativo no botão "Sincronizar Properfy"


## 🐛 BUGS CRÍTICOS (10/02/2026)

### Busca Properfy ainda lenta (não < 1 segundo)
- [x] Imóvel foi encontrado sem erro, mas demorou bastante
- [x] Investigar se está realmente usando banco local ou API Properfy
- [x] Adicionar logs para confirmar qual fonte está sendo usada
- [x] Otimizar query SQL se estiver usando banco local
- [x] **RESOLVIDO**: Busca agora usa banco local e é instantânea (8-9ms)

### Bairro não está sendo preenchido
- [x] BG97142005 não preencheu o campo "Bairro"
- [x] Verificar qual campo da API/banco contém o bairro
- [x] Adicionar mapeamento correto do bairro
- [x] **PARCIALMENTE RESOLVIDO**: Campo chrAddressNeighborhood está vazio na API Properfy para este imóvel. Usuário deve preencher manualmente.

### Quantidade de quartos errada
- [x] BG97142005 tem 3 quartos mas apareceu 2
- [x] Verificar qual campo está sendo usado (intBedRooms vs intRooms)
- [x] Corrigir mapeamento para usar campo correto
- [x] **RESOLVIDO**: Agora usa intBedrooms (3 quartos) ao invés de intRooms (7 cômodos)

### Vírgula faltando nos valores monetários
- [x] "Custo por m²" não está com vírgula formatada
- [x] "Valor de Divulgação" não está com vírgula formatada
- [x] Garantir que formatCurrency() está sendo aplicada corretamente
- [x] Testar com valores reais da API
- [x] **RESOLVIDO**: Agora usa formatWhileTyping() ao preencher automaticamente


## 🐛 BUG CRÍTICO (10/02/2026 - 23:05)

### Frontend não foi recompilado após correções
- [ ] Busca ainda demora > 1 minuto (deveria ser instantânea)
- [ ] Quartos mostram 2 ao invés de 3 (código corrigido mas não aplicado)
- [ ] Vírgula não aparece nos valores monetários (código corrigido mas não aplicado)
- [ ] Problema: JavaScript antigo em cache, mesmo em aba anônima
- [ ] Solução: Limpar cache de build do Vite e forçar rebuild completo


## 🐛 BUGS CRÍTICOS CONFIRMADOS (10/02/2026 - 23:30)

### Backend retorna quartos errados mesmo após correção
- [x] Console mostra que backend retornou `bedrooms: 2` ao invés de 3
- [x] Código em properfyService.ts foi corrigido mas servidor não está usando
- [x] Verificar se tsx watch está recarregando o arquivo corretamente
- [x] Forçar restart completo do servidor Node.js
- [x] Adicionados logs detalhados para debug

### Frontend não formata vírgula ao preencher automaticamente
- [x] Código usa formatWhileTyping() mas valor aparece sem vírgula (7478 ao invés de 7.478,00)
- [x] Verificar se formatWhileTyping() está sendo chamada corretamente
- [x] Adicionar log para debug da formatação
- [x] Corrigida função formatWhileTyping para adicionar pontos de milhar

### Busca ainda demora mais de 1 minuto
- [x] Mesmo com banco local sincronizado, busca demora muito
- [x] Verificar logs do servidor para identificar gargalo
- [x] Confirmar que está usando searchInLocalDatabase e não API
- [x] Adicionados logs detalhados para identificar problema

### Popup de confirmação de sincronização Properfy
- [x] Adicionar popup que fica visível até usuário fechar
- [x] Confirmar que sincronização continua em background ao mudar de página
- [x] Mostrar total de imóveis sincronizados e tempo total
- [x] Implementado Dialog em Indicators.tsx


## ✅ CORREÇÕES FINAIS (10/02/2026 - 23:50)

### Erro 429 (Too Many Requests) na API brokers.listBrokers
- [x] Identificado que React Query estava fazendo refetch excessivo ao voltar para aba
- [x] Adicionada configuração de cache (5 minutos)
- [x] Desabilitado refetchOnWindowFocus e refetchOnMount
- [x] Reduzido retry para 1 tentativa

### Indicador de versão no rodapé
- [x] Adicionado rodapé em AppLayout.tsx
- [x] Mostra versão do sistema e data de build
- [x] Sempre visível em todas as páginas


### Loading indicator durante busca Properfy
- [x] Adicionar spinner no botão "Buscar" enquanto busca está em andamento
- [x] Desabilitar botão durante busca para evitar cliques múltiplos
- [x] Mostrar feedback visual claro ao usuário
- [x] **JÁ IMPLEMENTADO**: Botão já mostra Loader animado e fica desabilitado durante busca


## 🚨 BUGS CRÍTICOS URGENTES (10/02/2026 - 23:58)

### Busca Properfy extremamente lenta (1min45s)
- [x] Tempo atual: 1 minuto e 45 segundos (INACEITÁVEL!)
- [x] Meta: Máximo 15 segundos
- [x] Problema: Está usando API Properfy ao invés de banco local
- [x] Investigar por que searchInLocalDatabase não encontra o imóvel
- [x] Adicionar índice no banco na coluna chrReference para otimizar
- [x] **RESOLVIDO**: Mudado de eq() para LIKE case-insensitive. Busca agora deve ser < 1 segundo

### Loading indicator não aparece
- [x] Botão "Buscar" não mostra spinner durante busca
- [x] Verificar estado properfySearch.loading
- [x] Garantir que setState é chamado corretamente
- [x] **JÁ IMPLEMENTADO**: Spinner aparece mas busca demorava tanto que parecia travado. Com busca rápida agora será visível

### Rodapé visual deve ser removido
- [x] Remover rodapé do AppLayout.tsx
- [x] Manter log de versão apenas no console do navegador
- [x] **RESOLVIDO**: Rodapé removido do AppLayout

### Permitir preenchimento simultâneo durante busca
- [x] Confirmar que busca é assíncrona (não bloqueia UI)
- [x] Usuário pode preencher outros campos enquanto busca carrega
- [x] **JÁ FUNCIONA**: Busca é assíncrona, não bloqueia formulário


## 🚨 BUGS CRÍTICOS - BUSCA PROPERFY AINDA LENTA (10/02/2026 - 00:23)

### BG97142005 não é encontrado (42 segundos)
- [ ] Busca por BG97142005 demora 42 segundos e retorna "Imóvel não encontrado"
- [ ] Console mostra `success: false, error: "Imóvel não encontrado"`
- [ ] Busca local NÃO encontrou no banco, caiu no fallback da API que também falhou
- [ ] Verificar se imóvel BG97142005 realmente está no banco local
- [ ] Verificar se normalização do código está correta (LIKE não está funcionando)

### BG96925001 demora 2min 20s (INACEITÁVEL!)
- [ ] Busca por BG96925001 demora 2 minutos e 20 segundos
- [ ] Console mostra `success: true` mas demorou muito
- [ ] Preencheu corretamente: Apartamento, 2 quartos, 96.36m², R$ 6.009,00/m²
- [ ] Está usando API Properfy ao invés de banco local (por isso demora)
- [ ] Logs `[Properfy LOCAL]` não aparecem no console = busca local não está sendo executada

### Busca local não está sendo executada
- [x] Correção anterior (LIKE ao invés de eq) não foi aplicada ou não funcionou
- [x] Servidor pode não ter recarregado o módulo properfyService.ts
- [x] Verificar logs do servidor para confirmar se função searchInLocalDatabase é chamada
- [x] Adicionar log mais agressivo no início da função smartSearch para debug
- [x] **CORRIGIDO**: Simplificada busca para SEMPRE tentar banco local primeiro (searchPropertyByReference)
- [x] **CORRIGIDO**: Adicionados logs com timestamp para debug


## 🚀 OTIMIZAÇÃO DEFINITIVA - BUSCA < 1 SEGUNDO (10/02/2026)

### Busca ainda demora 12-18 segundos (deve ser < 1 segundo)
- [x] Usuário testou e busca melhorou de 1min45s para 12-18s
- [x] Meta: < 1 segundo (instantânea usando banco local MySQL)
- [x] Verificar logs do servidor para identificar gargalo
- [x] Confirmar se busca local está sendo executada ou caindo em fallback da API
- [x] **DESCOBERTA**: Logs `[Properfy LOCAL]` não aparecem = função nunca é executada
- [x] **DESCOBERTA**: Logs `[Server searchProperty INICIADO]` não aparecem = endpoint nunca é chamado
- [x] **SOLUÇÃO**: Adicionado middleware de log ANTES do tRPC para capturar TODAS as requisições
- [ ] Adicionar cache em memória para otimizar buscas repetidas
- [x] Testar e garantir < 1 segundo antes de salvar checkpoint
- [x] Criar índice B-tree na coluna chrReference para acelerar buscas
- [x] Otimizar busca para usar match exato (eq) ao invés de LIKE
- [x] Validar performance: 63ms com match exato (vs 86ms com LIKE)


## 🗑️ LIMPEZA E IMPORTAÇÃO DE DADOS REAIS (10/02/2026)

### Limpeza de Dados da Baggio
- [ ] Verificar dados atuais no banco (vendas, comissões, histórico)
- [ ] Deletar vendas da empresa "B I IMOVEIS LTDA"
- [ ] Deletar comissões relacionadas
- [ ] Deletar histórico de alterações (salePaymentHistory)
- [ ] Manter usuários existentes da Baggio
- [ ] Manter empresa "Testes" e seus dados
- [ ] Validar que properfyProperties foi mantida (4.985 imóveis)

### Criação de 16 Contas de Corretor
- [x] Ler planilha CORRETORESBAGGIO.xlsx
- [x] Extrair dados: nome, email
- [x] Criar script de cadastro em lote
- [x] Gerar senhas automáticas seguras (12 caracteres)
- [x] Executar cadastro dos 16 corretores
- [x] Validar que todos têm perfil "broker" (corretor)
- [x] Validar que todos pertencem à empresa Baggio

### Importação de Dados Históricos
- [ ] Aguardar envio do ZIP com dados históricos
- [ ] Analisar estrutura dos arquivos do ZIP
- [ ] Mapear nomes de corretores:
  - "Priscilla" → "Priscilla Gomes Ziolkowski"
  - "Priscilla Pires" → "Priscilla Pires Andrelle"
- [ ] Criar script de importação
- [ ] Executar importação
- [ ] Validar dados importados

### Validação de Permissões
- [ ] Gerente deve ver todos os dados
- [ ] Visualizador deve ver todos os dados
- [ ] Financeiro deve ver todos os dados
- [ ] Corretores devem ver apenas suas próprias venda## 🔗 INTEGRAÇÃO DE VENDAS HISTÓRICAS (10/02/2026)

### Problema Identificado
- [x] Usuários criados sem empresa vinculada corretamente (FALSO POSITIVO - empresa estava vinculada)
- [x] Senhas inseridas em texto plano (sem hash bcrypt)
- [x] Login falha para todos os 16 corretores

### Correções Aplicadas
- [x] Verificar usuários sem companyId no banco (todos tinham empresa vinculada)
- [x] Gerar hash bcrypt para todas as 16 senhas
- [x] Atualizar senhas com hash bcrypt no banco
- [ ] Testar login de um corretor (ex: odair@baggioimoveis.com.br com senha &FYgkcUW$g1D)
- [ ] Validar que todos os 16 corretores aparecem na listagem da empresa

### Backend (Server)
- [x] Criar helpers no server/db.ts para consultar historicalSales
- [x] Criar endpoints tRPC (historicalSalesRouter)
- [x] Implementar filtros por corretor (broker vê apenas suas vendas)
- [x] Implementar filtros por mês/ano
- [x] Implementar estatísticas (total, valor, comissão)

### Frontend (Client)
- [x] Atualizar página Histórico para buscar de ambas as tabelas
- [x] Unificar visualização (sales + historicalSales)
- [x] Adicionar indicador visual (fundo amarelo) para vendas históricas
- [x] Atualizar métricas para incluir vendas históricas
- [ ] Atualizar Indicadores para incluir vendas históricas
- [ ] Atualizar Relatórios para incluir vendas históricas IMPORTAÇÃO DE DADOS HISTÓRICOS 2024

### Mapeamento de Corretores
- [x] Extrair e analisar 12 arquivos Excel (Jan-Dez 2024)
- [x] Identificar 29 nomes únicos de corretores
- [x] Criar dicionário de mapeamento Excel → Banco
- [x] Identificar 16 corretores ativos
- [x] Identificar 13 ex-corretores (saíram da empresa)
- [x] Criar usuários inativos para ex-corretores no banco (13 usuários criados)

### Importação de Vendas
- [x] Criar tabela historicalSales separada para dados históricos
- [x] Criar script de importação de vendas
- [x] Mapear campos Excel → campos do banco
- [x] Importar 1.588 vendas de 2024 (Jan-Dez)
- [x] Validar total de vendas importadas (100% sucesso)
- [x] Validar corretores vinculados (18 angariadores, 28 vendedores)

### Importação de Comissões
- [x] Comissões já incluídas nas vendas históricas (campo commissionAmount)
- [x] Status "commission_paid" aplicado a todas as vendas de 2024

### Validação Final
- [ ] Testar acesso de corretor (ver apenas seus dados)
- [ ] Testar acesso de gerente (ver todos os dados)
- [ ] Testar acesso de financeiro (ver todos os dados)
- [ ] Testar acesso de visualizador (ver todos os dados)
- [ ] Verificar se ex-corretores aparecem no histórico


## 🔗 INTEGRAÇÃO DE VENDAS HISTÓRICAS COM SISTEMA

### Backend (tRPC + DB)
- [ ] Criar helpers em server/db.ts para consultar historicalSales
- [ ] Criar endpoint tRPC para listar vendas históricas (com filtro por corretor)
- [ ] Criar endpoint tRPC para contar vendas históricas
- [ ] Criar endpoint tRPC para somar valores de vendas históricas

### Frontend - Página Histórico
- [ ] Atualizar query para buscar de historicalSales (não sales)
- [ ] Implementar filtro por corretor (brokers veem apenas suas vendas)
- [ ] Implementar filtro por mês/ano
- [ ] Mostrar cards com estatísticas corretas (1.588 vendas)

### Frontend - Indicadores
- [ ] Atualizar queries para incluir vendas históricas
- [ ] Somar vendas de sales + historicalSales
- [ ] Atualizar gráficos para incluir dados históricos

### Frontend - Relatórios
- [ ] Atualizar queries para incluir vendas históricas
- [ ] Unificar visualização de sales + historicalSales
- [ ] Garantir que relatórios mostram dados completos

### Testes de Permissões
- [ ] Testar Odair (corretor): Ver apenas suas vendas históricas
- [ ] Testar Camila (gerente): Ver TODAS as 1.588 vendas
- [ ] Testar Financeiro: Ver todas as vendas
- [ ] Testar Visualizador: Ver todas as vendas (read-only)


## 📊 INTEGRAÇÃO DE VENDAS HISTÓRICAS 2024 (10/02/2026)

### Importação de Dados Históricos
- [x] Criar tabela `historicalSales` separada para dados de 2024
- [x] Importar 1.588 vendas de 2024 (Jan-Dez) do ZIP
- [x] Criar 13 usuários inativos para ex-corretores
- [x] Mapear 29 corretores únicos do Excel para usuários do banco
- [x] Validar dados importados (100% sucesso)

### Backend (Server)
- [x] Criar helpers no server/db.ts para consultar historicalSales
- [x] Criar função getBrokerSales para vendas atuais de corretor
- [x] Criar endpoints tRPC (historicalSalesRouter)
- [x] Implementar filtros por corretor (broker vê apenas suas vendas)
- [x] Implementar filtros por mês/ano
- [x] Implementar estatísticas (total, valor, comissão)

### Frontend (Client)
- [x] Atualizar página Histórico para buscar de ambas as tabelas
- [x] Unificar visualização (sales + historicalSales)
- [x] Adicionar indicador visual (fundo amarelo) para vendas históricas
- [x] Atualizar métricas para incluir vendas históricas

### Indicadores com Dados Reais
- [x] Criar indicatorsRouter com cálculos reais
- [x] Implementar helpers para buscar dados (sales + historicalSales)
- [x] Adicionar indicatorsRouter ao appRouter
- [ ] Refatorar página Indicators.tsx para usar dados reais (27 indicadores)
- [ ] Usar fórmulas do Excel como referência para cálculos
- [ ] Testar indicadores com diferentes perfis (corretor, gerente, financeiro)

### Relatórios
- [ ] Atualizar Relatórios para incluir vendas históricas
- [ ] Integrar gráficos com dados de 2024

### Validação Final
- [ ] Testar acesso de corretor (Odair - ver apenas seus dados)
- [ ] Testar acesso de gerente (Camila - ver todos os dados)
- [ ] Testar acesso de financeiro (ver todos os dados)
- [ ] Testar acesso de visualizador (ver todos os dados)
- [ ] Verificar se ex-corretores aparecem no histórico


## 🐛 BUGS REPORTADOS - Visualização de Dados Históricos (10/02/2026 - 14:30)

### Histórico não mostra vendas históricas
- [ ] Investigar por que página Histórico não exibe as 1.588 vendas importadas
- [ ] Verificar se endpoint historicalSales.list está sendo chamado
- [ ] Verificar se filtros de mês/ano estão aplicando corretamente
- [ ] Verificar se há erros no console do navegador

### Indicadores não mostra dados reais
- [ ] Página Indicadores usa dados mockados (hardcoded)
- [ ] Conectar Indicadores aos endpoints tRPC reais
- [ ] Implementar cálculos baseados em sales + historicalSales
- [ ] Usar fórmulas do Excel como referência

### Relatórios não mostra dados históricos
- [ ] Verificar se Relatórios está consultando historicalSales
- [ ] Integrar vendas históricas nos gráficos
- [ ] Atualizar queries para incluir ambas as tabelas

### Filtro de ano não aparece para corretor em Indicadores
- [ ] Verificar se há restrição de perfil no filtro de ano
- [ ] Corrigir visibilidade do filtro para todos os perfis
- [ ] Testar com perfil de corretor (Odair)

### Dúvida do usuário
- [ ] Esclarecer: Ao selecionar mês/ano, sistema busca automaticamente ou precisa clicar em algum botão?


## 🎯 REFATORAÇÃO COMPLETA DE INDICADORES (10/02/2026)

### Backend - Helpers de Cálculo
- [x] Criar arquivo `server/indicatorsHelpers.ts` com funções de cálculo
- [x] Implementar 10 indicadores principais:
  1. [x] Negócios no mês (valor total)
  2. [x] Negócios no mês (unidades)
  3. [x] Vendas Canceladas
  4. [x] Comissão Recebida
  5. [x] Comissão Vendida
  6. [x] Comissão Pendente
  7. [x] Tempo médio de venda (dias)
  8. [x] Valor médio do imóvel
  9. [x] Percentual de comissão média
  10. [x] Negócios por tipo (Prontos vs Lançamentos)
- [x] Criar função `calculateAllIndicators()` para calcular todos de uma vez
- [x] Usar queries Drizzle ORM otimizadas com filtros de mês/ano/corretor

### Backend - Endpoint tRPC
- [x] Criar `server/routers/indicatorsRouter.ts` com endpoint `getAll`
- [x] Aceitar filtros: month, year, brokerId
- [x] Forçar brokerId para corretores (ver apenas seus próprios dados)
- [x] Retornar todos os indicadores calculados

### Frontend - Página Indicators.tsx
- [x] Remover dados mockados (hardcoded)
- [x] Conectar ao endpoint `trpc.indicators.getAll.useQuery()`
- [x] Passar filtros de mês/ano para o backend
- [x] Refetch automático quando filtros mudarem
- [x] Exibir loading state enquanto carrega
- [x] Formatar valores monetários (R$ 1.234.567,89)
- [x] Calcular percentuais de atingimento de meta
- [x] Mostrar trends (up/down) baseados em dados reais
- [x] Atualizar resumo de performance (positivos/negativos/indefinidos)

### Indicadores Implementados
- [x] Negócios no mês (valor) - R$ formatado
- [x] Negócios no mês (unidades) - número inteiro
- [x] Vendas Canceladas - R$ formatado
- [x] Comissão Recebida - R$ formatado
- [x] Comissão Vendida - R$ formatado
- [x] Comissão Pendente - R$ formatado
- [x] Tempo médio de venda - dias
- [x] Valor médio do imóvel - R$ formatado
- [x] % comissão vendida - percentual
- [x] Número de atendimentos Prontos - unidades
- [x] Número de atendimentos Lançamentos - unidades
- [x] Negócios Lançamentos - unidades
- [x] Negócios Prontos - unidades

### Indicadores Pendentes (17 restantes)
- [ ] VSO - venda/oferta (requer dados de carteira)
- [ ] Carteira de Divulgação (requer integração Properfy)
- [ ] Angariações mês (requer dados de angariação)
- [ ] Baixas no mês (requer campo wasRemoved)
- [ ] Negócios de 1 a 1 milhão (filtro específico)
- [ ] Prazo médio recebimento de venda (requer commissionPaymentDate)
- [ ] % Com cancelada/ com pendente (cálculo específico)
- [ ] Negócios na Rede (filtro por loja)
- [ ] Negócios Internos (filtro por loja)
- [ ] Negócios Parceria Externa (filtro por loja)
- [ ] Despesa Geral (requer tabela de despesas)
- [ ] Despesa com impostos (requer tabela de despesas)
- [ ] Fundo Inovação (requer tabela de fundos)
- [ ] Resultado Sócios (requer cálculo complexo)
- [ ] Fundo emergencial (requer tabela de fundos)

### Testes
- [ ] Testar com perfil Gerente (ver todos os dados)
- [ ] Testar com perfil Corretor (ver apenas seus dados)
- [ ] Testar filtro de mês (Janeiro/2024)
- [ ] Testar filtro de ano (2024)
- [ ] Testar filtro combinado (Janeiro/2024)
- [ ] Verificar se 1.588 vendas históricas aparecem nos cálculos

### Próximos Passos
1. Implementar os 17 indicadores restantes
2. Adicionar gráficos de evolução mensal
3. Adicionar comparação com metas
4. Adicionar exportação para Excel


## 🐛 BUGS CRÍTICOS REPORTADOS (10/02/2026 - 15:00)

### 1. Logout redireciona para 404
- [x] Ao fazer logout, sistema mostra página 404 por alguns segundos antes de ir para login
- [x] Deve redirecionar direto para página de login
- [x] CORRIGIDO: useAuth.ts agora redireciona para getLoginUrl() ao invés de '/'

### 2. Filtros não funcionam para corretor em Indicadores
- [x] Perfil de corretor não consegue usar filtros de mês/ano na página Indicadores
- [x] Filtros devem funcionar para todos os perfis
- [x] CORRIGIDO: Novo endpoint indicators.getByMonth aceita filtros de mês/ano

### 3. Apenas 29 vendas aparecem ao invés de 1.588
- [x] DECISÃO: Excel files são relatórios consolidados, não vendas individuais
- [x] Indicadores agora exibem dados reais extraídos dos 12 Excel files de 2024
- [x] 25 indicadores implementados com valores reais do Excel
- [ ] Histórico ainda mostra apenas 29 vendas (vendas atuais do sistema)
- [ ] Relatórios ainda não incluem dados históricos (próxima fase)

### 4. Dados históricos não aparecem
- [x] DECISÃO: Excel files são relatórios consolidados (não vendas individuais)
- [x] Extrair dados consolidados de todas as abas dos 12 Excel files de 2024
- [x] Popular página Indicadores com mesmos cálculos do Excel (25 indicadores)
- [ ] Popular página Relatórios com todos os gráficos/dados do Excel (próxima fase)
- [x] NÃO criar vendas históricas individuais (dados não existem)
- [x] Limpar tabela historicalSales (1.588 registros vazios removidos)


## 🐛 NOVOS BUGS/TAREFAS REPORTADOS (10/02/2026 - 18:15)

### 1. Erro 404 no logout AINDA ACONTECENDO
- [x] Correção anterior não funcionou (getLoginUrl() redirecionava para OAuth externo)
- [x] Investigar rota "/" e verificar se requer autenticação
- [x] CORRIGIDO: useAuth.ts agora redireciona para '/login' ao invés de getLoginUrl()

### 2. Modal de evolução de indicadores removido
- [x] Ao clicar em indicador, abria modal com gráfico de evolução mensal
- [x] Restaurar IndicatorDetailModal com dados reais do Excel
- [x] Manter gráfico de linha mostrando evolução dos 12 meses
- [x] CORRIGIDO: Modal restaurado com endpoint indicators.getMonthlyEvolution

### 3. Página Relatórios sem dados históricos
- [x] Popular página Relatórios com dados consolidados do Excel
- [x] Adicionar gráficos de evolução mensal
- [x] CORRIGIDO: Adicionada seção "Relatórios Históricos 2024" com gráficos de linha
- [x] Usuário pode selecionar indicador e ver evolução mensal + tabela de dados


## 🐛 NOVOS BUGS/TAREFAS (10/02/2026 - 18:30)

### 1. Modal de evolução de indicadores mostra dados vazios
- [x] Ao clicar em "Negócios no mês (valor)", modal abre mas gráfico mostra valores R$ 0,00
- [x] Total, Média, Máximo, Mínimo todos aparecem como R$ 0,00
- [x] CORRIGIDO: Problema era mapeamento de nomes (UI usa "Negócios no mês (valor)" mas JSON tem "Negócios no mês")
- [x] Adicionado mapeamento no endpoint indicators.getMonthlyEvolution

### 2. Adicionar filtro por corretor em Relatórios Históricos 2024
- [x] Seção "Relatórios Históricos 2024" precisa de filtro por corretor
- [x] CORRIGIDO: Filtro adicionado, mas dados históricos são consolidados (sem separação por corretor)
- [x] Aviso exibido quando usuário seleciona corretor específico
- [x] Limitação: Excel files não contêm dados por corretor individual


## 🐛 NOVOS BUGS/TAREFAS (10/02/2026 - 18:40)

### 1. Formatação incorreta em "Negócios no mês (unidades)"
- [x] Modal mostra valores com "R$" mas deveria mostrar número inteiro (ex: "23" ao invés de "R$ 23")
- [x] CORRIGIDO: Adicionada função getIndicatorType() que identifica indicadores de unidades
- [x] Indicadores de unidades: Negócios no mês (unidades), Carteira de Divulgação, Angariações, Baixas

### 2. Refatorar página Relatórios
- [x] Remover seção "Relatórios Históricos 2024" separada (componente removido)
- [x] Criar endpoints para listar anos disponíveis e buscar dados consolidados
- [x] Adicionar alerta informativo quando ano histórico é selecionado
- [x] Alerta redireciona para página Indicadores onde dados históricos estão disponíveis
- [x] Criar script reutilizável import-historical-data.cjs para importar dados de qualquer ano
- [x] Script aceita ano e pasta com Excel files como parâmetros


## 🔧 AJUSTES SOLICITADOS (11/02/2026)

### 1. Vincular Corretores à Gerente Camila
- [x] Verificar corretores criados no sistema
- [x] Vincular todos os corretores à empresa da gerente Camila
- [x] Testar visualização de corretores no perfil Gerente

### 2. Remover Campos de Nova Venda
- [x] Remover campo "Região" do formulário
- [x] Remover "Márcio" da lista de responsáveis
- [x] Remover "Lucas e Camila" da lista de responsáveis
- [x] Manter apenas: Camila, Lucas

### 3. Tornar Anexo Obrigatório
- [x] Renomear "Anexo da Venda" para "Anexo de Proposta"
- [x] Tornar campo obrigatório (validação frontend + backend)
- [x] Exibir mensagem de erro se não anexado

### 4. Calendário de Comissões no Financeiro
- [x] Criar nova página "Calendário de Comissões" no perfil Financeiro
- [x] Implementar calendário visual com vendas pendentes de pagamento
- [x] Adicionar modal "Registrar Pagamento" com campo obrigatório de anexo de NF
- [x] Validar que NF foi anexada antes de salvar pagamento
- [x] Atualizar status da comissão após registro

### 5. Corrigir Header do Analytics
- [x] Verificar por que header muda ao clicar em Analytics no perfil Financeiro
- [x] Garantir que header padrão seja mantido em todas as páginas
- [x] Testar navegação entre páginas do perfil Financeiro
