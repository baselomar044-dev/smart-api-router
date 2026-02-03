// ============================================
// THEMES - Consistent Across ALL Pages
// ============================================

export type ThemeType = 'dark' | 'light' | 'pink';

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentBg: string;
  border: string;
  card: string;
  cardHover: string;
  input: string;
  inputBorder: string;
  sidebar: string;
  sidebarHover: string;
  sidebarActive: string;
  userMsg: string;
  aiMsg: string;
  gradient: string;
  primary: string;
  success: string;
  error: string;
  warning: string;
}

// ============================================
// DARK THEME (Neutral Black/White)
// ============================================
const darkTheme: ThemeColors = {
  bg: 'bg-[#0a0a0a]',
  bgSecondary: 'bg-[#141414]',
  bgTertiary: 'bg-[#1f1f1f]',
  text: 'text-white',
  textSecondary: 'text-neutral-400',
  textMuted: 'text-neutral-500',
  accent: 'text-white',
  accentHover: 'text-neutral-200',
  accentBg: 'bg-white/10',
  border: 'border-neutral-700',
  card: 'bg-[#141414]',
  cardHover: 'hover:bg-[#1f1f1f]',
  input: 'bg-[#0a0a0a]',
  inputBorder: 'border-neutral-600',
  sidebar: 'bg-[#0a0a0a]',
  sidebarHover: 'hover:bg-neutral-800',
  sidebarActive: 'bg-white/10 text-white border-white/30',
  userMsg: 'bg-neutral-700',
  aiMsg: 'bg-[#1f1f1f]',
  gradient: 'bg-gradient-to-r from-neutral-700 to-neutral-600',
  primary: 'bg-neutral-700',
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
};

// ============================================
// LIGHT THEME
// ============================================
const lightTheme: ThemeColors = {
  bg: 'bg-slate-50',
  bgSecondary: 'bg-white',
  bgTertiary: 'bg-slate-100',
  text: 'text-slate-900',
  textSecondary: 'text-slate-600',
  textMuted: 'text-slate-400',
  accent: 'text-neutral-600',
  accentHover: 'text-neutral-700',
  accentBg: 'bg-neutral-100',
  border: 'border-slate-200',
  card: 'bg-white',
  cardHover: 'hover:bg-slate-50',
  input: 'bg-white',
  inputBorder: 'border-slate-300',
  sidebar: 'bg-white',
  sidebarHover: 'hover:bg-slate-100',
  sidebarActive: 'bg-neutral-100 text-neutral-600 border-neutral-300',
  userMsg: 'bg-neutral-200',
  aiMsg: 'bg-slate-100',
  gradient: 'bg-gradient-to-r from-neutral-600 to-neutral-500',
  primary: 'bg-neutral-600',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
};

// ============================================
// SOFT GRAY THEME (Neutral Light)
// ============================================
const softGrayTheme: ThemeColors = {
  bg: 'bg-neutral-100',
  bgSecondary: 'bg-white',
  bgTertiary: 'bg-neutral-200',
  text: 'text-neutral-900',
  textSecondary: 'text-neutral-600',
  textMuted: 'text-neutral-400',
  accent: 'text-neutral-800',
  accentHover: 'text-neutral-900',
  accentBg: 'bg-neutral-200',
  border: 'border-neutral-300',
  card: 'bg-white',
  cardHover: 'hover:bg-neutral-50',
  input: 'bg-white',
  inputBorder: 'border-neutral-300',
  sidebar: 'bg-neutral-100',
  sidebarHover: 'hover:bg-neutral-200',
  sidebarActive: 'bg-neutral-300 text-neutral-900 border-neutral-400',
  userMsg: 'bg-neutral-300',
  aiMsg: 'bg-neutral-200',
  gradient: 'bg-gradient-to-r from-neutral-600 to-neutral-500',
  primary: 'bg-neutral-700',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
};

// ============================================
// THEME MAP & EXPORTS
// ============================================
export const themes: Record<ThemeType, ThemeColors> = {
  'dark': darkTheme,
  'light': lightTheme,
  'pink': softGrayTheme,
};

export const themeNames: Record<ThemeType, { en: string; ar: string }> = {
  'dark': { en: 'Dark', ar: 'داكن' },
  'light': { en: 'Light', ar: 'فاتح' },
  'pink': { en: 'Soft Gray', ar: 'رمادي ناعم' },
};

// Get theme colors
export function getTheme(name: string): ThemeColors {
  return themes[name as ThemeType] || darkTheme;
}

// Hook for components - THIS IS WHAT SETTINGSPAGE IMPORTS
export function useTheme(themeName: string): { colors: ThemeColors } {
  return { colors: getTheme(themeName) };
}

// Check if dark theme
export function isDarkTheme(name: string): boolean {
  return name === 'dark';
}

// Alias for compatibility
export const useThemeColors = getTheme;
