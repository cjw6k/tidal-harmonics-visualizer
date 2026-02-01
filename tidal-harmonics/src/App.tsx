import { Scene } from '@/components/canvas/Scene';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { HarmonicsPanel } from '@/components/harmonics/HarmonicsPanel';
import { KeyboardShortcutsHelp } from '@/components/ui/KeyboardShortcutsHelp';
import { AboutPanel } from '@/components/ui/AboutPanel';
import { TidalFactsWidget } from '@/components/ui/TidalFactsWidget';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { TutorialOverlayEffects } from '@/components/tutorial/TutorialOverlayEffects';
import { TutorialButton } from '@/components/tutorial/TutorialButton';
import { ChapterNavigation } from '@/components/tutorial/ChapterNavigation';
import { TutorialController } from '@/components/tutorial/TutorialController';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUrlSync } from '@/hooks/useUrlSync';

function App() {
  // Enable global keyboard shortcuts
  useKeyboardShortcuts();

  // Sync selected station with URL for deep linking
  useUrlSync();

  return (
    <div className="w-full h-full relative">
      {/* Skip link for screen readers and keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-slate-800 focus:text-white focus:rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none"
      >
        Skip to main content
      </a>
      <Scene id="main-content" />
      <TutorialOverlayEffects />
      <ControlPanel />
      <HarmonicsPanel />
      <TutorialButton />
      <ChapterNavigation />
      <TutorialOverlay />
      <TutorialController />
      <KeyboardShortcutsHelp />
      <AboutPanel />
      <TidalFactsWidget />
    </div>
  );
}

export default App;
