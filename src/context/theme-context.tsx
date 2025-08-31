import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ContrastMode = 'normal' | 'high';
type ColorScheme = 'default' | 'first-aid' | 'blue' | 'green' | 'purple';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  contrastMode: ContrastMode;
  setContrastMode: (mode: ContrastMode) => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('theme');
      return (stored as Theme) || 'system';
    } catch {
      return 'system';
    }
  });

  const [contrastMode, setContrastMode] = useState<ContrastMode>(() => {
    try {
      const stored = localStorage.getItem('contrastMode');
      return (stored as ContrastMode) || 'normal';
    } catch {
      return 'normal';
    }
  });

  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    try {
      const stored = localStorage.getItem('colorScheme');
      return (stored as ColorScheme) || 'first-aid';
    } catch {
      return 'first-aid';
    }
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    try {
      const stored = localStorage.getItem('reducedMotion');
      return stored === 'true' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });

  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    const updateTheme = () => {
      let shouldBeDark = false;
      
      if (theme === 'dark') {
        shouldBeDark = true;
      } else if (theme === 'light') {
        shouldBeDark = false;
      } else {
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      setIsDark(shouldBeDark);
      
      // Apply theme classes with smooth transition
      root.style.transition = reducedMotion ? 'none' : 'background-color 0.3s ease, color 0.3s ease';
      
      if (shouldBeDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Apply contrast mode
      root.classList.toggle('high-contrast', contrastMode === 'high');
      
      // Apply color scheme
      root.classList.remove('scheme-default', 'scheme-first-aid', 'scheme-blue', 'scheme-green', 'scheme-purple');
      root.classList.add(`scheme-${colorScheme}`);
      
      // Apply reduced motion preference
      root.classList.toggle('reduce-motion', reducedMotion);
      
      // Set CSS custom properties for enhanced theming
      if (shouldBeDark) {
        root.style.setProperty('--bg-primary', contrastMode === 'high' ? '#0a0a0a' : '#1a1a1a');
        root.style.setProperty('--text-primary', contrastMode === 'high' ? '#ffffff' : '#fafafa');
        root.style.setProperty('--border-color', contrastMode === 'high' ? '#333333' : '#404040');
      } else {
        root.style.setProperty('--bg-primary', contrastMode === 'high' ? '#f5f5f5' : '#fafafa');
        root.style.setProperty('--text-primary', contrastMode === 'high' ? '#000000' : '#1a1a1a');
        root.style.setProperty('--border-color', contrastMode === 'high' ? '#000000' : '#d4d4d4');
      }
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleThemeChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };
    
    const handleMotionChange = () => {
      setReducedMotion(motionQuery.matches);
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    motionQuery.addEventListener('change', handleMotionChange);
    
    // Persist preferences to localStorage
    try {
      localStorage.setItem('theme', theme);
      localStorage.setItem('contrastMode', contrastMode);
      localStorage.setItem('colorScheme', colorScheme);
      localStorage.setItem('reducedMotion', reducedMotion.toString());
    } catch {
      // Ignore localStorage errors
    }

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [theme, contrastMode, colorScheme, reducedMotion]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark,
    contrastMode,
    setContrastMode,
    colorScheme,
    setColorScheme,
    reducedMotion,
    setReducedMotion
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};