import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'aryx-ai-theme';

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem('nova-ai-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setTheme = useCallback((t) => {
    if (t === 'dark' || t === 'light') {
      setThemeState(t);
    }
  }, []);

  return { theme, setTheme, toggleTheme };
}
