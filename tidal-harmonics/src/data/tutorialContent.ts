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
          "Tides are one of nature's most predictable phenomena. Let's explore how the Moon and Sun work together to create the rhythmic rise and fall of the seas.",
        camera: {
          position: [80, 40, 80],
          target: [0, 0, 0],
          duration: 2,
        },
      },
      {
        id: 'ch1-moon-pull',
        title: "The Moon's Pull",
        content:
          "The Moon's gravity pulls on Earth's oceans. Water on the side facing the Moon is pulled toward it, creating a bulge.",
        camera: {
          position: [50, 20, 50],
          target: [0, 0, 0],
          duration: 1.5,
        },
        annotations: [
          {
            id: 'moon-label',
            text: 'Moon',
            position: [30, 0, 0],
            style: 'highlight',
          },
          {
            id: 'near-bulge',
            text: 'Tidal bulge (toward Moon)',
            position: [3, 0, 0],
            style: 'default',
          },
        ],
        showTidalBulge: true,
      },
      {
        id: 'ch1-far-bulge',
        title: 'The Far Side Bulge',
        content:
          "Surprisingly, there's also a bulge on the opposite side of Earth! This happens because Earth is pulled toward the Moon more than the water on the far side.",
        camera: {
          position: [-50, 20, 50],
          target: [0, 0, 0],
          duration: 2,
        },
        annotations: [
          {
            id: 'far-bulge',
            text: 'Tidal bulge (away from Moon)',
            position: [-3, 0, 0],
            style: 'default',
          },
        ],
        showTidalBulge: true,
        showForceVectors: true,
      },
      {
        id: 'ch1-rotation',
        title: 'Earth Rotates Through the Bulges',
        content:
          'As Earth rotates, different locations pass through the two tidal bulges. This is why most places experience two high tides and two low tides each day.',
        camera: {
          position: [0, 60, 60],
          target: [0, 0, 0],
          duration: 1.5,
        },
        timeSpeed: 3600, // 1 hour per second for visualization
        interactive: true,
      },
    ],
  },
  {
    id: 'ch2-sun-contribution',
    title: "The Sun's Contribution",
    description: 'How the Sun creates spring and neap tides',
    steps: [
      {
        id: 'ch2-intro',
        title: 'The Sun Also Pulls',
        content:
          "While the Moon is the primary driver of tides, the Sun also exerts a gravitational pull on Earth's oceans. The Sun's effect is about 46% as strong as the Moon's.",
        camera: {
          position: [100, 50, 100],
          target: [0, 0, 0],
          duration: 2,
        },
        annotations: [
          {
            id: 'sun-label',
            text: 'Sun (not to scale)',
            position: [-200, 0, 0],
            style: 'highlight',
          },
        ],
      },
      {
        id: 'ch2-spring',
        title: 'Spring Tides',
        content:
          'When the Sun and Moon align (new moon or full moon), their gravitational pulls combine. This creates extra-high and extra-low tides called spring tides.',
        camera: {
          position: [80, 30, 0],
          target: [0, 0, 0],
          duration: 1.5,
        },
        annotations: [
          {
            id: 'spring-align',
            text: 'Sun-Earth-Moon aligned → Spring tide',
            position: [0, 5, 0],
            style: 'highlight',
          },
        ],
        showTidalBulge: true,
      },
      {
        id: 'ch2-neap',
        title: 'Neap Tides',
        content:
          "When the Sun and Moon are at right angles (first and third quarter moon), their pulls partially cancel. This creates smaller tides called neap tides.",
        camera: {
          position: [0, 60, 80],
          target: [0, 0, 0],
          duration: 1.5,
        },
        annotations: [
          {
            id: 'neap-perpendicular',
            text: 'Sun-Earth-Moon at 90° → Neap tide',
            position: [0, 5, 0],
            style: 'highlight',
          },
        ],
        showTidalBulge: true,
      },
    ],
  },
  {
    id: 'ch3-harmonics-intro',
    title: 'Breaking It Down',
    description: 'Introduction to harmonic analysis',
    steps: [
      {
        id: 'ch3-complex-tide',
        title: 'Tides Are Complex',
        content:
          "Real tides aren't simple sine waves. They're the combination of many overlapping cycles with different periods and amplitudes.",
        camera: {
          position: [60, 30, 60],
          target: [0, 0, 0],
          duration: 1.5,
        },
      },
      {
        id: 'ch3-phasor-intro',
        title: 'The Phasor Diagram',
        content:
          'We can represent each tidal cycle as a rotating vector (phasor). The length is the amplitude, and the rotation speed depends on the period.',
        camera: {
          position: [40, 20, 40],
          target: [0, 0, 0],
          duration: 1.5,
        },
        highlightConstituents: ['M2'],
      },
      {
        id: 'ch3-constituents',
        title: 'Tidal Constituents',
        content:
          "Each cycle is called a 'constituent' and has a symbol. M2 is the main lunar tide (period ~12.4 hours), S2 is the main solar tide (period 12 hours).",
        camera: {
          position: [40, 20, 40],
          target: [0, 0, 0],
          duration: 1,
        },
        highlightConstituents: ['M2', 'S2'],
      },
    ],
  },
  {
    id: 'ch4-major-constituents',
    title: 'The Major Players',
    description: 'Understanding M2, S2, K1, and O1',
    steps: [
      {
        id: 'ch4-m2',
        title: 'M2: The Principal Lunar',
        content:
          "M2 is the largest tidal constituent at most locations. It's caused by the Moon and has a period of 12 hours 25 minutes - half a lunar day.",
        highlightConstituents: ['M2'],
        interactive: true,
      },
      {
        id: 'ch4-s2',
        title: 'S2: The Principal Solar',
        content:
          "S2 is caused by the Sun and has an exact 12-hour period. When M2 and S2 are in phase, you get spring tides. When they're opposed, neap tides.",
        highlightConstituents: ['M2', 'S2'],
        interactive: true,
      },
      {
        id: 'ch4-diurnal',
        title: 'K1 and O1: The Diurnals',
        content:
          'K1 and O1 have periods near 24 hours. They cause the difference between the two daily high tides (diurnal inequality).',
        highlightConstituents: ['K1', 'O1'],
        interactive: true,
      },
    ],
  },
  {
    id: 'ch5-prediction',
    title: 'Predicting the Future',
    description: 'How harmonic constants enable tide prediction',
    steps: [
      {
        id: 'ch5-station-data',
        title: 'Station-Specific Constants',
        content:
          'Each location has unique harmonic constants derived from years of tide gauge measurements. The amplitude and phase of each constituent varies by location.',
        interactive: true,
      },
      {
        id: 'ch5-formula',
        title: 'The Prediction Formula',
        content:
          'To predict the tide: sum up all constituents, each with its amplitude, phase, and current angle. The result is remarkably accurate!',
        interactive: true,
      },
      {
        id: 'ch5-try-it',
        title: 'Try It Yourself',
        content:
          'Select different stations from the dropdown and watch how the tide curve changes. Each location has its own tidal signature.',
        interactive: true,
      },
    ],
  },
  {
    id: 'ch6-full-picture',
    title: 'The Full Picture',
    description: 'The complete 37+ constituent model',
    steps: [
      {
        id: 'ch6-many-constituents',
        title: '37 Major Constituents',
        content:
          'NOAA uses 37 major constituents for official tide predictions. Each captures a specific astronomical effect: lunar ellipticity, solar declination, and more.',
        interactive: true,
      },
      {
        id: 'ch6-families',
        title: 'Constituent Families',
        content:
          'Constituents are grouped by period: Semidiurnal (~12 hr), Diurnal (~24 hr), Long-period (weeks to months), and Shallow-water (compound effects).',
        interactive: true,
      },
      {
        id: 'ch6-conclusion',
        title: 'Congratulations!',
        content:
          "You now understand harmonic tidal analysis! Explore the visualization, change stations, toggle constituents, and see how the predictions work.",
        camera: {
          position: [60, 40, 60],
          target: [0, 0, 0],
          duration: 2,
        },
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
