/**
 * Error handling utilities to prevent information leakage
 * Maps internal error messages to user-friendly messages
 */

export function getUserFriendlyError(error: unknown): string {
  const message = getErrorMessage(error);
  
  // Map specific error patterns to generic messages
  if (message.includes('violates row-level security') || message.includes('violates row')) {
    return 'Operação não autorizada';
  }
  
  if (message.includes('not found') || message.includes('no rows')) {
    return 'Item não encontrado';
  }
  
  if (message.includes('duplicate') || message.includes('unique constraint') || message.includes('23505')) {
    return 'Este item já existe';
  }
  
  if (message.includes('Invalid login credentials')) {
    return 'Email ou senha incorretos';
  }
  
  if (message.includes('Email not confirmed')) {
    return 'Por favor, confirme seu email antes de entrar';
  }
  
  if (message.includes('User already registered')) {
    return 'Este email já está cadastrado';
  }
  
  if (message.includes('Password')) {
    return 'Senha inválida';
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Erro de conexão. Tente novamente.';
  }
  
  if (message.includes('timeout')) {
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
