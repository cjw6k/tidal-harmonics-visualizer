import { useEffect, useRef } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';

/**
 * Syncs selected station with URL hash for deep linking
 * Enables sharing URLs like: https://app.com/#station=san-francisco
 */
export function useUrlSync() {
  const { selectedStation, selectStation, stations } = useHarmonicsStore();
  const isInitialLoad = useRef(true);

  // On mount, check URL for station parameter
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove #
    const params = new URLSearchParams(hash);
    const stationId = params.get('station');

    if (stationId) {
      // Validate station exists before selecting
      const stationExists = stations.some((s) => s.id === stationId);
      if (stationExists) {
        selectStation(stationId);
      }
    }

    isInitialLoad.current = false;
  }, [stations, selectStation]);

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
