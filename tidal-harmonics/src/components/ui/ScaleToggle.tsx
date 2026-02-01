import { useScene } from '@/hooks/useScene';
import type { ScaleMode } from '@/types';

export function ScaleToggle() {
  const { scaleMode, setScaleMode } = useScene();

  const options: { mode: ScaleMode; label: string }[] = [
    { mode: 'exaggerated', label: 'Exaggerated' },
    { mode: 'realistic', label: 'Realistic' },
  ];

  return (
    <div className="flex flex-col gap-2 p-4 bg-space-800 rounded-lg">
      <span className="text-gray-400 text-sm font-medium">Scale Mode</span>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.mode}
            onClick={() => setScaleMode(option.mode)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              scaleMode === option.mode
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
