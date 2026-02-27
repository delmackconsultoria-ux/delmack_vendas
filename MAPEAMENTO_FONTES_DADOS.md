# Mapeamento de Fontes de Dados - Properfy vs Sistema Delmack

## Resumo Executivo

O sistema Delmack integra dados de duas fontes principais:
1. **Properfy API** - Dados de imóveis, anúncios e transações
2. **Sistema Delmack** - Dados de vendas, comissões e gestão interna

---

## 📊 Indicadores de Vendas - Fonte de Dados

### Indicadores que usam dados do **PROPERFY**:

| Indicador | Campo | Descrição | Origem |
|-----------|-------|-----------|--------|
| **Negócios no mês (unidades)** | salesCount | Quantidade de vendas do mês | Properfy (sales/transactions) |
| **Negócios no mês (valores)** | salePrice | Valor total de vendas do mês | Properfy (sales/transactions) |
| **VSO - venda/oferta** | ratio | Relação vendas/anúncios | Properfy (sales vs listings) |
| **Comissão Recebida** | commissionAmount | Valor de comissão recebida | Properfy (commission data) |
| **Ticket Médio** | avgTicket | Valor médio por venda | Properfy (salePrice / salesCount) |

### Indicadores que usam dados do **SISTEMA DELMACK**:

| Indicador | Campo | Descrição | Origem |
|-----------|-------|-----------|--------|
| **Comissão Vendida** | commissionAmount | Comissão gerada pela venda | Delmack (sales table) |
| **Metas Mensais** | monthlyGoal | Meta de vendas do mês | Delmack (goals table) |
| **Atingimento de Meta** | percentage | % da meta atingida | Delmack (calculado: vendas/meta) |
| **Vendas Canceladas** | cancelledCount | Quantidade de vendas canceladas | Delmack (sales.status = 'cancelled') |
| **Comissão Cancelada** | cancelledCommission | Comissão de vendas canceladas | Delmack (sales.status = 'cancelled') |

### Indicadores **HÍBRIDOS** (Properfy + Delmack):

| Indicador | Campos | Descrição | Origem |
|-----------|--------|-----------|--------|
| **Comissão Pendente** | commissionAmount, paymentStatus | Comissão aguardando recebimento | Properfy (transação) + Delmack (status) |
| **Tempo Médio de Venda** | listingDate, saleDate | Dias entre anúncio e venda | Properfy (dates) + Delmack (tracking) |
| **Taxa de Conversão** | listings, sales | % de anúncios que viraram vendas | Properfy (ambos) |

---

## 🗄️ Tabelas do Banco de Dados

### Tabelas que recebem dados do **PROPERFY**:

```sql
-- Sincronização automática a cada 2 horas
propertyListings (
  propertyReference,      -- Código Properfy
  title,
  description,
  listingPrice,
  listingDate,
  propertyType,
  location,
  ...
)

sales (
  propertyReference,      -- Vinculado ao Properfy
  salePrice,
  saleDate,
  ...
)
```

### Tabelas que recebem dados do **SISTEMA DELMACK**:

```sql
-- Dados inseridos manualmente ou via formulário
sales (
  id,
  brokerName,             -- Corretor (Delmack)
  acquisitionBroker,      -- Angariador (Delmack)
  commissionAmount,       -- Calculada (Delmack)
  commissionPercentage,   -- Definida (Delmack)
  businessType,           -- Tipo de negócio (Delmack)
  status,                 -- Status da venda (Delmack)
  ...
)

historicalSales (
  -- Dados históricos de 2024, 2025, janeiro 2026
  -- Importados via Excel
  saleDate,
  salePrice,
  commissionAmount,
  brokerName,
  ...
)

goals (
  -- Metas mensais por indicador
  indicatorName,
  month,
  year,
  targetValue,
  ...
)
```

---

## 📈 Fluxo de Dados - 2024, 2025, Janeiro 2026

### Dados Históricos (Tabela: `historicalSales`)

| Período | Total Vendas | Valor Total | Origem | Status |
|---------|--------------|-------------|--------|--------|
| **2024** | 92 vendas | R$ 56.670.500 | Excel importado | ✅ Ativo |
| **2025** | 69 vendas | R$ 40.416.328 | Excel importado | ✅ Ativo |
| **Jan 2026** | 15 vendas | R$ 1.356.364 | Properfy + Delmack | ✅ Ativo |
| **Total** | **176 vendas** | **R$ 98.443.192** | Misto | ✅ Ativo |

