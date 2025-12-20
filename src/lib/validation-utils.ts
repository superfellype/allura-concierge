import { z } from 'zod';

/**
 * Product validation schema with server-side compatible rules
 */
export const productSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  
  slug: z.string()
    .trim()
    .max(200, 'Slug deve ter no máximo 200 caracteres')
    .regex(/^[a-z0-9-]*$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .optional()
    .or(z.literal('')),
  
  sku: z.string()
    .trim()
    .max(50, 'SKU deve ter no máximo 50 caracteres')
    .regex(/^[A-Z0-9-]*$/i, 'SKU deve conter apenas letras, números e hífens')
    .optional()
    .or(z.literal('')),
  
  description: z.string()
    .trim()
    .max(5000, 'Descrição deve ter no máximo 5000 caracteres')
    .optional()
    .or(z.literal('')),
  
  price: z.number()
    .positive('Preço deve ser maior que zero')
    .max(9999999.99, 'Preço inválido'),
  
  original_price: z.number()
    .positive('Preço original deve ser maior que zero')
    .max(9999999.99, 'Preço original inválido')
    .optional()
    .nullable(),
  
  cost_price: z.number()
    .min(0, 'Preço de custo não pode ser negativo')
    .max(9999999.99, 'Preço de custo inválido')
    .optional()
    .nullable(),
  
  stock_quantity: z.number()
    .int('Quantidade deve ser um número inteiro')
    .min(0, 'Quantidade não pode ser negativa')
    .max(999999, 'Quantidade inválida'),
  
  images: z.array(z.string().url('URL de imagem inválida'))
    .max(20, 'Máximo de 20 imagens permitido')
    .optional()
    .nullable(),
});

export type ProductValidation = z.infer<typeof productSchema>;

/**
 * Validate product data and return errors if any
 */
export function validateProduct(data: Partial<ProductValidation>): { 
  valid: boolean; 
  errors: string[] 
} {
  const result = productSchema.safeParse(data);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }
  
  const errors = result.error.errors.map(e => e.message);
  return { valid: false, errors };
}

/**
 * Sanitize and validate slug format
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200);
}

/**
 * Validate image URLs
 */
export function validateImageUrls(urls: string[]): { valid: boolean; invalidUrls: string[] } {
  const invalidUrls: string[] = [];
  
  for (const url of urls) {
    try {
      new URL(url);
    } catch {
      invalidUrls.push(url);
    }
  }
  
  return {
    valid: invalidUrls.length === 0,
    invalidUrls
  };
}
