import { useRef, useCallback, useEffect } from 'react';

interface TouchGestureCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchIn?: () => void;
  onPinchOut?: () => void;
  onDoubleTap?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startDistance: number;
  lastTapTime: number;
}

const SWIPE_THRESHOLD = 50;
const PINCH_THRESHOLD = 30;
const DOUBLE_TAP_DELAY = 300;

function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function useTouchGestures(callbacks: TouchGestureCallbacks) {
  const stateRef = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startDistance: 0,
    lastTapTime: 0,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const state = stateRef.current;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (!touch) return;
      state.startX = touch.clientX;
      state.startY = touch.clientY;
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      if (!touch1 || !touch2) return;
      state.startDistance = getDistance(touch1, touch2);
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const state = stateRef.current;

      // Double tap detection
      if (e.changedTouches.length === 1) {
        const now = Date.now();
        if (now - state.lastTapTime < DOUBLE_TAP_DELAY) {
          callbacks.onDoubleTap?.();
          state.lastTapTime = 0;
        } else {
          state.lastTapTime = now;
        }
      }

      // Swipe detection
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - state.startX;
        const dy = touch.clientY - state.startY;

        if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            callbacks.onSwipeRight?.();
          } else {
            callbacks.onSwipeLeft?.();
          }
        } else if (Math.abs(dy) > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
          if (dy > 0) {
            callbacks.onSwipeDown?.();
          } else {
            callbacks.onSwipeUp?.();
          }
        }
      }
    },
    [callbacks]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const state = stateRef.current;

      // Pinch detection
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        if (!touch1 || !touch2) return;
        const currentDistance = getDistance(touch1, touch2);
        const deltaDistance = currentDistance - state.startDistance;

        if (Math.abs(deltaDistance) > PINCH_THRESHOLD) {
          if (deltaDistance > 0) {
            callbacks.onPinchOut?.();
          } else {
            callbacks.onPinchIn?.();
          }
          // Reset start distance to allow continuous pinching
          state.startDistance = currentDistance;
        }
      }
    },
    [callbacks]
  );

  const bind = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: true });

      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchmove', handleTouchMove);
      };
    },
    [handleTouchStart, handleTouchEnd, handleTouchMove]
  );

  return { bind };
}

// Hook for ref-based binding
export function useTouchGesturesRef<T extends HTMLElement>(callbacks: TouchGestureCallbacks) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (!touch) return;
        (element as any).__touchStartX = touch.clientX;
        (element as any).__touchStartY = touch.clientY;
        (element as any).__lastTapTime = (element as any).__lastTapTime || 0;
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        if (!touch1 || !touch2) return;
        (element as any).__startDistance = getDistance(touch1, touch2);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Double tap
      if (e.changedTouches.length === 1) {
        const now = Date.now();
        const lastTap = (element as any).__lastTapTime || 0;
        if (now - lastTap < DOUBLE_TAP_DELAY) {
          callbacks.onDoubleTap?.();
          (element as any).__lastTapTime = 0;
        } else {
          (element as any).__lastTapTime = now;
        }

        const touch = e.changedTouches[0];
        if (!touch) return;
        const startX = (element as any).__touchStartX || 0;
        const startY = (element as any).__touchStartY || 0;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;

        if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) callbacks.onSwipeRight?.();
          else callbacks.onSwipeLeft?.();
        } else if (Math.abs(dy) > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
          if (dy > 0) callbacks.onSwipeDown?.();
          else callbacks.onSwipeUp?.();
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        if (!touch1 || !touch2) return;
        const currentDistance = getDistance(touch1, touch2);
        const startDistance = (element as any).__startDistance || currentDistance;
        const delta = currentDistance - startDistance;

        if (Math.abs(delta) > PINCH_THRESHOLD) {
          if (delta > 0) callbacks.onPinchOut?.();
          else callbacks.onPinchIn?.();
          (element as any).__startDistance = currentDistance;
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [callbacks]);

  return ref;
}
