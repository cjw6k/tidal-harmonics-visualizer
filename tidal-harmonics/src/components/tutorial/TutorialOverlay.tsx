import { useEffect, useState, useRef, useCallback } from 'react';
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

  // Auto-advance state - disabled during Playwright tests to debug infinite loop
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const current = getCurrentStep();
  const stepDuration = current?.step.duration ?? 8; // Default 8 seconds
  const isInteractive = current?.step.interactive ?? false;

  // Handle auto-advance
  const startTimer = useCallback(() => {
    console.log('[TutorialOverlay] startTimer called');
    // Get fresh current step inside callback to avoid stale closure
    const currentStep = getCurrentStep();
    const duration = currentStep?.step.duration ?? 8;
    const interactive = currentStep?.step.interactive ?? false;

    if (!autoAdvance || !currentStep || interactive || duration === 0) {
      console.log('[TutorialOverlay] Timer skipped - conditions not met');
      setTimeRemaining(0);
      return;
    }

    console.log('[TutorialOverlay] Starting timer with duration:', duration);
    startTimeRef.current = Date.now();
    setTimeRemaining(duration);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        nextStep();
      }
    }, 100);
  }, [autoAdvance, getCurrentStep, nextStep]);

  // Reset timer when step changes
  // Note: startTimer intentionally excluded from deps to avoid re-render loops
  useEffect(() => {
    console.log('[TutorialOverlay] Timer effect triggered - isActive:', isActive, 'state:', state, 'step:', progress.chapterIndex, progress.stepIndex);
    if (isActive && state !== 'complete') {
      startTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, state, progress.chapterIndex, progress.stepIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStep();
      } else if (e.key === 'Escape') {
        exitTutorial();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, exitTutorial]);

  if (!isActive) return null;

  const totalSteps = getTotalSteps();
  const currentStepNumber = getCurrentStepNumber();

  if (state === 'complete') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-10 max-w-lg text-center shadow-2xl border border-slate-700">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Tutorial Complete!</h2>
          <p className="text-slate-400 mb-8 text-lg">
            You now understand harmonic tidal analysis. The ocean's rhythm is yours to explore.
          </p>
          <button
            onClick={exitTutorial}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl
              hover:from-blue-500 hover:to-cyan-400 transition-all text-lg font-medium
              shadow-lg shadow-blue-500/25"
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

  const progressPercent = (currentStepNumber / totalSteps) * 100;
  const timerPercent = stepDuration > 0 ? ((stepDuration - timeRemaining) / stepDuration) * 100 : 0;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
        {/* Progress bar with timer overlay */}
        <div className="h-1.5 bg-slate-800 relative">
          {/* Overall progress */}
          <div
            className="absolute inset-y-0 left-0 bg-blue-600/50 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Step timer */}
          {autoAdvance && stepDuration > 0 && !step.interactive && (
            <div
              className="absolute inset-y-0 left-0 bg-cyan-400 transition-all duration-100"
              style={{ width: `${Math.min(timerPercent, progressPercent)}%` }}
            />
          )}
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
              {progress.chapterIndex + 1}/{TUTORIAL_CHAPTERS.length}
            </span>
            <span className="text-sm text-white font-medium">
              {chapter.title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-advance toggle */}
            <button
              onClick={() => setAutoAdvance(!autoAdvance)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                autoAdvance
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-700 text-slate-400'
              }`}
              title={autoAdvance ? 'Auto-advance ON' : 'Auto-advance OFF'}
            >
              {autoAdvance ? '▶ Auto' : '⏸ Manual'}
            </button>
            <span className="text-xs text-slate-500">
              {currentStepNumber}/{totalSteps}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
          <p className="text-slate-300 leading-relaxed">{step.content}</p>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-5 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${isFirstStep
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={exitTutorial}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              Skip
            </button>
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500
                text-white rounded-lg hover:from-blue-500 hover:to-blue-400
                text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="px-6 pb-3 flex justify-center gap-4 text-xs text-slate-600">
          <span>← → Navigate</span>
          <span>Space Next</span>
          <span>Esc Exit</span>
        </div>
      </div>
    </div>
  );
}
