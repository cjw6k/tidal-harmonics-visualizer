import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { useTimeStore } from '@/stores/timeStore';
import { useSceneStore } from '@/stores/sceneStore';
import { Earth } from './Earth';
import { TidalEarth } from './TidalEarth';
import { Moon } from './Moon';
import { Sun } from './Sun';
import { Planets } from './Planets';
import { Starfield } from './Starfield';
import { Lighting } from './Lighting';
import { CameraController } from './CameraController';
import { MoonOrbitPath } from './OrbitPath';
import { ForceField } from './ForceField';
import { AnnotationLayer } from '../tutorial/AnnotationLayer';
import { HighlightRing, PulsingGlow } from './HighlightRing';
import { useSmoothCamera } from '@/hooks/useSmoothCamera';
import { useCelestialPositions } from '@/hooks/useCelestialPositions';
import { useScene } from '@/hooks/useScene';

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
  useSmoothCamera();
  return null;
}

function CelestialHighlights() {
  const { moon } = useCelestialPositions();
  const { scale } = useScene();
  const highlightMoon = useSceneStore((s) => s.highlightMoon);
  const highlightEarth = useSceneStore((s) => s.highlightEarth);
  const pulseEffect = useSceneStore((s) => s.pulseEffect);

  return (
    <>
      <HighlightRing
        position={moon}
        radius={scale.MOON_RADIUS}
        color="#60a5fa"
        visible={highlightMoon}
      />
      <PulsingGlow
        position={[0, 0, 0]}
        radius={scale.EARTH_RADIUS}
        color="#22d3ee"
        visible={highlightEarth || pulseEffect}
      />
    </>
  );
}

function SceneContent() {
  const showOrbits = useSceneStore((s) => s.showOrbits);
  const showForceVectors = useSceneStore((s) => s.showForceVectors);
  const showPlanets = useSceneStore((s) => s.showPlanets);
  const showStarfield = useSceneStore((s) => s.showStarfield);

  return (
    <>
      <TimeUpdater />
      <TutorialCameraController />
      {showStarfield && <Starfield />}
      <Lighting />
      <CameraController />
      <Suspense fallback={<Loader />}>
        <EarthWithTides />
        <Moon />
        <Sun />
        {showPlanets && <Planets />}
        {showOrbits && <MoonOrbitPath />}
        {showForceVectors && <ForceField />}
        <CelestialHighlights />
        <AnnotationLayer />
      </Suspense>
    </>
  );
}

interface SceneProps {
  id?: string;
}

export function Scene({ id }: SceneProps) {
  return (
    <main id={id} className="w-full h-full" tabIndex={-1}>
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
    </main>
  );
}
