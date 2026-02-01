import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useTutorialStore } from '@/stores/tutorialStore';

export function useTutorialCamera() {
  const { camera } = useThree();
  const isActive = useTutorialStore((s) => s.isActive);
  const getCurrentStep = useTutorialStore((s) => s.getCurrentStep);

  const animationRef = useRef<number | null>(null);
  const startPosRef = useRef(new Vector3());
  const targetPosRef = useRef(new Vector3());
  const startTimeRef = useRef(0);
  const durationRef = useRef(1);

  useEffect(() => {
    if (!isActive) return;

    const current = getCurrentStep();
    if (!current?.step.camera) return;

    const { position, target, duration } = current.step.camera;

    // Store starting position
    startPosRef.current.copy(camera.position);
    targetPosRef.current.set(position[0], position[1], position[2]);
    startTimeRef.current = performance.now();
    durationRef.current = duration * 1000; // Convert to ms

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = () => {
      const elapsed = performance.now() - startTimeRef.current;
      const progress = Math.min(elapsed / durationRef.current, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPosRef.current, targetPosRef.current, eased);
      camera.lookAt(target[0], target[1], target[2]);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, getCurrentStep, camera]);
}
