import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface ThemeContextType {
  // Tema sempre será dark mode
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeContext.Provider value={{ isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
