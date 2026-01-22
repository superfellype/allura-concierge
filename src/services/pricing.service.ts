/**
 * Pricing Service - Isolated business logic for pricing operations
 * Handles mass discounts, price calculations, and related validations
 */

import { supabase } from "@/integrations/supabase/client";
import { roundPrice, isPriceBelowCost } from "@/lib/price-utils";

export interface MassDiscountPreview {
  name: string;
  oldPrice: number;
  newPrice: number;
  belowCost: boolean;
}

export interface MassDiscountResult {
  success: boolean;
  updatedCount: number;
  errors: string[];
  belowCostWarnings: { productId: string; name: string; newPrice: number; costPrice: number }[];
}

interface ProductForDiscount {
  id: string;
  name: string;
  price: number;
  cost_price: number | null;
  is_active: boolean;
}

class PricingService {
  /**
   * Calculate preview of mass discount application
   * @param products List of products to preview
   * @param percentOff Discount percentage (1-100)
   * @param limit Max number of items to show in preview
   * @returns Array of preview objects
   */
  calculateMassDiscountPreview(
    products: ProductForDiscount[],
    percentOff: number,
    limit = 10
  ): MassDiscountPreview[] {
    if (percentOff <= 0 || percentOff > 100) return [];

    return products
      .filter((p) => p.is_active)
      .slice(0, limit)
      .map((p) => {
        const newPrice = roundPrice(p.price * (1 - percentOff / 100));
        return {
          name: p.name,
          oldPrice: p.price,
          newPrice,
          belowCost: isPriceBelowCost(newPrice, p.cost_price),
        };
      });
  }

  /**
   * Apply mass discount to all active products
   * Uses batch updates for efficiency
   * @param products List of products to update
   * @param percentOff Discount percentage (1-100)
   * @returns Result object with success status and details
   */
  async applyMassDiscount(
    products: ProductForDiscount[],
    percentOff: number
  ): Promise<MassDiscountResult> {
    if (percentOff <= 0 || percentOff > 100) {
      return {
        success: false,
        updatedCount: 0,
        errors: ["Percentual de desconto inválido (deve ser entre 1 e 100)"],
        belowCostWarnings: [],
      };
    }

    const activeProducts = products.filter((p) => p.is_active);
    const errors: string[] = [];
    const belowCostWarnings: MassDiscountResult["belowCostWarnings"] = [];
    let updatedCount = 0;

    // Process in chunks of 50 to avoid timeout
    const chunks = this.chunkArray(activeProducts, 50);

    for (const chunk of chunks) {
      // Prepare updates with price validation
      const updates = chunk.map((p) => {
        const newPrice = roundPrice(p.price * (1 - percentOff / 100));
        
        if (isPriceBelowCost(newPrice, p.cost_price)) {
          belowCostWarnings.push({
            productId: p.id,
            name: p.name,
            newPrice,
            costPrice: p.cost_price!,
          });
        }

        return {
          id: p.id,
          original_price: p.price, // Save current price as reference
          price: newPrice,
        };
      });

      // Execute batch update
      for (const update of updates) {
        const { error } = await supabase
          .from("products")
          .update({
            original_price: update.original_price,
            price: update.price,
          })
          .eq("id", update.id);

        if (error) {
          errors.push(`Erro ao atualizar produto ${update.id}: ${error.message}`);
        } else {
          updatedCount++;
        }
      }
    }

    return {
      success: errors.length === 0,
      updatedCount,
      errors,
      belowCostWarnings,
    };
  }

  /**
   * Validate discount percentage
   * @param percent Discount percentage
   * @returns Object with valid flag and error message
   */
  validateDiscountPercent(percent: number): { valid: boolean; error?: string } {
    if (typeof percent !== "number" || isNaN(percent)) {
      return { valid: false, error: "Percentual deve ser um número" };
    }
    if (percent <= 0) {
      return { valid: false, error: "Percentual deve ser maior que zero" };
    }
    if (percent > 100) {
      return { valid: false, error: "Percentual não pode ser maior que 100%" };
    }
    return { valid: true };
  }

  /**
   * Split array into chunks of specified size
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }
}

export const pricingService = new PricingService();
