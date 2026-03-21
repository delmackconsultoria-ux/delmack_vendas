# Análise Completa: Indicador "Baixas no Mês"

## Contexto
Investigação sobre o indicador "Baixas no mês (em quantidade)" que estava retornando 1.526 em março, enquanto janeiro retornou 41 e fevereiro retornou 27.

## Descobertas

### 1. Estrutura de Dados no Properfy
- **Campo `dteTermination`**: Deveria indicar data de término/baixa do imóvel
- **Status**: 100% VAZIO em todos os registros (0 imóveis com `dteTermination IS NOT NULL`)
- **Total de imóveis para venda**: 2.257 (chrTransactionType='sale')
- **Total geral de imóveis**: 5.084

### 2. Distribuição de Status em Março
Todos os 1.526 imóveis com status de baixa foram atualizados em março:

| Status | Quantidade |
|--------|-----------|
| REMOVED | 2.426 |
| RENTED | 1.650 |
| IN_TERMINATION | 56 |
| **Total** | **4.132** |

Dos 2.257 imóveis para venda, 1.526 estão com status de baixa.

### 3. Análise de Variação Acumulada
| Período | Total Acumulado | Diferença |
|---------|-----------------|-----------|
| Até Janeiro 2026 | 0 | 0 |
| Até Fevereiro 2026 | 0 | 0 |
| Até Março 2026 | 1.526 | 1.526 |

**Conclusão**: Todos os 1.526 imóveis foram sincronizados/atualizados em março, não em janeiro ou fevereiro.

### 4. Lógica Atual (Incorreta)
```sql
WHERE chrTransactionType = 'sale'
AND chrStatus IN ('REMOVED', 'RENTED', 'IN_TERMINATION')
AND (
  (dteTermination IS NOT NULL AND dteTermination >= startDate AND dteTermination <= endDate)
  OR
  (dteTermination IS NULL AND updatedAt >= startDate AND updatedAt <= endDate)
)
```

**Problema**: Como `dteTermination` está sempre NULL, usa `updatedAt` como fallback. Isso conta TODAS as atualizações em março, não apenas as baixas reais.

### 5. Números Mencionados
- **Janeiro**: 41 baixas
- **Fevereiro**: 27 baixas
- **Março**: 1.526 baixas (atual - INCORRETO)

**Observação**: Os números 41 e 27 não podem vir do Properfy (nenhum registro atualizado nesses meses). Devem vir de outra fonte.

## Opções de Solução

### Opção 1: Usar apenas chrStatus='REMOVED' (sem data)
```sql
WHERE chrTransactionType = 'sale'
AND chrStatus = 'REMOVED'
```
- Resultado: Contaria apenas imóveis removidos, sem considerar mês específico
- Problema: Não diferencia por mês

### Opção 2: Usar Sistema de Vendas em vez de Properfy
- Usar tabela `sales` com status de cancelamento
- Contar vendas canceladas por mês
- Mais preciso para dados históricos

### Opção 3: Aguardar preenchimento de dteTermination
- Depender de sincronização correta do Properfy
- Usar lógica atual quando dados estiverem completos

## Próximas Ações
1. Consultar com usuário qual é a fonte correta dos números 41 e 27
2. Definir qual opção de solução usar
3. Implementar correção na função `calculateRemovedPropertiesCount()`
