import type { ConstituentDetail } from '@/types/harmonics';

/**
 * Comprehensive encyclopedia of tidal constituents
 *
 * Each constituent is a pure sinusoidal component that, when combined with others,
 * reproduces the complex tidal pattern at a location. The genius of harmonic analysis
 * is that once you measure these components at a location, you can predict tides
 * indefinitely into the future.
 */

export const CONSTITUENT_DETAILS: Record<string, ConstituentDetail> = {
  // ============================================
  // SEMIDIURNAL CONSTITUENTS (~12 hour period)
  // ============================================

  M2: {
    symbol: 'M2',
    physicalCause: 'Gravitational attraction of the Moon',
    explanation: `M2 is the king of tidal constituents, typically accounting for 60-70% of the total
tidal range at most locations. It represents the fundamental gravitational pull of the Moon as it
orbits Earth. The "2" indicates it's semidiurnal (two cycles per lunar day), and "M" stands for Moon.

The Moon creates two tidal bulges on Earth: one directly beneath it (due to gravitational attraction)
and one on the opposite side (due to the Earth's center accelerating toward the Moon faster than the
far-side water). As Earth rotates beneath these bulges, coastal locations experience two high tides
per lunar day.

The period of 12.42 hours (not exactly 12) reflects the fact that the Moon is also orbiting Earth,
so it takes slightly more than half an Earth rotation for the Moon to return to the same position
overhead. This is why high tide occurs about 50 minutes later each day.`,
    mathematicalNotes: 'Speed = 2(T - s) = 28.984°/hour, where T is mean solar time and s is lunar longitude',
    practicalSignificance: 'Dominates most tide predictions. Any error in M2 amplitude or phase has the largest impact on prediction accuracy.',
    typicalAmplitudePercent: 100,
    relatedConstituents: ['N2', 'L2', 'NU2', 'MU2'],
    historicalNotes: 'Named by Sir William Thomson (Lord Kelvin) in the 1860s when developing harmonic tide prediction.',
  },

  S2: {
    symbol: 'S2',
    physicalCause: 'Gravitational attraction of the Sun',
    explanation: `S2 is the solar counterpart to M2. Despite the Sun being 27 million times more massive
than the Moon, it's 390 times farther away. Since tidal force decreases with the cube of distance,
the Sun's tidal effect is only about 46% of the Moon's.

S2 has an exact 12-hour period because it's synchronized to the solar day. When M2 and S2 are
in phase (new and full Moon), their effects add together, creating spring tides with maximum
tidal range. When they're 90° out of phase (quarter Moons), they partially cancel, creating
neap tides with minimum range.

The S2/M2 interaction creates the familiar spring-neap cycle with a period of about 14.77 days
(the synodic fortnight).`,
    mathematicalNotes: 'Speed = 2T = 30°/hour exactly. The difference between M2 and S2 speeds determines the spring-neap period.',
    practicalSignificance: 'Second most important constituent. Essential for spring/neap tide prediction.',
    typicalAmplitudePercent: 46,
    relatedConstituents: ['M2', 'T2', 'R2'],
    historicalNotes: 'The spring-neap cycle was known to ancient mariners, but the mathematical explanation came with Newton.',
  },

  N2: {
    symbol: 'N2',
    physicalCause: 'Variation in Moon distance due to elliptical orbit',
    explanation: `The Moon's orbit is not a perfect circle but an ellipse with eccentricity of about 0.055.
At perigee (closest approach), the Moon is about 356,000 km from Earth; at apogee, about 407,000 km.

Since tidal force varies as the inverse cube of distance, the Moon's tidal effect is about 20%
stronger at perigee than at apogee. N2 captures this variation.

The "N" historically stood for "Newton" or the lunar perigee motion. When perigee coincides with
new or full Moon (syzygy), you get perigean spring tides ("king tides"), which are exceptionally
high and low.`,
    mathematicalNotes: 'Speed = M2 - lunar perigee motion. Period slightly longer than M2 because perigee advances.',
    practicalSignificance: 'Third largest constituent at most locations. Critical for predicting unusually high tides.',
    typicalAmplitudePercent: 19,
    relatedConstituents: ['M2', '2N2', 'L2'],
    historicalNotes: 'The lunar perigee-apogee cycle was crucial for understanding tidal variations beyond the spring-neap pattern.',
  },

  K2: {
    symbol: 'K2',
    physicalCause: 'Combined effect of lunar and solar declination variations',
    explanation: `K2 arises from the fact that both the Sun and Moon do not stay in the equatorial plane.
The Moon's orbital plane is tilted about 5° to the ecliptic, and the ecliptic is tilted 23.4° to the
equator. The Sun's declination varies between ±23.4° over the year.

When the Moon or Sun is at high declination (far from the equator), the two daily tidal bulges are
of unequal size, affecting the semidiurnal tide amplitude. K2 captures the slowly-varying component
of this effect.

The "K" comes from Greek "klima" (inclination/declination). K2 and K1 (the diurnal counterpart)
together capture declination effects.`,
    mathematicalNotes: 'Speed = 2T + 2h - 2s = 30.082°/hour. Combines both lunar (s) and solar (h) motions.',
    practicalSignificance: 'Important for seasonal variation in semidiurnal tides.',
    typicalAmplitudePercent: 13,
    relatedConstituents: ['K1', 'S2'],
  },

  NU2: {
    symbol: 'NU2',
    physicalCause: 'Lunar evection - perturbation of Moon orbit by the Sun',
    explanation: `The Moon's orbit is not a simple ellipse but is continuously perturbed by the Sun's gravity.
One of the largest perturbations is called "evection," discovered by Ptolemy around 150 AD.

Evection causes the Moon's distance to vary with a period of about 31.8 days (the evection period),
in addition to the basic orbital period. NU2 captures the effect of this distance variation on
the semidiurnal tide.

The Greek letter ν (nu) is used for this constituent.`,
    mathematicalNotes: 'Combines lunar orbital period with evection period.',
    practicalSignificance: 'Contributes to the complex modulation of tide heights over monthly cycles.',
    typicalAmplitudePercent: 4,
    relatedConstituents: ['M2', 'LAM2'],
  },

  MU2: {
    symbol: 'MU2',
    physicalCause: 'Variation in Moon orbital speed',
    explanation: `As the Moon moves in its elliptical orbit, it moves faster at perigee and slower at apogee
(Kepler's second law). This speed variation affects the timing of tides.

MU2 (Greek μ, mu) captures this "variation" in the Moon's orbital speed. It modifies both the
amplitude and timing of tides with a period related to the anomalistic month (perigee to perigee).`,
    mathematicalNotes: 'Speed = 2T - 4s + 2h = 27.968°/hour',
    practicalSignificance: 'Contributes to fine-tuning of tidal predictions.',
    typicalAmplitudePercent: 2,
    relatedConstituents: ['M2', 'N2'],
  },

  '2N2': {
    symbol: '2N2',
    physicalCause: 'Second-order effect of lunar orbital eccentricity',
    explanation: `While N2 captures the first-order effect of the Moon's elliptical orbit, 2N2 captures
higher-order (second harmonic) effects. The name "2N2" indicates it involves twice the lunar
perigee argument.

These higher-order constituents become more important at locations where the basic constituents
happen to be amplified by local geography, or where very precise predictions are needed.`,
    mathematicalNotes: 'Speed = M2 - 2 × perigee motion',
    practicalSignificance: 'Important for high-precision predictions and at locations with amplified elliptic effects.',
    typicalAmplitudePercent: 2,
    relatedConstituents: ['N2', 'M2'],
  },

  L2: {
    symbol: 'L2',
    physicalCause: 'Smaller lunar elliptic effect (complement to N2)',
    explanation: `L2 is another elliptic constituent, mathematically related to N2 but with a shorter
period. Together, N2 and L2 fully describe how the Moon's elliptical orbit modulates the M2 tide.

Think of the pair like this: N2 dominates when looking at the slower variation, L2 captures
the faster variation in the elliptic envelope.`,
    mathematicalNotes: 'Speed = M2 + perigee motion = 29.528°/hour',
    practicalSignificance: 'Important for accurate reproduction of the elliptic modulation.',
    typicalAmplitudePercent: 3,
    relatedConstituents: ['N2', 'M2'],
  },

  T2: {
    symbol: 'T2',
    physicalCause: 'Eccentricity of Earth orbit around Sun',
    explanation: `Just as the Moon's elliptical orbit creates N2 and L2, Earth's elliptical orbit around
the Sun (eccentricity ~0.017) creates T2 and R2.

Earth is closest to the Sun (perihelion) in early January and farthest (aphelion) in early July.
This 3.3% variation in distance affects the Sun's tidal force by about 10%.

T2 captures the primary effect of this variation on the solar semidiurnal tide.`,
    mathematicalNotes: 'Speed = S2 - solar perigee motion',
    practicalSignificance: 'Contributes to seasonal variation in solar tidal effects.',
    typicalAmplitudePercent: 2,
    relatedConstituents: ['S2', 'R2'],
  },

  R2: {
    symbol: 'R2',
    physicalCause: 'Smaller solar elliptic effect',
    explanation: `R2 is the complement to T2, together capturing the full effect of Earth's orbital
eccentricity on solar tides. While T2 has the larger amplitude, R2 is needed for complete
representation of the elliptic modulation.`,
    mathematicalNotes: 'Speed = S2 + solar perigee motion',
    practicalSignificance: 'Completes the solar elliptic picture.',
    typicalAmplitudePercent: 0.5,
    relatedConstituents: ['T2', 'S2'],
  },

  LAM2: {
    symbol: 'LAM2',
    physicalCause: 'Smaller lunar evectional effect',
    explanation: `LAM2 (λ₂, lambda-2) is the complement to NU2, together describing the full effect
of lunar evection on semidiurnal tides. Evection is one of the largest perturbations to the
Moon's orbit, and these constituents capture its tidal signature.`,
    mathematicalNotes: 'Related to NU2 through evection period.',
    practicalSignificance: 'Improves prediction accuracy for evection-related variations.',
    typicalAmplitudePercent: 0.5,
    relatedConstituents: ['NU2', 'M2'],
  },

  // ============================================
  // DIURNAL CONSTITUENTS (~24 hour period)
  // ============================================

  K1: {
    symbol: 'K1',
    physicalCause: 'Declination (north-south position) of both Sun and Moon',
    explanation: `K1 is the largest diurnal constituent at most locations. It arises because the Moon
and Sun are rarely directly over the equator. When they're at some declination north or south,
the two daily tidal bulges have different sizes.

Imagine standing at a location in the northern hemisphere. When the Moon is at maximum north
declination, the tidal bulge on your side of Earth is larger than the one on the opposite side.
This creates inequality between the two daily high tides - one is higher than the other.

K1 captures the combined declination effects of both Sun and Moon. It's called "lunisolar"
because both bodies contribute.`,
    mathematicalNotes: 'Speed = T + h = 15.041°/hour. Period nearly 24 hours but not exactly.',
    practicalSignificance: 'Essential for predicting diurnal inequality (why the two daily high tides differ).',
    typicalAmplitudePercent: 58,
    relatedConstituents: ['O1', 'P1'],
    historicalNotes: 'The "diurnal inequality" has been known since antiquity - some days one high tide is notably higher than the other.',
  },

  O1: {
    symbol: 'O1',
    physicalCause: 'Declination of the Moon',
    explanation: `O1 is the principal lunar diurnal constituent, capturing how the Moon's changing
declination affects the daily tide pattern. As the Moon moves from northern to southern
declination over its ~27-day orbit, the diurnal inequality varies.

At locations where O1 is large relative to the semidiurnal constituents, you can see
"mixed tides" with two unequal highs and lows per day, or even "diurnal tides" with
only one high and one low.`,
    mathematicalNotes: 'Speed = T - 2s + h = 13.943°/hour. Period about 25.82 hours.',
    practicalSignificance: 'Primary lunar contribution to diurnal inequality.',
    typicalAmplitudePercent: 42,
    relatedConstituents: ['K1', 'Q1'],
  },

  P1: {
    symbol: 'P1',
    physicalCause: 'Declination of the Sun',
    explanation: `P1 is the solar counterpart to O1. It captures how the Sun's declination
(which varies between ±23.4° over the year) affects the daily tide pattern.

P1 is responsible for some of the seasonal variation in diurnal tides - the diurnal
inequality is larger around the solstices (when the Sun is at maximum declination)
than around the equinoxes.`,
    mathematicalNotes: 'Speed = T - h = 14.959°/hour. Period about 24.07 hours.',
    practicalSignificance: 'Solar contribution to diurnal inequality. Important for seasonal patterns.',
    typicalAmplitudePercent: 19,
    relatedConstituents: ['K1', 'S1'],
  },

  Q1: {
    symbol: 'Q1',
    physicalCause: 'Moon elliptic orbit effect on diurnal tide',
    explanation: `Just as N2 modifies M2 for the elliptic orbit, Q1 modifies O1. When the Moon
is closer (at perigee), its declination effects are amplified.

Q1 thus captures how the Moon's varying distance modulates the diurnal inequality.`,
    mathematicalNotes: 'Speed = O1 - perigee motion = 13.399°/hour',
    practicalSignificance: 'Modulates diurnal tide with lunar distance.',
    typicalAmplitudePercent: 8,
    relatedConstituents: ['O1', '2Q1'],
  },

  J1: {
    symbol: 'J1',
    physicalCause: 'Smaller lunar elliptic diurnal effect',
    explanation: `J1 is the smaller complement to Q1, together fully describing how the Moon's
elliptical orbit modulates the diurnal constituents. Named after various historical conventions.`,
    mathematicalNotes: 'Speed = K1 + perigee motion',
    practicalSignificance: 'Completes elliptic modulation of diurnal tides.',
    typicalAmplitudePercent: 3,
    relatedConstituents: ['Q1', 'K1'],
  },

  M1: {
    symbol: 'M1',
    physicalCause: 'First-order lunar diurnal (complex origin)',
    explanation: `M1 has a complex origin involving the interaction of the Moon's declination
with its orbital motion. It's smaller than O1 and K1 but contributes to the full
description of lunar diurnal effects.`,
    mathematicalNotes: 'Speed = T - s = 14.497°/hour',
    practicalSignificance: 'Minor lunar diurnal contribution.',
    typicalAmplitudePercent: 3,
    relatedConstituents: ['O1', 'K1'],
  },

  OO1: {
    symbol: 'OO1',
    physicalCause: 'Second-order lunar diurnal',
    explanation: `OO1 captures higher-order effects of lunar declination on the diurnal tide.
It becomes important at locations with strong diurnal signals and for high-precision work.`,
    mathematicalNotes: 'Speed = T + 2s + h = 16.139°/hour',
    practicalSignificance: 'Second-order diurnal correction.',
    typicalAmplitudePercent: 2,
    relatedConstituents: ['O1', 'K1'],
  },

  S1: {
    symbol: 'S1',
    physicalCause: 'Daily solar heating (radiational tide)',
    explanation: `S1 is unusual among tidal constituents because it's primarily caused by
solar heating rather than gravitational attraction. Daily heating and cooling of the
atmosphere creates a small "radiational tide" in the ocean.

S1 has an exact 24-hour period because it follows the solar day. It's often quite
small at most locations.`,
    mathematicalNotes: 'Speed = T = 15°/hour exactly. Period exactly 24 hours.',
    practicalSignificance: 'Captures thermally-driven daily water level variations.',
    typicalAmplitudePercent: 2,
    relatedConstituents: ['P1'],
    historicalNotes: 'The radiational origin of S1 was not fully understood until the 20th century.',
  },

  RHO1: {
    symbol: 'RHO1',
    physicalCause: 'Lunar evection effect on diurnal tide',
    explanation: `RHO1 (ρ₁) captures how the lunar evection perturbation affects the diurnal
constituents, similar to how NU2 affects the semidiurnal. Evection modulates both the
Moon's distance and its orbital speed.`,
    mathematicalNotes: 'Speed = O1 + evection period',
    practicalSignificance: 'Evection modulation of diurnal tides.',
    typicalAmplitudePercent: 2,
    relatedConstituents: ['O1', 'Q1'],
  },

  '2Q1': {
    symbol: '2Q1',
    physicalCause: 'Second-order elliptic diurnal',
    explanation: `2Q1 is a second-order elliptic constituent that complements Q1 in describing
how the Moon's elliptical orbit modulates the diurnal tide. The "2" indicates it
involves twice the lunar perigee argument.`,
    mathematicalNotes: 'Speed = O1 - 2 × perigee motion',
    practicalSignificance: 'Higher-order elliptic correction for diurnal tides.',
    typicalAmplitudePercent: 1,
    relatedConstituents: ['Q1', 'O1'],
  },

  // ============================================
  // LONG-PERIOD CONSTITUENTS (days to years)
  // ============================================

  Mf: {
    symbol: 'Mf',
    physicalCause: 'Lunar fortnightly (Moon declination cycle)',
    explanation: `Mf arises from the Moon's declination varying from about +28° to -28° over
its orbital period. The effect on tides has a period of about half this (fortnightly)
because maximum declination north and maximum south have similar tidal effects.

Mf has a period of about 13.66 days. It causes a slow modulation in mean sea level
that can amount to several centimeters. This is separate from the spring-neap cycle
(which affects the range rather than the mean level).`,
    mathematicalNotes: 'Speed = 2s = 1.098°/hour. Period about 327.86 hours (13.66 days).',
    practicalSignificance: 'Affects mean sea level at fortnightly scale. Important for geodesy and satellite altimetry.',
    typicalAmplitudePercent: 4,
    relatedConstituents: ['Mm', 'MSf'],
    historicalNotes: 'Long-period constituents were initially hard to separate from weather effects.',
  },

  Mm: {
    symbol: 'Mm',
    physicalCause: 'Lunar monthly (Moon distance cycle)',
    explanation: `Mm arises from the Moon's varying distance over its anomalistic month
(perigee to perigee, about 27.55 days). When the Moon is closer, tides are slightly
stronger on average, raising mean sea level slightly.

Mm has a period of about 27.55 days. It's typically smaller than Mf because the
distance variation is a smaller perturbation than the declination variation.`,
    mathematicalNotes: 'Speed = s - p = 0.544°/hour. Period about 661.31 hours (27.55 days).',
    practicalSignificance: 'Monthly modulation of mean sea level.',
    typicalAmplitudePercent: 2,
    relatedConstituents: ['Mf'],
  },

  Ssa: {
    symbol: 'Ssa',
    physicalCause: 'Solar semiannual (Sun declination cycle)',
    explanation: `Ssa arises from the Sun's declination varying between ±23.4° over the year.
Similar to Mf for the Moon, this creates a twice-yearly (semiannual) effect on mean
sea level with a period of about 182.6 days.

Ssa is typically small but can be important for understanding seasonal sea level
variations. Some of the "Ssa" signal may include non-tidal seasonal effects.`,
    mathematicalNotes: 'Speed = 2h = 0.082°/hour. Period about 4383 hours (182.6 days).',
    practicalSignificance: 'Contributes to semiannual sea level cycle.',
    typicalAmplitudePercent: 2,
    relatedConstituents: ['Sa'],
  },

  Sa: {
    symbol: 'Sa',
    physicalCause: 'Solar annual (Earth orbit and solar heating)',
    explanation: `Sa nominally arises from the annual variation in the Sun's tidal effect due
to Earth's elliptical orbit. However, in practice, most of the observed "Sa" signal
comes from meteorological effects: seasonal variations in wind, atmospheric pressure,
water temperature, and river runoff.

Sa is often called a "meteorological tide" because the gravitational component is
tiny compared to the seasonal effects of weather and heating.`,
    mathematicalNotes: 'Speed = h = 0.041°/hour. Period exactly 1 year (8766.15 hours).',
    practicalSignificance: 'Captures annual sea level cycle (mostly non-gravitational).',
    typicalAmplitudePercent: 3,
    relatedConstituents: ['Ssa'],
    historicalNotes: 'The distinction between gravitational and meteorological Sa is a 20th-century insight.',
  },

  MSf: {
    symbol: 'MSf',
    physicalCause: 'Spring-neap modulation of mean level',
    explanation: `MSf has a period equal to the spring-neap cycle (about 14.77 days). It arises
from the varying mean water level between spring and neap conditions. During spring
tides, the stronger mixing and larger tidal excursions can slightly affect mean level.

MSf is the long-period counterpart to the M2-S2 interaction that creates spring
and neap tides.`,
    mathematicalNotes: 'Speed = 2(s - h) = 1.016°/hour. Period about 354.37 hours (14.77 days).',
    practicalSignificance: 'Spring-neap effect on mean sea level.',
    typicalAmplitudePercent: 1,
    relatedConstituents: ['Mf', 'Mm'],
  },

  // ============================================
  // SHALLOW-WATER CONSTITUENTS (overtides)
  // ============================================

  M4: {
    symbol: 'M4',
    physicalCause: 'Nonlinear distortion of M2 in shallow water',
    explanation: `M4 is the first "overtide" of M2, created when the sinusoidal M2 wave becomes
distorted in shallow water. As the tide wave enters shallower water, friction with the
bottom and the changing water depth cause the wave to become asymmetric - it rises
faster than it falls, or vice versa.

This distortion creates harmonics at integer multiples of the fundamental frequency.
M4 has exactly twice the frequency (half the period) of M2. It's called a "quarter-diurnal"
constituent because it has four peaks per day.

M4 is small or absent in deep water but can be significant in estuaries, bays, and
tidal rivers.`,
    mathematicalNotes: 'Speed = 2 × M2 = 57.968°/hour. Period = 6.21 hours.',
    practicalSignificance: 'Essential for accurate predictions in shallow water and estuaries.',
    typicalAmplitudePercent: 3,
    relatedConstituents: ['M2', 'M6', 'M8'],
    historicalNotes: 'Shallow-water constituents were first systematically studied in the early 20th century.',
  },

  MS4: {
    symbol: 'MS4',
    physicalCause: 'Nonlinear interaction of M2 and S2',
    explanation: `MS4 is a compound constituent created by the nonlinear interaction of M2 and S2
in shallow water. When two waves interact nonlinearly, they create new waves at the
sum and difference of their frequencies.

MS4 has frequency = M2 + S2, making it a quarter-diurnal constituent. It modulates
with the spring-neap cycle because its parent constituents (M2 and S2) create that
cycle.`,
    mathematicalNotes: 'Speed = M2 + S2 = 58.984°/hour. Period = 6.10 hours.',
    practicalSignificance: 'Important compound constituent in shallow water.',
    typicalAmplitudePercent: 1,
    relatedConstituents: ['M2', 'S2', 'M4'],
  },

  M6: {
    symbol: 'M6',
    physicalCause: 'Second overtide of M2',
    explanation: `M6 is the second overtide of M2, at three times the M2 frequency. It appears
in even shallower water than M4 and indicates strong nonlinear distortion of the
tidal wave. M6 is a "sixth-diurnal" constituent with six peaks per day.`,
    mathematicalNotes: 'Speed = 3 × M2 = 86.952°/hour. Period = 4.14 hours.',
    practicalSignificance: 'Indicator of strong nonlinear effects in very shallow water.',
    typicalAmplitudePercent: 0.5,
    relatedConstituents: ['M2', 'M4', 'M8'],
  },

  MN4: {
    symbol: 'MN4',
    physicalCause: 'Nonlinear interaction of M2 and N2',
    explanation: `MN4 is a compound constituent from the interaction of M2 with N2 (the lunar
elliptic constituent). It modulates with the perigee-apogee cycle and contributes
to the quarter-diurnal energy in shallow water.`,
    mathematicalNotes: 'Speed = M2 + N2 = 57.424°/hour. Period = 6.27 hours.',
    practicalSignificance: 'Contributes to elliptic modulation of quarter-diurnal tides.',
    typicalAmplitudePercent: 0.5,
    relatedConstituents: ['M2', 'N2', 'M4'],
  },

  S4: {
    symbol: 'S4',
    physicalCause: 'Overtide of S2',
    explanation: `S4 is the first overtide of S2, at twice the S2 frequency. Like M4 for M2,
S4 appears when the S2 wave is distorted in shallow water. It has exactly 6-hour
period since S2 has exactly 12-hour period.`,
    mathematicalNotes: 'Speed = 2 × S2 = 60°/hour. Period = 6.00 hours exactly.',
    practicalSignificance: 'Solar contribution to quarter-diurnal shallow water tides.',
    typicalAmplitudePercent: 0.3,
    relatedConstituents: ['S2', 'S6'],
  },

  S6: {
    symbol: 'S6',
    physicalCause: 'Second overtide of S2',
    explanation: `S6 is the second overtide of S2, at three times the S2 frequency. Like M6,
it indicates strong nonlinear effects and is typically small except in very
shallow estuarine environments.`,
    mathematicalNotes: 'Speed = 3 × S2 = 90°/hour. Period = 4.00 hours exactly.',
    practicalSignificance: 'Indicator of extreme shallow-water distortion.',
    typicalAmplitudePercent: 0.1,
    relatedConstituents: ['S2', 'S4'],
  },

  MK3: {
    symbol: 'MK3',
    physicalCause: 'Nonlinear interaction of M2 and K1',
    explanation: `MK3 is a "terdiurnal" (three cycles per day) constituent created by the
interaction of M2 (semidiurnal) and K1 (diurnal) in shallow water. It has
frequency M2 + K1 and period about 8.18 hours.

Terdiurnal constituents are relatively rare and indicate interaction between
the semidiurnal and diurnal tidal regimes.`,
    mathematicalNotes: 'Speed = M2 + K1 = 44.025°/hour. Period = 8.18 hours.',
    practicalSignificance: 'Semidiurnal-diurnal interaction in shallow water.',
    typicalAmplitudePercent: 0.3,
    relatedConstituents: ['M2', 'K1', '2MK3'],
  },

  '2MK3': {
    symbol: '2MK3',
    physicalCause: 'Nonlinear interaction: 2×M2 minus K1',
    explanation: `2MK3 is another terdiurnal constituent, but created by the interaction
2×M2 - K1 rather than M2 + K1. It and MK3 together describe the terdiurnal
energy in shallow water that involves both lunar and declination effects.`,
    mathematicalNotes: 'Speed = 2×M2 - K1 = 42.927°/hour. Period = 8.39 hours.',
    practicalSignificance: 'Complements MK3 for terdiurnal description.',
    typicalAmplitudePercent: 0.2,
    relatedConstituents: ['M2', 'K1', 'MK3'],
  },

  M8: {
    symbol: 'M8',
    physicalCause: 'Third overtide of M2',
    explanation: `M8 is the third overtide of M2, at four times the M2 frequency. It has
eight cycles per day ("eighth-diurnal"). M8 is typically very small but can
be detected in strongly nonlinear environments like tidal rivers and bar-built
estuaries.

The presence of significant M8 indicates extreme tidal distortion, often
associated with tidal bores.`,
    mathematicalNotes: 'Speed = 4 × M2 = 115.936°/hour. Period = 3.11 hours.',
    practicalSignificance: 'Indicator of extreme nonlinear distortion (potential tidal bore).',
    typicalAmplitudePercent: 0.1,
    relatedConstituents: ['M2', 'M4', 'M6'],
    historicalNotes: 'Tidal bores like the Severn Bore are associated with strong higher harmonics.',
  },
};

