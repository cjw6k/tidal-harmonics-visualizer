import { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCameraStore, CAMERA_PRESET_CONFIGS } from '@/stores/cameraStore';
import { useCelestialPositions } from '@/hooks/useCelestialPositions';

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const preset = useCameraStore((s) => s.preset);
  const isTransitioning = useCameraStore((s) => s.isTransitioning);
  const setTransitioning = useCameraStore((s) => s.setTransitioning);

  const { earth, moon, sun } = useCelestialPositions();
  const presetConfig = CAMERA_PRESET_CONFIGS[preset];

  // Compute actual target position based on which body we're viewing
  const targetBodyPosition = useMemo(() => {
    switch (preset) {
      case 'moon':
        return new Vector3(...moon);
      case 'sun':
        return new Vector3(...sun);
      case 'earth':
      case 'overview':
      default:
        return new Vector3(...earth);
    }
  }, [preset, earth, moon, sun]);

  // Camera position = body position + offset
  const targetCameraPosition = useMemo(() => {
    const offset = new Vector3(...presetConfig.offset);
    return targetBodyPosition.clone().add(offset);
  }, [targetBodyPosition, presetConfig.offset]);

  useEffect(() => {
    if (presetConfig?.fov !== undefined && camera instanceof PerspectiveCamera) {
      camera.fov = presetConfig.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, presetConfig]);

  useFrame(() => {
    if (!controlsRef.current) return;

    if (isTransitioning) {
      camera.position.lerp(targetCameraPosition, 0.05);
      controlsRef.current.target.lerp(targetBodyPosition, 0.05);

      const positionDistance = camera.position.distanceTo(targetCameraPosition);
      const targetDistance = controlsRef.current.target.distanceTo(targetBodyPosition);

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
