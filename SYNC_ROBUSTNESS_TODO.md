# Plano de Robustez - Sincronização de Cards Properfy

## Fase 1: Tabela de Histórico e Status
- [ ] Criar tabela `properfySyncHistory` com campos:
  - `id` (PK)
  - `syncType` (enum: 'cards', 'properties', 'leads')
  - `status` (enum: 'pending', 'in_progress', 'completed', 'failed')
  - `startedAt` (timestamp)
  - `completedAt` (timestamp)
  - `totalRecords` (int)
  - `processedRecords` (int)
  - `failedRecords` (int)
  - `errorMessage` (text)
  - `lastPageProcessed` (int)
  - `nextPageToProcess` (int)

- [ ] Criar tabela `properfySyncErrors` com campos:
  - `id` (PK)
  - `syncHistoryId` (FK)
  - `recordId` (string)
  - `errorMessage` (text)
  - `errorCode` (string)
  - `retryCount` (int)
  - `createdAt` (timestamp)

## Fase 2: Sistema de Retry com Backoff
- [ ] Implementar função `retryWithBackoff()` com:
  - Tentativas: 5
  - Delay inicial: 1s
  - Multiplicador: 2 (1s, 2s, 4s, 8s, 16s)
  - Max delay: 60s
  - Jitter aleatório: ±10%

- [ ] Aplicar retry em:
  - Requisições HTTP à API Properfy
  - Operações de banco de dados
  - Processamento de cards

## Fase 3: Validação e Sanitização
- [ ] Validar campos obrigatórios:
  - `id` (number)
  - `fkPipeline` (number, deve estar em [20, 21, 24, 49])
  - `fkTimeline` (number)
  - `fkLead` (number)

- [ ] Sanitizar strings:
  - Remover caracteres especiais perigosos
  - Limitar tamanho máximo
  - Validar encoding UTF-8

- [ ] Validar datas:
  - Formato ISO 8601
  - Não podem ser no futuro
  - Não podem ser antes de 2020

## Fase 4: Detecção de Duplicatas
- [ ] Implementar verificação de duplicatas:
  - Por `id` (chave primária)
  - Por `fkPipeline + fkLead + dttRegistered` (combinação única)

- [ ] Estratégia de merge:
  - Se card existe: atualizar apenas campos modificados
  - Manter histórico de alterações
  - Log de quando foi atualizado

## Fase 5: Sistema de Alertas
- [ ] Criar notificação quando:
  - Sincronização falha 3 vezes seguidas
  - Sincronização demora mais de 30 minutos
  - Nenhum card foi sincronizado em 24 horas
  - Taxa de erro > 5%

- [ ] Enviar alertas via:
  - Email para admin
  - Notificação in-app
  - Log estruturado

## Fase 6: Snapshot Mensal
- [ ] Criar tabela `indicatorSnapshots` com:
  - `id` (PK)
  - `month` (YYYY-MM)
  - `indicatorName` (string)
  - `value` (number)
  - `createdAt` (timestamp)

- [ ] Implementar job que:
  - Roda no último dia do mês às 23:59
  - Calcula todos os indicadores do mês
  - Salva snapshot
  - Valida que valores não diminuem

## Fase 7: Dashboard de Monitoramento
- [ ] Criar página `/admin/sync-status` com:
  - Status atual da sincronização
  - Histórico das últimas 10 sincronizações
  - Gráfico de taxa de sucesso
  - Lista de erros recentes
  - Botão para forçar sincronização manual
  - Botão para resetar sincronização

## Fase 8: Testes
- [ ] Teste de sincronização completa
- [ ] Teste de falha e recuperação
- [ ] Teste de duplicatas
- [ ] Teste de validação de dados
- [ ] Teste de snapshot mensal
- [ ] Teste de alertas
- [ ] Teste de performance (tempo máximo 30 minutos)

---

## Estimativa de Tempo
- Fase 1: 30 min (schema + migrations)
- Fase 2: 45 min (retry logic)
- Fase 3: 30 min (validation)
- Fase 4: 30 min (deduplication)
- Fase 5: 45 min (alerts)
- Fase 6: 30 min (snapshots)
- Fase 7: 60 min (dashboard)
- Fase 8: 60 min (tests)

**Total: ~4 horas**
