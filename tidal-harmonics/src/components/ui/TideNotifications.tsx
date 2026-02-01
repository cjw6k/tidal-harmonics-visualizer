import { useState, useEffect, useCallback } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';

type NotificationSettings = {
  enabled: boolean;
  highTide: boolean;
  lowTide: boolean;
  minutesBefore: number;
  stationId: string | null;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  highTide: true,
  lowTide: true,
  minutesBefore: 30,
  stationId: null,
};

function loadSettings(): NotificationSettings {
  try {
    const stored = localStorage.getItem('tide-notifications');
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: NotificationSettings) {
  localStorage.setItem('tide-notifications', JSON.stringify(settings));
}

export function TideNotifications() {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const epoch = useTimeStore((s) => s.epoch);
  const [settings, setSettings] = useState<NotificationSettings>(loadSettings);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [showSettings, setShowSettings] = useState(false);
  const [lastNotifiedEvent, setLastNotifiedEvent] = useState<string | null>(null);

  // Check notification support and permission
  useEffect(() => {
    if (!('Notification' in window)) {
      setPermissionState('unsupported');
      return;
    }
    setPermissionState(Notification.permission);
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setPermissionState(permission);
    if (permission === 'granted') {
      updateSettings({ enabled: true });
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  // Toggle notifications for current station
  const toggleNotifications = useCallback(() => {
    if (permissionState === 'default') {
      requestPermission();
      return;
    }
    if (permissionState === 'denied') {
      alert('Notifications are blocked. Please enable them in your browser settings.');
      return;
    }
    if (settings.enabled && settings.stationId === selectedStation?.id) {
      updateSettings({ enabled: false, stationId: null });
    } else {
      updateSettings({ enabled: true, stationId: selectedStation?.id || null });
    }
  }, [permissionState, settings, selectedStation, requestPermission, updateSettings]);

  // Check for upcoming tides and notify
  useEffect(() => {
    if (!settings.enabled || !selectedStation || settings.stationId !== selectedStation.id) {
      return;
    }
    if (permissionState !== 'granted') return;

    // Predict tides for next 6 hours
    const now = new Date(epoch);
    const endTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const series = predictTideSeries(selectedStation, now, endTime, 6);
    const extremes = findExtremes(series);

    // Find next tide events within notification window
    for (const extreme of extremes) {
      const isHigh = extreme.type === 'high';
      if ((isHigh && !settings.highTide) || (!isHigh && !settings.lowTide)) {
        continue;
      }

      const eventTime = extreme.time;
      const msUntil = eventTime.getTime() - now.getTime();
      const minutesUntil = Math.round(msUntil / (1000 * 60));

      // Skip events in the past or too far in the future
      if (minutesUntil <= 0 || minutesUntil > settings.minutesBefore) {
        continue;
      }

      const eventKey = `${eventTime.toISOString()}-${extreme.type}`;
      if (lastNotifiedEvent === eventKey) continue;

      const title = isHigh ? 'High Tide Coming' : 'Low Tide Coming';
      const body = `${selectedStation.name}: ${isHigh ? 'High' : 'Low'} tide in ${minutesUntil} minutes (${extreme.height.toFixed(2)}m)`;

      new Notification(title, {
        body,
        icon: '/icon-192.png',
        tag: eventKey,
        requireInteraction: false,
      });

      setLastNotifiedEvent(eventKey);
      break; // Only one notification per check
    }
  }, [epoch, selectedStation, settings, permissionState, lastNotifiedEvent]);

  // Don't render if notifications not supported
  if (permissionState === 'unsupported') return null;

  const isActiveForStation = settings.enabled && settings.stationId === selectedStation?.id;

  return (
    <div className="relative">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`p-2 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
          isActiveForStation
            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
            : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-cyan-400'
        }`}
        title={isActiveForStation ? 'Tide notifications active' : 'Enable tide notifications'}
        aria-label="Tide notifications"
        aria-pressed={isActiveForStation}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {isActiveForStation && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full" />
        )}
      </button>

      {showSettings && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl z-50">
          <div className="text-sm font-medium text-white mb-3">Tide Notifications</div>

          {permissionState === 'denied' && (
            <div className="text-xs text-red-400 mb-3">
              Notifications are blocked. Enable them in browser settings.
            </div>
          )}

          {permissionState === 'default' && (
            <button
              onClick={requestPermission}
              className="w-full mb-3 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded transition-colors"
            >
              Enable Notifications
            </button>
          )}

          {permissionState === 'granted' && (
            <>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActiveForStation}
                  onChange={toggleNotifications}
                  className="rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-400"
                />
                <span className="text-sm text-slate-300">
                  Notify for {selectedStation?.name || 'selected station'}
                </span>
              </label>

              {isActiveForStation && (
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.highTide}
                      onChange={(e) => updateSettings({ highTide: e.target.checked })}
                      className="rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-400"
                    />
                    <span className="text-sm text-slate-300">High tides</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.lowTide}
                      onChange={(e) => updateSettings({ lowTide: e.target.checked })}
                      className="rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-400"
                    />
                    <span className="text-sm text-slate-300">Low tides</span>
                  </label>

                  <div className="mt-2">
                    <label className="text-xs text-slate-400 block mb-1">Alert before (minutes)</label>
                    <select
                      value={settings.minutesBefore}
                      onChange={(e) => updateSettings({ minutesBefore: Number(e.target.value) })}
                      className="w-full bg-slate-700 text-white text-sm px-2 py-1 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={() => setShowSettings(false)}
            className="mt-3 w-full text-xs text-slate-500 hover:text-slate-400"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
