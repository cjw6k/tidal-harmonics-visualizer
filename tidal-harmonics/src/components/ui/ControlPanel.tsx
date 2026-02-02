import { TimeControls } from './TimeControls';
import { ViewSelector } from './ViewSelector';
import { ScaleToggle } from './ScaleToggle';
import { ExportMenu } from './ExportMenu';
import { LunarPhaseIndicator } from './LunarPhaseIndicator';
import { AstronomicalEventsPanel } from './AstronomicalEventsPanel';
import { TidalFactsWidget } from './TidalFactsWidget';

export function ControlPanel() {
  return (
    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-2 sm:gap-4 z-10 max-w-[220px] sm:max-w-[280px] max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin">
      <TimeControls />
      <LunarPhaseIndicator />
      <AstronomicalEventsPanel />
      <ViewSelector />
      <ScaleToggle />
      <ExportMenu />
      <TidalFactsWidget />
    </div>
  );
}
