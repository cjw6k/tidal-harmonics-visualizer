import { useScene } from '@/hooks/useScene';
import type { ScaleMode } from '@/types';

export function ScaleToggle() {
  const { scaleMode, setScaleMode } = useScene();

  const options: { mode: ScaleMode; label: string }[] = [
    { mode: 'exaggerated', label: 'Exaggerated' },
    { mode: 'realistic', label: 'Realistic' },
  ];

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
      <span className="text-slate-400 text-sm font-medium">Scale Mode</span>
      <div className="flex gap-2 mt-2">
        {options.map((option) => (
          <button
            key={option.mode}
            onClick={() => setScaleMode(option.mode)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              scaleMode === option.mode
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
