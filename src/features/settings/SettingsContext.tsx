/**
 * PM Flow — Settings Context
 * Global state for application settings and templates.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { loadSettings, saveSettings, type AppSettings, type FileTemplate, DEFAULT_TEMPLATES } from '../../lib/config/settingsOps';

interface SettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  updateTemplates: (templates: FileTemplate[]) => Promise<void>;
  getTemplate: (id: string) => FileTemplate | undefined;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({ templates: DEFAULT_TEMPLATES });
  const [isLoading, setIsLoading] = useState(true);

  // Load on mount
  useEffect(() => {
    loadSettings().then(data => {
      setSettings(data);
      setIsLoading(false);
    });
  }, []);

  const updateTemplates = useCallback(async (templates: FileTemplate[]) => {
    const newSettings = { ...settings, templates };
    setSettings(newSettings);
    await saveSettings(newSettings);
  }, [settings]);

  const getTemplate = useCallback((id: string) => {
    return settings.templates.find(t => t.id === id);
  }, [settings.templates]);

  const value: SettingsContextValue = {
    settings,
    isLoading,
    updateTemplates,
    getTemplate
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
