import { useEffect, useRef } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';

/**
 * Syncs selected station with URL hash for deep linking
 * Enables sharing URLs like: https://app.com/#station=san-francisco
 * Supports additional params: constituents, time
 */
export function useUrlSync() {
  const { selectedStation, selectStation, stations, setAllConstituentsVisible } = useHarmonicsStore();
  const setDate = useTimeStore((s) => s.setDate);
  const isInitialLoad = useRef(true);

  // On mount, check URL for parameters
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove #
    const params = new URLSearchParams(hash);

    // Handle station
    const stationId = params.get('station');
    if (stationId) {
      const stationExists = stations.some((s) => s.id === stationId);
      if (stationExists) {
        selectStation(stationId);
      }
    }

    // Handle constituents
    const constituentsParam = params.get('constituents');
    if (constituentsParam) {
      const constituents = constituentsParam.split(',').filter(Boolean);
      if (constituents.length > 0) {
        setAllConstituentsVisible(constituents);
      }
    }

    // Handle time
    const timeParam = params.get('time');
    if (timeParam) {
      const time = new Date(timeParam);
      if (!isNaN(time.getTime())) {
        setDate(time);
      }
    }

    isInitialLoad.current = false;
  }, [stations, selectStation, setAllConstituentsVisible, setDate]);

  // Update URL when station changes (but not on initial load)
  useEffect(() => {
    if (isInitialLoad.current || !selectedStation) return;

    // Use replaceState to avoid polluting browser history
    const newHash = `station=${selectedStation.id}`;
    const newUrl = `${window.location.pathname}#${newHash}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedStation]);

  // Listen for popstate events (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const stationId = params.get('station');

      if (stationId) {
        const stationExists = stations.some((s) => s.id === stationId);
        if (stationExists) {
          selectStation(stationId);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [stations, selectStation]);
}

/**
 * Returns a shareable URL for the current station
 */
export function getShareableUrl(): string {
  return window.location.href;
}

/**
 * Copies current station URL to clipboard
 */
export async function copyStationUrl(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getShareableUrl());
    return true;
  } catch {
    return false;
  }
}
