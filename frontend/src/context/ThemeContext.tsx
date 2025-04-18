import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeName = 'light' | 'dark' | 'olivia' | 'botanical' | 'coral' | 'nord' | 'dracula';

interface Theme {
  name: ThemeName;
  label: string;
  icon: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    textPrimary: string;
    textSecondary: string;
    borderColor: string;
    navbarBg: string;
    navbarText: string;
    cardBg: string;
    cardShadow: string;
    accent: string;
  };
}

const themes: Record<ThemeName, Theme> = {
  light: {
    name: 'light',
    label: 'Light',
    icon: '☀️',
    colors: {
      bgPrimary: '#ffffff',
      bgSecondary: '#f8f9fa',
      textPrimary: '#2c3e50',
      textSecondary: '#6c757d',
      borderColor: 'rgba(0, 0, 0, 0.125)',
      navbarBg: '#2c3e50',
      navbarText: 'rgba(255, 255, 255, 0.8)',
      cardBg: '#ffffff',
      cardShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      accent: '#3498db'
    }
  },
  dark: {
    name: 'dark',
    label: 'Dark',
    icon: '🌙',
    colors: {
      bgPrimary: '#1a1a1a',
      bgSecondary: '#2d2d2d',
      textPrimary: '#ffffff',
      textSecondary: '#b0b0b0',
      borderColor: 'rgba(255, 255, 255, 0.125)',
      navbarBg: '#000000',
      navbarText: 'rgba(255, 255, 255, 0.8)',
      cardBg: '#2d2d2d',
      cardShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      accent: '#6c5ce7'
    }
  },
  olivia: {
    name: 'olivia',
    label: 'Olivia',
    icon: '🫒',
    colors: {
      bgPrimary: '#1c1b1d',
      bgSecondary: '#2c2b2e',
      textPrimary: '#e8c4b8',
      textSecondary: '#a6a6a6',
      borderColor: 'rgba(232, 196, 184, 0.125)',
      navbarBg: '#181619',
      navbarText: '#e8c4b8',
      cardBg: '#2c2b2e',
      cardShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      accent: '#deaf9d'
    }
  },
  botanical: {
    name: 'botanical',
    label: 'Botanical',
    icon: '🌿',
    colors: {
      bgPrimary: '#dce4d0',
      bgSecondary: '#f1f7e7',
      textPrimary: '#2d3436',
      textSecondary: '#636e72',
      borderColor: 'rgba(0, 0, 0, 0.125)',
      navbarBg: '#88ab75',
      navbarText: '#ffffff',
      cardBg: '#ffffff',
      cardShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      accent: '#76a56d'
    }
  },
  coral: {
    name: 'coral',
    label: 'Coral',
    icon: '🐚',
    colors: {
      bgPrimary: '#fff5f5',
      bgSecondary: '#fff0f0',
      textPrimary: '#2d3436',
      textSecondary: '#636e72',
      borderColor: 'rgba(0, 0, 0, 0.125)',
      navbarBg: '#ff7675',
      navbarText: '#ffffff',
      cardBg: '#ffffff',
      cardShadow: '0 2px 8px rgba(255, 118, 117, 0.1)',
      accent: '#ff7675'
    }
  },
  nord: {
    name: 'nord',
    label: 'Nord',
    icon: '❄️',
    colors: {
      bgPrimary: '#2e3440',
      bgSecondary: '#3b4252',
      textPrimary: '#eceff4',
      textSecondary: '#d8dee9',
      borderColor: 'rgba(236, 239, 244, 0.125)',
      navbarBg: '#242933',
      navbarText: '#eceff4',
      cardBg: '#3b4252',
      cardShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      accent: '#88c0d0'
    }
  },
  dracula: {
    name: 'dracula',
    label: 'Dracula',
    icon: '🧛',
    colors: {
      bgPrimary: '#282a36',
      bgSecondary: '#343746',
      textPrimary: '#f8f8f2',
      textSecondary: '#bd93f9',
      borderColor: 'rgba(248, 248, 242, 0.125)',
      navbarBg: '#1e1f29',
      navbarText: '#f8f8f2',
      cardBg: '#343746',
      cardShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      accent: '#ff79c6'
    }
  }
};

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeName: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: themes.light,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeName;
    return themes[savedTheme] || themes.light;
  });

  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;
    
    root.style.setProperty('--bg-primary', colors.bgPrimary);
    root.style.setProperty('--bg-secondary', colors.bgSecondary);
    root.style.setProperty('--text-primary', colors.textPrimary);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--border-color', colors.borderColor);
    root.style.setProperty('--navbar-bg', colors.navbarBg);
    root.style.setProperty('--navbar-text', colors.navbarText);
    root.style.setProperty('--card-bg', colors.cardBg);
    root.style.setProperty('--card-shadow', colors.cardShadow);
    root.style.setProperty('--accent', colors.accent);
    
    localStorage.setItem('theme', currentTheme.name);
  }, [currentTheme]);

  const setTheme = (themeName: ThemeName) => {
    setCurrentTheme(themes[themeName]);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { themes };
export default ThemeContext; 