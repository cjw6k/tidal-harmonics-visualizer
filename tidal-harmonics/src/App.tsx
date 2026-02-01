import { Scene } from '@/components/canvas/Scene';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { HarmonicsPanel } from '@/components/harmonics/HarmonicsPanel';
import { KeyboardShortcutsHelp } from '@/components/ui/KeyboardShortcutsHelp';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { TutorialOverlayEffects } from '@/components/tutorial/TutorialOverlayEffects';
import { TutorialButton } from '@/components/tutorial/TutorialButton';
import { ChapterNavigation } from '@/components/tutorial/ChapterNavigation';
import { TutorialController } from '@/components/tutorial/TutorialController';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function App() {
  // Enable global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="w-full h-full relative">
      <Scene />
      <TutorialOverlayEffects />
      <ControlPanel />
      <HarmonicsPanel />
      <TutorialButton />
      <ChapterNavigation />
      <TutorialOverlay />
      <TutorialController />
      <KeyboardShortcutsHelp />
    </div>
  );
}

export default App;
