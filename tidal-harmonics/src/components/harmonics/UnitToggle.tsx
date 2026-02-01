import { useHarmonicsStore } from '@/stores/harmonicsStore';

/**
 * Unit System Toggle Component
 *
 * Allows users to switch between metric (meters) and imperial (feet) units.
 */

export function UnitToggle() {
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const toggleUnitSystem = useHarmonicsStore((s) => s.toggleUnitSystem);

  return (
    <button
      onClick={toggleUnitSystem}
      className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors flex items-center gap-1"
      title={`Switch to ${unitSystem === 'metric' ? 'feet' : 'meters'}`}
    >
      <span className={unitSystem === 'metric' ? 'text-white font-semibold' : 'text-slate-500'}>
        m
      </span>
      <span className="text-slate-500">/</span>
      <span className={unitSystem === 'imperial' ? 'text-white font-semibold' : 'text-slate-500'}>
        ft
      </span>
    </button>
  );
}
