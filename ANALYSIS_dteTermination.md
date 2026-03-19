# Análise de dteTermination - Indicador "Baixas no mês"

## Problema Identificado
O indicador "Baixas no mês" está retornando **4.129** (todos os registros históricos) em vez dos valores corretos:
- Janeiro 2026: 35 baixas
- Fevereiro 2026: 41 baixas
- Março 2026: ainda não temos dados

## Causa Raiz
Campo `dteTermination` está **100% vazio (NULL)** em todos os 4.129 registros com status de baixa.

### Verificação no Banco de Dados
```sql
SELECT 
  chrTransactionType,
  COUNT(*) as total,
  SUM(CASE WHEN dteTermination IS NOT NULL THEN 1 ELSE 0 END) as com_dteTermination
FROM properfyProperties 
WHERE chrStatus IN ('REMOVED', 'RENTED', 'IN_TERMINATION')
GROUP BY chrTransactionType;
```

**Resultado:**
- SALE: 1.526 registros, 0 com dteTermination
- RENT: 2.600 registros, 0 com dteTermination
- BOTH: 2 registros, 0 com dteTermination
- NULL: 1 registro, 0 com dteTermination

## Código de Sincronização
Arquivo: `/home/ubuntu/delmack_real_estate/server/services/properfySyncService.ts`

Linha 219 - Mapeamento está correto:
```typescript
dteTermination: property.dteTermination ? new Date(property.dteTermination) : null,
```

## Próximas Ações
1. **Obter URL exata da requisição ao Properfy** que retorna `dteTermination` preenchido
2. **Verificar se há filtro especial** necessário na API (ex: `chrTransactionType=SALE`)
3. **Atualizar sincronização** para puxar dados com `dteTermination` preenchido
4. **Validar números**: janeiro=35, fevereiro=41

## Regra Importante
**SEMPRE filtrar por `chrTransactionType = 'SALE'`** ao puxar dados de vendas do Properfy!
