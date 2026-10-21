import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ActiveTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ActiveTheme;
  preference: ThemePreference;
  toggleTheme: () => void;
  setTheme: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'swakarya_theme';

function getSystemTheme(): ActiveTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Ignore storage errors
  }
  return 'system';
}

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getStoredPreference());
  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(() => {
    const pref = getStoredPreference();
    return pref === 'system' ? getSystemTheme() : pref;
  });

  const applyThemeToDOM = useCallback((theme: ActiveTheme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = theme;
    }
  }, []);

  const setTheme = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
      // Ignore storage errors
    }

    const resolved = pref === 'system' ? getSystemTheme() : pref;
    setActiveTheme(resolved);
    applyThemeToDOM(resolved);
  }, [applyThemeToDOM]);

  const toggleTheme = useCallback(() => {
    const nextTheme: ActiveTheme = activeTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [activeTheme, setTheme]);

  // Initial synchronization on mount
  useEffect(() => {
    const resolved = preference === 'system' ? getSystemTheme() : preference;
    setActiveTheme(resolved);
    applyThemeToDOM(resolved);
  }, [preference, applyThemeToDOM]);

  // System theme change listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (preference === 'system') {
        const newTheme: ActiveTheme = e.matches ? 'dark' : 'light';
        setActiveTheme(newTheme);
        applyThemeToDOM(newTheme);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
    return undefined;
  }, [preference, applyThemeToDOM]);

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        preference,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
