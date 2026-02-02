# TODO - Preparação para Produção

## 📊 Implementação de Funcionalidades (27/01/2026)

### Sugestão 2: Campos de Preenchimento Manual
- [x] Criar tabela `monthly_indicators` no schema
- [x] Criar endpoints tRPC para CRUD de indicadores mensais
- [x] Implementar interface de preenchimento para Gerente/Financeiro
- [x] Campos: Despesa Geral, Despesa com Impostos, Fundo Inovação, Resultado Sócios, Fundo Emergencial
- [x] Adicionar validação de permissões (apenas manager e finance)
- [ ] Integrar valores manuais com página de Indicadores

### Sugestão 3: Sincronização Automática Properfy
- [x] Criar serviço de sincronização `properfySyncService.ts`
- [x] Implementar busca de todos os imóveis ativos
- [x] Salvar/atualizar status (chrStatus) no banco local
- [x] Salvar/atualizar datas (dteNewListing, dteTermination)
- [x] Criar job agendado diário (executar às 2h da manhã)
- [x] Adicionar logs de sincronização
- [x] Implementar tratamento de erros e retry

### Estrutura de Dados:
```
monthly_indicators:
- id (PK)
- month (YYYY-MM)
- companyId
- generalExpense (decimal)
- taxExpense (decimal)
- innovationFund (decimal)
- partnerResult (decimal)
- emergencyFund (decimal)
- createdBy
- createdAt
- updatedAt

properties_cache:
- id (PK)
- properfyId
- chrReference
- chrDocument
- chrStatus
- dteNewListing
- dteTermination
- lastSyncAt
- companyId
```
