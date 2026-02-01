import { useMemo, useState, useCallback } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { getTidalType, getTidalTypeLabel } from '@/data/stations';
import { copyStationUrl } from '@/hooks/useUrlSync';
import { TideNotifications } from '@/components/ui/TideNotifications';
import type { TideStation } from '@/types/harmonics';

// Fuzzy match score - returns score (higher is better) or -1 if no match
function fuzzyMatch(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match gets highest score
  if (textLower.includes(queryLower)) {
    return 1000 - textLower.indexOf(queryLower);
  }

  // Fuzzy match - characters must appear in order
  let queryIdx = 0;
  let score = 0;
  let consecutiveBonus = 0;
  let lastMatchIdx = -1;

  for (let i = 0; i < textLower.length && queryIdx < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIdx]) {
      // Bonus for consecutive matches
      if (lastMatchIdx === i - 1) {
        consecutiveBonus += 5;
      }
      // Bonus for matching at word boundaries
      if (i === 0 || text[i - 1] === ' ' || text[i - 1] === ',') {
        score += 10;
      }
      score += 1 + consecutiveBonus;
      lastMatchIdx = i;
      queryIdx++;
    }
  }

  // All query chars must match
  if (queryIdx < queryLower.length) {
    return -1;
  }

  return score;
}

const TIDAL_TYPE_COLORS = {
  'semidiurnal': 'bg-blue-500/20 text-blue-400',
  'mixed-semidiurnal': 'bg-cyan-500/20 text-cyan-400',
  'mixed-diurnal': 'bg-green-500/20 text-green-400',
  'diurnal': 'bg-amber-500/20 text-amber-400',
};

// Country display order and names
const COUNTRY_ORDER = ['US', 'Canada', 'UK', 'France', 'Netherlands', 'Japan', 'Vietnam', 'Australia', 'Brazil', 'South Africa', 'India', 'China', 'Gibraltar', 'Sweden'];
const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States',
  'Canada': 'Canada',
  'UK': 'United Kingdom',
  'France': 'France',
  'Netherlands': 'Netherlands',
  'Japan': 'Japan',
  'Vietnam': 'Vietnam',
  'Australia': 'Australia',
  'Brazil': 'Brazil',
  'South Africa': 'South Africa',
  'India': 'India',
  'China': 'China',
  'Gibraltar': 'Gibraltar',
  'Sweden': 'Sweden',
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

// Calculate distance between two coordinates using Haversine formula
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function StationSelector() {
  const stations = useHarmonicsStore((s) => s.stations);
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const selectStation = useHarmonicsStore((s) => s.selectStation);
  const favoriteStations = useHarmonicsStore((s) => s.favoriteStations);
  const toggleFavorite = useHarmonicsStore((s) => s.toggleFavorite);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    const success = await copyStationUrl();
    if (success) {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  }, []);

  const findNearest = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setTimeout(() => setLocationError(null), 3000);
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Find nearest station using reduce
        const nearest = stations.reduce<{ station: typeof stations[0] | null; distance: number }>(
          (acc, station) => {
            const distance = haversineDistance(latitude, longitude, station.lat, station.lon);
            if (acc.station === null || distance < acc.distance) {
              return { station, distance };
            }
            return acc;
          },
          { station: null, distance: Infinity }
        );

        if (nearest.station) {
          selectStation(nearest.station.id);
        }
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('Could not get location');
        }
        setTimeout(() => setLocationError(null), 3000);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [stations, selectStation]);

  const tidalType = selectedStation ? getTidalType(selectedStation) : null;
  const isCurrentFavorite = selectedStation ? favoriteStations.includes(selectedStation.id) : false;

  // Filter and sort stations based on fuzzy search query
  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return stations;
    const query = searchQuery.trim();

    // Calculate fuzzy match scores and filter
    const scored = stations
      .map((s) => {
        const searchableFields = [
          s.name,
          s.state || '',
          s.country,
          COUNTRY_NAMES[s.country] || s.country,
          getTidalTypeLabel(getTidalType(s)),
        ];
        // Use best match across all fields
        const bestScore = Math.max(...searchableFields.map((field) => fuzzyMatch(field, query)));
        return { station: s, score: bestScore };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map((item) => item.station);
  }, [stations, searchQuery]);

  // Get favorite stations list
  const favoriteStationsList = useMemo(() => {
    return filteredStations.filter((s) => favoriteStations.includes(s.id));
  }, [filteredStations, favoriteStations]);

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
      <div className="flex gap-2">
        <select
          value={selectedStation?.id || ''}
          onChange={(e) => selectStation(e.target.value)}
          className="flex-1 bg-slate-700 text-white text-sm px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
          style={{ minWidth: '120px' }}
          aria-label="Select tide station"
        >
          {matchCount === 0 ? (
            <option value="" disabled>No matching stations</option>
          ) : (
            <>
              {favoriteStationsList.length > 0 && (
                <optgroup label="★ Favorites">
                  {favoriteStationsList.map((s) => (
                    <option key={`fav-${s.id}`} value={s.id}>
                      {s.state ? `${s.name}, ${s.state}` : s.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {Array.from(groupedStations.entries()).map(([country, stationList]) => (
                <optgroup key={country} label={COUNTRY_NAMES[country] || country}>
                  {stationList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {favoriteStations.includes(s.id) ? '★ ' : ''}{s.state ? `${s.name}, ${s.state}` : s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </>
          )}
        </select>
        <button
          onClick={findNearest}
          disabled={locating}
          className="px-2 py-2 rounded border bg-slate-700 border-slate-600 text-slate-400 hover:text-green-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 relative disabled:opacity-50"
          title="Find nearest station"
          aria-label="Find nearest station"
        >
          {locating ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          {locationError && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {locationError}
            </span>
          )}
        </button>
        {selectedStation && (
          <>
            <button
              onClick={() => toggleFavorite(selectedStation.id)}
              className={`px-2 py-2 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                isCurrentFavorite
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-amber-400'
              }`}
              title={isCurrentFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={isCurrentFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={isCurrentFavorite}
            >
              {isCurrentFavorite ? '★' : '☆'}
            </button>
            <button
              onClick={handleShare}
              className="px-2 py-2 rounded border bg-slate-700 border-slate-600 text-slate-400 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 relative"
              title="Copy link to this station"
              aria-label="Copy link to this station"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {showCopied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
            <TideNotifications />
          </>
        )}
      </div>
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
