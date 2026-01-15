/**
 * Centralizes price formatting and discount calculation logic
 */

/**
 * Format price as installment display
 * @param price Total price in BRL
 * @param installments Number of installments (default 3)
 * @returns Formatted string like "3x R$ 100,00"
 */
export function formatInstallment(price: number, installments = 3): string {
  const installmentValue = price / installments;
  return `${installments}x ${formatCurrency(installmentValue)}`;
}

/**
 * Calculate discount percentage between original and current price
 * @param price Current price
 * @param originalPrice Original price
 * @returns Discount percentage (0-100)
 */
export function calculateDiscount(price: number, originalPrice: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Format price as full currency string
 * @param price Price value
 * @returns Formatted string like "R$ 1.299,00"
 */
export function formatCurrency(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}

/**
 * Calculate gross, tax, and net amounts for manual sales
 * @param grossAmount Original amount
 * @param taxPercentage Tax percentage (0-100)
 * @param fixedTax Fixed tax amount
 * @returns Object with gross, tax, and net values
 */
export function calculateNetAmount(
  grossAmount: number,
  taxPercentage: number = 0,
  fixedTax: number = 0
): { gross: number; tax: number; net: number } {
  const percentageTax = grossAmount * (taxPercentage / 100);
  const totalTax = percentageTax + fixedTax;
  const net = grossAmount - totalTax;
  
  return {
    gross: grossAmount,
    tax: totalTax,
    net: Math.max(0, net)
  };
}
