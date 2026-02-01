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

export function useTutorialEffects() {
  const isActive = useTutorialStore((s) => s.isActive);
  const getCurrentStep = useTutorialStore((s) => s.getCurrentStep);

  // Scene store actions
  const setTidalExaggeration = useSceneStore((s) => s.setTidalExaggeration);
  const toggleTidalBulge = useSceneStore((s) => s.toggleTidalBulge);
  const toggleForceVectors = useSceneStore((s) => s.toggleForceVectors);
  const toggleOrbits = useSceneStore((s) => s.toggleOrbits);
  const showTidalBulge = useSceneStore((s) => s.showTidalBulge);
  const showForceVectors = useSceneStore((s) => s.showForceVectors);
  const showOrbits = useSceneStore((s) => s.showOrbits);
  const tidalExaggeration = useSceneStore((s) => s.tidalExaggeration);
  const highlightMoon = useSceneStore((s) => s.highlightMoon);
  const highlightSun = useSceneStore((s) => s.highlightSun);
  const highlightEarth = useSceneStore((s) => s.highlightEarth);
  const pulseEffect = useSceneStore((s) => s.pulseEffect);
  const setHighlightMoon = useSceneStore((s) => s.setHighlightMoon);
  const setHighlightSun = useSceneStore((s) => s.setHighlightSun);
  const setHighlightEarth = useSceneStore((s) => s.setHighlightEarth);
  const setPulseEffect = useSceneStore((s) => s.setPulseEffect);

  // Time store actions
  const play = useTimeStore((s) => s.play);
  const pause = useTimeStore((s) => s.pause);
  const setSpeed = useTimeStore((s) => s.setSpeed);
  const playing = useTimeStore((s) => s.playing);
  const speed = useTimeStore((s) => s.speed);

  // Harmonics store
  const visibleConstituents = useHarmonicsStore((s) => s.visibleConstituents);
  const setAllConstituentsVisible = useHarmonicsStore((s) => s.setAllConstituentsVisible);

  // Store original settings when tutorial starts
  const originalSettings = useRef<SceneSnapshot | null>(null);

  // Capture original settings when tutorial starts
  useEffect(() => {
    if (isActive && !originalSettings.current) {
      originalSettings.current = {
        showTidalBulge,
        tidalExaggeration,
        showForceVectors,
        showOrbits,
        playing,
        speed,
        visibleConstituents: [...visibleConstituents],
        highlightMoon,
        highlightSun,
        highlightEarth,
        pulseEffect,
      };
    }

    // Restore settings when tutorial ends
    if (!isActive && originalSettings.current) {
      const orig = originalSettings.current;

      if (showTidalBulge !== orig.showTidalBulge) toggleTidalBulge();
      setTidalExaggeration(orig.tidalExaggeration);
      if (showForceVectors !== orig.showForceVectors) toggleForceVectors();
      if (showOrbits !== orig.showOrbits) toggleOrbits();
      if (orig.playing) play();
      else pause();
      setSpeed(orig.speed);
      setAllConstituentsVisible(orig.visibleConstituents);
      setHighlightMoon(orig.highlightMoon);
      setHighlightSun(orig.highlightSun);
      setHighlightEarth(orig.highlightEarth);
      setPulseEffect(orig.pulseEffect);

      originalSettings.current = null;
    }
  }, [isActive]);

  // Get current step info for dependency
  const progress = useTutorialStore((s) => s.progress);

  // Apply step-specific settings
  useEffect(() => {
    if (!isActive) return;

    const current = getCurrentStep();
    if (!current) return;

    const { step } = current;

    // Apply tidal bulge visibility
    if (step.showTidalBulge !== undefined) {
      if (step.showTidalBulge && !showTidalBulge) toggleTidalBulge();
      if (!step.showTidalBulge && showTidalBulge) toggleTidalBulge();
    }

    // Apply force vectors visibility
    if (step.showForceVectors !== undefined) {
      if (step.showForceVectors && !showForceVectors) toggleForceVectors();
      if (!step.showForceVectors && showForceVectors) toggleForceVectors();
    }

    // Apply orbit visibility
    if (step.showOrbits !== undefined) {
      if (step.showOrbits && !showOrbits) toggleOrbits();
      if (!step.showOrbits && showOrbits) toggleOrbits();
    }

    // Apply time speed (0 means pause)
    if (step.timeSpeed !== undefined) {
      if (step.timeSpeed === 0) {
        pause();
      } else {
        setSpeed(step.timeSpeed);
        play();
      }
    }

    // Apply tidal exaggeration
    if (step.tidalExaggeration !== undefined) {
      setTidalExaggeration(step.tidalExaggeration);
    }

    // Apply constituent visibility
    if (step.highlightConstituents) {
      setAllConstituentsVisible(step.highlightConstituents);
    }

    // Apply highlight effects
    setHighlightMoon(step.highlightMoon ?? false);
    setHighlightSun(step.highlightSun ?? false);
    setHighlightEarth(step.highlightEarth ?? false);
    setPulseEffect(step.pulseEffect ?? false);
  }, [isActive, progress.chapterIndex, progress.stepIndex]);
}
