import { useTutorialStore } from '@/stores/tutorialStore';
import { TUTORIAL_CHAPTERS } from '@/data/tutorialContent';

export function TutorialOverlay() {
  const isActive = useTutorialStore((s) => s.isActive);
  const state = useTutorialStore((s) => s.state);
  const progress = useTutorialStore((s) => s.progress);
  const nextStep = useTutorialStore((s) => s.nextStep);
  const prevStep = useTutorialStore((s) => s.prevStep);
  const exitTutorial = useTutorialStore((s) => s.exitTutorial);
  const getCurrentStep = useTutorialStore((s) => s.getCurrentStep);
  const getTotalSteps = useTutorialStore((s) => s.getTotalSteps);
  const getCurrentStepNumber = useTutorialStore((s) => s.getCurrentStepNumber);

  if (!isActive) return null;

  const current = getCurrentStep();
  const totalSteps = getTotalSteps();
  const currentStepNumber = getCurrentStepNumber();

  if (state === 'complete') {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-800 rounded-xl p-8 max-w-md text-center shadow-2xl">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Tutorial Complete!</h2>
          <p className="text-slate-300 mb-6">
            You now understand the fundamentals of harmonic tidal analysis.
            Explore the visualization on your own!
          </p>
          <button
            onClick={exitTutorial}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Start Exploring
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const { chapter, step } = current;
  const isFirstStep = progress.chapterIndex === 0 && progress.stepIndex === 0;
  const isLastStep =
    progress.chapterIndex === TUTORIAL_CHAPTERS.length - 1 &&
    progress.stepIndex === chapter.steps.length - 1;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-slate-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700">
        {/* Progress bar */}
        <div className="h-1 bg-slate-700 rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-700/50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-400 font-medium">
              Chapter {progress.chapterIndex + 1}: {chapter.title}
            </span>
            <span className="text-xs text-slate-500">
              {currentStepNumber} / {totalSteps}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed">{step.content}</p>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-4 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={isFirstStep}
            className={`px-4 py-2 rounded-lg text-sm transition-colors
              ${
                isFirstStep
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
          >
            ← Back
          </button>

          <div className="flex gap-2">
            <button
              onClick={exitTutorial}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Skip Tutorial
            </button>
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm transition-colors"
            >
              {isLastStep ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
