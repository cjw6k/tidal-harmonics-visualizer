import { Html } from '@react-three/drei';
import { useTutorialStore } from '@/stores/tutorialStore';

export function AnnotationLayer() {
  const isActive = useTutorialStore((s) => s.isActive);
  const getCurrentStep = useTutorialStore((s) => s.getCurrentStep);

  if (!isActive) return null;

  const current = getCurrentStep();
  if (!current?.step.annotations) return null;

  return (
    <group>
      {current.step.annotations.map((annotation) => (
        <Html
          key={annotation.id}
          position={annotation.position}
          center
          distanceFactor={10}
          occlude={false}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap
              ${
                annotation.style === 'highlight'
                  ? 'bg-blue-600 text-white font-medium'
                  : annotation.style === 'equation'
                    ? 'bg-slate-900/90 text-green-400 font-mono border border-green-600/50'
                    : 'bg-slate-800/90 text-white border border-slate-600'
              }
              shadow-lg backdrop-blur-sm`}
          >
            {annotation.text}
          </div>
        </Html>
      ))}
    </group>
  );
}
