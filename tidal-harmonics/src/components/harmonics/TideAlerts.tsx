import { useState, useMemo, useCallback, useEffect } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { predictTideFromConstituents } from '@/lib/harmonics';

interface AlertConfig {
  id: string;
  type: 'high' | 'low' | 'threshold' | 'change';
  threshold?: number; // for threshold alerts
  enabled: boolean;
  notifyBefore: number; // minutes before event
}

const DEFAULT_ALERTS: AlertConfig[] = [
  { id: 'high', type: 'high', enabled: false, notifyBefore: 30 },
  { id: 'low', type: 'low', enabled: false, notifyBefore: 30 },
];

export function TideAlerts() {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const visibleConstituents = useHarmonicsStore((s) => s.visibleConstituents);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const epoch = useTimeStore((s) => s.epoch);

  const [alerts, setAlerts] = useState<AlertConfig[]>(DEFAULT_ALERTS);
  const [customThreshold, setCustomThreshold] = useState<number>(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  }, []);

  // Find next high and low tides
  const upcomingExtremes = useMemo(() => {
    if (!selectedStation) return [];

    const now = epoch;
    const extremes: { type: 'high' | 'low'; time: Date; height: number }[] = [];
    const step = 10 * 60 * 1000; // 10 minutes
    const lookAhead = 24 * 60 * 60 * 1000; // 24 hours

    let prevHeight = predictTideFromConstituents(selectedStation, new Date(now - step), visibleConstituents);
    let prevTrend = 0;

    for (let t = now; t < now + lookAhead; t += step) {
      const height = predictTideFromConstituents(selectedStation, new Date(t), visibleConstituents);
      const trend = height - prevHeight;

      // Detect extremes (trend change)
      if (prevTrend > 0 && trend < 0) {
        // Was rising, now falling -> high tide
        extremes.push({ type: 'high', time: new Date(t - step), height: prevHeight });
      } else if (prevTrend < 0 && trend > 0) {
        // Was falling, now rising -> low tide
        extremes.push({ type: 'low', time: new Date(t - step), height: prevHeight });
      }

      prevHeight = height;
      prevTrend = trend;

      if (extremes.length >= 6) break; // Get next 6 extremes
    }

    return extremes;
  }, [selectedStation, visibleConstituents, epoch]);

  // Toggle alert
  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  };

  // Update notify before time
  const updateNotifyBefore = (id: string, minutes: number) => {
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, notifyBefore: minutes } : a
    ));
  };

  // Add threshold alert
  const addThresholdAlert = () => {
    const newAlert: AlertConfig = {
      id: `threshold-${Date.now()}`,
      type: 'threshold',
      threshold: customThreshold,
      enabled: true,
      notifyBefore: 0,
    };
    setAlerts(prev => [...prev, newAlert]);
    setCustomThreshold(0);
  };

  // Remove alert
  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format height
  const formatHeight = (meters: number) => {
    if (unitSystem === 'metric') {
      return `${meters.toFixed(2)}m`;
    }
    return `${(meters * 3.28084).toFixed(1)}ft`;
  };

  // Time until
  const timeUntil = (date: Date) => {
    const diff = date.getTime() - epoch;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const supportsNotifications = 'Notification' in window;

  return (
    <div className="bg-slate-900/95 backdrop-blur rounded-lg p-3 text-xs shadow-lg border border-slate-700 max-w-[340px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-100">Tide Alerts</h3>
        {supportsNotifications && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            notificationPermission === 'granted'
              ? 'bg-green-900/50 text-green-400'
              : notificationPermission === 'denied'
                ? 'bg-red-900/50 text-red-400'
                : 'bg-yellow-900/50 text-yellow-400'
          }`}>
            {notificationPermission === 'granted' ? '✓ Enabled' :
             notificationPermission === 'denied' ? '✗ Blocked' : '? Pending'}
          </span>
        )}
      </div>

      {/* Permission request */}
      {supportsNotifications && notificationPermission === 'default' && (
        <div className="bg-blue-900/30 rounded p-2 mb-3">
          <p className="text-slate-300 mb-2">
            Enable notifications to receive tide alerts even when this tab is in the background.
          </p>
          <button
            onClick={requestPermission}
            className="w-full px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {/* Upcoming extremes */}
      {selectedStation && upcomingExtremes.length > 0 && (
        <div className="mb-3">
          <div className="text-slate-400 mb-2">Upcoming Tides</div>
          <div className="space-y-1.5">
            {upcomingExtremes.slice(0, 4).map((extreme, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-2 rounded ${
                  extreme.type === 'high' ? 'bg-blue-900/30' : 'bg-amber-900/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={extreme.type === 'high' ? 'text-blue-400' : 'text-amber-400'}>
                    {extreme.type === 'high' ? '▲' : '▼'}
                  </span>
                  <span className="text-slate-300">{extreme.type === 'high' ? 'High' : 'Low'}</span>
                  <span className="text-slate-500">{formatTime(extreme.time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">{formatHeight(extreme.height)}</span>
                  <span className="text-slate-500 text-[10px]">in {timeUntil(extreme.time)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert configuration */}
      <div className="mb-3">
        <div className="text-slate-400 mb-2">Alert Settings</div>
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-2 rounded bg-slate-800/50"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAlert(alert.id)}
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px]
                    ${alert.enabled
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-700 border-slate-600'
                    }`}
                >
                  {alert.enabled ? '✓' : ''}
                </button>
                <span className="text-slate-300">
                  {alert.type === 'high' && '▲ High Tide'}
                  {alert.type === 'low' && '▼ Low Tide'}
                  {alert.type === 'threshold' && `📏 Level ${formatHeight(alert.threshold || 0)}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(alert.type === 'high' || alert.type === 'low') && (
                  <select
                    value={alert.notifyBefore}
                    onChange={(e) => updateNotifyBefore(alert.id, parseInt(e.target.value))}
                    className="bg-slate-700 text-slate-300 text-[10px] rounded px-1 py-0.5 border-none"
                  >
                    <option value={15}>15m before</option>
                    <option value={30}>30m before</option>
                    <option value={60}>1h before</option>
                    <option value={120}>2h before</option>
                  </select>
                )}
                {alert.type === 'threshold' && (
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="text-red-400 hover:text-red-300 px-1"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add threshold alert */}
      <div className="border-t border-slate-700 pt-3">
        <div className="text-slate-400 mb-2">Custom Level Alert</div>
        <div className="flex gap-2">
          <input
            type="number"
            value={customThreshold}
            onChange={(e) => setCustomThreshold(parseFloat(e.target.value) || 0)}
            placeholder={unitSystem === 'metric' ? 'meters' : 'feet'}
            step={unitSystem === 'metric' ? 0.1 : 0.5}
            className="flex-1 bg-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 border border-slate-600 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={addThresholdAlert}
            disabled={customThreshold === 0}
            className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        <p className="text-slate-500 text-[10px] mt-1">
          Get notified when tide reaches this level
        </p>
      </div>

      {/* Info */}
      <div className="mt-3 pt-2 border-t border-slate-700 text-slate-500 text-[10px]">
        <p>
          Alerts are calculated from harmonic predictions. Browser notifications require
          this page to remain open (can be in background). For reliable alerts, consider
          keeping the page open or using a dedicated tide app.
        </p>
      </div>
    </div>
  );
}
