import { useEffect, useRef } from 'react';
import { useGameStore } from './store';

const TICK_INTERVAL_MS = 1000;

export function useTicker() {
  const tick = useGameStore((state) => state.tick);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tick();
    }, TICK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tick]);
}
