import { useSceneStore } from '@/stores/sceneStore';
import { REALISTIC_SCALE, EXAGGERATED_SCALE } from '@/lib/constants';

export function useScene() {
  const store = useSceneStore();

  const scale =
    store.scaleMode === 'realistic' ? REALISTIC_SCALE : EXAGGERATED_SCALE;

  return {
    ...store,
    scale,
  };
}
