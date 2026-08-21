import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // Load from local storage
    const storedTheme = localStorage.getItem('fpb_theme') as Theme;
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
      setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      if (theme === 'dark' || (theme === 'system' && matchMedia.matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('fpb_theme', theme);

    if (theme === 'system') {
      matchMedia.addEventListener('change', applyTheme);
      return () => matchMedia.removeEventListener('change', applyTheme);
    }
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

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
