export type TutorialState = 'idle' | 'intro' | 'step' | 'interactive' | 'complete';

export interface CameraKeyframe {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
  duration: number; // seconds
}

export interface Annotation {
  id: string;
  text: string;
  position: [number, number, number]; // 3D world position
  offset?: [number, number]; // 2D screen offset
  style?: 'default' | 'highlight' | 'equation';
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string; // Markdown or plain text
  duration?: number; // Auto-advance after this many seconds (0 = wait for click)
  camera?: CameraKeyframe;
  annotations?: Annotation[];
  interactive?: boolean;
  highlightConstituents?: string[];
  showForceVectors?: boolean;
  showTidalBulge?: boolean;
  tidalExaggeration?: number;
  timeSpeed?: number;
  pauseTime?: boolean;
  showOrbits?: boolean;
  highlightMoon?: boolean;
  highlightEarth?: boolean;
  highlightSun?: boolean;
  pulseEffect?: boolean; // Pulse the tidal bulge for emphasis
}

export interface TutorialChapter {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
}

export interface TutorialProgress {
  chapterIndex: number;
  stepIndex: number;
  completedChapters: string[];
}
