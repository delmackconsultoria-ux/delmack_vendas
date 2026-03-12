# 📧 Guia de Teste: 3 Novos Tipos de Emails

## ✅ Implementação Concluída

Foram implementados e configurados **3 novos tipos de emails**:

1. **Comissão Pendente** - `sendPendingCommissionNotification()`
2. **Venda Cancelada** - `sendSaleCancelledNotification()`
3. **Relatório Mensal** - `sendMonthlyReportNotification()`

---

## 🔐 Filtro de Testes Ativado

**Apenas estes 2 emails receberão notificações durante testes:**
- ✅ `angellicapassosup@gmail.com`
- ✅ `delmackconsultoria@gmail.com`

**Nenhum email da Baggio receberá notificações durante testes.**

### Como Ativar/Desativar Modo de Teste

O modo de teste é ativado automaticamente em desenvolvimento. Para controlar:

```bash
# Ativar modo de teste (bloqueia emails não autorizados)
export EMAIL_TEST_MODE=true

# Desativar modo de teste (libera todos os emails)
export EMAIL_TEST_MODE=false
```

---

## 📋 Fluxo de Testes

### Teste 1: Email de Comissão Pendente

**Quando é enviado:** Quando uma venda é aprovada mas a comissão fica pendente de pagamento

**Dados necessários:**
- Email do corretor: `angellicapassosup@gmail.com` ou `delmackconsultoria@gmail.com`
- Emails dos gerentes: `angellicapassosup@gmail.com` ou `delmackconsultoria@gmail.com`
- Nome do corretor
- Nome do comprador
- Endereço do imóvel
- Valor da venda
- Valor da comissão
- Data prevista de pagamento

**Como testar via tRPC:**

```typescript
const result = await trpc.notification.notifyPendingCommission.mutate({
  brokerEmail: 'angellicapassosup@gmail.com',
  managerEmails: ['delmackconsultoria@gmail.com'],
  brokerName: 'João Silva',
  buyerName: 'Maria Santos',
  propertyAddress: 'Rua das Flores, 123 - Curitiba, PR',
  propertyReference: 'BG96925001',
  saleValue: 500000,
  commissionValue: 15000,
  expectedPaymentDate: new Date('2026-03-31'),
  proposalId: 'prop-123456',
});
```

**Resultado esperado:**
- ✅ Email enviado para `angellicapassosup@gmail.com`
- ✅ Email enviado para `delmackconsultoria@gmail.com`
- ✅ Assunto: "⏳ Comissão Pendente: R$ 15.000,00 | Ref. BG96925001"
- ✅ Contém: Detalhes da venda, valor da comissão, previsão de pagamento

---

### Teste 2: Email de Venda Cancelada

**Quando é enviado:** Quando uma venda é cancelada por qualquer motivo

**Dados necessários:**
- Email do corretor
- Emails dos gerentes
- Emails dos financeiros
- Nome do corretor
- Nome do comprador
- Endereço do imóvel
- Valor da venda
- Quem cancelou (nome)
- Perfil de quem cancelou (Gerente/Financeiro/Admin)
- Data/hora do cancelamento
- Motivo do cancelamento

**Como testar via tRPC:**

```typescript
const result = await trpc.notification.notifySaleCancelled.mutate({
  brokerEmail: 'angellicapassosup@gmail.com',
  managerEmails: ['delmackconsultoria@gmail.com'],
  financeEmails: ['delmackconsultoria@gmail.com'],
  brokerName: 'João Silva',
  buyerName: 'Maria Santos',
  propertyAddress: 'Rua das Flores, 123 - Curitiba, PR',
  propertyReference: 'BG96925001',
  saleValue: 500000,
  cancelledBy: 'Camila Pires',
  cancelledByRole: 'Gerente',
  cancelledAt: new Date(),
  reason: 'Comprador desistiu da compra',
  proposalId: 'prop-123456',
});
```

**Resultado esperado:**
- ✅ Email enviado para `angellicapassosup@gmail.com`
- ✅ Email enviado para `delmackconsultoria@gmail.com`
- ✅ Assunto: "❌ Venda Cancelada: Maria Santos | Ref. BG96925001 - Cancelada por Gerente"
- ✅ Contém: Detalhes da venda, quem cancelou, motivo do cancelamento

