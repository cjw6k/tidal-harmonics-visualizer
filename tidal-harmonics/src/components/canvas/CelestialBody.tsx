import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import type { Mesh } from 'three';
import type { CelestialBodyProps } from '@/types';

export function CelestialBody({
  radius,
  position,
  textureUrl,
  emissive = false,
  emissiveIntensity = 1,
  rotationSpeed = 0,
}: CelestialBodyProps) {
  const meshRef = useRef<Mesh>(null);
  const texture = useLoader(TextureLoader, textureUrl);

  useFrame((_, delta) => {
    if (meshRef.current && rotationSpeed !== 0) {
      meshRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius, 64, 64]} />
      {emissive ? (
        <meshBasicMaterial map={texture} />
      ) : (
        <meshStandardMaterial
          map={texture}
          emissive={emissive ? '#ffffff' : '#000000'}
          emissiveIntensity={emissive ? emissiveIntensity : 0}
        />
      )}
    </mesh>
  );
}
