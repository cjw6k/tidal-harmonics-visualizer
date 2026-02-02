// Realistic scale: 1 unit = 10,000 km
export const REALISTIC_SCALE = {
  EARTH_RADIUS: 0.6371,      // 6,371 km
  MOON_RADIUS: 0.1737,       // 1,737 km
  SUN_RADIUS: 69.634,        // 696,340 km
  MOON_DISTANCE: 38.44,      // 384,400 km
  SUN_DISTANCE: 14960,       // 149,600,000 km
} as const;

// Exaggerated scale: pedagogical clarity
export const EXAGGERATED_SCALE = {
  EARTH_RADIUS: 2,
  MOON_RADIUS: 0.5,
  SUN_RADIUS: 8,
  MOON_DISTANCE: 30,
  SUN_DISTANCE: 200,
} as const;

// Planet data (radii in km, orbital radii in million km for reference)
export const PLANET_DATA = {
  mercury: { radius: 2439, color: '#a6a6a6', orbitRadius: 58, name: 'Mercury' },
  venus: { radius: 6052, color: '#e6c87a', orbitRadius: 108, name: 'Venus' },
  mars: { radius: 3390, color: '#c1440e', orbitRadius: 228, name: 'Mars' },
  jupiter: { radius: 69911, color: '#c9b896', orbitRadius: 778, name: 'Jupiter' },
  saturn: { radius: 58232, color: '#ead6b8', orbitRadius: 1434, name: 'Saturn' },
  uranus: { radius: 25362, color: '#c9eef2', orbitRadius: 2871, name: 'Uranus' },
  neptune: { radius: 24622, color: '#5b7fde', orbitRadius: 4495, name: 'Neptune' },
} as const;

// Tidal influence of celestial bodies relative to Moon (M2 = 1.0)
export const TIDAL_INFLUENCE = {
  moon: 1.0,         // Reference: M2 constituent
  sun: 0.46,         // S2 is ~46% of M2
  venus: 0.000054,   // Negligible but measurable over millennia
  jupiter: 0.000006, // Tiny but included for completeness
  mars: 0.0000001,   // Essentially zero
} as const;

// Rotation speeds in radians per second
export const ROTATION_SPEEDS = {
  EARTH: 7.2921e-5,  // Earth's rotation rate (1 rotation / 24 hours)
  MOON: 2.6617e-6,   // Moon's rotation rate (synchronized with orbit)
} as const;

// Texture URLs - using base path for GitHub Pages compatibility
const BASE = import.meta.env.BASE_URL;
export const TEXTURE_URLS = {
  earth: {
    day2k: `${BASE}textures/earth/earth_day_2k.jpg`,
  },
  moon: {
    surface2k: `${BASE}textures/moon/moon_2k.jpg`,
  },
} as const;

// Julian Date constants
export const JULIAN = {
  UNIX_EPOCH_JD: 2440587.5,  // JD at Unix epoch (Jan 1, 1970 00:00:00 UTC)
  J2000_EPOCH_JD: 2451545.0, // JD at J2000.0 (Jan 1, 2000 12:00:00 TT)
  MS_PER_DAY: 86400000,
  DAYS_PER_CENTURY: 36525,
} as const;
