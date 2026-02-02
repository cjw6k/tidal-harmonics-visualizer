import { useCamera } from '@/hooks/useCamera';
import type { CameraPreset } from '@/types';

const VIEW_OPTIONS: { preset: CameraPreset; label: string; description: string }[] = [
  { preset: 'overview', label: 'Overview', description: 'See the whole system' },
  { preset: 'earth', label: 'Earth', description: 'Orbit around Earth' },
  { preset: 'moon', label: 'Moon', description: 'Orbit around the Moon' },
  { preset: 'sun', label: 'Sun', description: 'Orbit around the Sun' },
];

export function ViewSelector() {
  const { preset, setPreset } = useCamera();
  const currentView = VIEW_OPTIONS.find((o) => o.preset === preset);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium">Camera View</span>
        <span className="text-slate-500 text-xs">scroll to zoom, drag to rotate</span>
      </div>
      <div className="flex gap-2 flex-wrap mt-2">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.preset}
            onClick={() => setPreset(option.preset)}
            title={option.description}
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
      {currentView && (
        <p className="text-slate-400 text-xs mt-2">{currentView.description}</p>
      )}
    </div>
  );
}
