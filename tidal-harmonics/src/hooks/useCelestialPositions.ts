import { useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useSceneStore } from '@/stores/sceneStore';
import { getMoonPosition, getSunPosition } from '@/lib/ephemeris';
import { scalePosition } from '@/lib/scalePosition';

export function useCelestialPositions() {
  const epoch = useTimeStore((s) => s.epoch);
  const scaleMode = useSceneStore((s) => s.scaleMode);

  return useMemo(() => {
    const date = new Date(epoch);

    const moonRaw = getMoonPosition(date);
    const sunRaw = getSunPosition(date);

    return {
      earth: [0, 0, 0] as [number, number, number],
      moon: scalePosition(moonRaw, scaleMode),
      sun: scalePosition(sunRaw, scaleMode),
      // Raw positions for physics calculations (in km)
      moonRaw,
      sunRaw,
    };
  }, [epoch, scaleMode]);
}
