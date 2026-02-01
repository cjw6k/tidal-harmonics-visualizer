import { useTime } from '@/hooks/useTime';
import { useTimeStore } from '@/stores/timeStore';
import { SPEED_PRESETS } from '@/types';

export function TimeControls() {
  const { playing, speed, date, toggle, setSpeed, setDate } = useTime();
  const resetToNow = useTimeStore((s) => s.resetToNow);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setDate(newDate);
    }
  };

  const formatDateForInput = (d: Date): string => {
    return d.toISOString().slice(0, 16);
  };

  // Format current speed for display
  const getSpeedDescription = (): string => {
    if (speed === 1) return 'Real-time';
    if (speed < 60) return `${speed}× faster`;
    if (speed < 3600) return `${speed / 60} min/sec`;
    if (speed < 86400) return `${speed / 3600} hr/sec`;
    if (speed < 604800) return `${speed / 86400} day/sec`;
    return `${(speed / 604800).toFixed(1)} week/sec`;
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
      {/* Header with current time */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-slate-400">Simulation Time</span>
        <span className="text-xs text-slate-500">{getSpeedDescription()}</span>
      </div>

      {/* Play/Pause and Speed */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={toggle}
          className={`px-4 py-2 rounded text-white font-medium transition-colors ${
            playing
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
        >
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>

        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="flex-1 px-3 py-2 bg-slate-700 rounded text-white border border-slate-600 focus:border-blue-500 outline-none text-sm"
          title="Time speed (1-5 keys)"
        >
          {SPEED_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>

        <button
          onClick={resetToNow}
          className="px-2 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-colors"
          title="Reset to now (R)"
        >
          ⟲
        </button>
      </div>

      {/* Date/Time input */}
      <input
        type="datetime-local"
        value={formatDateForInput(date)}
        onChange={handleDateChange}
        className="w-full px-3 py-2 bg-slate-700 rounded text-white border border-slate-600 focus:border-blue-500 outline-none text-sm"
        title="Set simulation date and time"
      />
    </div>
  );
}
