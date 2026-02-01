import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function PerformanceMonitor() {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(0);

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();

    if (now - lastTime.current >= 1000) {
      setFps(frameCount.current);
      setFrameTime(1000 / frameCount.current);
      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return (
    <PerformanceStatsDisplay fps={fps} frameTime={frameTime} />
  );
}

interface PerformanceStatsDisplayProps {
  fps: number;
  frameTime: number;
}

function PerformanceStatsDisplay({ fps, frameTime }: PerformanceStatsDisplayProps) {
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);

  useEffect(() => {
    const updateMemory = () => {
      // @ts-expect-error - memory is a non-standard property
      const memory = performance.memory;
      if (memory) {
        setMemoryUsage(Math.round(memory.usedJSHeapSize / 1024 / 1024));
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 2000);
    return () => clearInterval(interval);
  }, []);

  const fpsColor = fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="fixed top-4 right-4 z-50 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs font-mono">
      <div className={`${fpsColor}`}>
        {fps} FPS ({frameTime.toFixed(1)}ms)
      </div>
      {memoryUsage !== null && (
        <div className="text-slate-400">{memoryUsage} MB</div>
      )}
    </div>
  );
}

export { PerformanceMonitor, PerformanceStatsDisplay };
