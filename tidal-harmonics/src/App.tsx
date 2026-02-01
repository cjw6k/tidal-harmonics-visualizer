import { Scene } from '@/components/canvas/Scene';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { HarmonicsPanel } from '@/components/harmonics/HarmonicsPanel';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { TutorialButton } from '@/components/tutorial/TutorialButton';
import { ChapterNavigation } from '@/components/tutorial/ChapterNavigation';
import { TutorialController } from '@/components/tutorial/TutorialController';

function App() {
  return (
    <div className="w-full h-full relative">
      <Scene />
      <ControlPanel />
      <HarmonicsPanel />
      <TutorialButton />
      <ChapterNavigation />
      <TutorialOverlay />
      <TutorialController />
    </div>
  );
}

export default App;
