# Guia de Importação de Excel para Sistema Delmack

## 📋 Visão Geral

O script `import_excel.py` permite importar dados históricos de vendas do Excel para o banco de dados MySQL do sistema Delmack.

## 🚀 Como Usar

### Comando Básico

```bash
python3 import_excel.py <arquivo_excel.xlsx> [company_id]
```

### Exemplos

```bash
# Importar com company_id padrão
python3 import_excel.py 01Relatório_Jan_2025.xlsx

# Importar especificando company_id
python3 import_excel.py 01Relatório_Jan_2025.xlsx minha_empresa_123
```

## 📊 Formato do Excel

### Estrutura Esperada

- **Aba:** GERAL
- **Cabeçalho:** Linha 2 (índice 2)
- **Dados:** A partir da linha 4

### Colunas Mapeadas

| Coluna no Excel | Campo no Banco | Tipo | Obrigatório |
|-----------------|----------------|------|-------------|
| REFERÊNCIA | propertyReference | text | ✅ Sim |
| IMÓVEL | propertyAddress | text | Não |
| BAIRRO | propertyNeighborhood | text | Não |
| DATA DA VENDA | saleDate | date | Não |
| DATA DA ANGARIAÇÃO | listingDate | date | Não |
| TEMPO VENDA | listingToSaleDays | int | Não |
| VALOR DE DIVULGAÇÃO | advertisementValue | decimal | Não |
| VALOR VENDA | saleValue | decimal | ✅ Sim |
| TIPO DE  NEGÓCIO  | businessType | text | Não |
| LOJA ANGARIADORA | listingStore | text | Não |
| LOJA VENDEDORA | sellingStore | text | Não |
| COMISSÃO | totalCommission | decimal | Não |
| % COMISSÃO | totalCommissionPercent | decimal | Não |
| ANGARIADOR | brokerAngariadorName | text | Não |
| VENDEDOR | brokerVendedorName | text | Não |
| DE ONDE VEIO O CLIENTE | clientOrigin | text | Não |
| FORMA DE PAGAMENTO | paymentMethod | text | Não |
| SITUAÇÃO CARTEIRA | status | text | Não |
| EQUIPE | team | text | Não |

**Nota:** O campo "TIPO DE  NEGÓCIO " tem um espaço extra no final no Excel.

## ✅ Validação de Dados

### Campos Obrigatórios

1. **REFERÊNCIA** - Código do imóvel (ex: BG96867001)
2. **VALOR VENDA** - Valor da venda em reais

### Campos Calculados Automaticamente

1. **priceDiscount** = VALOR DE DIVULGAÇÃO - VALOR VENDA
2. **bankReturnAmount** = VALOR FINANCIADO × (% RETORNO BANCÁRIO / 100)
3. **listingToSaleDays** = DATA DA VENDA - DATA DA ANGARIAÇÃO (em dias)
4. **buyerName** = "Comprador {REFERÊNCIA}" (se não houver nome do comprador)

## 📈 Relatório de Importação

Ao final da execução, o script exibe:

```
============================================================
📊 RELATÓRIO DE IMPORTAÇÃO
============================================================
Total de linhas no Excel: 354
✅ Importadas com sucesso: 29
⚠️  Ignoradas (dados faltando): 325
❌ Erros: 0
============================================================
```

### Interpretação

- **Importadas com sucesso:** Vendas inseridas no banco de dados
- **Ignoradas:** Linhas vazias, totalizadores ou sem dados obrigatórios
- **Erros:** Linhas com erro de processamento (SQL, formato, etc.)

## 🔧 Requisitos Técnicos

### Dependências Python

```bash
sudo pip3 install openpyxl mysql-connector-python pandas
```

### Variável de Ambiente

O script lê a conexão do banco de dados da variável `DATABASE_URL`:

```bash
export DATABASE_URL="mysql://user:pass@host:port/database"
```

## ⚠️ Observações Importantes

### 1. Linhas Ignoradas

O Excel contém muitas linhas de totalizadores e agrupamentos que serão automaticamente ignoradas. Isso é normal e esperado.

### 2. Referências Sem Código

Algumas vendas podem ter "S REF" (Sem Referência) no campo REFERÊNCIA. Essas vendas serão importadas normalmente.

### 3. Duplicação de Dados

O script **NÃO** verifica duplicatas. Se você executar o mesmo arquivo duas vezes, os dados serão duplicados no banco.

**Recomendação:** Antes de reimportar, limpe os dados anteriores ou adicione lógica de verificação de duplicatas.

### 4. Campos Não Mapeados

Alguns campos do Excel não foram mapeados porque não existem no banco de dados:

- APOIO PREMIAÇÃO
- Diferença valores vendidos
- Colunas "Unnamed" (vazias)

## 🔄 Próximas Melhorias

### Pendente de Implementação

1. **Aba "Comissões Pendentes"**
   - Importar dados de comissões a receber
   - Atualizar campo `expectedPaymentDate`

2. **Aba "Comissões Recebidas"**
   - Importar dados de pagamentos realizados
   - Preencher campos: `commissionPaymentDate`, `commissionAmountReceived`, `commissionPaymentBank`, `commissionPaymentMethod`

3. **Verificação de Duplicatas**
   - Checar se venda já existe antes de inserir
   - Opção de atualizar ou ignorar duplicatas

4. **Importação em Lote**
   - Importar múltiplos arquivos de uma vez
   - Exemplo: importar todos os meses de 2025

5. **Validação Avançada**
   - Verificar se corretor existe no sistema
   - Validar valores de comissão
   - Alertar sobre inconsistências

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique se o arquivo Excel está no formato correto
2. Confirme que a variável `DATABASE_URL` está configurada
3. Execute o script com debug ativado para ver erros detalhados

## 📝 Exemplo de Uso Completo

```bash
# 1. Navegar até o diretório do projeto
cd /home/ubuntu/delmack_real_estate

# 2. Verificar se o arquivo existe
ls -lh /caminho/para/01Relatório_Jan_2025.xlsx

# 3. Executar importação
python3 import_excel.py /caminho/para/01Relatório_Jan_2025.xlsx

# 4. Verificar dados importados no banco
# Acesse o Management UI → Database → Tabela "sales"
```

## ✅ Teste Realizado

**Arquivo:** `01Relatório_Jan_2025.xlsx`
**Resultado:** 29 vendas importadas com sucesso
**Data:** 05/02/2026

---

**Última atualização:** 05/02/2026 16:30
