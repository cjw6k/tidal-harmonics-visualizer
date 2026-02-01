import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { getTidalType, getTidalTypeLabel } from '@/data/stations';
import type { TideStation } from '@/types/harmonics';

const TIDAL_TYPE_COLORS = {
  'semidiurnal': 'bg-blue-500/20 text-blue-400',
  'mixed-semidiurnal': 'bg-cyan-500/20 text-cyan-400',
  'mixed-diurnal': 'bg-green-500/20 text-green-400',
  'diurnal': 'bg-amber-500/20 text-amber-400',
};

// Country display order and names
const COUNTRY_ORDER = ['US', 'Canada', 'UK', 'France', 'Netherlands', 'Japan', 'Vietnam', 'Australia'];
const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States',
  'Canada': 'Canada',
  'UK': 'United Kingdom',
  'France': 'France',
  'Netherlands': 'Netherlands',
  'Japan': 'Japan',
  'Vietnam': 'Vietnam',
  'Australia': 'Australia',
};

function groupStationsByCountry(stations: TideStation[]): Map<string, TideStation[]> {
  const groups = new Map<string, TideStation[]>();

  for (const station of stations) {
    const country = station.country;
    if (!groups.has(country)) {
      groups.set(country, []);
    }
    groups.get(country)!.push(station);
  }

  // Sort by country order
  const sorted = new Map<string, TideStation[]>();
  for (const country of COUNTRY_ORDER) {
    if (groups.has(country)) {
      sorted.set(country, groups.get(country)!);
    }
  }
  // Add any countries not in the order list
  for (const [country, stationList] of groups) {
    if (!sorted.has(country)) {
      sorted.set(country, stationList);
    }
  }

  return sorted;
}

export function StationSelector() {
  const stations = useHarmonicsStore((s) => s.stations);
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const selectStation = useHarmonicsStore((s) => s.selectStation);
  const [searchQuery, setSearchQuery] = useState('');

  const tidalType = selectedStation ? getTidalType(selectedStation) : null;

  // Filter stations based on search query
  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return stations;
    const query = searchQuery.toLowerCase();
    return stations.filter((s) => {
      const searchableText = [
        s.name,
        s.state || '',
        s.country,
        COUNTRY_NAMES[s.country] || s.country,
        getTidalTypeLabel(getTidalType(s)),
      ].join(' ').toLowerCase();
      return searchableText.includes(query);
    });
  }, [stations, searchQuery]);

  const groupedStations = useMemo(() => groupStationsByCountry(filteredStations), [filteredStations]);

  const matchCount = filteredStations.length;

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
      <label className="block text-xs text-slate-400 mb-1">Tide Station</label>
      <div className="relative mb-2">
        <input
          type="text"
          placeholder="Search stations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-700 text-white text-sm pl-8 pr-8 py-1.5 rounded border border-slate-600 focus:border-blue-500 focus:outline-none placeholder-slate-500"
          aria-label="Search tide stations"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {searchQuery && (
        <div className="text-xs text-slate-500 mb-1">
          {matchCount === 0 ? 'No stations found' : `${matchCount} station${matchCount !== 1 ? 's' : ''} found`}
        </div>
      )}
      <select
        value={selectedStation?.id || ''}
        onChange={(e) => selectStation(e.target.value)}
        className="w-full bg-slate-700 text-white text-sm px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
        aria-label="Select tide station"
      >
        {matchCount === 0 ? (
          <option value="" disabled>No matching stations</option>
        ) : (
          Array.from(groupedStations.entries()).map(([country, stationList]) => (
            <optgroup key={country} label={COUNTRY_NAMES[country] || country}>
              {stationList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.state ? `${s.name}, ${s.state}` : s.name}
                </option>
              ))}
            </optgroup>
          ))
        )}
      </select>
      {selectedStation && (
        <div className="mt-2 space-y-1">
          <div className="text-xs text-slate-500">
            <span>
              {selectedStation.lat.toFixed(2)}°{selectedStation.lat >= 0 ? 'N' : 'S'},{' '}
              {Math.abs(selectedStation.lon).toFixed(2)}°{selectedStation.lon >= 0 ? 'E' : 'W'}
            </span>
            <span className="ml-2">Datum: {selectedStation.datum}</span>
          </div>
          {tidalType && (
            <div className={`text-xs px-2 py-0.5 rounded inline-block ${TIDAL_TYPE_COLORS[tidalType]}`}>
              {getTidalTypeLabel(tidalType)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
