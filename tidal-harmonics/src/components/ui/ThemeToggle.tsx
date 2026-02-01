import { useThemeStore } from '@/stores/themeStore';

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const Icon = () => {
    if (theme === 'dark') {
      // Moon icon
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      );
    }
    if (theme === 'light') {
      // Sun icon
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    }
    // System icon (monitor)
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    );
  };

  const label =
    theme === 'dark' ? 'Dark mode' : theme === 'light' ? 'Light mode' : 'System theme';

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded border bg-slate-700 dark:bg-slate-700 light:bg-slate-200 border-slate-600 dark:border-slate-600 light:border-slate-300 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-cyan-400 dark:hover:text-cyan-400 light:hover:text-cyan-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
      title={label}
      aria-label={`Toggle theme (currently ${label})`}
    >
      <Icon />
    </button>
  );
}
