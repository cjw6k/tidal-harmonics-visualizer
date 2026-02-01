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

// Rotation speeds in radians per second
export const ROTATION_SPEEDS = {
  EARTH: 7.2921e-5,  // Earth's rotation rate (1 rotation / 24 hours)
  MOON: 2.6617e-6,   // Moon's rotation rate (synchronized with orbit)
} as const;

// Texture URLs - using local paths for reliability
export const TEXTURE_URLS = {
  earth: {
    day2k: '/textures/earth/earth_day_2k.jpg',
  },
  moon: {
    surface2k: '/textures/moon/moon_2k.jpg',
  },
  sun: {
    surface2k: '/textures/sun/sun_2k.jpg',
  },
} as const;

// Julian Date constants
export const JULIAN = {
  UNIX_EPOCH_JD: 2440587.5,  // JD at Unix epoch (Jan 1, 1970 00:00:00 UTC)
  J2000_EPOCH_JD: 2451545.0, // JD at J2000.0 (Jan 1, 2000 12:00:00 TT)
  MS_PER_DAY: 86400000,
  DAYS_PER_CENTURY: 36525,
} as const;
