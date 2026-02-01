import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { format, addHours } from 'date-fns';

interface CrewWatchSchedulerProps {
  onClose: () => void;
}

interface TidalEvent {
  time: Date;
  type: 'high' | 'low' | 'slack-flood' | 'slack-ebb' | 'max-flood' | 'max-ebb';
  importance: 'critical' | 'moderate' | 'routine';
  description: string;
}

interface WatchPeriod {
  start: Date;
  end: Date;
  crewMember: string;
  events: TidalEvent[];
  workload: 'heavy' | 'normal' | 'light';
}

const DEFAULT_CREW = ['Captain', 'First Mate', 'Crew A', 'Crew B'];
const WATCH_COLORS = ['bg-blue-600', 'bg-green-600', 'bg-amber-600', 'bg-purple-600'];

export function CrewWatchScheduler({ onClose }: CrewWatchSchedulerProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);

  // Watch parameters
  const [watchDuration, setWatchDuration] = useState(4); // hours
  const [crewCount, setCrewCount] = useState(4);
  const [crewNames, setCrewNames] = useState(DEFAULT_CREW);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now;
  });
  const [criticalEventsRequireCaptain, setCriticalEventsRequireCaptain] = useState(true);

  // Calculate tidal events for the next 24 hours
  const tidalEvents = useMemo(() => {
    if (!selectedStation) return [];

    const end = addHours(startTime, 24);
    const series = predictTideSeries(selectedStation, startTime, end, 10);
    const extremes = findExtremes(series);

    const events: TidalEvent[] = [];

    // Add high/low water events
    extremes.forEach((extreme) => {
      events.push({
        time: extreme.time,
        type: extreme.type,
        importance: 'critical',
        description: `${extreme.type === 'high' ? 'High' : 'Low'} Water: ${extreme.height.toFixed(2)}m`,
      });

      // Add slack water (approximately at HW/LW)
      events.push({
        time: extreme.time,
        type: extreme.type === 'high' ? 'slack-flood' : 'slack-ebb',
        importance: 'moderate',
        description: `Slack water (end of ${extreme.type === 'high' ? 'flood' : 'ebb'})`,
      });

      // Add max stream (approximately 3 hours after HW/LW)
      const maxStreamTime = addHours(extreme.time, 3);
      if (maxStreamTime <= end) {
        events.push({
          time: maxStreamTime,
          type: extreme.type === 'high' ? 'max-ebb' : 'max-flood',
          importance: 'moderate',
          description: `Max ${extreme.type === 'high' ? 'ebb' : 'flood'} stream`,
        });
      }
    });

    // Sort by time
    return events.sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [selectedStation, startTime]);

  // Generate watch schedule
  const watchSchedule = useMemo(() => {
    const schedule: WatchPeriod[] = [];
    const hoursToSchedule = 24;
    const watchCount = Math.ceil(hoursToSchedule / watchDuration);

    for (let i = 0; i < watchCount; i++) {
      const watchStart = addHours(startTime, i * watchDuration);
      const watchEnd = addHours(watchStart, watchDuration);

      // Find events during this watch
      const watchEvents = tidalEvents.filter(
        (e) => e.time >= watchStart && e.time < watchEnd
      );

      // Determine workload based on events
      const criticalCount = watchEvents.filter((e) => e.importance === 'critical').length;
      const moderateCount = watchEvents.filter((e) => e.importance === 'moderate').length;

      let workload: WatchPeriod['workload'];
      if (criticalCount >= 2 || (criticalCount >= 1 && moderateCount >= 2)) {
        workload = 'heavy';
      } else if (criticalCount >= 1 || moderateCount >= 2) {
        workload = 'normal';
      } else {
        workload = 'light';
      }

      // Assign crew member (rotate through available crew)
      let crewMemberIndex = i % crewCount;

      // If critical events require captain and this watch has critical events
      if (criticalEventsRequireCaptain && criticalCount > 0 && crewMemberIndex !== 0) {
        // Swap with captain's next scheduled watch
        // For simplicity, just assign captain to critical watches
        crewMemberIndex = 0;
      }

      schedule.push({
        start: watchStart,
        end: watchEnd,
        crewMember: crewNames[crewMemberIndex] || `Crew ${crewMemberIndex + 1}`,
        events: watchEvents,
        workload,
      });
    }

    return schedule;
  }, [startTime, watchDuration, crewCount, crewNames, tidalEvents, criticalEventsRequireCaptain]);

  // Calculate crew workload summary
  const crewWorkload = useMemo(() => {
    const summary: Record<string, { heavy: number; normal: number; light: number; total: number }> = {};

    watchSchedule.forEach((watch) => {
      if (!summary[watch.crewMember]) {
        summary[watch.crewMember] = { heavy: 0, normal: 0, light: 0, total: 0 };
      }
      const crew = summary[watch.crewMember];
      if (crew) {
        crew[watch.workload]++;
        crew.total += watchDuration;
      }
    });

    return summary;
  }, [watchSchedule, watchDuration]);

  const handleCrewNameChange = (index: number, name: string) => {
    const newNames = [...crewNames];
    newNames[index] = name;
    setCrewNames(newNames);
  };

  const getWorkloadColor = (workload: WatchPeriod['workload']) => {
    switch (workload) {
      case 'heavy':
        return 'bg-red-900/50 border-red-500';
      case 'normal':
        return 'bg-yellow-900/50 border-yellow-500';
      case 'light':
        return 'bg-green-900/50 border-green-500';
    }
  };

  const getImportanceIcon = (importance: TidalEvent['importance']) => {
    switch (importance) {
      case 'critical':
        return '🔴';
      case 'moderate':
        return '🟡';
      case 'routine':
        return '🟢';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900">
          <h2 className="text-lg font-semibold text-white">Crew Watch Scheduler</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl" aria-label="Close">
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Explanation */}
          <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300">
            <p className="font-medium text-cyan-400 mb-2">Tide-Aware Watch Planning</p>
            <p>
              Plan crew watch rotations around tidal events. Ensures experienced crew are on deck during
              critical moments like high/low water transitions, maximum stream rates, and slack water
              for maneuvering.
            </p>
          </div>

          {/* Configuration */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Watch Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Watch Duration</label>
                <select
                  value={watchDuration}
                  onChange={(e) => setWatchDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                >
                  <option value={3}>3 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={6}>6 hours</option>
                  <option value={8}>8 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Crew Size</label>
                <select
                  value={crewCount}
                  onChange={(e) => setCrewCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                >
                  <option value={2}>2 crew</option>
                  <option value={3}>3 crew</option>
                  <option value={4}>4 crew</option>
                  <option value={5}>5 crew</option>
                  <option value={6}>6 crew</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={format(startTime, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setStartTime(new Date(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={criticalEventsRequireCaptain}
                  onChange={(e) => setCriticalEventsRequireCaptain(e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600"
                />
                Captain on deck for critical tidal events
              </label>
            </div>
          </div>

          {/* Crew Names */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Crew Names</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Array.from({ length: crewCount }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${WATCH_COLORS[i % WATCH_COLORS.length]}`} />
                  <input
                    type="text"
                    value={crewNames[i] || `Crew ${i + 1}`}
                    onChange={(e) => handleCrewNameChange(i, e.target.value)}
                    className="flex-1 px-2 py-1 bg-slate-700 rounded text-white text-sm"
                    placeholder={`Crew ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Watch Schedule */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">24-Hour Watch Schedule</h3>
            <div className="space-y-2">
              {watchSchedule.map((watch, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${getWorkloadColor(watch.workload)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          WATCH_COLORS[crewNames.indexOf(watch.crewMember) % WATCH_COLORS.length]
                        }`}
                      />
                      <span className="text-white font-medium">{watch.crewMember}</span>
                    </div>
                    <div className="text-sm text-slate-300">
                      {format(watch.start, 'HH:mm')} - {format(watch.end, 'HH:mm')}
                    </div>
                  </div>

                  {watch.events.length > 0 ? (
                    <div className="ml-7 space-y-1">
                      {watch.events.map((event, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm">
                          <span>{getImportanceIcon(event.importance)}</span>
                          <span className="text-slate-400">{format(event.time, 'HH:mm')}</span>
                          <span className="text-slate-300">{event.description}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ml-7 text-sm text-slate-500 italic">No significant tidal events</div>
                  )}

                  <div className="mt-2 ml-7 text-xs text-slate-400">
                    Workload:{' '}
                    <span
                      className={
                        watch.workload === 'heavy'
                          ? 'text-red-400'
                          : watch.workload === 'normal'
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }
                    >
                      {watch.workload}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crew Workload Summary */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Crew Workload Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(crewWorkload).map(([name, stats]) => (
                <div key={name} className="bg-slate-700 rounded p-3">
                  <p className="text-white font-medium text-sm mb-2">{name}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total hours:</span>
                      <span className="text-white">{stats.total}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-400">Heavy watches:</span>
                      <span className="text-white">{stats.heavy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-400">Normal watches:</span>
                      <span className="text-white">{stats.normal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400">Light watches:</span>
                      <span className="text-white">{stats.light}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
            <p className="font-medium text-slate-300 mb-2">Event Importance:</p>
            <div className="flex flex-wrap gap-4">
              <span>🔴 Critical - HW/LW transitions</span>
              <span>🟡 Moderate - Slack/max stream</span>
              <span>🟢 Routine - Standard conditions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
