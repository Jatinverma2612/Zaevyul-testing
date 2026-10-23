import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const dark = false;

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('zae_theme', 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
