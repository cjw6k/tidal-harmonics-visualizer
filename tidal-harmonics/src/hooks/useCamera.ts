import { useCameraStore } from '@/stores/cameraStore';

export function useCamera() {
  const store = useCameraStore();

  const currentPresetConfig = store.presets[store.preset];

  return {
    ...store,
    currentPresetConfig,
  };
}
