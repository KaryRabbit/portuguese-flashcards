import { useRef, useState } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
}

// A horizontal move past this many px counts as a swipe; a total move under the
// tap ceiling counts as a tap (flip). Predominantly-vertical drags are ignored
// so the page can still scroll.
const SWIPE_THRESHOLD = 50;
const TAP_MAX_MOVEMENT = 10;

/**
 * Pointer-based swipe/tap gesture hook for the study card. No dependency.
 * Spread the returned `handlers` onto the target element and use `dx` to make
 * the card follow the finger during a horizontal drag.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, onTap }: SwipeOptions) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    startRef.current = null;
    setDragging(false);
    setDx(0);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    // Keep receiving move/up even if the finger leaves the element bounds.
    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore — capture is a progressive enhancement
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const moveX = e.clientX - startRef.current.x;
    const moveY = e.clientY - startRef.current.y;
    // Only follow the finger for horizontal intent; let vertical scroll happen.
    if (Math.abs(moveX) > Math.abs(moveY)) {
      setDx(moveX);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const moveX = e.clientX - startRef.current.x;
    const moveY = e.clientY - startRef.current.y;
    const absX = Math.abs(moveX);
    const absY = Math.abs(moveY);
    reset();

    if (absX < TAP_MAX_MOVEMENT && absY < TAP_MAX_MOVEMENT) {
      onTap?.();
      return;
    }

    if (absX > absY && absX > SWIPE_THRESHOLD) {
      if (moveX < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    }
  };

  return {
    dx,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
    },
  };
}
