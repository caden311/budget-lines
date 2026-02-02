/**
 * Color palette for SumTrails
 * Blue-focused theme with light and dark modes
 */

export const colors = {
  // Primary blues
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  
  // Accent teal for success states
  teal: {
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
  },
  
  // Error/warning reds
  red: {
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
  },
  
  // Amber for in-progress
  amber: {
    400: '#fbbf24',
    500: '#f59e0b',
  },
  
  // Neutrals for dark mode
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
};

export interface Theme {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Accents
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Game states
  cellAvailable: string;
  cellSpent: string;
  cellInPath: string;
  cellInPathOver: string;
  
  // Path colors
  pathStroke: string;
  pathStrokeOver: string;
  
  // UI elements
  border: string;
  cardBackground: string;
  buttonPrimary: string;
  buttonSecondary: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  
  // Tab bar
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Medal colors
  medalGold: string;
  medalSilver: string;
  medalBronze: string;
}

export const darkTheme: Theme = {
  // Backgrounds
  background: '#0c1222',
  backgroundSecondary: '#141d2f',
  backgroundTertiary: '#1a2540',
  
  // Text
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  
  // Accents
  primary: colors.blue[500],
  primaryLight: colors.blue[400],
  primaryDark: colors.blue[600],
  
  // Game states
  cellAvailable: '#1e3a5f',
  cellSpent: '#0f1729',
  cellInPath: colors.teal[500],
  cellInPathOver: colors.red[500],
  
  // Path colors
  pathStroke: colors.teal[400],
  pathStrokeOver: colors.red[400],
  
  // UI elements
  border: '#1e3a5f',
  cardBackground: '#141d2f',
  buttonPrimary: colors.blue[600],
  buttonSecondary: '#1e3a5f',
  
  // Status colors
  success: colors.teal[500],
  warning: colors.amber[500],
  error: colors.red[500],
  
  // Tab bar
  tabBarBackground: '#0c1222',
  tabBarBorder: '#1e3a5f',
  tabBarActive: colors.blue[500],
  tabBarInactive: '#64748b',

  // Medal colors
  medalGold: '#FFD700',
  medalSilver: '#C0C0C0',
  medalBronze: '#CD7F32',
};

export const lightTheme: Theme = {
  // Backgrounds
  background: '#f8fafc',
  backgroundSecondary: '#ffffff',
  backgroundTertiary: '#f1f5f9',
  
  // Text
  text: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  
  // Accents
  primary: colors.blue[600],
  primaryLight: colors.blue[500],
  primaryDark: colors.blue[700],
  
  // Game states
  cellAvailable: '#dbeafe',
  cellSpent: '#f1f5f9',
  cellInPath: colors.teal[500],
  cellInPathOver: colors.red[500],
  
  // Path colors
  pathStroke: colors.teal[500],
  pathStrokeOver: colors.red[500],
  
  // UI elements
  border: '#e2e8f0',
  cardBackground: '#ffffff',
  buttonPrimary: colors.blue[600],
  buttonSecondary: '#e2e8f0',
  
  // Status colors
  success: colors.teal[600],
  warning: colors.amber[500],
  error: colors.red[600],
  
  // Tab bar
  tabBarBackground: '#ffffff',
  tabBarBorder: '#e2e8f0',
  tabBarActive: colors.blue[600],
  tabBarInactive: '#94a3b8',

  // Medal colors
  medalGold: '#FFD700',
  medalSilver: '#C0C0C0',
  medalBronze: '#CD7F32',
};
