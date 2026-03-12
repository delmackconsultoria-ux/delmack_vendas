import { invokeLLM } from './server/_core/llm.js';

// Simular dados de teste
const testData = {
  pendingCommission: {
    brokerEmail: 'angellicapassosup@gmail.com',
    managerEmails: ['angellicapassosup@gmail.com'],
    brokerName: 'João Silva',
    buyerName: 'Maria Santos',
    propertyAddress: 'Rua das Flores, 123 - Curitiba, PR',
    propertyReference: 'BG96925001',
    saleValue: 500000,
    commissionValue: 15000,
    expectedPaymentDate: '2026-03-31',
    proposalId: 'prop-123456',
  },
  saleCancelled: {
    brokerEmail: 'angellicapassosup@gmail.com',
    managerEmails: ['angellicapassosup@gmail.com'],
    financeEmails: ['angellicapassosup@gmail.com'],
    brokerName: 'João Silva',
    buyerName: 'Maria Santos',
    propertyAddress: 'Rua das Flores, 123 - Curitiba, PR',
    propertyReference: 'BG96925001',
    saleValue: 500000,
    cancelledBy: 'Camila Pires',
    cancelledByRole: 'Gerente',
    cancelledAt: new Date().toISOString(),
    reason: 'Comprador desistiu da compra',
    proposalId: 'prop-123456',
  },
  monthlyReport: {
    recipients: ['angellicapassosup@gmail.com'],
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
  },
};

console.log('📧 Enviando 3 emails de teste para angellicapassosup@gmail.com...\n');
console.log('Dados de teste:', JSON.stringify(testData, null, 2));
