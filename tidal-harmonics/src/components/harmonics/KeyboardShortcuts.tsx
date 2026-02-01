import { useEffect, useCallback } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';

interface ShortcutDefinition {
  key: string;
  description: string;
  modifiers?: ('ctrl' | 'shift' | 'alt')[];
}

const SHORTCUTS: ShortcutDefinition[] = [
  { key: 'p', description: 'Toggle phasor diagram' },
  { key: 'c', description: 'Toggle tide curve' },
  { key: 'u', description: 'Toggle units (metric/imperial)' },
  { key: 'Space', description: 'Pause/resume time' },
  { key: '←', description: 'Step back 1 hour' },
  { key: '→', description: 'Step forward 1 hour' },
  { key: '↑', description: 'Speed up time' },
  { key: '↓', description: 'Slow down time' },
  { key: '0', description: 'Reset to current time' },
  { key: '1-9', description: 'Select station 1-9' },
  { key: 'a', description: 'Enable all constituents' },
  { key: 'n', description: 'Disable all (none)' },
  { key: 'm', description: 'Major constituents only' },
  { key: '?', description: 'Show this help' },
  { key: 'Esc', description: 'Close panels/modals' },
];

interface KeyboardShortcutsProps {
  onClose: () => void;
}

export function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-1">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-800/50"
            >
              <span className="text-slate-300 text-sm">{shortcut.description}</span>
              <kbd className="bg-slate-700 px-2 py-1 rounded text-xs font-mono text-slate-200 min-w-[2rem] text-center">
                {shortcut.modifiers?.map(m => m === 'ctrl' ? '⌘/' : m === 'shift' ? '⇧' : '⌥').join('')}
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-700">
          <p className="text-slate-400 text-xs">
            Press <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">?</kbd> anytime to toggle this help.
            Focus must be on the main panel for shortcuts to work.
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook to enable keyboard navigation
export function useKeyboardNavigation(
  showHelp: boolean,
  setShowHelp: (show: boolean) => void,
  panelSetters: Record<string, (show: boolean) => void>
) {
  const togglePhasorDiagram = useHarmonicsStore((s) => s.togglePhasorDiagram);
  const toggleTideCurve = useHarmonicsStore((s) => s.toggleTideCurve);
  const toggleUnitSystem = useHarmonicsStore((s) => s.toggleUnitSystem);
  const selectStation = useHarmonicsStore((s) => s.selectStation);
  const stations = useHarmonicsStore((s) => s.stations);
  const setAllConstituentsVisible = useHarmonicsStore((s) => s.setAllConstituentsVisible);

  const toggle = useTimeStore((s) => s.toggle);
  const setDate = useTimeStore((s) => s.setDate);
  const epoch = useTimeStore((s) => s.epoch);
  const setSpeed = useTimeStore((s) => s.setSpeed);
  const speed = useTimeStore((s) => s.speed);
  const resetToNow = useTimeStore((s) => s.resetToNow);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = e.key.toLowerCase();

    // Handle escape for closing panels
    if (key === 'escape') {
      if (showHelp) {
        setShowHelp(false);
        e.preventDefault();
        return;
      }
      // Close any open panels
      Object.values(panelSetters).forEach(setter => setter(false));
      e.preventDefault();
      return;
    }

    // Show help
    if (key === '?' || (key === '/' && e.shiftKey)) {
      setShowHelp(!showHelp);
      e.preventDefault();
      return;
    }

    // Don't process other shortcuts if help is showing
    if (showHelp) return;

    switch (key) {
      case 'p':
        togglePhasorDiagram();
        e.preventDefault();
        break;
      case 'c':
        toggleTideCurve();
        e.preventDefault();
        break;
      case 'u':
        toggleUnitSystem();
        e.preventDefault();
        break;
      case ' ':
        toggle();
        e.preventDefault();
        break;
      case 'arrowleft':
        setDate(new Date(epoch - 3600000)); // -1 hour
        e.preventDefault();
        break;
      case 'arrowright':
        setDate(new Date(epoch + 3600000)); // +1 hour
        e.preventDefault();
        break;
      case 'arrowup':
        setSpeed(Math.min(speed * 2, 3600)); // Max 1 hour per second
        e.preventDefault();
        break;
      case 'arrowdown':
        setSpeed(Math.max(speed / 2, 1)); // Min 1x speed
        e.preventDefault();
        break;
      case '0':
        resetToNow();
        e.preventDefault();
        break;
      case 'a':
        // All constituents
        setAllConstituentsVisible(['M2', 'S2', 'N2', 'K2', 'K1', 'O1', 'P1', 'Q1', 'M4', 'MS4', 'M6', 'S4', 'Mf', 'Mm', 'Ssa', 'Sa']);
        e.preventDefault();
        break;
      case 'n':
        // None
        setAllConstituentsVisible([]);
        e.preventDefault();
        break;
      case 'm':
        // Major only (M2, S2, K1, O1)
        setAllConstituentsVisible(['M2', 'S2', 'K1', 'O1']);
        e.preventDefault();
        break;
      default:
        // Number keys 1-9 for station selection
        const num = parseInt(key);
        const station = stations[num - 1];
        if (num >= 1 && num <= 9 && station) {
          selectStation(station.id);
          e.preventDefault();
        }
        break;
    }
  }, [
    showHelp, setShowHelp, panelSetters,
    togglePhasorDiagram, toggleTideCurve, toggleUnitSystem,
    toggle, setDate, epoch, setSpeed, speed, resetToNow,
    setAllConstituentsVisible, selectStation, stations
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
