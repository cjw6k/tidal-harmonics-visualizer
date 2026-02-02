import { useTutorialStore } from '@/stores/tutorialStore';

export function TutorialButton() {
  const isActive = useTutorialStore((s) => s.isActive);
  const hasCompletedTutorial = useTutorialStore((s) => s.hasCompletedTutorial);
  const startTutorial = useTutorialStore((s) => s.startTutorial);

  if (isActive) return null;

  // Prominent CTA for first-time visitors
  if (!hasCompletedTutorial) {
    return (
      <button
        onClick={startTutorial}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 px-6 py-3
          bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl
          hover:from-blue-500 hover:to-blue-400
          shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50
          transition-all duration-300 text-base font-semibold
          flex items-center gap-2 animate-highlight-glow"
      >
        <span className="text-xl">📖</span>
        <span>Start Tutorial</span>
      </button>
    );
  }

  // De-emphasized but accessible for returning visitors
  return (
    <button
      onClick={startTutorial}
      className="fixed bottom-12 left-4 z-40 px-3 py-1.5
        bg-slate-700/80 text-slate-300 rounded-lg
        hover:bg-slate-600 hover:text-white
        shadow-md transition-all text-xs font-medium
        flex items-center gap-1.5 backdrop-blur-sm"
    >
      <span>📖</span>
      <span>Replay Tutorial</span>
    </button>
  );
}
