import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function loadTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'system';
  return (localStorage.getItem('theme') as Theme) || 'system';
}

function applyTheme(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(resolved);
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = loadTheme();
  const initialResolved = initialTheme === 'system' ? getSystemTheme() : initialTheme;

  // Apply on initialization
  setTimeout(() => applyTheme(initialResolved), 0);

  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const { theme } = get();
      if (theme === 'system') {
        const resolved = e.matches ? 'dark' : 'light';
        set({ resolvedTheme: resolved });
        applyTheme(resolved);
      }
    });
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,

    setTheme: (theme) => {
      const resolved = theme === 'system' ? getSystemTheme() : theme;
      localStorage.setItem('theme', theme);
      set({ theme, resolvedTheme: resolved });
      applyTheme(resolved);
    },

    toggleTheme: () => {
      const { theme } = get();
      const next: Theme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
      get().setTheme(next);
    },
  };
});
