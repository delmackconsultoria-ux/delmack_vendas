# Mapeamento de Fontes de Dados - Página de Indicadores

## 📊 Visão Geral

A página de **Indicadores** exibe dados de desempenho de vendas que são coletados de duas fontes principais:

1. **Properfy** - Sistema de gestão de imóveis (dados de angariações e propriedades)
2. **Delmack** - Sistema interno de vendas (dados de vendas realizadas e comissões)

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    PÁGINA DE INDICADORES                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐      ┌──────────────────────┐     │
│  │   DADOS DO PROPERFY  │      │  DADOS DO DELMACK    │     │
│  ├──────────────────────┤      ├──────────────────────┤     │
│  │ • Propriedades Ativas│      │ • Vendas Realizadas  │     │
│  │ • Angariações        │      │ • Comissões          │     │
│  │ • Ofertas            │      │ • Status de Vendas   │     │
│  │ • Atendimentos       │      │ • Dados Históricos   │     │
│  └──────────────────────┘      └──────────────────────┘     │
│           ▼                              ▼                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    INDICADORES CALCULADOS (tRPC Router)              │   │
│  └──────────────────────────────────────────────────────┘   │
│           ▼                                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Negócios no Mês (unidades)                        │   │
│  │  • VSO - Venda/Oferta                               │   │
│  │  • Comissão Vendida                                 │   │
│  │  • Comissão Recebida                                │   │
│  │  • Vendas Canceladas                                │   │
│  │  • Ticket Médio                                     │   │
│  │  • E outros...                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Indicadores por Fonte

### ✅ INDICADORES DO DELMACK (Sistema Interno)

| Indicador | Origem | Cálculo | Tabela | Observações |
|-----------|--------|---------|--------|-------------|
| **Negócios no Mês (unidades)** | Delmack | COUNT(sales) onde status='sale' | sales | Vendas com status finalizado |
| **Negócios no Mês (valor)** | Delmack | SUM(saleValue) | sales | Soma dos valores de venda |
| **Ticket Médio** | Delmack | SUM(saleValue) / COUNT(sales) | sales | Valor médio por venda |
| **Comissão Vendida** | Delmack | SUM(totalCommission) | sales | Total de comissões registradas |
| **Comissão Recebida** | Delmack | SUM(commissionAmountReceived) | sales | Comissões efetivamente recebidas |
| **Comissão Pendente** | Delmack | SUM(totalCommission - commissionAmountReceived) | sales | Diferença entre vendida e recebida |
| **% Comissão Vendida** | Delmack | (Comissão Vendida / Negócios Valor) * 100 | sales | Percentual de comissão sobre vendas |
| **Vendas Canceladas** | Delmack | COUNT(sales) onde status='cancelled' | sales | Vendas com status cancelado |
| **Vendas Acima de 1M** | Delmack | COUNT(sales) onde saleValue > 1.000.000 | sales | Vendas de alto valor |
| **Prazo Médio Recebimento** | Delmack | AVG(DATEDIFF(commissionPaymentDate, saleDate)) | sales | Dias entre venda e recebimento |
| **VSO - Venda/Oferta** | Delmack + Properfy | COUNT(sales) / COUNT(properties_ativas) | sales + properties | Relação vendas/ofertas ativas |
| **Negócios Internos** | Delmack | COUNT(sales) onde brokerAngariadorType='internal' AND brokerVendedorType='internal' | sales | Ambos corretores internos |
| **Negócios Rede UNA** | Delmack | COUNT(sales) onde businessType contém 'rede' | sales | Negócios com rede UNA |
| **Negócios Lançamentos** | Delmack | COUNT(sales) onde saleType='lancamento' | sales | Vendas de lançamentos |
| **Negócios Prontos** | Delmack | COUNT(sales) onde saleType='pronto' | sales | Vendas de imóveis prontos |

---

### 🏢 INDICADORES DO PROPERFY (Sistema de Imóveis)

| Indicador | Origem | Cálculo | Tabela | Observações |
|-----------|--------|---------|--------|-------------|
| **Carteira Ativa** | Properfy | COUNT(properties) onde status='ativa' | properties | Imóveis em carteira ativa |
| **Angariações do Mês** | Properfy | COUNT(properties) onde listingDate no mês | properties | Novas propriedades listadas |
| **Baixas do Mês** | Properfy | COUNT(properties) onde delistingDate no mês | properties | Propriedades removidas |
| **Atendimentos Prontos** | Properfy | COUNT(visits) onde propertyType='pronto' | properfy_visits | Visitas em imóveis prontos |
| **Atendimentos Lançamentos** | Properfy | COUNT(visits) onde propertyType='lancamento' | properfy_visits | Visitas em lançamentos |

---

### 🔗 INDICADORES HÍBRIDOS (Delmack + Properfy)

