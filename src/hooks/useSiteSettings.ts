import { useState, useEffect } from 'react';
import { siteSettingsService, SiteSetting, SettingGroup } from '@/services/site-settings.service';

export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await siteSettingsService.getAllAsObject();
      setSettings(data);
    } catch (err) {
      setError(err as Error);
    }
    setLoading(false);
  };

  const updateSetting = async (key: string, value: any) => {
    const { error } = await siteSettingsService.update(key, value);
    if (!error) {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
    return { error };
  };

  const updateMultiple = async (updates: Record<string, any>) => {
    const { error } = await siteSettingsService.updateMultiple(updates);
    if (!error) {
      setSettings(prev => ({ ...prev, ...updates }));
    }
    return { error };
  };

  const getSetting = (key: string, defaultValue: any = '') => {
    return settings[key] ?? defaultValue;
  };

  return {
    settings,
    loading,
    error,
    updateSetting,
    updateMultiple,
    getSetting,
    refresh: loadSettings,
  };
}

export function useSiteSettingsByGroup(group: SettingGroup) {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [group]);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await siteSettingsService.getByGroup(group);
    setSettings(data || []);
    setLoading(false);
  };

  return { settings, loading, refresh: loadSettings };
}
