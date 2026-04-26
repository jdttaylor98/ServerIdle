import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useGameStore } from './store';

const TICK_INTERVAL_MS = 1000;

export function useTicker() {
  const tick = useGameStore((state) => state.tick);
  const saveGame = useGameStore((state) => state.saveGame);
  const loadGame = useGameStore((state) => state.loadGame);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Tick every second and save every tick — save data is tiny, no reason not to
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
      saveGame();
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [tick, saveGame]);

  // Save on background; recalculate offline on return to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (prev === 'active' && (next === 'background' || next === 'inactive')) {
        await saveGame();
      } else if (prev !== 'active' && next === 'active') {
        await loadGame();
      }
    });

    return () => sub.remove();
  }, [saveGame, loadGame]);
}
