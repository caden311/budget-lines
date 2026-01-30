/**
 * Theme context for SumTrails
 * Provides theme colors throughout the app
 */

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
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
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);
  
  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await loadThemePreference();
      setThemeMode(savedTheme);
      setIsLoading(false);
    };
    loadTheme();
  }, []);
  
  const toggleTheme = async () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    await saveThemePreference(newMode);
  };
  
  const isDark = themeMode === 'dark';
  
  const value = useMemo(() => ({
    theme: isDark ? darkTheme : lightTheme,
    isDark,
    toggleTheme,
  }), [isDark, themeMode]);
  
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
