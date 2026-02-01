import * as Astronomy from 'astronomy-engine';

export interface CelestialPosition {
  x: number;
  y: number;
  z: number;
  distance: number; // km from Earth
}

const AU_TO_KM = 149_597_870.7;

export function getBodyPosition(
  body: Astronomy.Body,
  date: Date
): CelestialPosition {
  const time = Astronomy.MakeTime(date);
  const vec = Astronomy.GeoVector(body, time, true);

  return {
    x: vec.x * AU_TO_KM,
    y: vec.y * AU_TO_KM,
    z: vec.z * AU_TO_KM,
    distance: Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2) * AU_TO_KM,
  };
}

export function getMoonPosition(date: Date): CelestialPosition {
  return getBodyPosition(Astronomy.Body.Moon, date);
}

export function getSunPosition(date: Date): CelestialPosition {
  return getBodyPosition(Astronomy.Body.Sun, date);
}

// Astronomical event types for tidal analysis
export interface AstronomicalEvent {
  type: 'new_moon' | 'full_moon' | 'first_quarter' | 'third_quarter' | 'perigee' | 'apogee' | 'equinox' | 'solstice';
  date: Date;
  label: string;
  description: string;
  tidalSignificance: string;
}

/**
 * Find the next lunar phases after a given date
 */
export function findNextMoonPhases(startDate: Date, count: number = 4): AstronomicalEvent[] {
  const events: AstronomicalEvent[] = [];
  const time = Astronomy.MakeTime(startDate);

  // Moon phases: 0=new, 90=first quarter, 180=full, 270=third quarter
  const phases = [
    { target: 0, type: 'new_moon' as const, label: 'New Moon', desc: 'Moon between Earth and Sun' },
    { target: 90, type: 'first_quarter' as const, label: 'First Quarter', desc: 'Moon 90° east of Sun' },
    { target: 180, type: 'full_moon' as const, label: 'Full Moon', desc: 'Moon opposite the Sun' },
    { target: 270, type: 'third_quarter' as const, label: 'Third Quarter', desc: 'Moon 90° west of Sun' },
  ];

  let currentTime = time;
  let foundCount = 0;

  while (foundCount < count) {
    let nextPhase: { date: Date; phase: typeof phases[0] } | null = null;
    let earliestTime: Astronomy.AstroTime | null = null;

    for (const phase of phases) {
      const result = Astronomy.SearchMoonPhase(phase.target, currentTime, 35);
      if (result && (!earliestTime || result.ut < earliestTime.ut)) {
        earliestTime = result;
        nextPhase = { date: result.date, phase };
      }
    }

    if (nextPhase) {
      events.push({
        type: nextPhase.phase.type,
        date: nextPhase.date,
        label: nextPhase.phase.label,
        description: nextPhase.phase.desc,
        tidalSignificance: (nextPhase.phase.type === 'new_moon' || nextPhase.phase.type === 'full_moon')
          ? 'Spring tide - maximum tidal range'
          : 'Neap tide - minimum tidal range',
      });
      foundCount++;
      currentTime = Astronomy.MakeTime(new Date(nextPhase.date.getTime() + 86400000)); // Move past this event
    } else {
      break;
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Find the next lunar apsis events (perigee/apogee)
 */
export function findNextLunarApsis(startDate: Date, count: number = 4): AstronomicalEvent[] {
  const events: AstronomicalEvent[] = [];
  const time = Astronomy.MakeTime(startDate);

  let currentApsis = Astronomy.SearchLunarApsis(time);

  for (let i = 0; i < count; i++) {
    if (!currentApsis) break;

    const isPerigee = currentApsis.kind === Astronomy.ApsisKind.Pericenter;
    events.push({
      type: isPerigee ? 'perigee' : 'apogee',
      date: currentApsis.time.date,
      label: isPerigee ? 'Perigee' : 'Apogee',
      description: isPerigee
        ? `Moon closest: ${Math.round(currentApsis.dist_km).toLocaleString()} km`
        : `Moon farthest: ${Math.round(currentApsis.dist_km).toLocaleString()} km`,
      tidalSignificance: isPerigee
        ? 'Stronger tides - enhanced M2, N2 amplitudes'
        : 'Weaker tides - reduced M2, N2 amplitudes',
    });

    currentApsis = Astronomy.NextLunarApsis(currentApsis);
  }

  return events;
}

/**
 * Find equinoxes and solstices
 */
export function findNextSeasons(startDate: Date, count: number = 2): AstronomicalEvent[] {
  const events: AstronomicalEvent[] = [];
  const year = startDate.getFullYear();

  // Check current year and next year
  for (let y = year; y <= year + 1 && events.length < count; y++) {
    const seasons = Astronomy.Seasons(y);

    const seasonEvents = [
      {
        time: seasons.mar_equinox,
        type: 'equinox' as const,
        label: 'March Equinox',
        desc: 'Sun crosses equator northward',
        tidal: 'Declination effects minimized',
      },
      {
        time: seasons.jun_solstice,
        type: 'solstice' as const,
        label: 'June Solstice',
        desc: 'Sun at maximum north declination',
        tidal: 'Maximum diurnal inequality',
      },
      {
        time: seasons.sep_equinox,
        type: 'equinox' as const,
        label: 'September Equinox',
        desc: 'Sun crosses equator southward',
        tidal: 'Declination effects minimized',
      },
      {
        time: seasons.dec_solstice,
        type: 'solstice' as const,
        label: 'December Solstice',
        desc: 'Sun at maximum south declination',
        tidal: 'Maximum diurnal inequality',
      },
    ];

    for (const s of seasonEvents) {
      if (s.time.date > startDate && events.length < count) {
        events.push({
          type: s.type,
          date: s.time.date,
          label: s.label,
          description: s.desc,
          tidalSignificance: s.tidal,
        });
      }
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get all upcoming astronomical events relevant to tides
 */
export function getUpcomingTidalEvents(startDate: Date): AstronomicalEvent[] {
  const phases = findNextMoonPhases(startDate, 4);
  const apsis = findNextLunarApsis(startDate, 3);
  const seasons = findNextSeasons(startDate, 1);

  const allEvents = [...phases, ...apsis, ...seasons];
  return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export { Astronomy };
