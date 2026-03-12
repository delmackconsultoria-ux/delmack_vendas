#!/usr/bin/env node

/**
 * Script para testar envio dos 3 novos tipos de emails
 * Executa: node test-emails.mjs
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurar transporter SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'email-ssl.com.br',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Template HTML base
function getEmailTemplate(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #6b7280; }
        .info-value { color: #111827; }
        .info-value.highlight { font-weight: 600; color: #667eea; }
        .alert-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .alert-box.error { background: #fef2f2; border-left-color: #ef4444; }
        .alert-box.success { background: #f0fdf4; border-left-color: #22c55e; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status-badge.status-rejected { background: #fee2e2; color: #991b1b; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Delmack - Sistema de Gestão de Vendas</h1>
        </div>
        <div class="content">
          ${content}
          <div class="footer">
            <p>Este é um email automático. Não responda diretamente.</p>
            <p>© 2026 Delmack Consultoria. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email 1: Comissão Pendente
async function sendPendingCommissionEmail() {
  const content = `
    <h2 style="color: #111827; margin-top: 0;">⏳ Comissão Pendente de Pagamento</h2>
    
    <div class="alert-box">
      <strong>Atenção:</strong> A venda foi aprovada e a comissão está pendente de pagamento.
    </div>

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Detalhes da Venda</h3>
      
      <div class="info-row">
        <span class="info-label">Corretor</span>
        <span class="info-value highlight">João Silva</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Comprador</span>
        <span class="info-value">Maria Santos</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Imóvel</span>
        <span class="info-value">Rua das Flores, 123 - Curitiba, PR</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor da Venda</span>
        <span class="info-value highlight">R$ 500.000,00</span>
      </div>
    </div>

    <div class="info-card" style="background-color: #fef3c7; border-color: #fcd34d;">
      <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">Informações da Comissão</h3>
      
      <div class="info-row">
        <span class="info-label">Valor da Comissão</span>
        <span class="info-value highlight" style="font-size: 18px; color: #d97706;">R$ 15.000,00</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="status-badge" style="background-color: #fef3c7; color: #92400e;">Pendente</span></span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Previsão de Pagamento</span>
        <span class="info-value">31/03/2026</span>
      </div>
    </div>

    <p style="color: #6b7280; margin: 20px 0;">
      <strong>Próximos Passos:</strong><br>
      1. Acompanhe o status da comissão no sistema<br>
      2. Verifique se todos os documentos foram anexados<br>
      3. Contacte o financeiro se houver atrasos
    </p>

    <center>
      <a href="https://delmack-rei-fwqutmfh.manus.space/proposals/34f2eccb#observations" class="button">
        Acompanhar Comissão
      </a>
    </center>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Delmack" <${process.env.SMTP_USER}>`,
      to: 'angellicapassosup@gmail.com',
      subject: '⏳ Comissão Pendente: R$ 15.000,00 | Ref. BG96925001',
      html: getEmailTemplate(content),
      text: 'Comissão pendente de pagamento: R$ 15.000,00. Venda: Maria Santos. Previsão: 31/03/2026.',
    });

    console.log('✅ Email 1 (Comissão Pendente) enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar Email 1:', error.message);
    return false;
  }
}

// Email 2: Venda Cancelada
async function sendSaleCancelledEmail() {
  const content = `
    <h2 style="color: #111827; margin-top: 0;">❌ Venda Cancelada</h2>
    
    <div class="alert-box error">
      <strong>Aviso Importante:</strong> A venda foi cancelada e não será mais processada.
    </div>

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Detalhes da Venda Cancelada</h3>
      
      <div class="info-row">
        <span class="info-label">Corretor</span>
        <span class="info-value highlight">João Silva</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Comprador</span>
        <span class="info-value">Maria Santos</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Imóvel</span>
        <span class="info-value">Rua das Flores, 123 - Curitiba, PR</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor da Venda</span>
        <span class="info-value">R$ 500.000,00</span>
      </div>
    </div>

    <div class="info-card" style="background-color: #fef2f2; border-color: #fca5a5;">
      <h3 style="color: #991b1b; margin-top: 0; font-size: 16px;">Informações do Cancelamento</h3>
      
      <div class="info-row">
        <span class="info-label">Cancelado por</span>
        <span class="info-value highlight">Camila Pires</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Perfil</span>
        <span class="info-value">Gerente</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Data/Hora</span>
        <span class="info-value">11/03/2026 às 11:10</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="status-badge status-rejected">Cancelada</span></span>
      </div>
    </div>

    <div class="alert-box error">
      <strong>Motivo do Cancelamento:</strong><br>
      "Comprador desistiu da compra"
    </div>

    <p style="color: #6b7280; margin: 20px 0;">
      <strong>Impacto:</strong><br>
      • A comissão desta venda não será processada<br>
      • O imóvel retorna à carteira disponível<br>
      • Nenhuma ação necessária neste momento
    </p>

    <center>
      <a href="https://delmack-rei-fwqutmfh.manus.space/proposals/34f2eccb#observations" class="button">
        Ver Detalhes do Cancelamento
      </a>
    </center>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Delmack" <${process.env.SMTP_USER}>`,
      to: 'angellicapassosup@gmail.com',
      subject: '❌ Venda Cancelada: Maria Santos | Ref. BG96925001 - Cancelada por Gerente',
      html: getEmailTemplate(content),
      text: 'Venda cancelada por Camila Pires (Gerente). Comprador: Maria Santos. Motivo: Comprador desistiu da compra.',
    });

    console.log('✅ Email 2 (Venda Cancelada) enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar Email 2:', error.message);
    return false;
  }
}

// Email 3: Relatório Mensal
async function sendMonthlyReportEmail() {
  const content = `
    <h2 style="color: #111827; margin-top: 0;">📊 Relatório Mensal de Vendas</h2>
    
    <div class="alert-box success">
      <strong>Relatório de março de 2026</strong> - B I IMOVEIS LTDA
    </div>

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Resumo Executivo</h3>
      
      <div class="info-row">
        <span class="info-label">Total de Vendas</span>
        <span class="info-value highlight">12 vendas</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor Total em Vendas</span>
        <span class="info-value highlight" style="font-size: 18px; color: #059669;">R$ 6.000.000,00</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Total em Comissões</span>
        <span class="info-value highlight">R$ 180.000,00</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Ticket Médio</span>
        <span class="info-value">R$ 500.000,00</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Corretores Ativos</span>
        <span class="info-value">8</span>
      </div>
    </div>

    <div class="info-card" style="background-color: #f0fdf4; border-color: #86efac;">
      <h3 style="color: #166534; margin-top: 0; font-size: 16px;">Top Corretor do Mês</h3>
      
      <div class="info-row">
        <span class="info-label">Corretor</span>
        <span class="info-value highlight">João Silva</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Vendas</span>
        <span class="info-value">4 vendas</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor Total</span>
        <span class="info-value highlight">R$ 2.000.000,00</span>
      </div>
    </div>

    <p style="color: #6b7280; margin: 20px 0; text-align: center;">
      <strong>Este é um relatório automático gerado no final do mês.</strong><br>
      Para análises detalhadas, acesse o sistema de relatórios.
    </p>

    <center>
      <a href="https://delmack-rei-fwqutmfh.manus.space/reports" class="button">
        Ver Relatório Completo
      </a>
    </center>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Delmack" <${process.env.SMTP_USER}>`,
      to: 'angellicapassosup@gmail.com',
      subject: '📊 Relatório Mensal: março de 2026 - B I IMOVEIS LTDA',
      html: getEmailTemplate(content),
      text: 'Relatório de vendas de março de 2026. Total: 12 venda(s). Valor: R$ 6.000.000,00. Comissões: R$ 180.000,00.',
    });

    console.log('✅ Email 3 (Relatório Mensal) enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar Email 3:', error.message);
    return false;
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando envio de 3 emails de teste para angellicapassosup@gmail.com\n');
  console.log('Verificando credenciais SMTP...');
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Erro: Credenciais SMTP não configuradas');
    process.exit(1);
  }

  console.log('✅ Credenciais SMTP encontradas\n');

  const results = [];
  
  console.log('📧 Enviando Email 1: Comissão Pendente...');
  results.push(await sendPendingCommissionEmail());
  
  console.log('\n📧 Enviando Email 2: Venda Cancelada...');
  results.push(await sendSaleCancelledEmail());
  
  console.log('\n📧 Enviando Email 3: Relatório Mensal...');
  results.push(await sendMonthlyReportEmail());

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES:');
  console.log('='.repeat(60));
  console.log(`✅ Emails enviados com sucesso: ${results.filter(r => r).length}/3`);
  console.log(`❌ Emails com erro: ${results.filter(r => !r).length}/3`);
  console.log('\n📬 Verifique sua caixa de entrada em: angellicapassosup@gmail.com');
  console.log('='.repeat(60));

  process.exit(results.every(r => r) ? 0 : 1);
}

runTests();
