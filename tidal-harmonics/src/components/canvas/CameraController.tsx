import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCameraStore } from '@/stores/cameraStore';

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const preset = useCameraStore((s) => s.preset);
  const presets = useCameraStore((s) => s.presets);
  const isTransitioning = useCameraStore((s) => s.isTransitioning);
  const setTransitioning = useCameraStore((s) => s.setTransitioning);

  const targetPreset = presets[preset];

  useEffect(() => {
    if (targetPreset?.fov !== undefined && camera instanceof PerspectiveCamera) {
      camera.fov = targetPreset.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, targetPreset]);

  useFrame(() => {
    if (!controlsRef.current) return;

    if (isTransitioning) {
      const targetPosition = new Vector3(...targetPreset.position);
      const targetTarget = new Vector3(...targetPreset.target);

      camera.position.lerp(targetPosition, 0.05);
      controlsRef.current.target.lerp(targetTarget, 0.05);

      const positionDistance = camera.position.distanceTo(targetPosition);
      const targetDistance = controlsRef.current.target.distanceTo(targetTarget);

      if (positionDistance < 0.1 && targetDistance < 0.1) {
        setTransitioning(false);
      }
    }

    // Always update controls to keep them in sync
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={1}
      maxDistance={500}
      dampingFactor={0.05}
      enableDamping={true}
    />
  );
}
