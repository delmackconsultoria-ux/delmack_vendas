/**
 * Serviço de notificações por email
 * Responsável por enviar emails de notificação para usuários
 */

import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SaleNotificationData {
  brokerName: string;
  propertyAddress?: string;
  saleValue: number;
  commissionValue: number;
  commissionType: string;
}

interface ApprovalNotificationData {
  brokerName: string;
  saleValue: number;
  status: "approved" | "rejected";
  observation?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Usar variáveis de ambiente para configuração
    // Suporta Gmail, SendGrid, AWS SES, etc.
    const emailProvider = process.env.EMAIL_PROVIDER || "smtp";

    if (emailProvider === "gmail") {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } else if (emailProvider === "sendgrid") {
      this.transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        auth: {
          user: "apikey",
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else {
      // SMTP genérico
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
  }

  /**
   * Envia email genérico
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.warn("[Email] Transporter não configurado");
        return false;
      }

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || "noreply@delmack.com.br",
        ...options,
      });

      console.log(`[Email] Email enviado para ${options.to}`);
      return true;
    } catch (error) {
      console.error("[Email] Erro ao enviar email:", error);
      return false;
    }
  }

  /**
   * Notifica corretor sobre nova venda registrada
   */
  async notifySaleCreated(
    brokerEmail: string,
    data: SaleNotificationData
  ): Promise<boolean> {
    const html = `
      <h2>Nova Venda Registrada</h2>
      <p>Olá <strong>${data.brokerName}</strong>,</p>
      <p>Uma nova venda foi registrada no sistema:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Imóvel:</strong> ${data.propertyAddress || "Sem endereço"}</p>
        <p><strong>Valor da Venda:</strong> R$ ${(data.saleValue / 100).toFixed(2)}</p>
        <p><strong>Tipo de Comissão:</strong> ${data.commissionType}</p>
        <p><strong>Valor da Comissão:</strong> R$ ${(data.commissionValue / 100).toFixed(2)}</p>
      </div>
      
      <p>Acesse o sistema para mais detalhes: <a href="${process.env.APP_URL}/dashboard">Acessar Dashboard</a></p>
      
      <p>Atenciosamente,<br/>Equipe Delmack</p>
    `;

    return this.sendEmail({
      to: brokerEmail,
      subject: "Nova Venda Registrada - Delmack",
      html,
      text: `Nova venda registrada: ${data.propertyAddress} - R$ ${(data.saleValue / 100).toFixed(2)}`,
    });
  }

  /**
   * Notifica gerente sobre nova venda registrada
   */
  async notifyManagerSaleCreated(
    managerEmail: string,
    data: SaleNotificationData
  ): Promise<boolean> {
    const html = `
      <h2>Nova Venda Registrada</h2>
      <p>Olá Gerente,</p>
      <p>Uma nova venda foi registrada por <strong>${data.brokerName}</strong>:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Corretor:</strong> ${data.brokerName}</p>
        <p><strong>Imóvel:</strong> ${data.propertyAddress || "Sem endereço"}</p>
        <p><strong>Valor da Venda:</strong> R$ ${(data.saleValue / 100).toFixed(2)}</p>
        <p><strong>Tipo de Comissão:</strong> ${data.commissionType}</p>
        <p><strong>Valor da Comissão:</strong> R$ ${(data.commissionValue / 100).toFixed(2)}</p>
      </div>
      
      <p>Acesse o sistema para revisar: <a href="${process.env.APP_URL}/sales-approval">Aprovar Vendas</a></p>
      
      <p>Atenciosamente,<br/>Equipe Delmack</p>
    `;

    return this.sendEmail({
      to: managerEmail,
      subject: "Nova Venda para Aprovação - Delmack",
      html,
      text: `Nova venda de ${data.brokerName}: ${data.propertyAddress} - R$ ${(data.saleValue / 100).toFixed(2)}`,
    });
  }

  /**
   * Notifica financeiro sobre nova venda registrada
   */
  async notifyFinanceSaleCreated(
    financeEmail: string,
    data: SaleNotificationData
  ): Promise<boolean> {
    const html = `
      <h2>Nova Venda Registrada</h2>
      <p>Olá Financeiro,</p>
      <p>Uma nova venda foi registrada por <strong>${data.brokerName}</strong>:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Corretor:</strong> ${data.brokerName}</p>
        <p><strong>Imóvel:</strong> ${data.propertyAddress || "Sem endereço"}</p>
        <p><strong>Valor da Venda:</strong> R$ ${(data.saleValue / 100).toFixed(2)}</p>
        <p><strong>Tipo de Comissão:</strong> ${data.commissionType}</p>
        <p><strong>Valor da Comissão:</strong> R$ ${(data.commissionValue / 100).toFixed(2)}</p>
      </div>
      
      <p>Status: Pendente de Aprovação</p>
      <p>Acesse o sistema para mais detalhes: <a href="${process.env.APP_URL}/sales-approval">Visualizar Vendas</a></p>
      
      <p>Atenciosamente,<br/>Equipe Delmack</p>
    `;

    return this.sendEmail({
      to: financeEmail,
      subject: "Nova Venda Pendente de Aprovação - Delmack",
      html,
      text: `Nova venda de ${data.brokerName}: ${data.propertyAddress} - R$ ${(data.saleValue / 100).toFixed(2)}`,
    });
  }

  /**
   * Notifica corretor sobre aprovação/rejeição da venda
   */
  async notifySaleApproval(
    brokerEmail: string,
    data: ApprovalNotificationData
  ): Promise<boolean> {
    const statusText = data.status === "approved" ? "Aprovada" : "Rejeitada";
    const statusColor = data.status === "approved" ? "#28a745" : "#dc3545";

    const html = `
      <h2>Venda ${statusText}</h2>
      <p>Olá <strong>${data.brokerName}</strong>,</p>
      <p>Sua venda foi <strong style="color: ${statusColor};">${statusText}</strong>:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Valor da Venda:</strong> R$ ${(data.saleValue / 100).toFixed(2)}</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
        ${data.observation ? `<p><strong>Observação:</strong> ${data.observation}</p>` : ""}
      </div>
      
      <p>Acesse o sistema para mais detalhes: <a href="${process.env.APP_URL}/dashboard">Acessar Dashboard</a></p>
      
      <p>Atenciosamente,<br/>Equipe Delmack</p>
    `;

    return this.sendEmail({
      to: brokerEmail,
      subject: `Venda ${statusText} - Delmack`,
      html,
      text: `Sua venda foi ${statusText}. Valor: R$ ${(data.saleValue / 100).toFixed(2)}`,
    });
  }

  /**
   * Notifica corretor sobre comissão gerada
   */
  async notifyCommissionGenerated(
    brokerEmail: string,
    brokerName: string,
    commissionValue: number,
    commissionType: string
  ): Promise<boolean> {
    const html = `
      <h2>Comissão Gerada</h2>
      <p>Olá <strong>${brokerName}</strong>,</p>
      <p>Uma comissão foi gerada para você:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Tipo de Comissão:</strong> ${commissionType}</p>
        <p><strong>Valor:</strong> R$ ${(commissionValue / 100).toFixed(2)}</p>
        <p><strong>Status:</strong> Pendente de Pagamento</p>
      </div>
      
      <p>Acesse o sistema para acompanhar: <a href="${process.env.APP_URL}/dashboard">Acessar Dashboard</a></p>
      
      <p>Atenciosamente,<br/>Equipe Delmack</p>
    `;

    return this.sendEmail({
      to: brokerEmail,
      subject: "Comissão Gerada - Delmack",
      html,
      text: `Comissão gerada: R$ ${(commissionValue / 100).toFixed(2)} (${commissionType})`,
    });
  }

  /**
   * Notifica corretor sobre pagamento de comissão
   */
  async notifyCommissionPaid(
    brokerEmail: string,
    brokerName: string,
    commissionValue: number,
    paymentDate: Date
  ): Promise<boolean> {
    const html = `
      <h2>Comissão Paga</h2>
      <p>Olá <strong>${brokerName}</strong>,</p>
      <p>Sua comissão foi paga com sucesso!</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Valor:</strong> R$ ${(commissionValue / 100).toFixed(2)}</p>
        <p><strong>Data de Pagamento:</strong> ${paymentDate.toLocaleDateString("pt-BR")}</p>
      </div>
      
      <p>Acesse o sistema para mais detalhes: <a href="${process.env.APP_URL}/dashboard">Acessar Dashboard</a></p>
      
      <p>Atenciosamente,<br/>Equipe Delmack</p>
    `;

    return this.sendEmail({
      to: brokerEmail,
      subject: "Comissão Paga - Delmack",
      html,
      text: `Comissão paga: R$ ${(commissionValue / 100).toFixed(2)} em ${paymentDate.toLocaleDateString("pt-BR")}`,
    });
  }
}

export const emailService = new EmailService();
export type { EmailOptions, SaleNotificationData, ApprovalNotificationData };

