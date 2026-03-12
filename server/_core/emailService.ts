/**
 * Serviço de envio de emails via SMTP
 * Configurado para usar email-ssl.com.br:465 (SSL)
 */

import nodemailer from 'nodemailer';
import { ENV } from './env';
import { filterEmailsForTests, isEmailAuthorizedForTests } from './emailTestFilter';

// Configuração do transporter SMTP
const transporter = nodemailer.createTransport({
  host: ENV.smtpHost || 'email-ssl.com.br',
  port: ENV.smtpPort || 465,
  secure: true, // SSL
  auth: {
    user: ENV.smtpUser,
    pass: ENV.smtpPass,
  },
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envia email via SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!ENV.smtpUser || !ENV.smtpPass) {
      console.warn('[Email] Credenciais SMTP não configuradas');
      return false;
    }

    // Filtrar emails para testes (apenas Delmack)
    let recipients = Array.isArray(options.to) ? options.to : [options.to];
    const filteredRecipients = filterEmailsForTests(recipients);

    // Se nenhum email autorizado, não enviar
    if (filteredRecipients.length === 0) {
      console.warn('[Email] Nenhum email autorizado para receber notificação em modo de teste');
      return false;
    }

    const info = await transporter.sendMail({
      from: `"${ENV.smtpFromName || 'Delmack'}" <${ENV.smtpUser}>`,
      to: filteredRecipients.join(', '),
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('[Email] Email enviado:', info.messageId, 'para:', filteredRecipients);
    return true;
  } catch (error) {
    console.error('[Email] Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Template base para emails (sem header, design limpo)
 */
function getEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .content { padding: 32px 24px; }
        .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; }
        .alert-box.success { background-color: #d1fae5; border-left-color: #10b981; }
        .alert-box.error { background-color: #fee2e2; border-left-color: #ef4444; }
        .info-card { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #374151; font-size: 14px; }
        .info-value { color: #6b7280; font-size: 14px; text-align: right; }
        .reference-badge { display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 10px 0; }
        .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25); }
        .button:hover { background-color: #1d4ed8; }
        .footer { background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { color: #6b7280; font-size: 12px; margin: 4px 0; }
        .highlight { color: #2563eb; font-weight: 600; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; }
        .status-approved { background-color: #d1fae5; color: #065f46; }
        .status-rejected { background-color: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p><strong>Delmack - Sistema de Vendas</strong></p>
          <p>Este é um email automático. Não responda a este email.</p>
          <p style="margin-top: 12px; color: #9ca3af;">© ${new Date().getFullYear()} Delmack. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 1. NOVA VENDA CRIADA
 * Enviado para: Gerente + Corretor que cadastrou (confirmação)
 * Quando: Corretor cadastra nova venda
 */
export async function sendNewSaleNotification(data: {
  managerEmails: string[]; // Emails dos gerentes
  brokerEmail: string; // Email do corretor que cadastrou
  brokerName: string;
  buyerName: string;
  sellerName: string;
  propertyAddress: string;
  propertyReference?: string; // Referência Properfy
  saleValue: number;
  saleDate: string;
  proposalId: string;
  createdAt: string;
}): Promise<boolean> {
  const referenceDisplay = data.propertyReference 
    ? `<div class="reference-badge">Ref. Properfy: ${data.propertyReference}</div>` 
    : '';

  const content = `
    <h2 style="color: #111827; margin-top: 0;">🎉 Nova Venda Cadastrada</h2>
    
    <div class="alert-box">
      <strong>Ação Necessária:</strong> Uma nova venda foi registrada e aguarda análise do gerente e aprovação.
    </div>

    ${referenceDisplay}

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Detalhes da Venda</h3>
      
      <div class="info-row">
        <span class="info-label">Corretor Responsável</span>
        <span class="info-value highlight">${data.brokerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Imóvel</span>
        <span class="info-value">${data.propertyAddress}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor da Venda</span>
        <span class="info-value highlight">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.saleValue)}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Comprador</span>
        <span class="info-value">${data.buyerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Vendedor</span>
        <span class="info-value">${data.sellerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Data da Venda</span>
        <span class="info-value">${new Date(data.saleDate).toLocaleDateString('pt-BR')}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Cadastrado em</span>
        <span class="info-value">${new Date(data.createdAt).toLocaleString('pt-BR')}</span>
      </div>
    </div>

    <p style="color: #6b7280; margin: 20px 0;">
      <strong>Próximos Passos:</strong><br>
      1. Revise todos os detalhes da venda<br>
      2. Verifique a documentação anexada<br>
      3. Aprove ou solicite correções
    </p>

    <center>
      <a href="${ENV.frontendUrl || 'https://delmack.manus.space'}/proposals/${data.proposalId}" class="button">
        Visualizar Proposta Completa
      </a>
    </center>
  `;

  // Enviar para gerentes + corretor
  const allRecipients = [...data.managerEmails, data.brokerEmail];

  return sendEmail({
    to: allRecipients,
    subject: `🆕 Nova Venda: ${data.buyerName}${data.propertyReference ? ` | Ref. ${data.propertyReference}` : ''} - ${data.brokerName}`,
    html: getEmailTemplate(content),
    text: `Nova venda cadastrada por ${data.brokerName}. Comprador: ${data.buyerName}. Valor: R$ ${data.saleValue.toFixed(2)}. Acesse o sistema para revisar.`,
  });
}

/**
 * 2. VENDA APROVADA
 * Enviado para: Corretor + outros envolvidos no fluxo
 * Quando: Gerente ou Financeiro aprova a venda
 */
export async function sendSaleApprovedNotification(data: {
  recipients: string[]; // Emails dos envolvidos
  brokerName: string;
  buyerName: string;
  propertyAddress: string;
  propertyReference?: string;
  saleValue: number;
  approvedBy: string; // Nome de quem aprovou
  approvedByRole: string; // Perfil de quem aprovou (Gerente/Financeiro)
  approvedAt: string;
  comment?: string;
  proposalId: string;
}): Promise<boolean> {
  const referenceDisplay = data.propertyReference 
    ? `<div class="reference-badge">Ref. Properfy: ${data.propertyReference}</div>` 
    : '';

  const commentSection = data.comment 
    ? `
      <div class="alert-box success">
        <strong>Comentário do ${data.approvedByRole}:</strong><br>
        "${data.comment}"
      </div>
    ` 
    : '';

  const content = `
    <h2 style="color: #111827; margin-top: 0;">✅ Venda Aprovada</h2>
    
    <div class="alert-box success">
      <strong>Boa notícia!</strong> A venda foi aprovada e está avançando no processo.
    </div>

    ${referenceDisplay}

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Detalhes da Venda</h3>
      
      <div class="info-row">
        <span class="info-label">Corretor</span>
        <span class="info-value highlight">${data.brokerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Imóvel</span>
        <span class="info-value">${data.propertyAddress}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor</span>
        <span class="info-value highlight">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.saleValue)}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Comprador</span>
        <span class="info-value">${data.buyerName}</span>
      </div>
    </div>

    <div class="info-card" style="background-color: #f0fdf4; border-color: #86efac;">
      <h3 style="color: #166534; margin-top: 0; font-size: 16px;">Informações da Aprovação</h3>
      
      <div class="info-row">
        <span class="info-label">Aprovado por</span>
        <span class="info-value highlight">${data.approvedBy}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Perfil</span>
        <span class="info-value">${data.approvedByRole}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Data/Hora</span>
        <span class="info-value">${new Date(data.approvedAt).toLocaleString('pt-BR')}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="status-badge status-approved">Aprovada</span></span>
      </div>
    </div>

    ${commentSection}

    <center>
      <a href="${ENV.frontendUrl || 'https://delmack.manus.space'}/proposals/${data.proposalId}" class="button">
        Ver Detalhes Completos
      </a>
    </center>
  `;

  return sendEmail({
    to: data.recipients,
    subject: `✅ Venda Aprovada: ${data.buyerName}${data.propertyReference ? ` | Ref. ${data.propertyReference}` : ''} - ${data.approvedByRole}`,
    html: getEmailTemplate(content),
    text: `Venda aprovada por ${data.approvedBy} (${data.approvedByRole}). Comprador: ${data.buyerName}. Valor: R$ ${data.saleValue.toFixed(2)}.`,
  });
}

/**
 * 3. VENDA REPROVADA
 * Enviado para: Corretor + outros envolvidos no fluxo
 * Quando: Gerente ou Financeiro reprova a venda
 */
export async function sendSaleRejectedNotification(data: {
  recipients: string[];
  brokerName: string;
  buyerName: string;
  propertyAddress: string;
  propertyReference?: string;
  saleValue: number;
  rejectedBy: string;
  rejectedByRole: string;
  rejectedAt: string;
  reason: string; // Motivo da reprovação
  proposalId: string;
}): Promise<boolean> {
  const referenceDisplay = data.propertyReference 
    ? `<div class="reference-badge">Ref. Properfy: ${data.propertyReference}</div>` 
    : '';

  const content = `
    <h2 style="color: #111827; margin-top: 0;">❌ Venda Reprovada</h2>
    
    <div class="alert-box error">
      <strong>Atenção:</strong> A venda foi reprovada pelo ${data.rejectedByRole} e requer correções antes de prosseguir.
    </div>

    ${referenceDisplay}

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Detalhes da Venda</h3>
      
      <div class="info-row">
        <span class="info-label">Corretor</span>
        <span class="info-value highlight">${data.brokerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Imóvel</span>
        <span class="info-value">${data.propertyAddress}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor</span>
        <span class="info-value">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.saleValue)}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Comprador</span>
        <span class="info-value">${data.buyerName}</span>
      </div>
    </div>

    <div class="info-card" style="background-color: #fef2f2; border-color: #fca5a5;">
      <h3 style="color: #991b1b; margin-top: 0; font-size: 16px;">Informações da Reprovação</h3>
      
      <div class="info-row">
        <span class="info-label">Reprovado por</span>
        <span class="info-value highlight">${data.rejectedBy}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Perfil</span>
        <span class="info-value">${data.rejectedByRole}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Data/Hora</span>
        <span class="info-value">${new Date(data.rejectedAt).toLocaleString('pt-BR')}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="status-badge status-rejected">Reprovada</span></span>
      </div>
    </div>

    <div class="alert-box error">
      <strong>Motivo da Reprovação:</strong><br>
      "${data.reason}"
    </div>

    <p style="color: #6b7280; margin: 20px 0;">
      <strong>Próximos Passos:</strong><br>
      1. Revise o motivo da reprovação<br>
      2. Faça as correções necessárias<br>
      3. Reenvie a proposta para análise
    </p>

    <center>
      <a href="${ENV.frontendUrl || 'https://delmack.manus.space'}/proposals/${data.proposalId}" class="button">
        Corrigir Proposta
      </a>
    </center>
  `;

  return sendEmail({
    to: data.recipients,
    subject: `❌ Venda Reprovada: ${data.buyerName}${data.propertyReference ? ` | Ref. ${data.propertyReference}` : ''} - Ação Necessária`,
    html: getEmailTemplate(content),
    text: `Venda reprovada por ${data.rejectedBy} (${data.rejectedByRole}). Motivo: ${data.reason}. Acesse o sistema para fazer correções.`,
  });
}

/**
 * 4. COMISSÃO PAGA
 * Enviado para: Corretor + Gerente + Financeiro (apenas os envolvidos naquela venda)
 * Quando: Financeiro registra pagamento de comissão
 */
export async function sendCommissionPaidNotification(data: {
  brokerEmail: string; // Corretor que fez a venda
  managerEmail: string; // Gerente que aprovou
  financeEmail: string; // Financeiro que pagou
  brokerName: string;
  buyerName: string;
  propertyAddress: string;
  propertyReference?: string;
  saleValue: number;
  commissionValue: number;
  paidBy: string; // Nome do financeiro que pagou
  paidAt: string;
  paymentMethod: string;
  bankName: string;
  proposalId: string;
}): Promise<boolean> {
  const referenceDisplay = data.propertyReference 
    ? `<div class="reference-badge">Ref. Properfy: ${data.propertyReference}</div>` 
    : '';

  const paymentMethodLabels: Record<string, string> = {
    pix: 'PIX',
    ted: 'TED',
    boleto: 'Boleto',
    dinheiro: 'Dinheiro',
  };

  const content = `
    <h2 style="color: #111827; margin-top: 0;">💰 Comissão Paga</h2>
    
    <div class="alert-box success">
      <strong>Confirmação:</strong> A comissão foi processada e paga com sucesso.
    </div>

    ${referenceDisplay}

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Detalhes da Venda</h3>
      
      <div class="info-row">
        <span class="info-label">Corretor</span>
        <span class="info-value highlight">${data.brokerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Imóvel</span>
        <span class="info-value">${data.propertyAddress}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Comprador</span>
        <span class="info-value">${data.buyerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor da Venda</span>
        <span class="info-value">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.saleValue)}</span>
      </div>
    </div>

    <div class="info-card" style="background-color: #f0fdf4; border-color: #86efac;">
      <h3 style="color: #166534; margin-top: 0; font-size: 16px;">Informações do Pagamento</h3>
      
      <div class="info-row">
        <span class="info-label">Valor da Comissão</span>
        <span class="info-value highlight" style="font-size: 18px; color: #059669;">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.commissionValue)}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Pago por</span>
        <span class="info-value">${data.paidBy}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Data/Hora</span>
        <span class="info-value">${new Date(data.paidAt).toLocaleString('pt-BR')}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Forma de Pagamento</span>
        <span class="info-value">${paymentMethodLabels[data.paymentMethod] || data.paymentMethod}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Banco</span>
        <span class="info-value">${data.bankName}</span>
      </div>
    </div>

    <p style="color: #6b7280; margin: 20px 0; text-align: center;">
      <strong>Verifique sua conta bancária para confirmar o recebimento.</strong>
    </p>

    <center>
      <a href="${ENV.frontendUrl || 'https://delmack.manus.space'}/proposals/${data.proposalId}" class="button">
        Ver Comprovante
      </a>
    </center>
  `;

  // Enviar para corretor + gerente + financeiro (apenas os envolvidos)
  const recipients = [data.brokerEmail, data.managerEmail, data.financeEmail];

  return sendEmail({
    to: recipients,
    subject: `💰 Comissão Paga: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.commissionValue)}${data.propertyReference ? ` | Ref. ${data.propertyReference}` : ''}`,
    html: getEmailTemplate(content),
    text: `Comissão paga: R$ ${data.commissionValue.toFixed(2)}. Venda: ${data.buyerName}. Forma: ${paymentMethodLabels[data.paymentMethod]}. Banco: ${data.bankName}.`,
  });
}


/**
 * 5. CONTRATO/ESCRITURA ANEXADO (ETAPA 3)
 * Enviado para: Todos os financeiros
 * Quando: Gerente ou Corretor anexa Contrato/Escritura
 */
export async function sendContractAttachedNotification(data: {
  financeEmails: string[]; // Emails de todos os financeiros
  brokerName: string;
  buyerName: string;
  propertyAddress: string;
  propertyReference?: string;
  saleValue: number;
  attachedBy: string; // Nome de quem anexou (Gerente ou Corretor)
  attachedByRole: string; // Perfil de quem anexou
  attachmentDate: string;
  proposalId: string;
}): Promise<boolean> {
  const referenceDisplay = data.propertyReference 
    ? `<div class="reference-badge">Ref. Properfy: ${data.propertyReference}</div>` 
    : '';

  const actionBoxCorretor = `
    <div class="action-box">
      <div class="action-title">👤 Se você é CORRETOR:</div>
      <div class="action-item">Acompanhe o andamento da venda. Nenhuma ação necessária no momento.</div>
    </div>
  `;

  const actionBoxGerente = `
    <div class="action-box">
      <div class="action-title">👔 Se você é GERENTE:</div>
      <div class="action-item">Revise todos os detalhes da venda e a documentação anexada. Aprove ou solicite correções.</div>
    </div>
  `;

  const actionBoxFinanceiro = `
    <div class="action-box">
      <div class="action-title">💰 Se você é FINANCEIRO:</div>
      <div class="action-item">A venda está pronta para sua análise. Revise a documentação e prepare-se para receber a Nota Fiscal.</div>
    </div>
  `;

  const content = `
    <h2 style="color: #111827; margin-top: 0;">📋 Contrato/Escritura Anexado</h2>
    
    <div class="alert-box success">
      <strong>Ação Necessária:</strong> O Contrato/Escritura foi anexado à venda. Veja abaixo qual é a próxima ação esperada para seu perfil.
    </div>

    ${referenceDisplay}

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Detalhes da Venda</h3>
      
      <div class="info-row">
        <span class="info-label">Corretor Responsável</span>
        <span class="info-value highlight">${data.brokerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Comprador</span>
        <span class="info-value">${data.buyerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Imóvel</span>
        <span class="info-value">${data.propertyAddress}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor da Venda</span>
        <span class="info-value highlight">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.saleValue)}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Anexado por</span>
        <span class="info-value">${data.attachedBy} (${data.attachedByRole})</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Data de Anexação</span>
        <span class="info-value">${new Date(data.attachmentDate).toLocaleString('pt-BR')}</span>
      </div>
    </div>

    <div class="info-card" style="background-color: #f0fdf4; border-color: #86efac;">
      <h3 style="color: #166534; margin-top: 0; font-size: 16px;">Documentos Anexados</h3>
      
      <div style="padding: 12px 0;">
        <p style="margin: 8px 0; color: #166534;">✅ Comprovante de Sinal de Negócio</p>
        <p style="margin: 8px 0; color: #166534;">✅ Contrato/Escritura</p>
        <p style="margin: 8px 0; color: #9ca3af;">⏳ Nota Fiscal (pendente)</p>
      </div>
    </div>

    ${actionBoxCorretor}
    ${actionBoxGerente}
    ${actionBoxFinanceiro}

    <center>
      <a href="${ENV.frontendUrl || 'https://delmack.manus.space'}/proposals/${data.proposalId}" class="button">
        Visualizar Venda Completa
      </a>
    </center>
  `;

  return sendEmail({
    to: data.financeEmails,
    subject: `📋 Contrato/Escritura Anexado: ${data.buyerName}${data.propertyReference ? ` | Ref. ${data.propertyReference}` : ''} - Ação Necessária`,
    html: getEmailTemplate(content),
    text: `Contrato/Escritura anexado por ${data.attachedBy}. Comprador: ${data.buyerName}. Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.saleValue)}. Acesse o sistema para revisar.`,
  });
}

/**
 * 6. NOTA FISCAL ANEXADA (ETAPA 5)
 * Enviado para: Corretor + Gerentes (Camila + Lucas se for Lançamento)
 * Quando: Financeiro anexa Nota Fiscal
 */
export async function sendInvoiceAttachedNotification(data: {
  brokerEmail: string; // Email do corretor
  managerEmails: string[]; // Emails dos gerentes (Camila + Lucas se Lançamento)
  brokerName: string;
  buyerName: string;
  propertyAddress: string;
  propertyReference?: string;
  saleValue: number;
  commissionValue: number;
  attachedBy: string; // Nome do financeiro que anexou
  attachmentDate: string;
  paymentDate: string;
  proposalId: string;
}): Promise<boolean> {
  const referenceDisplay = data.propertyReference 
    ? `<div class="reference-badge">Ref. Properfy: ${data.propertyReference}</div>` 
    : '';

  const actionBoxCorretor = `
    <div class="action-box">
      <div class="action-title">👤 Se você é CORRETOR:</div>
      <div class="action-item">Sua comissão foi paga! Verifique os detalhes do pagamento no sistema.</div>
    </div>
  `;

  const actionBoxGerente = `
    <div class="action-box">
      <div class="action-title">👔 Se você é GERENTE:</div>
      <div class="action-item">A venda foi finalizada com sucesso. Acompanhe o histórico de comissões pagas.</div>
    </div>
  `;

  const actionBoxFinanceiro = `
    <div class="action-box">
      <div class="action-title">💰 Se você é FINANCEIRO:</div>
      <div class="action-item">Nenhuma ação necessária. A venda foi processada e a comissão foi paga.</div>
    </div>
  `;

  const content = `
    <h2 style="color: #111827; margin-top: 0;">✅ Nota Fiscal Anexada - Comissão Processada</h2>
    
    <div class="alert-box success">
      <strong>Boa notícia!</strong> A Nota Fiscal foi anexada e sua comissão foi processada com sucesso! Veja abaixo qual é a próxima ação esperada para seu perfil.
    </div>

    ${referenceDisplay}

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Detalhes da Venda</h3>
      
      <div class="info-row">
        <span class="info-label">Corretor Responsável</span>
        <span class="info-value highlight">${data.brokerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Comprador</span>
        <span class="info-value">${data.buyerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Imóvel</span>
        <span class="info-value">${data.propertyAddress}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor da Venda</span>
        <span class="info-value highlight">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.saleValue)}</span>
      </div>
    </div>

    <div class="info-card" style="background-color: #f0fdf4; border-color: #86efac;">
      <h3 style="color: #166534; margin-top: 0; font-size: 16px;">Informações da Comissão</h3>
      
      <div class="info-row">
        <span class="info-label">Valor da Comissão</span>
        <span class="info-value highlight">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.commissionValue)}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="status-badge status-approved">Comissão Paga</span></span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Data de Pagamento</span>
        <span class="info-value">${new Date(data.paymentDate).toLocaleDateString('pt-BR')}</span>
      </div>
    </div>

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Documentos Completos</h3>
      
      <div style="padding: 12px 0;">
        <p style="margin: 8px 0; color: #10b981;">✅ Comprovante de Sinal de Negócio</p>
        <p style="margin: 8px 0; color: #10b981;">✅ Contrato/Escritura</p>
        <p style="margin: 8px 0; color: #10b981;">✅ Nota Fiscal</p>
      </div>
    </div>

    ${actionBoxCorretor}
    ${actionBoxGerente}
    ${actionBoxFinanceiro}

    <center>
      <a href="${ENV.frontendUrl || 'https://delmack.manus.space'}/proposals/${data.proposalId}" class="button">
        Ver Detalhes Completos
      </a>
    </center>
  `;

  // Enviar para corretor + gerentes
  const recipients = [data.brokerEmail, ...data.managerEmails];

  return sendEmail({
    to: recipients,
    subject: `✅ Nota Fiscal Anexada: ${data.buyerName}${data.propertyReference ? ` | Ref. ${data.propertyReference}` : ''} - Comissão Paga`,
    html: getEmailTemplate(content),
    text: `Nota Fiscal anexada. Comissão paga: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.commissionValue)}. Comprador: ${data.buyerName}. Acesse o sistema para mais detalhes.`,
  });
}


/**
 * 7. COMISSÃO PENDENTE (NOVO)
 * Enviado para: Corretor + Gerente
 * Quando: Venda é aprovada mas comissão fica pendente de pagamento
 */
export async function sendPendingCommissionNotification(data: {
  brokerEmail: string; // Email do corretor
  managerEmails: string[]; // Emails dos gerentes
  brokerName: string;
  buyerName: string;
  propertyAddress: string;
  propertyReference?: string;
  saleValue: number;
  commissionValue: number;
  expectedPaymentDate: string;
  proposalId: string;
}): Promise<boolean> {
  const referenceDisplay = data.propertyReference 
    ? `<div class="reference-badge">Ref. Properfy: ${data.propertyReference}</div>` 
    : '';

  const content = `
    <h2 style="color: #111827; margin-top: 0;">⏳ Comissão Pendente de Pagamento</h2>
    
    <div class="alert-box">
      <strong>Atenção:</strong> A venda foi aprovada e a comissão está pendente de pagamento.
    </div>

    ${referenceDisplay}

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Detalhes da Venda</h3>
      
      <div class="info-row">
        <span class="info-label">Corretor</span>
        <span class="info-value highlight">${data.brokerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Comprador</span>
        <span class="info-value">${data.buyerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Imóvel</span>
        <span class="info-value">${data.propertyAddress}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor da Venda</span>
        <span class="info-value highlight">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.saleValue)}</span>
      </div>
    </div>

    <div class="info-card" style="background-color: #fef3c7; border-color: #fcd34d;">
      <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">Informações da Comissão</h3>
      
      <div class="info-row">
        <span class="info-label">Valor da Comissão</span>
        <span class="info-value highlight" style="font-size: 18px; color: #d97706;">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.commissionValue)}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="status-badge" style="background-color: #fef3c7; color: #92400e;">Pendente</span></span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Previsão de Pagamento</span>
        <span class="info-value">${new Date(data.expectedPaymentDate).toLocaleDateString('pt-BR')}</span>
      </div>
    </div>

    <p style="color: #6b7280; margin: 20px 0;">
      <strong>Próximos Passos:</strong><br>
      1. Acompanhe o status da comissão no sistema<br>
      2. Verifique se todos os documentos foram anexados<br>
      3. Contacte o financeiro se houver atrasos
    </p>

    <center>
      <a href="${ENV.frontendUrl || 'https://delmack.manus.space'}/proposals/${data.proposalId}#observations" class="button">
        Acompanhar Comissão
      </a>
    </center>
  `;

  // Enviar para corretor + gerentes
  const recipients = [data.brokerEmail, ...data.managerEmails];

  return sendEmail({
    to: recipients,
    subject: `⏳ Comissão Pendente: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.commissionValue)}${data.propertyReference ? ` | Ref. ${data.propertyReference}` : ''}`,
    html: getEmailTemplate(content),
    text: `Comissão pendente de pagamento: R$ ${data.commissionValue.toFixed(2)}. Venda: ${data.buyerName}. Previsão: ${new Date(data.expectedPaymentDate).toLocaleDateString('pt-BR')}.`,
  });
}

/**
 * 8. VENDA CANCELADA (NOVO)
 * Enviado para: Corretor + Gerente + Financeiro
 * Quando: Venda é cancelada
 */
export async function sendSaleCancelledNotification(data: {
  brokerEmail: string; // Email do corretor
  managerEmails: string[]; // Emails dos gerentes
  financeEmails: string[]; // Emails dos financeiros
  brokerName: string;
  buyerName: string;
  propertyAddress: string;
  propertyReference?: string;
  saleValue: number;
  cancelledBy: string; // Nome de quem cancelou
  cancelledByRole: string; // Perfil de quem cancelou
  cancelledAt: string;
  reason: string; // Motivo do cancelamento
  proposalId: string;
}): Promise<boolean> {
  const referenceDisplay = data.propertyReference 
    ? `<div class="reference-badge">Ref. Properfy: ${data.propertyReference}</div>` 
    : '';

  const content = `
    <h2 style="color: #111827; margin-top: 0;">❌ Venda Cancelada</h2>
    
    <div class="alert-box error">
      <strong>Aviso Importante:</strong> A venda foi cancelada e não será mais processada.
    </div>

    ${referenceDisplay}

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Detalhes da Venda Cancelada</h3>
      
      <div class="info-row">
        <span class="info-label">Corretor</span>
        <span class="info-value highlight">${data.brokerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Comprador</span>
        <span class="info-value">${data.buyerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Imóvel</span>
        <span class="info-value">${data.propertyAddress}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor da Venda</span>
        <span class="info-value">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.saleValue)}</span>
      </div>
    </div>

    <div class="info-card" style="background-color: #fef2f2; border-color: #fca5a5;">
      <h3 style="color: #991b1b; margin-top: 0; font-size: 16px;">Informações do Cancelamento</h3>
      
      <div class="info-row">
        <span class="info-label">Cancelado por</span>
        <span class="info-value highlight">${data.cancelledBy}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Perfil</span>
        <span class="info-value">${data.cancelledByRole}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Data/Hora</span>
        <span class="info-value">${new Date(data.cancelledAt).toLocaleString('pt-BR')}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="status-badge status-rejected">Cancelada</span></span>
      </div>
    </div>

    <div class="alert-box error">
      <strong>Motivo do Cancelamento:</strong><br>
      "${data.reason}"
    </div>

    <p style="color: #6b7280; margin: 20px 0;">
      <strong>Impacto:</strong><br>
      • A comissão desta venda não será processada<br>
      • O imóvel retorna à carteira disponível<br>
      • Nenhuma ação necessária neste momento
    </p>

    <center>
      <a href="${ENV.frontendUrl || 'https://delmack.manus.space'}/proposals/${data.proposalId}#observations" class="button">
        Ver Detalhes do Cancelamento
      </a>
    </center>
  `;

  // Enviar para corretor + gerentes + financeiros
  const recipients = [data.brokerEmail, ...data.managerEmails, ...data.financeEmails];

  return sendEmail({
    to: recipients,
    subject: `❌ Venda Cancelada: ${data.buyerName}${data.propertyReference ? ` | Ref. ${data.propertyReference}` : ''} - Cancelada por ${data.cancelledByRole}`,
    html: getEmailTemplate(content),
    text: `Venda cancelada por ${data.cancelledBy} (${data.cancelledByRole}). Comprador: ${data.buyerName}. Motivo: ${data.reason}.`,
  });
}

/**
 * 9. RELATÓRIO MENSAL (NOVO)
 * Enviado para: Gerentes + Financeiros
 * Quando: Último dia do mês (job agendado)
 */
export async function sendMonthlyReportNotification(data: {
  recipients: string[]; // Emails dos gerentes e financeiros
  companyName: string;
  month: number; // 1-12
  year: number;
  totalSales: number; // Quantidade de vendas
  totalSalesValue: number; // Valor total em vendas
  totalCommissions: number; // Valor total em comissões
  averageTicket: number; // Ticket médio
  topBroker: {
    name: string;
    salesCount: number;
    salesValue: number;
  };
  brokerCount: number; // Quantidade de corretores ativos
}): Promise<boolean> {
  const monthName = new Date(data.year, data.month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const content = `
    <h2 style="color: #111827; margin-top: 0;">📊 Relatório Mensal de Vendas</h2>
    
    <div class="alert-box success">
      <strong>Relatório de ${monthName}</strong> - ${data.companyName}
    </div>

    <div class="info-card">
      <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Resumo Executivo</h3>
      
      <div class="info-row">
        <span class="info-label">Total de Vendas</span>
        <span class="info-value highlight">${data.totalSales} venda${data.totalSales !== 1 ? 's' : ''}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor Total em Vendas</span>
        <span class="info-value highlight" style="font-size: 18px; color: #059669;">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totalSalesValue)}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Total em Comissões</span>
        <span class="info-value highlight">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totalCommissions)}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Ticket Médio</span>
        <span class="info-value">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.averageTicket)}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Corretores Ativos</span>
        <span class="info-value">${data.brokerCount}</span>
      </div>
    </div>

    <div class="info-card" style="background-color: #f0fdf4; border-color: #86efac;">
      <h3 style="color: #166534; margin-top: 0; font-size: 16px;">Top Corretor do Mês</h3>
      
      <div class="info-row">
        <span class="info-label">Corretor</span>
        <span class="info-value highlight">${data.topBroker.name}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Vendas</span>
        <span class="info-value">${data.topBroker.salesCount} venda${data.topBroker.salesCount !== 1 ? 's' : ''}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Valor Total</span>
        <span class="info-value highlight">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.topBroker.salesValue)}</span>
      </div>
    </div>

    <p style="color: #6b7280; margin: 20px 0; text-align: center;">
      <strong>Este é um relatório automático gerado no final do mês.</strong><br>
      Para análises detalhadas, acesse o sistema de relatórios.
    </p>

    <center>
      <a href="${ENV.frontendUrl || 'https://delmack.manus.space'}/reports" class="button">
        Ver Relatório Completo
      </a>
    </center>
  `;

  return sendEmail({
    to: data.recipients,
    subject: `📊 Relatório Mensal: ${monthName} - ${data.companyName}`,
    html: getEmailTemplate(content),
    text: `Relatório de vendas de ${monthName}. Total: ${data.totalSales} venda(s). Valor: R$ ${data.totalSalesValue.toFixed(2)}. Comissões: R$ ${data.totalCommissions.toFixed(2)}.`,
  });
}
