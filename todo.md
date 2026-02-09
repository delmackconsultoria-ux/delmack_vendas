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
