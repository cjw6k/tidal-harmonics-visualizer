import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { useTimeStore } from '@/stores/timeStore';
import { Earth } from './Earth';
import { Moon } from './Moon';
import { Sun } from './Sun';
import { Lighting } from './Lighting';
import { CameraController } from './CameraController';

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

function SceneContent() {
  return (
    <>
      <TimeUpdater />
      <Lighting />
      <CameraController />
      <Suspense fallback={<Loader />}>
        <Earth />
        <Moon />
        <Sun />
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
