import { useEffect, useRef } from 'react';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';

interface SceneSnapshot {
  showTidalBulge: boolean;
  tidalExaggeration: number;
  showForceVectors: boolean;
  showOrbits: boolean;
  playing: boolean;
  speed: number;
  visibleConstituents: string[];
  highlightMoon: boolean;
  highlightSun: boolean;
  highlightEarth: boolean;
  pulseEffect: boolean;
}

/**
 * Manages tutorial step effects (scene settings, camera, time).
 * Uses getState() for direct store access to avoid subscription-based re-render loops.
 */
export function useTutorialEffects() {
  const isActive = useTutorialStore((s) => s.isActive);
  const progress = useTutorialStore((s) => s.progress);

  // Store original settings when tutorial starts
  const originalSettings = useRef<SceneSnapshot | null>(null);

  // Track applied step to avoid duplicate runs
  const appliedStep = useRef<string | null>(null);

  // Capture original settings when tutorial starts, restore when it ends
  useEffect(() => {
    if (isActive && !originalSettings.current) {
      // Capture current state without subscribing
      const scene = useSceneStore.getState();
      const time = useTimeStore.getState();
      const harmonics = useHarmonicsStore.getState();

      originalSettings.current = {
        showTidalBulge: scene.showTidalBulge,
        tidalExaggeration: scene.tidalExaggeration,
        showForceVectors: scene.showForceVectors,
        showOrbits: scene.showOrbits,
        playing: time.playing,
        speed: time.speed,
        visibleConstituents: [...harmonics.visibleConstituents],
        highlightMoon: scene.highlightMoon,
        highlightSun: scene.highlightSun,
        highlightEarth: scene.highlightEarth,
        pulseEffect: scene.pulseEffect,
      };
    }

    // Restore settings when tutorial ends
    if (!isActive && originalSettings.current) {
      const orig = originalSettings.current;
      const scene = useSceneStore.getState();
      const time = useTimeStore.getState();

      // Restore scene settings
      if (scene.showTidalBulge !== orig.showTidalBulge) {
        useSceneStore.getState().toggleTidalBulge();
      }
      useSceneStore.getState().setTidalExaggeration(orig.tidalExaggeration);
      if (scene.showForceVectors !== orig.showForceVectors) {
        useSceneStore.getState().toggleForceVectors();
      }
      if (scene.showOrbits !== orig.showOrbits) {
        useSceneStore.getState().toggleOrbits();
      }
      useSceneStore.getState().setHighlightMoon(orig.highlightMoon);
      useSceneStore.getState().setHighlightSun(orig.highlightSun);
      useSceneStore.getState().setHighlightEarth(orig.highlightEarth);
      useSceneStore.getState().setPulseEffect(orig.pulseEffect);

      // Restore time settings
      if (orig.playing) {
        useTimeStore.getState().play();
      } else {
        useTimeStore.getState().pause();
      }
      useTimeStore.getState().setSpeed(orig.speed);

      // Restore harmonics
      useHarmonicsStore.getState().setAllConstituentsVisible(orig.visibleConstituents);

      originalSettings.current = null;
    }
  }, [isActive]);

  // Apply step-specific settings when step changes
  useEffect(() => {
    console.log('[useTutorialEffects] Effect triggered, isActive:', isActive, 'progress:', progress.chapterIndex, progress.stepIndex);

    if (!isActive) {
      appliedStep.current = null;
      return;
    }

    const stepId = `${progress.chapterIndex}-${progress.stepIndex}`;
    if (stepId === appliedStep.current) {
      console.log('[useTutorialEffects] Skipping - already applied:', stepId);
      return; // Already applied
    }
    console.log('[useTutorialEffects] Applying step:', stepId);
    appliedStep.current = stepId;

    const current = useTutorialStore.getState().getCurrentStep();
    if (!current) return;

    const { step } = current;

    // Get store actions via getState() to avoid subscription loops
    const sceneActions = useSceneStore.getState();
    const timeActions = useTimeStore.getState();
    const harmonicsActions = useHarmonicsStore.getState();

    // Apply tidal bulge visibility
    if (step.showTidalBulge !== undefined) {
      sceneActions.setShowTidalBulge(step.showTidalBulge);
    }

    // Apply force vectors visibility
    if (step.showForceVectors !== undefined) {
      sceneActions.setShowForceVectors(step.showForceVectors);
    }

    // Apply orbit visibility
    if (step.showOrbits !== undefined) {
      sceneActions.setShowOrbits(step.showOrbits);
    }

    // Apply time speed (0 means pause)
    if (step.timeSpeed !== undefined) {
      console.log('[useTutorialEffects] Setting time speed:', step.timeSpeed);
      if (step.timeSpeed === 0) {
        timeActions.pause();
      } else {
        timeActions.setSpeed(step.timeSpeed);
        timeActions.play();
      }
      console.log('[useTutorialEffects] Time speed applied');
    }

    // Apply tidal exaggeration
    if (step.tidalExaggeration !== undefined) {
      sceneActions.setTidalExaggeration(step.tidalExaggeration);
    }

    // Apply constituent visibility
    if (step.highlightConstituents) {
      harmonicsActions.setAllConstituentsVisible(step.highlightConstituents);
    }

    // Apply highlight effects
    sceneActions.setHighlightMoon(step.highlightMoon ?? false);
    sceneActions.setHighlightSun(step.highlightSun ?? false);
    sceneActions.setHighlightEarth(step.highlightEarth ?? false);
    sceneActions.setPulseEffect(step.pulseEffect ?? false);
  }, [isActive, progress.chapterIndex, progress.stepIndex]);
}
