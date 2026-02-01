import { Scene } from '@/components/canvas/Scene';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { HarmonicsPanel } from '@/components/harmonics/HarmonicsPanel';

function App() {
  return (
    <div className="w-full h-full relative">
      <Scene />
      <ControlPanel />
      <HarmonicsPanel />
    </div>
  );
}

export default App;
