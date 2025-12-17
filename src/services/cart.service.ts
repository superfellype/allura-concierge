import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  attributes: Json | null;
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[] | null;
    stock_quantity: number;
  };
}

class CartService {
  async getByUser(userId: string): Promise<{ data: CartItem[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        *,
        products (id, name, price, images, stock_quantity)
      `)
      .eq("user_id", userId);

    if (data) {
      return {
        data: data.map(item => ({
          ...item,
          product: (item as any).products as CartItem["product"]
        })) as CartItem[],
        error: null
      };
    }

    return { data: null, error };
  }

  async addItem(userId: string, productId: string, quantity: number = 1, attributes?: Json): Promise<{ error: Error | null }> {
    // Check if item already exists
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();

    if (existing) {
      // Update quantity
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id);
      return { error };
    }

    // Create new item
    const { error } = await supabase
      .from("cart_items")
      .insert({
        user_id: userId,
        product_id: productId,
        quantity,
        attributes: attributes || null
      });

    return { error };
  }

  async updateQuantity(itemId: string, quantity: number): Promise<{ error: Error | null }> {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", itemId);

    return { error };
  }

  async removeItem(itemId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    return { error };
  }

  async clearCart(userId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);

    return { error };
  }

  async getCartTotal(userId: string): Promise<{ subtotal: number; itemCount: number }> {
    const { data } = await this.getByUser(userId);
    
    if (!data) {
      return { subtotal: 0, itemCount: 0 };
    }

    const subtotal = data.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);

    const itemCount = data.reduce((sum, item) => sum + item.quantity, 0);

    return { subtotal, itemCount };
  }
}

export const cartService = new CartService();
