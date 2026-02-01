import { useTimeStore } from '@/stores/timeStore';
import { unixToJulian } from '@/lib/julian';

export function useTime() {
  const store = useTimeStore();

  return {
    ...store,
    julianDate: unixToJulian(store.epoch),
    date: new Date(store.epoch),
    isoString: new Date(store.epoch).toISOString(),
  };
}
