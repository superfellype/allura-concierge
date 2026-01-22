/**
 * Centralizes price formatting and discount calculation logic
 * This is the SINGLE SOURCE OF TRUTH for all price formatting in the application
 */

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
 * Format price as installment display (compact)
 * @param price Total price in BRL
 * @param installments Number of installments (default 3)
 * @returns Formatted string like "3x R$ 100,00"
 */
export function formatInstallment(price: number, installments = 3): string {
  const installmentValue = price / installments;
  return `${installments}x ${formatCurrency(installmentValue)}`;
}

/**
 * Format price as installment display with preposition
 * Used in product cards and catalog displays
 * @param price Total price in BRL
 * @param installments Number of installments (default 3)
 * @returns Formatted string like "3x de R$ 100,00"
 */
export function formatInstallmentWithPreposition(price: number, installments = 3): string {
  const installmentValue = price / installments;
  return `${installments}x de ${formatCurrency(installmentValue)}`;
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
 * Check if price is below cost
 * @param price Sale price
 * @param costPrice Cost price
 * @returns Boolean indicating if selling below cost
 */
export function isPriceBelowCost(price: number, costPrice: number | null): boolean {
  if (!costPrice || costPrice <= 0) return false;
  return price < costPrice;
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

/**
 * Round price to 2 decimal places (standard for BRL)
 * @param price Price value
 * @returns Rounded price
 */
export function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}
