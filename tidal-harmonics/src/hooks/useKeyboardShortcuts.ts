import { useEffect } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';

/**
 * Global keyboard shortcuts for the application
 *
 * Time controls:
 * - Space: Play/Pause
 * - 1-5: Set time speed presets
 * - R: Reset to current time
 *
 * View toggles:
 * - O: Toggle orbits
 * - T: Toggle tidal bulge
 * - F: Toggle force vectors
 *
 * Harmonics panel:
 * - P: Toggle phasor diagram
 * - C: Toggle tide curve
 * - U: Toggle metric/imperial units
 *
 * Tutorial:
 * - ?: Start tutorial
 * - Escape: Exit tutorial
 */
export function useKeyboardShortcuts() {
  const play = useTimeStore((s) => s.play);
  const pause = useTimeStore((s) => s.pause);
  const playing = useTimeStore((s) => s.playing);
  const setSpeed = useTimeStore((s) => s.setSpeed);
  const resetToNow = useTimeStore((s) => s.resetToNow);

  const toggleOrbits = useSceneStore((s) => s.toggleOrbits);
  const toggleTidalBulge = useSceneStore((s) => s.toggleTidalBulge);
  const toggleForceVectors = useSceneStore((s) => s.toggleForceVectors);

  const isActive = useTutorialStore((s) => s.isActive);
  const startTutorial = useTutorialStore((s) => s.startTutorial);
  const exitTutorial = useTutorialStore((s) => s.exitTutorial);

  const togglePhasorDiagram = useHarmonicsStore((s) => s.togglePhasorDiagram);
  const toggleTideCurve = useHarmonicsStore((s) => s.toggleTideCurve);
  const toggleUnitSystem = useHarmonicsStore((s) => s.toggleUnitSystem);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Skip if tutorial is active (it has its own handlers)
      if (isActive && !['?', 'Escape'].includes(e.key)) {
        return;
      }

      switch (e.key) {
        // Time controls
        case ' ':
          e.preventDefault();
          if (playing) pause();
          else play();
          break;

        case '1':
          setSpeed(1); // Real time
          break;

        case '2':
          setSpeed(3600); // 1 hour/sec
          break;

        case '3':
          setSpeed(86400); // 1 day/sec
          break;

        case '4':
          setSpeed(604800); // 1 week/sec
          break;

        case '5':
          setSpeed(2592000); // 30 days/sec
          break;

        case 'r':
        case 'R':
          resetToNow();
          break;

        // View toggles
        case 'o':
        case 'O':
          toggleOrbits();
          break;

        case 't':
        case 'T':
          if (!isActive) toggleTidalBulge();
          break;

        case 'f':
        case 'F':
          toggleForceVectors();
          break;

        // Harmonics panel
        case 'p':
        case 'P':
          togglePhasorDiagram();
          break;

        case 'c':
        case 'C':
          toggleTideCurve();
          break;

        case 'u':
        case 'U':
          toggleUnitSystem();
          break;

        // Tutorial
        case '?':
          if (!isActive) startTutorial();
          break;

        case 'Escape':
          if (isActive) exitTutorial();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    playing,
    play,
    pause,
    setSpeed,
    resetToNow,
    toggleOrbits,
    toggleTidalBulge,
    toggleForceVectors,
    togglePhasorDiagram,
    toggleTideCurve,
    toggleUnitSystem,
    isActive,
    startTutorial,
    exitTutorial,
  ]);
}

/**
 * Display available keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = [
  { category: 'Time', shortcuts: [
    { key: 'Space', action: 'Play/Pause' },
    { key: '1-5', action: 'Time speed presets' },
    { key: 'R', action: 'Reset to now' },
  ]},
  { category: 'View', shortcuts: [
    { key: 'O', action: 'Toggle orbits' },
    { key: 'T', action: 'Toggle tidal bulge' },
    { key: 'F', action: 'Toggle force vectors' },
  ]},
  { category: 'Harmonics', shortcuts: [
    { key: 'P', action: 'Toggle phasor diagram' },
    { key: 'C', action: 'Toggle tide curve' },
    { key: 'U', action: 'Toggle metric/imperial' },
  ]},
  { category: 'Tutorial', shortcuts: [
    { key: '?', action: 'Start tutorial' },
    { key: 'Esc', action: 'Exit tutorial' },
    { key: '← →', action: 'Navigate steps' },
  ]},
];
