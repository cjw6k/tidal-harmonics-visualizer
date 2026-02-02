import { useCameraStore, CAMERA_PRESET_CONFIGS } from '@/stores/cameraStore';

export function useCamera() {
  const store = useCameraStore();

  const currentPresetConfig = CAMERA_PRESET_CONFIGS[store.preset];

  return {
    ...store,
    currentPresetConfig,
  };
}