---

### Teste 3: Email de Relatório Mensal

**Quando é enviado:** Manualmente (pode ser agendado para último dia do mês)

**Dados necessários:**
- Lista de emails dos gerentes e financeiros
- Nome da empresa
- Mês e ano do relatório
- Total de vendas (quantidade)
- Total em vendas (valor)
- Total em comissões
- Ticket médio
- Top corretor do mês (nome, quantidade de vendas, valor total)
- Quantidade de corretores ativos

**Como testar via tRPC:**

```typescript
const result = await trpc.notification.sendMonthlyReport.mutate({
  recipients: ['angellicapassosup@gmail.com', 'delmackconsultoria@gmail.com'],
  companyName: 'B I IMOVEIS LTDA',
  month: 3,
  year: 2026,
  totalSales: 12,
  totalSalesValue: 6000000,
  totalCommissions: 180000,
  averageTicket: 500000,
  topBroker: {
    name: 'João Silva',
    salesCount: 4,
    salesValue: 2000000,
  },
  brokerCount: 8,
});
```

**Resultado esperado:**
- ✅ Email enviado para `angellicapassosup@gmail.com`
- ✅ Email enviado para `delmackconsultoria@gmail.com`
- ✅ Assunto: "📊 Relatório Mensal: março de 2026 - B I IMOVEIS LTDA"
- ✅ Contém: Resumo executivo, total de vendas, comissões, top corretor

---

## 🔍 Verificação de Logs

Após cada teste, verifique os logs do servidor:

```bash
# Logs de email enviado com sucesso
[Email] Email enviado: <messageId> para: [emails]

# Logs de email bloqueado em modo de teste
[Email Filter] Email bloqueado em modo de teste: <email>

# Logs de nenhum email autorizado
[Email] Nenhum email autorizado para receber notificação em modo de teste
```

---

## 📊 Checklist de Testes

### Email 1: Comissão Pendente
- [ ] Email enviado para `angellicapassosup@gmail.com`
- [ ] Email enviado para `delmackconsultoria@gmail.com`
- [ ] Assunto correto
- [ ] Detalhes da venda exibidos
- [ ] Valor da comissão destacado
- [ ] Previsão de pagamento exibida
- [ ] Link para acompanhar funciona

### Email 2: Venda Cancelada
- [ ] Email enviado para `angellicapassosup@gmail.com`
- [ ] Email enviado para `delmackconsultoria@gmail.com`
- [ ] Assunto correto
- [ ] Motivo do cancelamento exibido
- [ ] Informações de quem cancelou exibidas
- [ ] Status "Cancelada" exibido
- [ ] Link para detalhes funciona

### Email 3: Relatório Mensal
- [ ] Email enviado para `angellicapassosup@gmail.com`
- [ ] Email enviado para `delmackconsultoria@gmail.com`
- [ ] Assunto correto com mês/ano
- [ ] Resumo executivo exibido
- [ ] Total de vendas correto
- [ ] Total em comissões correto
- [ ] Top corretor exibido
- [ ] Link para relatório completo funciona

---

## 🚀 Próximos Passos

1. **Testar cada email** seguindo os fluxos acima
2. **Verificar logs** para confirmar envio
3. **Validar conteúdo** dos emails recebidos
4. **Documentar resultados** e qualquer problema encontrado
5. **Desativar modo de teste** quando pronto para produção

---

## ⚙️ Configuração para Produção

Quando estiver pronto para produção:

1. **Desativar modo de teste:**
   ```bash
   export EMAIL_TEST_MODE=false
   ```

2. **Atualizar lista de emails autorizados** em `server/_core/emailTestFilter.ts` com todos os usuários reais

3. **Implementar agendamento** do relatório mensal (último dia do mês)

4. **Testar com dados reais** antes de liberar para usuários

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique se as credenciais SMTP estão configuradas
2. Verifique se os emails estão na lista de autorizados
3. Verifique os logs do servidor para mensagens de erro
4. Confirme que o modo de teste está ativado/desativado conforme esperado
