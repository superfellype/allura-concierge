import { supabase } from "@/integrations/supabase/client";

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: { value: any };
  setting_group: string;
  created_at: string;
  updated_at: string;
}

export type SettingGroup = 'identity' | 'home' | 'contact' | 'social' | 'footer' | 'pages' | 'seo' | 'ecommerce';

export interface BenefitItem {
  icon: string;
  title: string;
  description: string;
}

export interface FooterLink {
  label: string;
  url: string;
}

class SiteSettingsService {
  private cache: Map<string, any> = new Map();
  private cacheExpiry: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getAll(): Promise<{ data: SiteSetting[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('setting_key');

    return { data: data as SiteSetting[] | null, error };
  }

  async getByGroup(group: SettingGroup): Promise<{ data: SiteSetting[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('setting_group', group)
      .order('setting_key');

    return { data: data as SiteSetting[] | null, error };
  }

  async get(key: string): Promise<any> {
    // Check cache first
    if (this.cache.has(key) && Date.now() < this.cacheExpiry) {
      return this.cache.get(key);
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .maybeSingle();

    if (error || !data) return null;
    
    const value = (data.setting_value as any)?.value;
    this.cache.set(key, value);
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    
    return value;
  }

  async getMultiple(keys: string[]): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', keys);

    if (error || !data) return {};

    const result: Record<string, any> = {};
    data.forEach(item => {
      result[item.setting_key] = (item.setting_value as any)?.value;
    });

    return result;
  }

  async getAllAsObject(): Promise<Record<string, any>> {
    const { data } = await this.getAll();
    if (!data) return {};

    const result: Record<string, any> = {};
    data.forEach(item => {
      result[item.setting_key] = item.setting_value?.value;
    });

    return result;
  }

  async update(key: string, value: any): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('site_settings')
      .update({ setting_value: { value } })
      .eq('setting_key', key);

    if (!error) {
      this.cache.set(key, value);
    }

    return { error };
  }

  async updateMultiple(updates: Record<string, any>): Promise<{ error: Error | null }> {
    const promises = Object.entries(updates).map(([key, value]) => 
      supabase
        .from('site_settings')
        .update({ setting_value: { value } })
        .eq('setting_key', key)
    );

    const results = await Promise.all(promises);
    const error = results.find(r => r.error)?.error || null;

    if (!error) {
      Object.entries(updates).forEach(([key, value]) => {
        this.cache.set(key, value);
      });
    }

    return { error };
  }

  clearCache() {
    this.cache.clear();
    this.cacheExpiry = 0;
  }
}

export const siteSettingsService = new SiteSettingsService();
