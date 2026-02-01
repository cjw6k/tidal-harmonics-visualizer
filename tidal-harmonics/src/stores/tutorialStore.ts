import { create } from 'zustand';
import type { TutorialState, TutorialProgress } from '@/types/tutorial';
import { TUTORIAL_CHAPTERS, getStep } from '@/data/tutorialContent';

interface TutorialStoreState {
  // State machine
  state: TutorialState;
  isActive: boolean;

  // Progress
  progress: TutorialProgress;

  // Actions
  startTutorial: () => void;
  exitTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToChapter: (chapterIndex: number) => void;
  goToStep: (chapterIndex: number, stepIndex: number) => void;
  markChapterComplete: (chapterId: string) => void;

  // Computed getters (as functions)
  getCurrentStep: () => ReturnType<typeof getStep>;
  getTotalSteps: () => number;
  getCurrentStepNumber: () => number;
}

export const useTutorialStore = create<TutorialStoreState>((set, get) => ({
  state: 'idle',
  isActive: false,
  progress: {
    chapterIndex: 0,
    stepIndex: 0,
    completedChapters: [],
  },

  startTutorial: () => {
    set({
      state: 'intro',
      isActive: true,
      progress: {
        chapterIndex: 0,
        stepIndex: 0,
        completedChapters: [],
      },
    });
  },

  exitTutorial: () => {
    set({
      state: 'idle',
      isActive: false,
    });
  },

  nextStep: () => {
    const { progress } = get();
    const chapter = TUTORIAL_CHAPTERS[progress.chapterIndex];
    if (!chapter) return;

    if (progress.stepIndex < chapter.steps.length - 1) {
      // Next step in current chapter
      set({
        state: 'step',
        progress: {
          ...progress,
          stepIndex: progress.stepIndex + 1,
        },
      });
    } else if (progress.chapterIndex < TUTORIAL_CHAPTERS.length - 1) {
      // Move to next chapter
      const completedChapters = [...progress.completedChapters];
      if (!completedChapters.includes(chapter.id)) {
        completedChapters.push(chapter.id);
      }

      set({
        state: 'step',
        progress: {
          chapterIndex: progress.chapterIndex + 1,
          stepIndex: 0,
          completedChapters,
        },
      });
    } else {
      // Tutorial complete
      const completedChapters = [...progress.completedChapters];
      if (!completedChapters.includes(chapter.id)) {
        completedChapters.push(chapter.id);
      }

      set({
        state: 'complete',
        progress: {
          ...progress,
          completedChapters,
        },
      });
    }
  },

  prevStep: () => {
    const { progress } = get();

    if (progress.stepIndex > 0) {
      // Previous step in current chapter
      set({
        state: 'step',
        progress: {
          ...progress,
          stepIndex: progress.stepIndex - 1,
        },
      });
    } else if (progress.chapterIndex > 0) {
      // Move to previous chapter's last step
      const prevChapter = TUTORIAL_CHAPTERS[progress.chapterIndex - 1];
      if (prevChapter) {
        set({
          state: 'step',
          progress: {
            ...progress,
            chapterIndex: progress.chapterIndex - 1,
            stepIndex: prevChapter.steps.length - 1,
          },
        });
      }
    }
  },

  goToChapter: (chapterIndex) => {
    if (chapterIndex >= 0 && chapterIndex < TUTORIAL_CHAPTERS.length) {
      set({
        state: 'step',
        progress: {
          ...get().progress,
          chapterIndex,
          stepIndex: 0,
        },
      });
    }
  },

  goToStep: (chapterIndex, stepIndex) => {
    const chapter = TUTORIAL_CHAPTERS[chapterIndex];
    if (chapter && stepIndex >= 0 && stepIndex < chapter.steps.length) {
      set({
        state: 'step',
        progress: {
          ...get().progress,
          chapterIndex,
          stepIndex,
        },
      });
    }
  },

  markChapterComplete: (chapterId) => {
    const { progress } = get();
    if (!progress.completedChapters.includes(chapterId)) {
      set({
        progress: {
          ...progress,
          completedChapters: [...progress.completedChapters, chapterId],
        },
      });
    }
  },

  getCurrentStep: () => {
    const { progress } = get();
    return getStep(progress.chapterIndex, progress.stepIndex);
  },

  getTotalSteps: () => {
    return TUTORIAL_CHAPTERS.reduce((sum, ch) => sum + ch.steps.length, 0);
  },

  getCurrentStepNumber: () => {
    const { progress } = get();
    let count = 0;
    for (let i = 0; i < progress.chapterIndex; i++) {
      const ch = TUTORIAL_CHAPTERS[i];
      if (ch) count += ch.steps.length;
    }
    return count + progress.stepIndex + 1;
  },
}));
