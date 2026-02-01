import { TimeControls } from './TimeControls';
import { ViewSelector } from './ViewSelector';
import { ScaleToggle } from './ScaleToggle';
import { ExportMenu } from './ExportMenu';

export function ControlPanel() {
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-4 z-10 max-w-[280px]">
      <TimeControls />
      <ViewSelector />
      <ScaleToggle />
      <ExportMenu />
    </div>
  );
}