### Campos da Tabela `historicalSales`:

```typescript
interface HistoricalSale {
  id: string;
  companyId: string;              // "B I IMOVEIS LTDA"
  propertyReference: string;      // Código Properfy (se disponível)
  saleDate: Date;                 // Data da venda
  acquisitionDate: Date;          // Data da angariação
  listingPrice: number;           // Valor do anúncio
  salePrice: number;              // Valor da venda (PROPERFY)
  commissionAmount: number;       // Comissão (DELMACK)
  commissionPercentage: number;   // % Comissão (DELMACK)
  acquisitionBrokerName: string;  // Angariador (DELMACK)
  saleBrokerName: string;         // Vendedor (DELMACK)
  businessType: string;           // Tipo: Prontos/Lançamentos (DELMACK)
  acquisitionStore: string;       // Loja Angariadora (DELMACK)
  saleStore: string;              // Loja Vendedora (DELMACK)
  status: string;                 // "commission_paid" (DELMACK)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔄 Sincronização de Dados

### Properfy → Delmack

**Frequência:** A cada 2 horas (automático)

**Dados sincronizados:**
- Novos anúncios (propertyListings)
- Transações/Vendas (sales)
- Preços atualizados
- Status de imóveis

**Endpoint:** `/api/sync/properfy`

### Delmack → Banco Local

**Frequência:** Em tempo real (ao salvar)

**Dados inseridos:**
- Novas vendas (formulário "Nova Venda")
- Comissões calculadas
- Status de aprovação
- Observações e histórico

---

## 📋 Exemplo: Indicador "Comissão Vendida"

### Fluxo de Dados:

```
1. Corretor cria venda no formulário "Nova Venda"
   ↓
2. Sistema busca imóvel no Properfy (salePrice)
   ↓
3. Delmack calcula comissão baseado em:
   - Valor da venda (Properfy)
   - % Comissão definida (Delmack)
   - Tipo de negócio (Delmack)
   ↓
4. Venda é salva na tabela `sales` com status "Proposta"
   ↓
5. Indicador "Comissão Vendida" busca:
   - SUM(commissionAmount) FROM sales
   - WHERE status IN ('Proposta', 'Vendido', 'Em análise', 'Comissão paga')
   - AND saleDate BETWEEN start AND end
```

### Dados Retornados:

```json
{
  "indicatorName": "Comissão Vendida",
  "year": 2026,
  "month": "Fevereiro",
  "statistics": {
    "total": 66100000,      // SUM de todas as comissões
    "average": 6610000,     // Média por venda
    "maximum": 8000000,     // Maior comissão
    "minimum": 5200000,     // Menor comissão
    "trend": 10.2           // % variação vs mês anterior
  },
  "monthlyData": [
    {
      "month": "Janeiro",
      "value": 5500000,
      "salesCount": 8,
      "source": "Properfy + Delmack"
    }
  ]
}
```

---

## 🔐 Permissões por Perfil

### Corretor
- ✅ Ver seus próprios dados (Delmack)
- ✅ Ver dados históricos agregados (2024-2025)
- ❌ Ver dados de outros corretores
- ❌ Editar metas

### Gerente (Camila)
- ✅ Ver dados de sua equipe (Delmack)
- ✅ Ver dados históricos agregados (2024-2025)
- ✅ Filtrar por corretor
- ✅ Editar metas
- ✅ Ver dados do Properfy

### Financeiro
- ✅ Ver todos os dados agregados
- ✅ Ver dados históricos completos
- ✅ Filtrar por período
- ✅ Exportar relatórios
- ❌ Editar dados de vendas

---

## 🚀 Próximas Melhorias

1. **Integração em tempo real com Properfy** - Atualmente a cada 2h
2. **Webhook do Properfy** - Receber notificações de novos imóveis
3. **Validação de dados** - Verificar consistência entre Properfy e Delmack
4. **Auditoria completa** - Rastrear todas as alterações de dados
5. **Exportação de relatórios** - Gerar PDFs com dados históricos

---

**Última atualização:** 27/02/2026  
**Responsável:** Sistema Delmack  
**Status:** ✅ Documentação Ativa
