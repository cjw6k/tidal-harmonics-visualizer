import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { useTimeStore } from '@/stores/timeStore';
import { useSceneStore } from '@/stores/sceneStore';
import { Earth } from './Earth';
import { TidalEarth } from './TidalEarth';
import { Moon } from './Moon';
import { Sun } from './Sun';
import { Lighting } from './Lighting';
import { CameraController } from './CameraController';
import { MoonOrbitPath } from './OrbitPath';
import { ForceField } from './ForceField';
import { AnnotationLayer } from '../tutorial/AnnotationLayer';
import { useTutorialCamera } from '@/hooks/useTutorialCamera';

function TimeUpdater() {
  const tick = useTimeStore((s) => s.tick);
  const playing = useTimeStore((s) => s.playing);

  useFrame((_, delta) => {
    if (playing) {
      tick(delta * 1000);
    }
  });

  return null;
}

function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#444" wireframe />
    </mesh>
  );
}

function EarthWithTides() {
  const showTidalBulge = useSceneStore((s) => s.showTidalBulge);
  return showTidalBulge ? <TidalEarth /> : <Earth />;
}

function TutorialCameraController() {
  useTutorialCamera();
  return null;
}

function SceneContent() {
  const showOrbits = useSceneStore((s) => s.showOrbits);
  const showForceVectors = useSceneStore((s) => s.showForceVectors);

  return (
    <>
      <TimeUpdater />
      <TutorialCameraController />
      <Lighting />
      <CameraController />
      <Suspense fallback={<Loader />}>
        <EarthWithTides />
        <Moon />
        <Sun />
        {showOrbits && <MoonOrbitPath />}
        {showForceVectors && <ForceField />}
        <AnnotationLayer />
      </Suspense>
    </>
  );
}

export function Scene() {
  return (
    <Canvas
      camera={{
        position: [50, 30, 50],
        fov: 60,
        near: 0.1,
        far: 20000,
      }}
      style={{ background: '#0a0a0f' }}
    >
      <SceneContent />
    </Canvas>
  );
}
