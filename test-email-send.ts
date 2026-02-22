import { sendEmail } from './server/_core/emailService';

async function testEmailSend() {
  console.log('=== TESTE DE ENVIO DE EMAIL ===\n');
  
  const result = await sendEmail({
    to: 'camila.pires@baggioimoveis.com.br',
    subject: 'Teste de Configuração SMTP - Delmack',
    html: `
      <h2>Teste de Configuração</h2>
      <p>Este é um email de teste para validar se as credenciais SMTP estão funcionando corretamente.</p>
      <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <p>Se você recebeu este email, significa que o serviço de email está <strong>✅ FUNCIONAL</strong>.</p>
    `,
    text: 'Email de teste - Credenciais SMTP funcionando'
  });

  console.log(result ? '✅ EMAIL ENVIADO COM SUCESSO' : '❌ ERRO AO ENVIAR EMAIL');
  process.exit(result ? 0 : 1);
}

testEmailSend().catch(err => {
  console.error('❌ ERRO:', err.message);
  process.exit(1);
});
