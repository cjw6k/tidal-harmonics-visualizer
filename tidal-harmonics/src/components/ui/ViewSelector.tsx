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
    <div className="flex flex-col gap-2 p-4 bg-space-800 rounded-lg">
      <span className="text-gray-400 text-sm font-medium">Camera View</span>
      <div className="flex gap-2 flex-wrap">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.preset}
            onClick={() => setPreset(option.preset)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              preset === option.preset
                ? 'bg-blue-600 text-white'
                : 'bg-space-700 text-gray-300 hover:bg-space-700/80'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
