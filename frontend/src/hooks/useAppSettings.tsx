import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { appSettingsAPI } from '../services/api';
import { useFavicon } from './useFavicon';

interface AppSettings {
  appTitle: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  sidebarColor: string;
  theme: 'light' | 'dark';
}

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>, logoFile?: File, faviconFile?: File) => Promise<void>;
  resetSettings: () => Promise<void>;
  applySettings: (settingsToApply?: AppSettings) => void;
}

const defaultSettings: AppSettings = {
  appTitle: 'Dashboard Donasi',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  sidebarColor: '#f8fafc',
  theme: 'light'
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  
  // Apply favicon automatically when settings change
  useFavicon(settings.faviconUrl);

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await appSettingsAPI.get();
        const apiSettings = response.data;
        
        // Convert snake_case to camelCase for frontend
        const frontendSettings: AppSettings = {
          appTitle: apiSettings.app_title || defaultSettings.appTitle,
          logoUrl: apiSettings.logo_url || defaultSettings.logoUrl,
          faviconUrl: apiSettings.favicon_url || defaultSettings.faviconUrl,
          primaryColor: apiSettings.primary_color || defaultSettings.primaryColor,
          secondaryColor: apiSettings.secondary_color || defaultSettings.secondaryColor,
          backgroundColor: apiSettings.background_color || defaultSettings.backgroundColor,
          textColor: apiSettings.text_color || defaultSettings.textColor,
          sidebarColor: apiSettings.sidebar_color || defaultSettings.sidebarColor,
          theme: defaultSettings.theme, // theme is not stored in backend yet
        };
        
        setSettings(frontendSettings);
        applySettings(frontendSettings);
      } catch (error) {
        console.warn('Failed to load settings from API, using defaults:', error);
        // Fallback to default settings if API fails
        setSettings(defaultSettings);
        applySettings(defaultSettings);
      }
    };
    
    // Add a small delay to ensure backend is ready
    const timeoutId = setTimeout(loadSettings, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Apply settings to CSS variables and DOM
  const applySettings = (settingsToApply: AppSettings = settings) => {
    const root = document.documentElement;
    
    // Apply CSS variables
    root.style.setProperty('--primary-color', settingsToApply.primaryColor);
    root.style.setProperty('--secondary-color', settingsToApply.secondaryColor);
    root.style.setProperty('--background-color', settingsToApply.backgroundColor);
    root.style.setProperty('--text-color', settingsToApply.textColor);
    root.style.setProperty('--sidebar-color', settingsToApply.sidebarColor);
    
    // Update app title in document
    document.title = settingsToApply.appTitle;
    
    // Update app title in sidebar elements
    const titleElements = document.querySelectorAll('h1');
    titleElements.forEach(element => {
      if (element.textContent?.includes('Dashboard')) {
        element.textContent = settingsToApply.appTitle;
      }
    });
    
    // Logo updates are now handled by React components directly
    // No need for DOM manipulation
  };

  const updateSettings = async (newSettings: Partial<AppSettings>, logoFile?: File, faviconFile?: File) => {
    const updatedSettings = { ...settings, ...newSettings };
    try {
      let logoUrl = updatedSettings.logoUrl;
      let faviconUrl = updatedSettings.faviconUrl;
      
      // Upload logo file if provided
      if (logoFile) {
        const uploadResponse = await appSettingsAPI.uploadLogo(logoFile);
        if (uploadResponse.success) {
          logoUrl = uploadResponse.data.logo_url;
          updatedSettings.logoUrl = logoUrl;
        }
      }
      
      // Upload favicon file if provided
      if (faviconFile) {
        const uploadResponse = await appSettingsAPI.uploadFavicon(faviconFile);
        if (uploadResponse.success) {
          faviconUrl = uploadResponse.data.favicon_url;
          updatedSettings.faviconUrl = faviconUrl;
        }
      }
      
      // Convert camelCase to snake_case for API
      const apiData = {
        app_title: updatedSettings.appTitle,
        logo_url: logoUrl || '',
        favicon_url: faviconUrl || '',
        primary_color: updatedSettings.primaryColor,
        secondary_color: updatedSettings.secondaryColor,
        background_color: updatedSettings.backgroundColor,
        text_color: updatedSettings.textColor,
        sidebar_color: updatedSettings.sidebarColor,
      };
      
      // Only update other settings if no file upload or if file upload was successful
      if ((!logoFile || logoUrl) && (!faviconFile || faviconUrl)) {
        await appSettingsAPI.update(apiData);
      }
      
      setSettings(updatedSettings);
      applySettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert to previous settings if API call fails
      throw error;
    }
  };

  const resetSettings = async () => {
    try {
      // Convert camelCase to snake_case for API
      const apiData = {
        app_title: defaultSettings.appTitle,
        logo_url: defaultSettings.logoUrl || '',
        primary_color: defaultSettings.primaryColor,
        secondary_color: defaultSettings.secondaryColor,
        background_color: defaultSettings.backgroundColor,
        text_color: defaultSettings.textColor,
        sidebar_color: defaultSettings.sidebarColor,
      };
      
      await appSettingsAPI.update(apiData);
      setSettings(defaultSettings);
      applySettings(defaultSettings);
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  };

  return (
    <AppSettingsContext.Provider value={{
      settings,
      updateSettings,
      resetSettings,
      applySettings
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}

export type { AppSettings };
export { defaultSettings };