/**
 * Educational groupings of constituents
 */
export const CONSTITUENT_GROUPS = {
  fundamental: {
    name: 'Fundamental Constituents',
    description: 'The primary gravitational effects of Moon and Sun',
    constituents: ['M2', 'S2', 'K1', 'O1'],
    explanation: 'These four constituents capture about 85% of tidal variation at most locations.',
  },
  elliptic: {
    name: 'Elliptic Constituents',
    description: 'Effects of elliptical orbits',
    constituents: ['N2', 'L2', 'Q1', 'J1', 'T2', 'R2', '2N2', '2Q1'],
    explanation: 'The Moon and Earth do not move in perfect circles. These constituents capture how varying distances affect tides.',
  },
  declination: {
    name: 'Declination Constituents',
    description: 'Effects of orbital tilts',
    constituents: ['K1', 'K2', 'O1', 'P1', 'M1', 'OO1'],
    explanation: 'The Moon and Sun move above and below the equator. These constituents capture the resulting diurnal inequality.',
  },
  evection: {
    name: 'Evection Constituents',
    description: 'Solar perturbation of Moon orbit',
    constituents: ['NU2', 'LAM2', 'RHO1'],
    explanation: 'The Sun perturbs the Moon orbit, creating a ~32-day modulation called evection.',
  },
  shallowWater: {
    name: 'Shallow Water Constituents',
    description: 'Nonlinear effects in coastal waters',
    constituents: ['M4', 'MS4', 'M6', 'MN4', 'S4', 'S6', 'MK3', '2MK3', 'M8'],
    explanation: 'As tides enter shallow water, friction and depth changes distort the wave, creating new frequencies.',
  },
  longPeriod: {
    name: 'Long Period Constituents',
    description: 'Slow modulations over days to years',
    constituents: ['Mf', 'Mm', 'Ssa', 'Sa', 'MSf'],
    explanation: 'These constituents affect mean sea level over weeks to months, important for understanding sea level trends.',
  },
};

/**
 * Get detailed information about a constituent
 */
export function getConstituentDetail(symbol: string): ConstituentDetail | undefined {
  return CONSTITUENT_DETAILS[symbol];
}

/**
 * Get all constituent details as an array
 */
export function getAllConstituentDetails(): ConstituentDetail[] {
  return Object.values(CONSTITUENT_DETAILS);
}
