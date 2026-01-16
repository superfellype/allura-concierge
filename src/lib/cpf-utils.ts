/**
 * Validates a Brazilian CPF number
 * @param cpf - CPF string (can contain formatting)
 * @returns boolean indicating if CPF is valid
 */
export function validateCpf(cpf: string): boolean {
  // Remove non-digits
  const cleaned = cpf.replace(/\D/g, "");
  
  // Must have 11 digits
  if (cleaned.length !== 11) return false;
  
  // Check for known invalid patterns (all same digits)
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[10])) return false;
  
  return true;
}

/**
 * Formats a CPF string with dots and dash
 * @param value - Raw CPF input
 * @returns Formatted CPF string
 */
export function formatCpf(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

/**
 * Cleans CPF to digits only
 * @param cpf - Formatted CPF string
 * @returns Digits-only CPF string
 */
export function cleanCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}
