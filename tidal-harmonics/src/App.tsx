import { Scene } from '@/components/canvas/Scene';
import { ControlPanel } from '@/components/ui/ControlPanel';

function App() {
  return (
    <div className="w-full h-full relative">
      <Scene />
      <ControlPanel />
    </div>
  );
}

export default App;
