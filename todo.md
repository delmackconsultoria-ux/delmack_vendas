# TODO - Implementação de Relatórios

## 📊 Relatórios na Aba de Relatórios (27/01/2026)

### Relatórios a Implementar:

1. **Valor por corretor (angariações + vendas)** ✅ IMPLEMENTADO
   - [x] Mostrar soma de valores lado a lado
   - [x] Sistema interno: vendas registradas
   - [x] Properfy: imóveis angariados (dteNewListing)

2. **Valor por corretor (somente angariações)** ✅ IMPLEMENTADO
   - [x] Soma de valores de imóveis angariados
   - [x] Fonte: Properfy (imóveis com dteNewListing no período)

3. **Quantidade por corretor (somente angariações)** ✅ IMPLEMENTADO
   - [x] Contagem de imóveis angariados
   - [x] Fonte: Properfy (imóveis com dteNewListing no período)

4. **Quantidade de baixas por corretor** ⏳ Aguardando definição
   - [ ] Aguardando: Como identificar corretor responsável pela baixa?
   - [ ] Fonte: Properfy (chrStatus = 'REMOVED')

5. **Valor de baixas por corretor** ⏳ Aguardando definição
   - [ ] Aguardando: Como identificar corretor responsável pela baixa?
   - [ ] Fonte: Properfy (chrStatus = 'REMOVED')

6. **Escrituradas vs Não escrituradas** ⏳ Aguardando definição
   - [ ] Aguardando: Onde será registrado esse status?
   - [ ] Mostrar quantidade e valor de cada categoria + totais

7. **Tabela pivotada (valor x corretor)** ✅ IMPLEMENTADO
   - [x] Linhas: Valores (R$)
   - [x] Colunas: Nome dos corretores
   - [x] Células: Separado por "Vendas" e "Angariações"

### Regras de Negócio:
- **Properfy**: Fonte de status do imóvel, quantidade de anúncios, imóveis, angariações
- **Sistema Interno (Delmack)**: ÚNICA FONTE DA VERDADE para vendas, recebimentos e comissões

### Estrutura de Dados Necessária:
- Tabela `sales`: vendas registradas com `brokerId` e `saleValue`
- Tabela `propertiesCache`: cache de imóveis do Properfy com `chrStatus`, `dteNewListing`, `dcmSaleValue`
- Relacionamento: `sales.propertyId` → `propertiesCache.id`
