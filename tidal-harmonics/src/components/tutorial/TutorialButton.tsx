import { useTutorialStore } from '@/stores/tutorialStore';

export function TutorialButton() {
  const isActive = useTutorialStore((s) => s.isActive);
  const startTutorial = useTutorialStore((s) => s.startTutorial);

  if (isActive) return null;

  return (
    <button
      onClick={startTutorial}
      className="fixed bottom-4 left-4 z-40 px-3 py-1.5 bg-blue-600 text-white rounded-lg
        hover:bg-blue-500 shadow-lg transition-all text-xs font-medium
        flex items-center gap-1.5"
    >
      <span>📖</span>
      <span>Start Tutorial</span>
    </button>
  );
}
