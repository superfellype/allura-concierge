import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  images: string[] | null;
  attributes: Json | null;
  sku: string | null;
  cost_price: number | null;
  low_stock_threshold: number | null;
  allow_backorder: boolean | null;
  weight_grams: number | null;
  height_cm: number | null;
  width_cm: number | null;
  length_cm: number | null;
}

export interface ProductInput {
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  category: string;
  stock_quantity?: number;
  is_active?: boolean;
  is_featured?: boolean;
  images?: string[] | null;
  attributes?: Json | null;
  sku?: string | null;
  cost_price?: number | null;
  low_stock_threshold?: number | null;
  allow_backorder?: boolean | null;
  weight_grams?: number | null;
  height_cm?: number | null;
  width_cm?: number | null;
  length_cm?: number | null;
}

class ProductsService {
  async getAll(): Promise<{ data: Product[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    return { data: data as Product[] | null, error };
  }

  async getActive(): Promise<{ data: Product[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    return { data: data as Product[] | null, error };
  }

  async getFeatured(): Promise<{ data: Product[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .limit(8);

    return { data: data as Product[] | null, error };
  }

  async getBySlug(slug: string): Promise<{ data: Product | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    return { data: data as Product | null, error };
  }

  async getByCategory(category: string): Promise<{ data: Product[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    return { data: data as Product[] | null, error };
  }

  async create(input: ProductInput): Promise<{ data: Product | null; error: Error | null }> {
    const slug = input.slug || input.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    const { data, error } = await supabase
      .from("products")
      .insert({
        ...input,
        slug,
        stock_quantity: input.stock_quantity ?? 0,
        is_active: input.is_active ?? true,
        is_featured: input.is_featured ?? false,
      })
      .select()
      .single();

    return { data: data as Product | null, error };
  }

  async update(id: string, input: Partial<ProductInput>): Promise<{ data: Product | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("products")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    return { data: data as Product | null, error };
  }

  async delete(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    return { error };
  }

  async toggleActive(id: string, isActive: boolean): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from("products")
      .update({ is_active: isActive })
      .eq("id", id);

    return { error };
  }

  async updateStock(id: string, quantity: number): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: quantity })
      .eq("id", id);

    return { error };
  }

  async search(query: string): Promise<{ data: Product[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(20);

    return { data: data as Product[] | null, error };
  }

  async getCategories(): Promise<string[]> {
    const { data } = await supabase
      .from("products")
      .select("category")
      .eq("is_active", true);

    if (!data) return [];
    return [...new Set(data.map(p => p.category))];
  }
}

export const productsService = new ProductsService();
