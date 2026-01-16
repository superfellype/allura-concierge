import { supabase } from "@/integrations/supabase/client";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BrandInput {
  name: string;
  slug?: string;
  logo_url?: string;
  is_active?: boolean;
  display_order?: number;
}

class BrandsService {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async getAll(): Promise<{ data: Brand[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("display_order", { ascending: true });

    return { data: data as Brand[] | null, error: error as Error | null };
  }

  async getActive(): Promise<{ data: Brand[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    return { data: data as Brand[] | null, error: error as Error | null };
  }

  async create(input: BrandInput): Promise<{ data: Brand | null; error: Error | null }> {
    const slug = input.slug || this.generateSlug(input.name);
    
    const { data, error } = await supabase
      .from("brands")
      .insert({
        name: input.name,
        slug,
        logo_url: input.logo_url || null,
        is_active: input.is_active ?? true,
        display_order: input.display_order ?? 0,
      })
      .select()
      .single();

    return { data: data as Brand | null, error: error as Error | null };
  }

  async update(id: string, input: Partial<BrandInput>): Promise<{ error: Error | null }> {
    const updateData: Record<string, unknown> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
      if (!input.slug) {
        updateData.slug = this.generateSlug(input.name);
      }
    }
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.logo_url !== undefined) updateData.logo_url = input.logo_url;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.display_order !== undefined) updateData.display_order = input.display_order;

    const { error } = await supabase
      .from("brands")
      .update(updateData)
      .eq("id", id);

    return { error: error as Error | null };
  }

  async delete(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from("brands")
      .delete()
      .eq("id", id);

    return { error: error as Error | null };
  }

  async toggleActive(id: string, isActive: boolean): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from("brands")
      .update({ is_active: isActive })
      .eq("id", id);

    return { error: error as Error | null };
  }
}

export const brandsService = new BrandsService();
