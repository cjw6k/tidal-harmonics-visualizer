import { useHarmonicsStore } from '@/stores/harmonicsStore';

export function StationSelector() {
  const stations = useHarmonicsStore((s) => s.stations);
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const selectStation = useHarmonicsStore((s) => s.selectStation);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
      <label className="block text-xs text-slate-400 mb-1">Tide Station</label>
      <select
        value={selectedStation?.id || ''}
        onChange={(e) => selectStation(e.target.value)}
        className="w-full bg-slate-700 text-white text-sm px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
      >
        {stations.map((s) => (
          <option key={s.id} value={s.id}>
            {s.state ? `${s.name}, ${s.state}` : s.name}
          </option>
        ))}
      </select>
      {selectedStation && (
        <div className="mt-2 text-xs text-slate-500">
          <span>
            {selectedStation.lat.toFixed(3)}°N, {Math.abs(selectedStation.lon).toFixed(3)}°W
          </span>
          <span className="ml-2">Datum: {selectedStation.datum}</span>
        </div>
      )}
    </div>
  );
}
