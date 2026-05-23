import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

/**
 * Tres temas suportados: claro (`light`), escuro (`dark`) e gotico (`gothic`,
 * uma variacao do escuro com classe extra). O `toggleTheme` cicla entre os
 * tres na ordem light -> dark -> gothic -> light.
 */
export type Theme = 'light' | 'dark' | 'gothic';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Respeitar escolha manual salva no localStorage
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark' || saved === 'gothic') return saved;
    // Detectar preferência do sistema operacional
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.remove('dark', 'gothic');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'gothic') {
      document.documentElement.classList.add('dark', 'gothic');
    }
  }, [theme]);

  // Listener para mudanças de preferência do SO (se não há escolha manual)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : prev === 'dark' ? 'gothic' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook fail-loud — usar fora do `ThemeProvider` derruba a app imediatamente.
 * Garante que os consumidores nunca lidem com `undefined`.
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
