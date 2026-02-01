import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import type { Mesh } from 'three';
import { useScene } from '@/hooks/useScene';
import { useTimeStore } from '@/stores/timeStore';
import { TEXTURE_URLS, ROTATION_SPEEDS } from '@/lib/constants';

export function Moon() {
  const meshRef = useRef<Mesh>(null);
  const { scale } = useScene();
  const playing = useTimeStore((s) => s.playing);
  const speed = useTimeStore((s) => s.speed);

  const texture = useLoader(TextureLoader, TEXTURE_URLS.moon.surface2k);

  useFrame((_, delta) => {
    if (meshRef.current && playing) {
      meshRef.current.rotation.y += ROTATION_SPEEDS.MOON * delta * speed;
    }
  });

  return (
    <mesh ref={meshRef} position={[scale.MOON_DISTANCE, 0, 0]}>
      <sphereGeometry args={[scale.MOON_RADIUS, 32, 32]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
