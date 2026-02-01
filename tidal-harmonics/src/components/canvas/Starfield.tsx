import { Stars } from '@react-three/drei';

export function Starfield() {
  return (
    <Stars
      radius={8000}
      depth={1000}
      count={3000}
      factor={2}
      saturation={0}
      fade
      speed={0}
    />
  );
}
