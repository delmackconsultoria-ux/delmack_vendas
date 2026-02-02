# TODO - Preparação para Produção

## 📊 Indicadores - Ajustes e Validações (27/01/2026)

### Tarefas Imediatas:
- [x] Adicionar indicador "Negócios Prontos"
- [x] Ajustar nome: "Negócios acima de 1 milhão" → "Negócios de 1 a 1 milhão"
- [x] Documentar regras de cálculo de cada indicador

### 📋 Regras de Negócio Validadas (do documento):

**Fontes de Dados:**
- **Properfy:** Status do imóvel (`chrStatus`), datas de angariação/baixa, quantidade de imóveis
- **Sistema Interno (Delmack):** Vendas, recebimentos, comissões (ÚNICA FONTE DA VERDADE)

**Status e Regras:**
1. **Disponível:** `chrStatus = 'LISTED'` (Properfy)
2. **Angariado:** Imóvel criado no período + status `NEW_LISTING` ou `LISTED` (Properfy)
3. **Vendido:** Venda registrada no sistema interno + imóvel `RENTED` ou `REMOVED` no Properfy
4. **Recebido:** Apenas registros financeiros internos
5. **Comissão cancelada:** Apenas sistema interno
6. **Baixa:** `chrStatus = 'REMOVED'` (Properfy - operacional)

**Fluxo de Status de Venda:**
- Rascunho → Venda → Em Análise (Gerente) → Comissão Agendada (Financeiro) → Comissão Paga
- Cancelada (pode acontecer em qualquer etapa)

### 📐 Cálculos Específicos (do documento):

1. **VSO - venda/oferta:** Vendas do mês (Delmack) / Carteira do mês anterior (Properfy)
2. **Número de atendimentos Prontos:** Leads do Properfy
3. **Número de atendimentos Lançamentos:** Leads do Properfy
4. **Prazo médio recebimento:** Data registro venda (Delmack) até data confirmação pagamento (Delmack)
5. **% Com cancelada/com pendente:** Vendas canceladas no mês / Vendas pendentes (status "Comissão Agendada")
6. **Tempo médio venda ang X venda:** Data angariação (Properfy `dteNewListing`) até data registro venda (Delmack)
7. **Despesa Geral:** Preenchimento manual
8. **Despesa com impostos:** Preenchimento manual
9. **Fundo Inovação:** Preenchimento manual
10. **Resultado Sócios:** Preenchimento manual
11. **Fundo emergencial:** Preenchimento manual

### ✅ Validação de Fontes de Dados:

**Properfy (API Externa):**
- [ ] `chrStatus` → Status operacional do imóvel
- [ ] `dteNewListing` → Data de angariação
- [ ] `dteTermination` → Data de baixa
- [ ] Quantidade de imóveis na carteira
- [ ] Leads de prontos e lançamentos

**Sistema Interno (Delmack):**
- [ ] Vendas registradas (única fonte da verdade)
- [ ] Datas de registro de venda
- [ ] Status de aprovação (Gerente, Financeiro)
- [ ] Comissões (vendida, recebida, pendente, cancelada)
- [ ] Datas de recebimento/pagamento

### 🔄 Próximos Passos:
1. Adicionar "Negócios Prontos" aos indicadores
2. Criar documentação técnica das regras de cálculo
3. Validar integração Properfy vs Sistema Interno
4. Implementar campos de preenchimento manual para despesas/fundos