| Indicador | Origem | Cálculo | Observações |
|-----------|--------|---------|-------------|
| **VSO (Venda/Oferta)** | Ambas | Vendas Delmack / Carteira Ativa Properfy | Eficiência de conversão |
| **Taxa de Conversão** | Ambas | Vendas / Angariações | Percentual de angariações convertidas em vendas |
| **Valor Médio Properfy** | Properfy | AVG(advertisementValue) | Valor médio dos imóveis em carteira |

---

## 📊 Dados Históricos (2024, 2025, 2026)

### Origem dos Dados Históricos

| Período | Origem | Status | Observações |
|---------|--------|--------|-------------|
| **2024** | Delmack | ✅ Importado | 101 vendas importadas do Excel histórico |
| **2025** | Delmack | ✅ Importado | 124 vendas importadas do Excel histórico |
| **Janeiro 2026** | Delmack | ✅ Importado | Dados iniciais do ano atual |
| **Fevereiro+ 2026** | Delmack | 🔄 Tempo Real | Dados sendo registrados no sistema |

---

## 🔐 Permissões de Acesso

### Por Perfil de Usuário

| Perfil | Acesso a Indicadores | Dados Visíveis |
|--------|----------------------|----------------|
| **Super Admin** | ✅ Sim | Todos os indicadores, todas as empresas |
| **Admin** | ✅ Sim | Todos os indicadores da empresa |
| **Gerente** | ✅ Sim | Indicadores da equipe (corretores vinculados) |
| **Corretor** | ✅ Sim | Apenas seus próprios indicadores |
| **Financeiro** | ✅ Sim | Indicadores de comissão e pagamentos |
| **Viewer** | ✅ Sim (Leitura) | Indicadores públicos apenas |

---

## 🔄 Sincronização de Dados

### Properfy → Delmack

```
Sincronização Automática (a cada 4 horas)
├─ Busca propriedades ativas do Properfy
├─ Atualiza tabela `properties`
├─ Recalcula indicadores de carteira
└─ Notifica sobre novas angariações
```

### Delmack → Indicadores

```
Cálculo em Tempo Real (quando acessada a página)
├─ Busca vendas do período (mês/ano selecionado)
├─ Agrupa por mês
├─ Calcula estatísticas
├─ Retorna via tRPC router
└─ Exibe no frontend
```

---

## 📈 Exemplo: Cálculo do Indicador "Negócios no Mês"

### Fevereiro 2026

```sql
-- Query no Delmack
SELECT 
  COUNT(*) as total_vendas,
  SUM(saleValue) as valor_total,
  SUM(saleValue) / COUNT(*) as ticket_medio,
  SUM(totalCommission) as comissao_vendida
FROM sales
WHERE 
  companyId = 'company_123'
  AND YEAR(saleDate) = 2026
  AND MONTH(saleDate) = 2
  AND status IN ('sale', 'commission_paid')
```

### Resultado Exibido

```
┌─────────────────────────────────┐
│ Negócios no Mês (Fevereiro 2026) │
├─────────────────────────────────┤
│ Total: 15 vendas                │
│ Valor: R$ 3.450.000,00          │
│ Ticket Médio: R$ 230.000,00     │
│ Comissão: R$ 172.500,00         │
└─────────────────────────────────┘
```

---

## 🛠️ Manutenção e Atualizações

### Quando Atualizar Dados Históricos

1. **Importação de Novo Período**: Executar script SQL de importação
   ```bash
   mysql -h host -u user -p database < import_2024_data.sql
   mysql -h host -u user -p database < import_2025_data.sql
   ```

2. **Sincronização Properfy**: Automática a cada 4 horas
   ```
   Cron Job: 0 */4 * * * /home/ubuntu/delmack_real_estate/scripts/sync-properfy.sh
   ```

3. **Recalcular Indicadores**: Automático ao acessar a página
   ```
   Frontend: Chama tRPC router `indicators.getIndicatorHistory`
   ```

---

## 📝 Notas Importantes

1. **Dados Históricos**: Importados uma única vez, não são atualizados automaticamente
2. **Dados Atuais**: Calculados em tempo real a cada acesso
3. **Comissões**: Podem ser registradas como "Pendente" ou "Recebida"
4. **Filtros**: Página permite filtrar por Mês, Ano e Tipo de Negócio
5. **Performance**: Indicadores são cacheados por 5 minutos para otimizar performance

---

## 🔗 Referências

- **Tabela de Vendas**: `/home/ubuntu/delmack_real_estate/drizzle/schema.ts` (sales table)
- **tRPC Router**: `/home/ubuntu/delmack_real_estate/server/routers/indicatorsRouter.ts`
- **Frontend**: `/home/ubuntu/delmack_real_estate/client/src/pages/Indicators.tsx`
- **Modal Histórico**: `/home/ubuntu/delmack_real_estate/client/src/components/IndicatorHistoryModal.tsx`

---

**Última atualização**: 27 de Fevereiro de 2026
**Responsável**: Sistema Delmack
