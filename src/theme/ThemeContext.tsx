/**
 * Theme context for SumTrails
 * Provides theme colors throughout the app
 */

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, lightTheme, darkTheme } from './colors';
import { loadThemePreference, saveThemePreference } from '../utils/storage';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await loadThemePreference();
      // If no saved preference, use device theme; otherwise use saved preference
      setThemeMode(savedTheme);
      setIsLoading(false);
    };
    loadTheme();
  }, []);
  
  const toggleTheme = async () => {
    // Determine current effective theme
    const currentIsDark = themeMode === 'dark' || (themeMode === null && deviceColorScheme === 'dark');
    const newMode = currentIsDark ? 'light' : 'dark';
    setThemeMode(newMode);
    await saveThemePreference(newMode);
  };
  
  // Use saved preference if available, otherwise fall back to device theme
  const isDark = themeMode === 'dark' || (themeMode === null && deviceColorScheme === 'dark');
  
  const value = useMemo(() => ({
    theme: isDark ? darkTheme : lightTheme,
    isDark,
    toggleTheme,
  }), [isDark, themeMode, deviceColorScheme]);
  
  // Don't render until theme is loaded to avoid flash
  if (isLoading) {
    return null;
  }
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export { Theme };
