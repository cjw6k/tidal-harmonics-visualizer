import { useTutorialStore } from '@/stores/tutorialStore';
import { TUTORIAL_CHAPTERS } from '@/data/tutorialContent';

export function ChapterNavigation() {
  const isActive = useTutorialStore((s) => s.isActive);
  const progress = useTutorialStore((s) => s.progress);
  const goToChapter = useTutorialStore((s) => s.goToChapter);

  if (!isActive) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex gap-2 bg-slate-800/80 backdrop-blur-sm rounded-full px-3 py-2">
        {TUTORIAL_CHAPTERS.map((chapter, i) => {
          const isComplete = progress.completedChapters.includes(chapter.id);
          const isCurrent = progress.chapterIndex === i;

          return (
            <button
              key={chapter.id}
              onClick={() => goToChapter(i)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all
                ${
                  isCurrent
                    ? 'bg-blue-600 text-white scale-110'
                    : isComplete
                      ? 'bg-green-600/50 text-green-300'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              title={chapter.title}
            >
              {isComplete && !isCurrent ? '✓' : i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
