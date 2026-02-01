import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useTutorialStore } from '@/stores/tutorialStore';

// Smooth easing with second-order continuity
function smootherstep(x: number): number {
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function useSmoothCamera() {
  const { camera } = useThree();
  const isActive = useTutorialStore((s) => s.isActive);
  const progress = useTutorialStore((s) => s.progress);

  // Animation state
  const animating = useRef(false);
  const startPos = useRef(new Vector3());
  const endPos = useRef(new Vector3());
  const startTarget = useRef(new Vector3());
  const endTarget = useRef(new Vector3());
  const currentTarget = useRef(new Vector3(0, 0, 0));
  const startTime = useRef(0);
  const duration = useRef(2000);

  // Track previous step to detect changes
  const prevStep = useRef<string | null>(null);

  useEffect(() => {
    if (!isActive) {
      prevStep.current = null;
      return;
    }

    // Use getState() to avoid dependency on getCurrentStep which might change
    const current = useTutorialStore.getState().getCurrentStep();
    if (!current?.step.camera) return;

    const stepId = `${progress.chapterIndex}-${progress.stepIndex}`;
    if (stepId === prevStep.current) return;
    prevStep.current = stepId;

    const { position, target, duration: dur } = current.step.camera;

    // Set up animation (camera is a stable ref from Three.js)
    startPos.current.copy(camera.position);
    endPos.current.set(position[0], position[1], position[2]);
    startTarget.current.copy(currentTarget.current);
    endTarget.current.set(target[0], target[1], target[2]);
    startTime.current = performance.now();
    duration.current = dur * 1000;
    animating.current = true;
    // Note: camera excluded from deps - it's a stable ref from useThree()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, progress.chapterIndex, progress.stepIndex]);

  useFrame(() => {
    if (!animating.current) {
      // Keep looking at target even when not animating
      camera.lookAt(currentTarget.current);
      return;
    }

    const elapsed = performance.now() - startTime.current;
    const t = Math.min(elapsed / duration.current, 1);
    const eased = smootherstep(t);

    // Interpolate position
    camera.position.lerpVectors(startPos.current, endPos.current, eased);

    // Interpolate look-at target
    currentTarget.current.lerpVectors(startTarget.current, endTarget.current, eased);
    camera.lookAt(currentTarget.current);

    if (t >= 1) {
      animating.current = false;
    }
  });

  return { isAnimating: animating.current };
}
