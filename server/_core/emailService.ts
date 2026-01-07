/**
 * Serviço de envio de emails via SMTP
 * Configurado para usar email-ssl.com.br:465 (SSL)
 */

import nodemailer from 'nodemailer';
import { ENV } from './env';

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

    const info = await transporter.sendMail({
      from: `"${ENV.smtpFromName || 'Delmack'}" <${ENV.smtpUser}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('[Email] Email enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Envia notificação de nova proposta para gerente
 */
export async function sendNewProposalNotification(data: {
  managerEmail: string;
  brokerName: string;
  buyerName: string;
  propertyAddress: string;
  saleValue: number;
  proposalId: string;
}): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Nova Proposta Cadastrada</h2>
      <p>Uma nova proposta foi registrada no sistema:</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Corretor:</strong> ${data.brokerName}</p>
        <p><strong>Comprador:</strong> ${data.buyerName}</p>
        <p><strong>Imóvel:</strong> ${data.propertyAddress}</p>
        <p><strong>Valor:</strong> R$ ${data.saleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      </div>
      
      <p>Acesse o sistema para revisar e aprovar a proposta.</p>
      
      <a href="${ENV.frontendUrl || 'https://delmack.manus.space'}/proposals/${data.proposalId}" 
         style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
        Ver Proposta
      </a>
      
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px;">
        Este é um email automático do sistema Delmack. Não responda a este email.
      </p>
    </div>
  `;

  return sendEmail({
    to: data.managerEmail,
    subject: `Nova Proposta: ${data.buyerName} - ${data.propertyAddress}`,
    html,
    text: `Nova proposta cadastrada por ${data.brokerName}. Comprador: ${data.buyerName}. Valor: R$ ${data.saleValue.toFixed(2)}`,
  });
}

/**
 * Envia notificação de mudança de status da proposta
 */
export async function sendStatusChangeNotification(data: {
  userEmail: string;
  userName: string;
  buyerName: string;
  propertyAddress: string;
  oldStatus: string;
  newStatus: string;
  proposalId: string;
  comment?: string;
}): Promise<boolean> {
  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    pending: 'Pendente',
    sale: 'Venda',
    manager_review: 'Em Análise (Gerente)',
    finance_review: 'Em Análise (Financeiro)',
    commission_paid: 'Comissão Paga',
    cancelled: 'Cancelada',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Status da Proposta Alterado</h2>
      <p>Olá ${data.userName},</p>
      <p>O status da proposta foi atualizado:</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Comprador:</strong> ${data.buyerName}</p>
        <p><strong>Imóvel:</strong> ${data.propertyAddress}</p>
        <p><strong>Status Anterior:</strong> <span style="color: #6b7280;">${statusLabels[data.oldStatus] || data.oldStatus}</span></p>
        <p><strong>Novo Status:</strong> <span style="color: #16a34a; font-weight: bold;">${statusLabels[data.newStatus] || data.newStatus}</span></p>
        ${data.comment ? `<p><strong>Comentário:</strong> ${data.comment}</p>` : ''}
      </div>
      
      <a href="${ENV.frontendUrl || 'https://delmack.manus.space'}/proposals/${data.proposalId}" 
         style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
        Ver Proposta
      </a>
      
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px;">
        Este é um email automático do sistema Delmack. Não responda a este email.
      </p>
    </div>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `Proposta ${statusLabels[data.newStatus]}: ${data.buyerName}`,
    html,
    text: `Status da proposta alterado de "${statusLabels[data.oldStatus]}" para "${statusLabels[data.newStatus]}". Comprador: ${data.buyerName}`,
  });
}
