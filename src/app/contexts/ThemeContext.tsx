import React, { createContext, useContext, useState, useEffect } from 'react';
import { projectId } from '/utils/supabase/info';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from backend on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const accessToken = localStorage.getItem('ispora_access_token');
        if (!accessToken) {
          setIsLoaded(true);
          return;
        }

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b8526fa6/settings`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings?.appearance?.theme) {
            setThemeState(data.settings.appearance.theme as Theme);
          }
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!isLoaded) return;

    const root = document.documentElement;
    
    const applyTheme = () => {
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else if (theme === 'system') {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();
  }, [theme, isLoaded]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};