import type { TutorialChapter } from '@/types/tutorial';

export const TUTORIAL_CHAPTERS: TutorialChapter[] = [
  {
    id: 'ch1-moon-gravity',
    title: 'The Moon\'s Pull',
    description: "Understanding gravitational tides",
    steps: [
      {
        id: 'ch1-intro',
        title: 'The Eternal Dance',
        content: "Watch the Moon orbit Earth. Its gravity reaches across 384,000 km to pull on our oceans.",
        duration: 6,
        camera: { position: [80, 50, 80], target: [0, 0, 0], duration: 2 },
        showTidalBulge: false,
        showForceVectors: false,
        showOrbits: true,
        timeSpeed: 172800, // 2 days/sec
      },
      {
        id: 'ch1-zoom',
        title: 'Zooming In',
        content: "The Moon pulls water toward itself, but something surprising happens...",
        duration: 5,
        camera: { position: [35, 12, 35], target: [0, 0, 0], duration: 2 },
        showTidalBulge: false,
        timeSpeed: 3600,
      },
      {
        id: 'ch1-bulge-reveal',
        title: 'The Tidal Bulge',
        content: "Water bulges toward the Moon. We're exaggerating this 50,000× — the real bulge is only half a meter!",
        duration: 7,
        camera: { position: [20, 8, 20], target: [0, 0, 0], duration: 1.5 },
        showTidalBulge: true,
        tidalExaggeration: 50000,
        timeSpeed: 0,
        highlightMoon: true,
        annotations: [
          { id: 'bulge1', text: '← Pulled toward Moon', position: [3.5, 0, 0], style: 'highlight' },
        ],
      },
      {
        id: 'ch1-second-bulge',
        title: 'The Surprising Second Bulge',
        content: "There's also a bulge on the OPPOSITE side! Earth accelerates toward the Moon faster than this distant water.",
        duration: 8,
        camera: { position: [-20, 12, 25], target: [0, 0, 0], duration: 2.5 },
        showTidalBulge: true,
        tidalExaggeration: 70000,
        showForceVectors: true,
        timeSpeed: 0,
        annotations: [
          { id: 'bulge2', text: 'Second bulge →', position: [-3.5, 0, 0], style: 'highlight' },
        ],
      },
      {
        id: 'ch1-differential',
        title: 'Differential Gravity',
        content: "The arrows show tidal forces — they point OUTWARD on both sides. This stretches Earth into an egg shape.",
        duration: 7,
        camera: { position: [0, 35, 35], target: [0, 0, 0], duration: 2 },
        showTidalBulge: true,
        tidalExaggeration: 60000,
        showForceVectors: true,
        timeSpeed: 0,
      },
      {
        id: 'ch1-rotation',
        title: 'Two Tides Per Day',
        content: "Earth rotates beneath the bulges. Any coastal point passes through TWO high tides every 24 hours 50 minutes.",
        duration: 10,
        camera: { position: [0, 45, 45], target: [0, 0, 0], duration: 1.5 },
        showTidalBulge: true,
        tidalExaggeration: 60000,
        showForceVectors: false,
        timeSpeed: 10800, // 3 hrs/sec - watch rotation clearly
        pulseEffect: true,
      },
    ],
  },
  {
    id: 'ch2-sun',
    title: 'The Sun\'s Role',
    description: 'Spring and neap tides',
    steps: [
      {
        id: 'ch2-intro',
        title: 'Another Player',
        content: "The Sun also pulls on our oceans. Its tidal effect is 46% as strong as the Moon's.",
        duration: 6,
        camera: { position: [120, 60, 120], target: [0, 0, 0], duration: 2.5 },
        showTidalBulge: true,
        tidalExaggeration: 40000,
        showOrbits: true,
        timeSpeed: 86400,
      },
      {
        id: 'ch2-alignment',
        title: 'When They Align',
        content: "At new and full Moon, Sun and Moon pull together. Their forces ADD up.",
        duration: 7,
        camera: { position: [60, 25, 0], target: [0, 0, 0], duration: 2 },
        showTidalBulge: true,
        tidalExaggeration: 90000,
        timeSpeed: 0,
        annotations: [
          { id: 'spring', text: 'SPRING TIDE', position: [0, 6, 0], style: 'highlight' },
        ],
      },
      {
        id: 'ch2-spring',
        title: 'Spring Tides',
        content: "Maximum tidal range! 'Spring' means to leap up — nothing to do with the season.",
        duration: 6,
        camera: { position: [50, 20, 10], target: [0, 0, 0], duration: 1.5 },
        showTidalBulge: true,
        tidalExaggeration: 100000,
        timeSpeed: 0,
        pulseEffect: true,
      },
      {
        id: 'ch2-watch-cycle',
        title: 'The Lunar Month',
        content: "Watch the Moon orbit. Every ~14 days, alignment shifts between spring and neap.",
        duration: 12,
        camera: { position: [0, 100, 70], target: [0, 0, 0], duration: 2 },
        showTidalBulge: true,
        tidalExaggeration: 50000,
        showOrbits: true,
        timeSpeed: 518400, // 6 days/sec
      },
      {
        id: 'ch2-neap',
        title: 'Neap Tides',
        content: "At quarter Moon, Sun and Moon pull at 90°. Their forces partially CANCEL. Minimum tidal range.",
        duration: 7,
        camera: { position: [50, 35, 50], target: [0, 0, 0], duration: 2 },
        showTidalBulge: true,
        tidalExaggeration: 35000,
        timeSpeed: 0,
        annotations: [
          { id: 'neap', text: 'NEAP TIDE', position: [0, 5, 0], style: 'default' },
        ],
      },
    ],
  },
  {
    id: 'ch3-harmonics',
    title: 'Harmonic Analysis',
    description: 'Breaking down complexity',
    steps: [
      {
        id: 'ch3-complex',
        title: 'Reality is Messy',
        content: "Real tides are complex. Elliptical orbits, tilted axes, continental shelves — many factors combine.",
        duration: 6,
        camera: { position: [45, 25, 45], target: [0, 0, 0], duration: 2 },
        showTidalBulge: true,
        tidalExaggeration: 40000,
        timeSpeed: 86400,
      },
      {
        id: 'ch3-fourier',
        title: 'The Key Insight',
        content: "Any complex wave can be decomposed into simple sine waves. Each has its own frequency and amplitude.",
        duration: 7,
        camera: { position: [35, 18, 35], target: [0, 0, 0], duration: 1.5 },
        showTidalBulge: true,
        tidalExaggeration: 35000,
        timeSpeed: 3600,
        highlightConstituents: ['M2'],
      },
      {
        id: 'ch3-phasor',
        title: 'The Phasor Diagram',
        content: "Look at the bottom-right panel. Each vector rotates at a different speed. The RED sum is the actual tide!",
        duration: 8,
        camera: { position: [30, 15, 30], target: [0, 0, 0], duration: 1.5 },
        highlightConstituents: ['M2', 'S2'],
        timeSpeed: 7200,
      },
      {
        id: 'ch3-m2',
        title: 'M2: The Biggest',
        content: "M2 (Principal Lunar) is typically 60-70% of the tide. Period: 12h 25m — half a lunar day.",
        duration: 7,
        camera: { position: [30, 15, 30], target: [0, 0, 0], duration: 1 },
        highlightConstituents: ['M2'],
        timeSpeed: 7200,
        showTidalBulge: true,
        tidalExaggeration: 45000,
      },
    ],
  },
  {
    id: 'ch4-constituents',
    title: 'Major Constituents',
    description: 'The tidal orchestra',
    steps: [
      {
        id: 'ch4-s2',
        title: 'S2: The Solar Twin',
        content: "S2 (Principal Solar) has exactly 12h period. When M2 and S2 align: spring tide. When opposed: neap.",
        duration: 8,
        camera: { position: [30, 18, 30], target: [0, 0, 0], duration: 1.5 },
        highlightConstituents: ['M2', 'S2'],
        timeSpeed: 86400,
      },
      {
        id: 'ch4-diurnal',
        title: 'K1 & O1: The Diurnals',
        content: "These ~24h constituents cause 'diurnal inequality' — when the two daily highs aren't equal.",
        duration: 7,
        camera: { position: [30, 18, 30], target: [0, 0, 0], duration: 1 },
        highlightConstituents: ['K1', 'O1'],
        timeSpeed: 7200,
      },
      {
        id: 'ch4-together',
        title: 'The Symphony',
        content: "M2 + S2 + K1 + O1 capture ~85% of most tides. Watch them dance together.",
        duration: 10,
        camera: { position: [35, 22, 35], target: [0, 0, 0], duration: 1.5 },
        highlightConstituents: ['M2', 'S2', 'K1', 'O1'],
        timeSpeed: 10800,
        showTidalBulge: true,
        tidalExaggeration: 50000,
      },
    ],
  },
  {
    id: 'ch5-prediction',
    title: 'Tide Prediction',
    description: 'From analysis to forecast',
    steps: [
      {
        id: 'ch5-local',
        title: 'Every Place is Different',
        content: "Local geography shapes how tides behave. Try different stations in the dropdown!",
        duration: 0, // Manual advance - interactive
        camera: { position: [40, 22, 40], target: [0, 0, 0], duration: 1.5 },
        highlightConstituents: ['M2', 'S2', 'K1', 'O1', 'N2'],
        timeSpeed: 3600,
        interactive: true,
      },
      {
        id: 'ch5-constants',
        title: 'Harmonic Constants',
        content: "Scientists measure years of data to extract each location's unique amplitudes and phases.",
        duration: 6,
        camera: { position: [40, 22, 40], target: [0, 0, 0], duration: 1 },
        highlightConstituents: ['M2', 'S2', 'K1', 'O1', 'N2', 'K2'],
        timeSpeed: 3600,
      },
      {
        id: 'ch5-formula',
        title: 'The Prediction',
        content: "Sum all constituents: height = Σ Aᵢ cos(ωᵢt + φᵢ). Simple math, remarkably accurate!",
        duration: 7,
        camera: { position: [40, 22, 40], target: [0, 0, 0], duration: 1 },
        highlightConstituents: ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'Q1'],
        timeSpeed: 10800,
      },
    ],
  },
  {
    id: 'ch6-explore',
    title: 'Your Turn',
    description: 'Explore freely',
    steps: [
      {
        id: 'ch6-full',
        title: '37 Constituents',
        content: "NOAA uses 37 major constituents. Each captures a specific astronomical effect.",
        duration: 6,
        camera: { position: [45, 28, 45], target: [0, 0, 0], duration: 1.5 },
        highlightConstituents: ['M2', 'S2', 'N2', 'K1', 'O1', 'K2', 'P1', 'Q1', 'M4', 'Mf', 'Mm'],
        timeSpeed: 7200,
      },
      {
        id: 'ch6-go',
        title: 'Explore!',
        content: "Toggle constituents. Change stations. Speed up time. The ocean's rhythm is yours.",
        duration: 0,
        camera: { position: [55, 35, 55], target: [0, 0, 0], duration: 2 },
        showTidalBulge: true,
        tidalExaggeration: 50000,
        showOrbits: true,
        timeSpeed: 86400,
        interactive: true,
      },
    ],
  },
];

export const CHAPTER_COUNT = TUTORIAL_CHAPTERS.length;

export function getChapter(index: number): TutorialChapter | undefined {
  return TUTORIAL_CHAPTERS[index];
}

export function getStep(
  chapterIndex: number,
  stepIndex: number
): { chapter: TutorialChapter; step: (typeof TUTORIAL_CHAPTERS)[0]['steps'][0] } | undefined {
  const chapter = TUTORIAL_CHAPTERS[chapterIndex];
  if (!chapter) return undefined;
  const step = chapter.steps[stepIndex];
  if (!step) return undefined;
  return { chapter, step };
}
