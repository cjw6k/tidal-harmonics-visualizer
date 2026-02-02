import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Tutorial Animation Capture Framework
 *
 * Captures animation frames during tutorial playback for review.
 * See ha-iyw (context bead) for full project philosophy.
 *
 * Directory structure:
 *   screenshots/
 *     chapter-N/
 *       step-MM/{in,rest,out}/
 *         tutorial-CH-STEP-STATE-FRAME.png
 *
 * Frame capture phases:
 *   - in: Transition into step (camera movement, annotations appearing)
 *   - rest: Steady state (orbital cycles, pulse effects)
 *   - out: Transition out (exit animation, handoff)
 */

// Chapter/step metadata from tutorialContent.ts
const CHAPTERS = [
  { id: 'ch1-moon-gravity', steps: 6 },
  { id: 'ch2-sun', steps: 5 },
  { id: 'ch3-harmonics', steps: 4 },
  { id: 'ch4-constituents', steps: 3 },
  { id: 'ch5-elliptic', steps: 4 },
  { id: 'ch6-declination', steps: 4 },
  { id: 'ch7-shallow', steps: 4 },
  { id: 'ch8-longperiod', steps: 4 },
  { id: 'ch9-prediction', steps: 5 },
  { id: 'ch10-explore', steps: 3 },
];

const TOTAL_STEPS = CHAPTERS.reduce((sum, ch) => sum + ch.steps, 0); // 42

// Base screenshot directory
const SCREENSHOT_BASE = path.join(__dirname, '..', 'screenshots');

// Default capture intervals (milliseconds)
const DEFAULT_FRAME_INTERVAL = 150;
const DEFAULT_TRANSITION_FRAMES = 12;
const DEFAULT_STEADY_STATE_DURATION = 3000; // 3 seconds of steady state

/**
 * Ensure screenshot directory exists
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get directory path for a step's screenshots
 */
function getStepDir(chapterIndex: number, stepIndex: number, phase: 'in' | 'rest' | 'out'): string {
  const chapterNum = String(chapterIndex + 1).padStart(1, '0');
  const stepNum = String(stepIndex + 1).padStart(2, '0');
  const dir = path.join(SCREENSHOT_BASE, `chapter-${chapterNum}`, `step-${stepNum}`, phase);
  ensureDir(dir);
  return dir;
}

/**
 * Generate screenshot filename
 * Format: tutorial-CH-STEP-STATE-FRAME.png
 */
function getScreenshotName(
  chapterIndex: number,
  stepIndex: number,
  phase: 'in' | 'rest' | 'out',
  frameNum: number
): string {
  const ch = String(chapterIndex + 1).padStart(2, '0');
  const step = String(stepIndex + 1).padStart(2, '0');
  const frame = String(frameNum).padStart(3, '0');
  return `tutorial-${ch}-${step}-${phase}-${frame}.png`;
}

/**
 * Wait for Three.js scene to be ready
 * Looks for the canvas element and waits for it to have content
 */
async function waitForSceneReady(page: Page): Promise<void> {
  // Wait for canvas element
  await page.waitForSelector('canvas', { timeout: 10000 });

  // Give Three.js time to render initial frame
  await page.waitForTimeout(500);
}

/**
 * Wait for camera animation to complete
 * Camera transitions typically take 1.5-2.5 seconds based on tutorialContent.ts
 */
async function waitForCameraAnimation(page: Page, durationMs: number = 2500): Promise<void> {
  await page.waitForTimeout(durationMs);
}

/**
 * Wait for annotations to fade in
 * Annotations appear with CSS transitions
 */
async function waitForAnnotationFadeIn(page: Page): Promise<void> {
  await page.waitForTimeout(500);
}

/**
 * Navigate to a specific tutorial step using the Zustand store
 * Zustand stores expose getState() for access outside React
 */
async function goToStep(page: Page, chapterIndex: number, stepIndex: number): Promise<void> {
  await page.evaluate(
    ([ch, st]) => {
      // Access Zustand store via window - use getState() for imperative access
      const store = (window as unknown as { __TUTORIAL_STORE__?: { getState: () => { goToStep: (c: number, s: number) => void } } }).__TUTORIAL_STORE__;
      if (store) {
        store.getState().goToStep(ch, st);
      }
    },
    [chapterIndex, stepIndex]
  );

  // Wait for the navigation to take effect
  await page.waitForTimeout(200);
}

/**
 * Start the tutorial from the beginning
 */
async function startTutorial(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as unknown as { __TUTORIAL_STORE__?: { getState: () => { startTutorial: () => void } } }).__TUTORIAL_STORE__;
    if (store) {
      store.getState().startTutorial();
    }
  });
  await page.waitForTimeout(500);
}

/**
 * Advance to the next step
 */
async function nextStep(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as unknown as { __TUTORIAL_STORE__?: { getState: () => { nextStep: () => void } } }).__TUTORIAL_STORE__;
    if (store) {
      store.getState().nextStep();
    }
  });
  await page.waitForTimeout(200);
}

