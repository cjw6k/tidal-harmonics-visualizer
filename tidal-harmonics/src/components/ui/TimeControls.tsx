import { useTime } from '@/hooks/useTime';
import { SPEED_PRESETS } from '@/types';

export function TimeControls() {
  const { playing, speed, date, toggle, setSpeed, setDate } = useTime();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setDate(newDate);
    }
  };

  const formatDateForInput = (d: Date): string => {
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-space-800 rounded-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors"
        >
          {playing ? 'Pause' : 'Play'}
        </button>

        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="px-3 py-2 bg-space-700 rounded text-white border border-space-700 focus:border-blue-500 outline-none"
        >
          {SPEED_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      <input
        type="datetime-local"
        value={formatDateForInput(date)}
        onChange={handleDateChange}
        className="px-3 py-2 bg-space-700 rounded text-white border border-space-700 focus:border-blue-500 outline-none"
      />
    </div>
  );
}
