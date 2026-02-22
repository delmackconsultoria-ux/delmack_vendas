import { ENV } from './server/_core/env';

console.log('=== VERIFICAÇÃO DE CREDENCIAIS SMTP ===\n');
console.log('SMTP_HOST:', ENV.smtpHost ? '✅ Configurado' : '❌ Não configurado');
console.log('SMTP_PORT:', ENV.smtpPort ? `✅ ${ENV.smtpPort}` : '❌ Não configurado');
console.log('SMTP_USER:', ENV.smtpUser ? `✅ ${ENV.smtpUser}` : '❌ Não configurado');
console.log('SMTP_PASS:', ENV.smtpPass ? '✅ Configurado' : '❌ Não configurado');
console.log('SMTP_FROM_NAME:', ENV.smtpFromName ? `✅ ${ENV.smtpFromName}` : '❌ Não configurado');

console.log('\n=== RESUMO ===');
const allConfigured = ENV.smtpHost && ENV.smtpPort && ENV.smtpUser && ENV.smtpPass;
console.log(allConfigured ? '✅ TODAS AS CREDENCIAIS CONFIGURADAS' : '❌ FALTAM CREDENCIAIS');