/**
 * Capture frames during transition into a step
 * Captures camera movement, state changes, annotation fade-in
 */
async function captureTransitionIn(
  page: Page,
  chapterIndex: number,
  stepIndex: number,
  options: {
    frameCount?: number;
    intervalMs?: number;
  } = {}
): Promise<string[]> {
  const frameCount = options.frameCount ?? DEFAULT_TRANSITION_FRAMES;
  const intervalMs = options.intervalMs ?? DEFAULT_FRAME_INTERVAL;
  const dir = getStepDir(chapterIndex, stepIndex, 'in');
  const paths: string[] = [];

  for (let i = 1; i <= frameCount; i++) {
    const filename = getScreenshotName(chapterIndex, stepIndex, 'in', i);
    const filepath = path.join(dir, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    paths.push(filepath);
    await page.waitForTimeout(intervalMs);
  }

  return paths;
}

/**
 * Capture frames during steady state
 * Captures orbital cycles, pulse effects, phasor rotation
 */
async function captureSteadyState(
  page: Page,
  chapterIndex: number,
  stepIndex: number,
  options: {
    durationMs?: number;
    intervalMs?: number;
  } = {}
): Promise<string[]> {
  const durationMs = options.durationMs ?? DEFAULT_STEADY_STATE_DURATION;
  const intervalMs = options.intervalMs ?? DEFAULT_FRAME_INTERVAL;
  const frameCount = Math.ceil(durationMs / intervalMs);
  const dir = getStepDir(chapterIndex, stepIndex, 'rest');
  const paths: string[] = [];

  for (let i = 1; i <= frameCount; i++) {
    const filename = getScreenshotName(chapterIndex, stepIndex, 'rest', i);
    const filepath = path.join(dir, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    paths.push(filepath);
    await page.waitForTimeout(intervalMs);
  }

  return paths;
}

/**
 * Capture frames during transition out of a step
 * Captures exit animation, handoff to next step
 */
async function captureTransitionOut(
  page: Page,
  chapterIndex: number,
  stepIndex: number,
  options: {
    frameCount?: number;
    intervalMs?: number;
  } = {}
): Promise<string[]> {
  const frameCount = options.frameCount ?? DEFAULT_TRANSITION_FRAMES;
  const intervalMs = options.intervalMs ?? DEFAULT_FRAME_INTERVAL;
  const dir = getStepDir(chapterIndex, stepIndex, 'out');
  const paths: string[] = [];

  for (let i = 1; i <= frameCount; i++) {
    const filename = getScreenshotName(chapterIndex, stepIndex, 'out', i);
    const filepath = path.join(dir, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    paths.push(filepath);
    await page.waitForTimeout(intervalMs);
  }

  return paths;
}

/**
 * Capture a complete step (all three phases)
 */
async function captureFullStep(
  page: Page,
  chapterIndex: number,
  stepIndex: number,
  options: {
    transitionFrames?: number;
    steadyStateDuration?: number;
    frameInterval?: number;
    cameraDuration?: number;
    skipNavigation?: boolean;
  } = {}
): Promise<{
  in: string[];
  rest: string[];
  out: string[];
}> {
  const cameraDuration = options.cameraDuration ?? 2500;

  // Navigate to step (unless already there)
  if (!options.skipNavigation) {
    await goToStep(page, chapterIndex, stepIndex);
  }

  // Phase 1: Capture transition in (during camera animation)
  const inFrames = await captureTransitionIn(page, chapterIndex, stepIndex, {
    frameCount: options.transitionFrames,
    intervalMs: options.frameInterval,
  });

  // Wait for camera to settle
  await waitForCameraAnimation(page, cameraDuration);
  await waitForAnnotationFadeIn(page);

  // Phase 2: Capture steady state
  const restFrames = await captureSteadyState(page, chapterIndex, stepIndex, {
    durationMs: options.steadyStateDuration,
    intervalMs: options.frameInterval,
  });

  // Phase 3: Capture transition out (before next step)
  const outFrames = await captureTransitionOut(page, chapterIndex, stepIndex, {
    frameCount: options.transitionFrames,
    intervalMs: options.frameInterval,
  });

  return { in: inFrames, rest: restFrames, out: outFrames };
}

/**
 * Get step info for a given global step number (1-42)
 */
function getStepInfo(globalStep: number): { chapterIndex: number; stepIndex: number } {
  let remaining = globalStep;
  for (let ch = 0; ch < CHAPTERS.length; ch++) {
    if (remaining <= CHAPTERS[ch].steps) {
      return { chapterIndex: ch, stepIndex: remaining - 1 };
    }
    remaining -= CHAPTERS[ch].steps;
  }
  // Fallback to last step
  return { chapterIndex: CHAPTERS.length - 1, stepIndex: CHAPTERS[CHAPTERS.length - 1].steps - 1 };
}

// ============================================================================
// Test Definitions
// ============================================================================

test.describe('Tutorial Animation Capture', () => {
  test.beforeEach(async ({ page }) => {
    // Force dark mode color scheme
    await page.emulateMedia({ colorScheme: 'dark' });

    // Dismiss welcome modal and force dark theme via localStorage
    await page.addInitScript(() => {
      localStorage.setItem('welcome-dismissed', 'true');
      localStorage.setItem('theme', 'dark');
    });

    // Navigate to the app
    await page.goto('/');

    // Wait for scene to initialize
    await waitForSceneReady(page);

    // Enable Playwright test mode after page load (for TimeUpdater throttling)
    await page.evaluate(() => {
      (window as Window & { __PLAYWRIGHT_TEST_MODE__?: boolean }).__PLAYWRIGHT_TEST_MODE__ = true;
    });

    // Expose store for programmatic navigation (will be set up in app)
    // The app should expose window.__TUTORIAL_STORE__ = useTutorialStore
  });

  test('capture single step (dev/debug)', async ({ page }) => {
    // Use this test for debugging a specific step
    const CHAPTER = 0; // Chapter 1
    const STEP = 2; // Step 3 (The Tidal Bulge)

    // Capture all console messages to debug infinite loop
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', text);
      } else if (text.includes('[useTutorialEffects]') || text.includes('[TutorialOverlay]')) {
        console.log('DEBUG:', text);
      }
    });
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
    });

    await startTutorial(page);

    // For step 0, no navigation needed
    if (STEP > 0) {
      // Navigate to step by using nextStep() repeatedly
      for (let i = 0; i < STEP; i++) {
        console.log(`Navigating to step ${i + 1}...`);
        await nextStep(page);
        await waitForCameraAnimation(page);
        console.log(`Arrived at step ${i + 1}, waiting for render...`);
      }
      // Extra wait for scene to fully render after navigation
      await page.waitForTimeout(3000);
      console.log('Starting capture...');
    }

    const result = await captureFullStep(page, CHAPTER, STEP, {
      transitionFrames: 10,
      steadyStateDuration: 2000,
      frameInterval: 150, // Original interval restored
      skipNavigation: true,
    });

    console.log(`Captured step ${CHAPTER + 1}.${STEP + 1}:`);
    console.log(`  In: ${result.in.length} frames`);
    console.log(`  Rest: ${result.rest.length} frames`);
    console.log(`  Out: ${result.out.length} frames`);

    expect(result.in.length).toBeGreaterThan(0);
    expect(result.rest.length).toBeGreaterThan(0);
    expect(result.out.length).toBeGreaterThan(0);
  });

  test('capture chapter 1 (Moon Gravity)', async ({ page }) => {
    await startTutorial(page);

    for (let step = 0; step < CHAPTERS[0].steps; step++) {
      console.log(`Capturing Chapter 1, Step ${step + 1}...`);
      const result = await captureFullStep(page, 0, step);
      console.log(`  Total frames: ${result.in.length + result.rest.length + result.out.length}`);
    }
  });

  // Generate tests for each chapter
  for (let ch = 0; ch < CHAPTERS.length; ch++) {
    test(`capture chapter ${ch + 1} (${CHAPTERS[ch].id})`, async ({ page }) => {
      await startTutorial(page);

      for (let step = 0; step < CHAPTERS[ch].steps; step++) {
        console.log(`Capturing Chapter ${ch + 1}, Step ${step + 1}...`);
        const result = await captureFullStep(page, ch, step);
        console.log(`  Total frames: ${result.in.length + result.rest.length + result.out.length}`);
      }
    });
  }

  test('capture all steps sequentially', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes for full capture

    await startTutorial(page);

    let totalFrames = 0;
    for (let ch = 0; ch < CHAPTERS.length; ch++) {
      for (let step = 0; step < CHAPTERS[ch].steps; step++) {
        const stepNum = getStepInfo(totalFrames + 1);
        console.log(`Capturing ${ch + 1}.${step + 1} (global step ${totalFrames + 1}/42)...`);

        const result = await captureFullStep(page, ch, step);
        const frames = result.in.length + result.rest.length + result.out.length;
        totalFrames += frames;

        console.log(`  Frames: ${frames} (running total: ${totalFrames})`);
      }
    }

    console.log(`\nCapture complete! Total frames: ${totalFrames}`);
    expect(totalFrames).toBeGreaterThan(TOTAL_STEPS * 20); // At least 20 frames per step
  });
});

// Export utilities for use in other test files
export {
  CHAPTERS,
  TOTAL_STEPS,
  waitForSceneReady,
  waitForCameraAnimation,
  waitForAnnotationFadeIn,
  goToStep,
  startTutorial,
  nextStep,
  captureTransitionIn,
  captureSteadyState,
  captureTransitionOut,
  captureFullStep,
  getStepInfo,
  getStepDir,
  getScreenshotName,
};
