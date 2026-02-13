import { describe, it, expect } from 'vitest';
import nodemailer from 'nodemailer';
import { ENV } from '../_core/env';

describe('SMTP Configuration', () => {
  it('should have SMTP credentials configured', () => {
    expect(ENV.smtpUser).toBeTruthy();
    expect(ENV.smtpPass).toBeTruthy();
    expect(ENV.smtpHost).toBeTruthy();
    expect(ENV.smtpPort).toBeTruthy();
  });

  it('should connect to SMTP server successfully', async () => {
    const transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: ENV.smtpPort,
      secure: true, // SSL
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
    });

    // Verificar conexão
    await expect(transporter.verify()).resolves.toBe(true);
  }, 15000); // Timeout de 15s para conexão SMTP
});
