/**
 * Filtro de Emails para Testes
 * Durante testes, apenas emails da Delmack recebem notificações
 * Emails da Baggio são bloqueados
 */

// Emails autorizados para receber notificações durante testes
const AUTHORIZED_TEST_EMAILS = [
  'angellicapassosup@gmail.com',
  'delmackconsultoria@gmail.com',
];

// Modo de teste (ativar/desativar filtro)
const TEST_MODE_ENABLED = process.env.EMAIL_TEST_MODE === 'true' || process.env.NODE_ENV === 'development';

/**
 * Verifica se um email está autorizado a receber notificações durante testes
 * @param email Email a verificar
 * @returns true se autorizado, false se bloqueado
 */
export function isEmailAuthorizedForTests(email: string): boolean {
  if (!TEST_MODE_ENABLED) {
    // Se modo de teste desativado, todos os emails são autorizados
    return true;
  }

  // Normalizar email (lowercase)
  const normalizedEmail = email.toLowerCase().trim();

  // Verificar se está na lista de autorizados
  const isAuthorized = AUTHORIZED_TEST_EMAILS.some(
    authorized => authorized.toLowerCase() === normalizedEmail
  );

  if (!isAuthorized) {
    console.log(`[Email Filter] Email bloqueado em modo de teste: ${email}`);
  }

  return isAuthorized;
}

/**
 * Filtra lista de emails para apenas os autorizados durante testes
 * @param emails Array de emails
 * @returns Array filtrado com apenas emails autorizados
 */
export function filterEmailsForTests(emails: string[]): string[] {
  if (!TEST_MODE_ENABLED) {
    return emails;
  }

  const filtered = emails.filter(email => isEmailAuthorizedForTests(email));

  if (filtered.length === 0) {
    console.warn('[Email Filter] Nenhum email autorizado encontrado na lista. Emails bloqueados:', emails);
  }

  return filtered;
}

/**
 * Verifica se há pelo menos um email autorizado na lista
 * @param emails Array de emails
 * @returns true se há pelo menos um email autorizado
 */
export function hasAuthorizedEmails(emails: string[]): boolean {
  if (!TEST_MODE_ENABLED) {
    return emails.length > 0;
  }

  return emails.some(email => isEmailAuthorizedForTests(email));
}

/**
 * Retorna status do modo de teste
 */
export function getTestModeStatus() {
  return {
    enabled: TEST_MODE_ENABLED,
    authorizedEmails: AUTHORIZED_TEST_EMAILS,
    message: TEST_MODE_ENABLED
      ? `Modo de teste ATIVO. Apenas ${AUTHORIZED_TEST_EMAILS.length} emails autorizados receberão notificações.`
      : 'Modo de teste DESATIVO. Todos os emails receberão notificações.',
  };
}
