import { useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useTimeStore } from '@/stores/timeStore';

interface EclipseTidesPanelProps {
  onClose: () => void;
}

interface EclipseEvent {
  date: Date;
  type: 'solar' | 'lunar';
  subtype: 'total' | 'partial' | 'annular' | 'penumbral';
  tidalImpact: 'high' | 'moderate' | 'low';
  visibility: string;
  description: string;
}

// Upcoming eclipse data (2026-2027)
const UPCOMING_ECLIPSES: EclipseEvent[] = [
  {
    date: new Date('2026-02-17T12:00:00Z'),
    type: 'solar',
    subtype: 'annular',
    tidalImpact: 'high',
    visibility: 'Antarctica, S. America',
    description: 'Near-perfect Sun-Moon alignment creates enhanced spring tides',
  },
  {
    date: new Date('2026-03-03T12:00:00Z'),
    type: 'lunar',
    subtype: 'total',
    tidalImpact: 'high',
    visibility: 'Americas, Europe, Africa',
    description: 'Full Moon eclipse - expect strongest spring tides of the month',
  },
  {
    date: new Date('2026-08-12T12:00:00Z'),
    type: 'solar',
    subtype: 'total',
    tidalImpact: 'high',
    visibility: 'Arctic, Greenland, Iceland, Spain',
    description: 'Total solar eclipse coincides with new moon spring tide',
  },
  {
    date: new Date('2026-08-28T12:00:00Z'),
    type: 'lunar',
    subtype: 'partial',
    tidalImpact: 'moderate',
    visibility: 'Pacific, Australia, Asia',
    description: 'Partial lunar eclipse during spring tide period',
  },
  {
    date: new Date('2027-02-06T12:00:00Z'),
    type: 'solar',
    subtype: 'annular',
    tidalImpact: 'high',
    visibility: 'S. America, Antarctica, Africa',
    description: 'Annular eclipse enhances new moon spring tides',
  },
  {
    date: new Date('2027-02-20T12:00:00Z'),
    type: 'lunar',
    subtype: 'penumbral',
    tidalImpact: 'low',
    visibility: 'Americas, Europe, Africa',
    description: 'Subtle penumbral eclipse - minimal additional tidal effect',
  },
  {
    date: new Date('2027-07-18T12:00:00Z'),
    type: 'lunar',
    subtype: 'penumbral',
    tidalImpact: 'low',
    visibility: 'Asia, Australia, Pacific',
    description: 'Penumbral eclipse during full moon spring tide',
  },
  {
    date: new Date('2027-08-02T12:00:00Z'),
    type: 'solar',
    subtype: 'total',
    tidalImpact: 'high',
    visibility: 'N. Africa, Europe, Asia',
    description: 'Major total solar eclipse amplifies spring tide effect',
  },
];

// Calculate approximate tidal enhancement during eclipse
function calculateEclipseEffect(eclipseType: 'solar' | 'lunar', subtype: string): {
  percentEnhancement: number;
  explanation: string;
} {
  // Eclipses occur during syzygy (Sun-Earth-Moon alignment)
  // which is already the spring tide period
  // The additional effect comes from more precise alignment

  if (eclipseType === 'solar') {
    switch (subtype) {
      case 'total':
        return {
          percentEnhancement: 5,
          explanation: 'Perfect Sun-Moon alignment maximizes combined gravitational pull',
        };
      case 'annular':
        return {
          percentEnhancement: 4,
          explanation: 'Near-perfect alignment with Moon slightly farther from Earth',
        };
      case 'partial':
        return {
          percentEnhancement: 2,
          explanation: 'Partial alignment still enhances the spring tide effect',
        };
      default:
        return { percentEnhancement: 0, explanation: '' };
    }
  } else {
    // Lunar eclipse - occurs at full moon
    switch (subtype) {
      case 'total':
        return {
          percentEnhancement: 4,
          explanation: 'Earth, Moon, Sun in precise line - strong spring tide',
        };
      case 'partial':
        return {
          percentEnhancement: 2,
          explanation: 'Partial alignment enhances full moon spring tide',
        };
      case 'penumbral':
        return {
          percentEnhancement: 1,
          explanation: 'Slight alignment enhancement over normal spring tide',
        };
      default:
        return { percentEnhancement: 0, explanation: '' };
    }
  }
}

