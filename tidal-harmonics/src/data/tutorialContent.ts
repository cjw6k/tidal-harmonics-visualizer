import type { TutorialChapter } from '@/types/tutorial';

export const TUTORIAL_CHAPTERS: TutorialChapter[] = [
  {
    id: 'ch1-moon-gravity',
    title: 'Why Do Tides Happen?',
    description: "Understanding the Moon's gravitational pull on Earth's oceans",
    steps: [
      {
        id: 'ch1-intro',
        title: 'Welcome to Tidal Harmonics',
        content:
          "Watch the Earth and Moon in their eternal dance. The Moon's gravity reaches across space to pull on our oceans.",
        camera: {
          position: [100, 60, 100],
          target: [0, 0, 0],
          duration: 2.5,
        },
        showTidalBulge: false,
        showForceVectors: false,
        showOrbits: true,
        timeSpeed: 86400, // 1 day per second - watch the Moon orbit
        tidalExaggeration: 10000,
      },
      {
        id: 'ch1-zoom-earth',
        title: 'Focus on Earth',
        content:
          "Let's zoom in on Earth. Notice the Moon's position - it's constantly pulling water toward itself.",
        camera: {
          position: [40, 15, 40],
          target: [0, 0, 0],
          duration: 2,
        },
        showTidalBulge: false,
        timeSpeed: 3600, // Slow down to 1 hour per second
      },
      {
        id: 'ch1-show-bulge',
        title: 'The Tidal Bulge Appears',
        content:
          "Now watch as we reveal the tidal bulge. The ocean water is pulled toward the Moon, creating a bulge on the near side.",
        camera: {
          position: [25, 10, 25],
          target: [0, 0, 0],
          duration: 1.5,
        },
        showTidalBulge: true,
        tidalExaggeration: 50000, // Very exaggerated for visibility
        timeSpeed: 0, // Pause to see the bulge
        annotations: [
          {
            id: 'near-bulge',
            text: '← Water pulled toward Moon',
            position: [4, 0, 0],
            style: 'highlight',
          },
        ],
      },
      {
        id: 'ch1-exaggerate-bulge',
        title: 'Exaggerating for Clarity',
        content:
          "In reality, the bulge is only about 0.5 meters high in open ocean. We're exaggerating it 100,000× so you can see it clearly!",
        camera: {
          position: [20, 5, 20],
          target: [0, 0, 0],
          duration: 1.5,
        },
        showTidalBulge: true,
        tidalExaggeration: 100000, // Maximum exaggeration
        timeSpeed: 0,
      },
      {
        id: 'ch1-far-bulge',
        title: 'The Mysterious Far-Side Bulge',
        content:
          "Rotate around... there's ALSO a bulge on the opposite side! This is because Earth is pulled toward the Moon more than the water on the far side.",
        camera: {
          position: [-25, 10, 25],
          target: [0, 0, 0],
          duration: 2.5,
        },
        showTidalBulge: true,
        tidalExaggeration: 100000,
        showForceVectors: true,
        timeSpeed: 0,
        annotations: [
          {
            id: 'far-bulge',
            text: 'Far-side bulge →',
            position: [-4, 0, 0],
            style: 'highlight',
          },
        ],
      },
      {
        id: 'ch1-force-vectors',
        title: 'Differential Gravity',
        content:
          "The arrows show the DIFFERENCE in gravitational pull across Earth. Notice they point AWAY from center on both sides - that's what creates two bulges!",
        camera: {
          position: [0, 40, 40],
          target: [0, 0, 0],
          duration: 2,
        },
        showTidalBulge: true,
        tidalExaggeration: 80000,
        showForceVectors: true,
        timeSpeed: 0,
      },
      {
        id: 'ch1-rotation',
        title: 'Earth Rotates Through the Bulges',
        content:
          "Now watch Earth rotate. The bulges stay aligned with the Moon while Earth spins beneath them. Any point passes through TWO high tides per day!",
        camera: {
          position: [0, 50, 50],
          target: [0, 0, 0],
          duration: 1.5,
        },
        showTidalBulge: true,
        tidalExaggeration: 80000,
        showForceVectors: false,
        timeSpeed: 7200, // 2 hours per second - watch Earth rotate
      },
    ],
  },
  {
    id: 'ch2-sun-contribution',
    title: "The Sun's Contribution",
    description: 'How the Sun creates spring and neap tides',
    steps: [
      {
        id: 'ch2-zoom-out',
        title: 'Zooming Out',
        content:
          "Let's zoom out to see the Sun. Though much farther away, its massive gravity also pulls on Earth's oceans.",
        camera: {
          position: [150, 80, 150],
          target: [0, 0, 0],
          duration: 2.5,
        },
        showTidalBulge: true,
        tidalExaggeration: 50000,
        showOrbits: true,
        timeSpeed: 86400, // 1 day per second
      },
      {
        id: 'ch2-sun-effect',
        title: "The Sun's Tidal Pull",
        content:
          "The Sun's tidal effect is about 46% as strong as the Moon's. When they align, their pulls ADD together!",
        camera: {
          position: [100, 40, 0],
          target: [0, 0, 0],
          duration: 2,
        },
        showTidalBulge: true,
        tidalExaggeration: 60000,
        timeSpeed: 0,
        annotations: [
          {
            id: 'sun-pull',
            text: '← Sun pulls this way',
            position: [-50, 0, 0],
            style: 'highlight',
          },
        ],
      },
      {
        id: 'ch2-spring-tide',
        title: 'Spring Tides: Maximum Range',
        content:
          "At new moon and full moon, Sun and Moon align. Their forces combine for the LARGEST tidal range - called 'spring' tides (nothing to do with the season!).",
        camera: {
          position: [80, 30, 0],
          target: [0, 0, 0],
          duration: 2,
        },
        showTidalBulge: true,
        tidalExaggeration: 100000, // Max bulge for spring tide visualization
        timeSpeed: 0,
        annotations: [
          {
            id: 'spring-label',
            text: 'SPRING TIDE - Maximum bulge',
            position: [0, 8, 0],
            style: 'highlight',
          },
        ],
      },
      {
        id: 'ch2-watch-month',
        title: 'Watch the Lunar Month',
        content:
          "Now let's speed up time and watch a full lunar month. See how the Moon orbits Earth, changing the alignment with the Sun.",
        camera: {
          position: [0, 120, 80],
          target: [0, 0, 0],
          duration: 2,
        },
        showTidalBulge: true,
        tidalExaggeration: 60000,
        showOrbits: true,
        timeSpeed: 604800, // 1 week per second
      },
      {
        id: 'ch2-neap-tide',
        title: 'Neap Tides: Minimum Range',
        content:
          "At first and third quarter moon, Sun and Moon are at 90°. Their pulls partially CANCEL, giving the smallest tidal range - 'neap' tides.",
        camera: {
          position: [60, 40, 60],
          target: [0, 0, 0],
          duration: 2,
        },
        showTidalBulge: true,
        tidalExaggeration: 40000, // Smaller bulge for neap visualization
        timeSpeed: 0,
        annotations: [
          {
            id: 'neap-label',
            text: 'NEAP TIDE - Reduced bulge',
            position: [0, 6, 0],
            style: 'highlight',
          },
        ],
      },
    ],
  },
  {
    id: 'ch3-harmonics-intro',
    title: 'Breaking It Down',
    description: 'Introduction to harmonic analysis',
    steps: [
      {
        id: 'ch3-complexity',
        title: 'The Real Picture is Complex',
        content:
          "Real tides aren't this simple. The Moon's orbit is tilted and elliptical. Earth's axis is tilted. Continents block water flow. It's complicated!",
        camera: {
          position: [50, 30, 50],
          target: [0, 0, 0],
          duration: 2,
        },
        showTidalBulge: true,
        tidalExaggeration: 50000,
        timeSpeed: 86400, // Show daily variation
      },
      {
        id: 'ch3-decompose',
        title: 'Decomposing into Cycles',
        content:
          "The brilliant insight: we can break down the complex tide into many simple, overlapping cycles. Each cycle has a specific period and amplitude.",
        camera: {
          position: [40, 20, 40],
          target: [0, 0, 0],
          duration: 1.5,
        },
        showTidalBulge: true,
        tidalExaggeration: 30000,
        timeSpeed: 3600,
      },
      {
        id: 'ch3-phasor-concept',
        title: 'Rotating Vectors',
        content:
          "Look at the phasor diagram (bottom right). Each colored line is a 'constituent' - a single tidal cycle. They rotate at different speeds. The RED vector is their sum - the actual tide!",
        camera: {
          position: [35, 15, 35],
          target: [0, 0, 0],
          duration: 1.5,
        },
        highlightConstituents: ['M2', 'S2'],
        timeSpeed: 3600,
      },
      {
        id: 'ch3-m2-dominant',
        title: 'M2: The Dominant Cycle',
        content:
          "The BLUE vector labeled 'M2' is the biggest. It completes one rotation in 12 hours 25 minutes - half a lunar day. This is the main lunar tide.",
        camera: {
          position: [30, 15, 30],
          target: [0, 0, 0],
          duration: 1.5,
        },
        highlightConstituents: ['M2'],
        timeSpeed: 7200,
      },
    ],
  },
  {
    id: 'ch4-major-constituents',
    title: 'The Major Players',
    description: 'Understanding M2, S2, K1, and O1',
    steps: [
      {
        id: 'ch4-m2-detail',
        title: 'M2: Principal Lunar Semidiurnal',
        content:
          "M2 is caused by the Moon. Period: 12h 25m. At most locations, M2 is responsible for 60-70% of the total tidal range. Watch it rotate in the phasor diagram!",
        camera: {
          position: [30, 20, 30],
          target: [0, 0, 0],
          duration: 1.5,
        },
        highlightConstituents: ['M2'],
        timeSpeed: 3600,
        showTidalBulge: true,
        tidalExaggeration: 50000,
      },
      {
        id: 'ch4-s2-detail',
        title: 'S2: Principal Solar Semidiurnal',
        content:
          "S2 is caused by the Sun. Period: exactly 12 hours. It's smaller than M2 but creates the spring/neap cycle by going in and out of phase with M2.",
        camera: {
          position: [30, 20, 30],
          target: [0, 0, 0],
          duration: 1.5,
        },
        highlightConstituents: ['M2', 'S2'],
        timeSpeed: 3600,
      },
      {
        id: 'ch4-spring-neap-phasor',
        title: 'Spring & Neap in the Phasor',
        content:
          "When M2 and S2 point the same direction: spring tide (big sum). When they point opposite: neap tide (small sum). This takes ~14 days to cycle.",
        camera: {
          position: [30, 20, 30],
          target: [0, 0, 0],
          duration: 1.5,
        },
        highlightConstituents: ['M2', 'S2'],
        timeSpeed: 86400, // 1 day/sec to see spring/neap cycle
      },
      {
        id: 'ch4-diurnal',
        title: 'K1 and O1: The Diurnals',
        content:
          "K1 and O1 have ~24 hour periods. They cause 'diurnal inequality' - when the two daily high tides are different heights. Important on the US West Coast!",
        camera: {
          position: [30, 20, 30],
          target: [0, 0, 0],
          duration: 1.5,
        },
        highlightConstituents: ['K1', 'O1'],
        timeSpeed: 3600,
      },
      {
        id: 'ch4-all-major',
        title: 'All Major Constituents',
        content:
          "Together, M2 + S2 + K1 + O1 capture about 85% of the tide at most locations. Watch how they combine in the phasor diagram!",
        camera: {
          position: [35, 25, 35],
          target: [0, 0, 0],
          duration: 1.5,
        },
        highlightConstituents: ['M2', 'S2', 'K1', 'O1'],
        timeSpeed: 7200,
      },
    ],
  },
  {
    id: 'ch5-prediction',
    title: 'Predicting the Future',
    description: 'How harmonic constants enable tide prediction',
    steps: [
      {
        id: 'ch5-station-intro',
        title: 'Every Location is Different',
        content:
          "Each coastal location has unique tidal behavior. Try selecting different stations in the dropdown - see how the tide curve changes!",
        camera: {
          position: [40, 25, 40],
          target: [0, 0, 0],
          duration: 1.5,
        },
        highlightConstituents: ['M2', 'S2', 'K1', 'O1', 'N2'],
        timeSpeed: 3600,
        interactive: true,
      },
      {
        id: 'ch5-harmonic-constants',
        title: 'Harmonic Constants',
        content:
          "For each station, scientists measure years of tides and extract the amplitude and phase of each constituent. These 'harmonic constants' are unique to each location.",
        camera: {
          position: [40, 25, 40],
          target: [0, 0, 0],
          duration: 1.5,
        },
        highlightConstituents: ['M2', 'S2', 'K1', 'O1', 'N2', 'K2'],
        timeSpeed: 3600,
      },
      {
        id: 'ch5-prediction-formula',
        title: 'The Prediction',
        content:
          "To predict: sum up all constituents at any future time. Each one contributes amplitude × cos(speed × time + phase). The result is remarkably accurate!",
        camera: {
          position: [40, 25, 40],
          target: [0, 0, 0],
          duration: 1.5,
        },
        highlightConstituents: ['M2', 'S2', 'K1', 'O1', 'N2', 'K2', 'P1', 'Q1'],
        timeSpeed: 7200,
      },
    ],
  },
  {
    id: 'ch6-full-picture',
    title: 'The Full Picture',
    description: 'The complete 37+ constituent model',
    steps: [
      {
        id: 'ch6-37-constituents',
        title: '37 Major Constituents',
        content:
          "NOAA uses 37 major constituents for official predictions. Each captures a specific effect: lunar ellipticity, solar declination, shallow water effects, and more.",
        camera: {
          position: [45, 30, 45],
          target: [0, 0, 0],
          duration: 1.5,
        },
        highlightConstituents: ['M2', 'S2', 'N2', 'K1', 'O1', 'K2', 'P1', 'Q1', 'M4', 'Mf', 'Mm'],
        timeSpeed: 3600,
      },
      {
        id: 'ch6-explore',
        title: 'Explore!',
        content:
          "You now understand harmonic tidal analysis! Toggle constituents on/off to see their individual effects. Change stations. Speed up time. The ocean's rhythm is yours to explore.",
        camera: {
          position: [60, 40, 60],
          target: [0, 0, 0],
          duration: 2,
        },
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
