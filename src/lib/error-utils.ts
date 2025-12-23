/**
 * Error handling utilities to prevent information leakage
 * Maps internal error messages to user-friendly messages
 */

export function getUserFriendlyError(error: unknown): string {
  const message = getErrorMessage(error);
  const lower = message.toLowerCase();

  // Map specific error patterns to generic messages
  if (lower.includes('violates row-level security') || lower.includes('violates row')) {
    return 'Operação não autorizada';
  }

  if (lower.includes('not found') || lower.includes('no rows')) {
    return 'Item não encontrado';
  }

  if (lower.includes('duplicate') || lower.includes('unique constraint') || lower.includes('23505')) {
    return 'Este item já existe';
  }

  if (lower.includes('invalid login credentials')) {
    return 'Email ou senha incorretos';
  }

  if (lower.includes('email not confirmed')) {
    return 'Por favor, confirme seu email antes de entrar';
  }

  if (lower.includes('user already registered')) {
    return 'Este email já está cadastrado';
  }

  // Password reset / update specific errors
  if (lower.includes('same_password') || lower.includes('new password should be different')) {
    return 'A nova senha precisa ser diferente da senha atual';
  }

  if (lower.includes('one-time token not found') || lower.includes('email link is invalid') || lower.includes('has expired')) {
    return 'Link de recuperação inválido ou expirado. Solicite um novo.';
  }

  if (lower.includes('password')) {
    return 'Senha inválida';
  }

  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Erro de conexão. Tente novamente.';
  }

  if (lower.includes('timeout')) {
    return 'A operação demorou muito. Tente novamente.';
  }

  // Default generic message
  return 'Erro ao processar solicitação';
}

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }
    if ('code' in error && typeof (error as any).code === 'string') {
      return (error as any).code;
    }
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

/**
 * Safe console error logging - only logs in development
 * In production, sensitive details are filtered
 */
export function safeLogError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  } else {
    // In production, only log the context and a safe message
    console.error(`[${context}]`, getUserFriendlyError(error));
  }
}
