import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface Installment {
  qty: number;
  tax: number;
  label: string;
}

export interface PaymentSetting {
  id: string;
  method_id: string;
  method_label: string;
  icon: string;
  is_active: boolean;
  installments: Installment[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const paymentSettingsService = {
  async getAll(): Promise<{ data: PaymentSetting[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("payment_settings")
      .select("*")
      .order("display_order");

    if (error) {
      return { data: null, error: error as unknown as Error };
    }

    // Parse installments from JSON
    const parsed = data?.map((item: Record<string, unknown>) => ({
      ...item,
      installments: Array.isArray(item.installments) 
        ? item.installments 
        : JSON.parse(item.installments as string || "[]"),
    })) as PaymentSetting[];

    return { data: parsed, error: null };
  },

  async update(
    id: string,
    updates: Partial<Pick<PaymentSetting, "method_label" | "icon" | "is_active" | "installments" | "display_order">>
  ): Promise<{ error: Error | null }> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.method_label !== undefined) updateData.method_label = updates.method_label;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.display_order !== undefined) updateData.display_order = updates.display_order;
    if (updates.installments !== undefined) updateData.installments = updates.installments as unknown as Json;

    const { error } = await supabase
      .from("payment_settings")
      .update(updateData)
      .eq("id", id);

    return { error: error as unknown as Error | null };
  },

  async updateInstallment(
    id: string,
    installmentQty: number,
    newTax: number
  ): Promise<{ error: Error | null }> {
    // First get current installments
    const { data: current, error: fetchError } = await supabase
      .from("payment_settings")
      .select("installments")
      .eq("id", id)
      .single();

    if (fetchError) {
      return { error: fetchError as unknown as Error };
    }

    const installments = Array.isArray(current.installments)
      ? current.installments
      : JSON.parse(current.installments as string || "[]");

    // Update the specific installment
    const updated = installments.map((inst: Installment) =>
      inst.qty === installmentQty ? { ...inst, tax: newTax } : inst
    );

    const { error } = await supabase
      .from("payment_settings")
      .update({
        installments: updated as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return { error: error as unknown as Error | null };
  },
};
