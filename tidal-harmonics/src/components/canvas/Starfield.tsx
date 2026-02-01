import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import type { Points } from 'three';

export function Starfield() {
  const starsRef = useRef<Points>(null);

  // Slow rotation for subtle movement
  useFrame((_, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.005;
      starsRef.current.rotation.x += delta * 0.002;
    }
  });

  return (
    <Stars
      ref={starsRef}
      radius={5000}
      depth={2000}
      count={8000}
      factor={6}
      saturation={0.1}
      fade
      speed={0.5}
    />
  );
}
