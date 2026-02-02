import { useCamera } from '@/hooks/useCamera';
import type { CameraPreset } from '@/types';

const VIEW_OPTIONS: { preset: CameraPreset; label: string }[] = [
  { preset: 'overview', label: 'Overview' },
  { preset: 'earth', label: 'Earth' },
  { preset: 'moon', label: 'Moon' },
  { preset: 'sun', label: 'Sun' },
];

export function ViewSelector() {
  const { preset, setPreset } = useCamera();

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
      <span className="text-slate-400 text-sm font-medium">Camera View</span>
      <div className="flex gap-2 flex-wrap mt-2">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.preset}
            onClick={() => setPreset(option.preset)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              preset === option.preset
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