export function EclipseTidesPanel({ onClose }: EclipseTidesPanelProps) {
  const epoch = useTimeStore((s) => s.epoch);
  const currentTime = useMemo(() => new Date(epoch), [epoch]);

  // Find upcoming eclipses
  const upcomingEclipses = useMemo(() => {
    return UPCOMING_ECLIPSES
      .filter(e => e.date > currentTime)
      .slice(0, 6);
  }, [currentTime]);

  // Find next eclipse
  const nextEclipse = upcomingEclipses[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-amber-400">Eclipse Tides</h3>
            <p className="text-slate-400 text-sm">
              How solar and lunar eclipses affect tidal patterns
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Next Eclipse Highlight */}
        {nextEclipse && (
          <div className={`rounded-lg p-4 mb-4 ${
            nextEclipse.type === 'solar' ? 'bg-amber-900/30' : 'bg-indigo-900/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {nextEclipse.type === 'solar' ? '🌑' : '🌕'}
                </span>
                <div>
                  <p className={`font-medium ${
                    nextEclipse.type === 'solar' ? 'text-amber-300' : 'text-indigo-300'
                  }`}>
                    Next: {nextEclipse.subtype.charAt(0).toUpperCase() + nextEclipse.subtype.slice(1)} {nextEclipse.type.charAt(0).toUpperCase() + nextEclipse.type.slice(1)} Eclipse
                  </p>
                  <p className="text-sm text-slate-400">
                    {format(nextEclipse.date, 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">
                  {differenceInDays(nextEclipse.date, currentTime)} days away
                </p>
              </div>
            </div>

            {(() => {
              const effect = calculateEclipseEffect(nextEclipse.type, nextEclipse.subtype);
              return (
                <div className="mt-2 text-sm">
                  <p className="text-slate-300 mb-1">
                    Expected tidal enhancement: <span className="font-mono text-green-400">+{effect.percentEnhancement}%</span>
                  </p>
                  <p className="text-slate-500 text-xs">
                    {effect.explanation}
                  </p>
                </div>
              );
            })()}

            <p className="text-xs text-slate-500 mt-2">
              Visible from: {nextEclipse.visibility}
            </p>
          </div>
        )}

        {/* Upcoming Eclipses List */}
        <div className="bg-slate-800 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Upcoming Eclipses</h4>
          <div className="space-y-2">
            {upcomingEclipses.map((eclipse, i) => {
              const effect = calculateEclipseEffect(eclipse.type, eclipse.subtype);
              const daysAway = differenceInDays(eclipse.date, currentTime);

              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-2 rounded ${
                    eclipse.type === 'solar' ? 'bg-amber-900/20' : 'bg-indigo-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {eclipse.type === 'solar' ? '☀️' : '🌙'}
                    </span>
                    <div>
                      <p className="text-sm text-slate-300">
                        {eclipse.subtype.charAt(0).toUpperCase() + eclipse.subtype.slice(1)} {eclipse.type}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(eclipse.date, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      eclipse.tidalImpact === 'high' ? 'bg-green-900/50 text-green-400' :
                      eclipse.tidalImpact === 'moderate' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      +{effect.percentEnhancement}%
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      {daysAway} days
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Educational Content */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">How Eclipses Affect Tides</h4>
          <div className="space-y-3 text-sm text-slate-400">
            <p>
              Eclipses occur during <strong className="text-white">syzygy</strong>—when the Sun, Earth,
              and Moon are aligned. This alignment is already what creates spring tides during new
              and full moons.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-900/20 rounded p-2">
                <p className="text-amber-300 font-medium flex items-center gap-1">
                  <span>☀️</span> Solar Eclipses
                </p>
                <p className="text-xs mt-1">
                  Occur at new moon when Moon passes between Earth and Sun.
                  The precise alignment can enhance spring tide by 3-5%.
                </p>
              </div>
              <div className="bg-indigo-900/20 rounded p-2">
                <p className="text-indigo-300 font-medium flex items-center gap-1">
                  <span>🌙</span> Lunar Eclipses
                </p>
                <p className="text-xs mt-1">
                  Occur at full moon when Earth passes between Sun and Moon.
                  Strong alignment amplifies full moon spring tides.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Eclipses Enhance Tides */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">The Eclipse-Tide Connection</h4>
          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-blue-400">1.</span>
              <p>
                <strong className="text-slate-300">Precise Alignment:</strong> During an eclipse,
                the Sun and Moon are more precisely aligned than during a typical new/full moon,
                maximizing combined gravitational pull.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400">2.</span>
              <p>
                <strong className="text-slate-300">Orbital Inclination:</strong> The Moon's orbit
                is tilted 5° to Earth's orbit. Eclipses occur when the Moon crosses this plane
                during syzygy, creating true alignment.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400">3.</span>
              <p>
                <strong className="text-slate-300">Perigean Eclipses:</strong> When an eclipse
                coincides with lunar perigee, the effect is even stronger—creating some of the
                most extreme tides of the year.
              </p>
            </div>
          </div>

          <div className="mt-3 p-2 bg-slate-700/50 rounded text-xs text-slate-500">
            <strong className="text-slate-400">Note:</strong> While eclipses enhance spring tides,
            the effect is relatively small (1-5%) compared to other factors like storm surge,
            barometric pressure, and wind setup. The tidal effect of an eclipse is scientific
            interest rather than a navigation hazard.
          </div>
        </div>
      </div>
    </div>
  );
}
