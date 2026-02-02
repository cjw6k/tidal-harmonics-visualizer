import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { useThemeStore } from '@/stores/themeStore';
import { SPEED_PRESETS } from '@/types';

export function TopBarCluster() {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const stations = useHarmonicsStore((s) => s.stations);
  const selectStation = useHarmonicsStore((s) => s.selectStation);

  const playing = useTimeStore((s) => s.playing);
  const speed = useTimeStore((s) => s.speed);
  const toggle = useTimeStore((s) => s.toggle);
  const setSpeed = useTimeStore((s) => s.setSpeed);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const ThemeIcon = () => {
    if (theme === 'dark') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    }
    if (theme === 'light') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  return (
    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-40 flex items-center gap-1.5">
      {/* Station selector */}
      <select
        value={station?.id ?? ''}
        onChange={(e) => selectStation(e.target.value)}
        className="px-2 py-1.5 bg-slate-800/90 backdrop-blur-sm rounded-lg text-white text-xs
          border border-slate-700 hover:border-slate-600 focus:border-blue-500 outline-none
          cursor-pointer max-w-[140px] truncate"
        title="Select tide station"
      >
        {stations.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Play/Pause + Speed */}
      <div className="flex items-center bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700">
        <button
          onClick={toggle}
          className={`px-2 py-1.5 text-xs font-medium transition-colors rounded-l-lg ${
            playing
              ? 'text-amber-400 hover:bg-amber-500/20'
              : 'text-blue-400 hover:bg-blue-500/20'
          }`}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="px-1 py-1.5 bg-transparent text-slate-300 text-xs border-l border-slate-700
            hover:text-white focus:outline-none cursor-pointer"
          title="Time speed"
        >
          {SPEED_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-1.5 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700
          text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
        title={theme === 'dark' ? 'Dark mode' : theme === 'light' ? 'Light mode' : 'System theme'}
      >
        <ThemeIcon />
      </button>
    </div>
  );
}
