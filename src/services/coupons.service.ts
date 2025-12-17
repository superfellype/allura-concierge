import { supabase } from "@/integrations/supabase/client";

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  current_uses: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  applicable_products: string[] | null;
  applicable_categories: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CouponValidation {
  valid: boolean;
  error?: string;
  discount?: number;
  coupon?: Coupon;
}

class CouponsService {
  async getAll(): Promise<{ data: Coupon[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    return { data: data as Coupon[] | null, error };
  }

  async getByCode(code: string): Promise<{ data: Coupon | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    return { data: data as Coupon | null, error };
  }

  async validate(code: string, orderTotal: number): Promise<CouponValidation> {
    const { data: coupon, error } = await this.getByCode(code);

    if (error || !coupon) {
      return { valid: false, error: "Cupom não encontrado" };
    }

    const now = new Date();

    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return { valid: false, error: "Este cupom ainda não está ativo" };
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return { valid: false, error: "Este cupom expirou" };
    }

    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { valid: false, error: "Este cupom já atingiu o limite de uso" };
    }

    if (coupon.min_order_value && orderTotal < coupon.min_order_value) {
      return { 
        valid: false, 
        error: `Pedido mínimo de R$ ${coupon.min_order_value.toFixed(2)}` 
      };
    }

    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = orderTotal * (coupon.discount_value / 100);
    } else {
      discount = Math.min(coupon.discount_value, orderTotal);
    }

    return { valid: true, discount, coupon };
  }

  async create(input: Omit<Coupon, "id" | "current_uses" | "created_at" | "updated_at">): Promise<{ data: Coupon | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("coupons")
      .insert({ ...input, code: input.code.toUpperCase() })
      .select()
      .single();

    return { data: data as Coupon | null, error };
  }

  async update(id: string, input: Partial<Coupon>): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from("coupons")
      .update({ ...input, code: input.code?.toUpperCase() })
      .eq("id", id);

    return { error };
  }

  async delete(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    return { error };
  }

  async incrementUse(couponId: string, userId: string, orderId: string, discountApplied: number): Promise<{ error: Error | null }> {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("current_uses")
      .eq("id", couponId)
      .single();

    if (coupon) {
      await supabase
        .from("coupons")
        .update({ current_uses: (coupon.current_uses || 0) + 1 })
        .eq("id", couponId);
    }

    const { error } = await supabase
      .from("coupon_uses")
      .insert({ coupon_id: couponId, user_id: userId, order_id: orderId, discount_applied: discountApplied });

    return { error };
  }
}

export const couponsService = new CouponsService();
