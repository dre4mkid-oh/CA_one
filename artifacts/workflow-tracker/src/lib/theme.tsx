import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type Palette = "pastel" | "neon";

interface ThemeContextType {
  theme: Theme;
  palette: Palette;
  setTheme: (theme: Theme) => void;
  setPalette: (palette: Palette) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "light"
  );
  const [palette, setPalette] = useState<Palette>(
    () => (localStorage.getItem("palette") as Palette) || "pastel"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-palette", palette);
    localStorage.setItem("palette", palette);
  }, [palette]);

  return (
    <ThemeContext.Provider value={{ theme, palette, setTheme, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
