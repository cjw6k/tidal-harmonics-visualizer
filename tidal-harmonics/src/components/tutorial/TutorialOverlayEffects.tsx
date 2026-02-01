import { useTutorialStore } from '@/stores/tutorialStore';

export function TutorialOverlayEffects() {
  const isActive = useTutorialStore((s) => s.isActive);
  const state = useTutorialStore((s) => s.state);

  if (!isActive || state === 'complete') return null;

  return (
    <>
      {/* Vignette overlay for focus */}
      <div
        className="fixed inset-0 pointer-events-none z-30"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Top gradient for text readability */}
      <div
        className="fixed top-0 left-0 right-0 h-32 pointer-events-none z-30"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)',
        }}
      />

      {/* Bottom gradient for overlay readability */}
      <div
        className="fixed bottom-0 left-0 right-0 h-48 pointer-events-none z-30"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
        }}
      />
    </>
  );
}

export function TutorialUIDimmer() {
  const isActive = useTutorialStore((s) => s.isActive);

  if (!isActive) return null;

  // This component renders nothing but signals to other components to dim
  return null;
}
