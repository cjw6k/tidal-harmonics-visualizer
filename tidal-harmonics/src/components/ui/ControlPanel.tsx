import { TimeControls } from './TimeControls';
import { ViewSelector } from './ViewSelector';
import { ScaleToggle } from './ScaleToggle';

export function ControlPanel() {
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-4 z-10">
      <TimeControls />
      <ViewSelector />
      <ScaleToggle />
    </div>
  );
}
