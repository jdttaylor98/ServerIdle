import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVE_KEY = 'serverIdle_save';

export interface GameState {
  credits: number;
  creditsPerSec: number;
  lastSaved: number;
  tickCount: number;

  // Actions
  tick: () => void;
  addCredits: (amount: number) => void;
  recalcCreditsPerSec: () => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<number>; // returns offline earnings
}

export const useGameStore = create<GameState>((set, get) => ({
  credits: 0,
  creditsPerSec: 0.5, // base rate before any servers
  lastSaved: Date.now(),
  tickCount: 0,

  tick: () => {
    const { credits, creditsPerSec, tickCount, saveGame } = get();
    const newTickCount = tickCount + 1;

    set({
      credits: credits + creditsPerSec,
      tickCount: newTickCount,
    });

    // Save every 30 ticks (~30 seconds)
    if (newTickCount % 30 === 0) {
      saveGame();
    }
  },

  addCredits: (amount) => {
    set((state) => ({ credits: state.credits + amount }));
  },

  recalcCreditsPerSec: () => {
    // Placeholder — will factor in servers, upgrades, uptime etc in later phases
    set({ creditsPerSec: 0.5 });
  },

  saveGame: async () => {
    const { credits, creditsPerSec } = get();
    const saveData = {
      credits,
      creditsPerSec,
      lastSaved: Date.now(),
    };
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    set({ lastSaved: saveData.lastSaved });
  },

  loadGame: async () => {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return 0;

    const saveData = JSON.parse(raw);
    const offlineEarnings = calcOfflineEarnings(
      saveData.lastSaved,
      saveData.creditsPerSec
    );

    set({
      credits: (saveData.credits ?? 0) + offlineEarnings,
      creditsPerSec: saveData.creditsPerSec ?? 0.5,
      lastSaved: Date.now(),
    });

    return offlineEarnings;
  },
}));

function calcOfflineEarnings(lastSaved: number, creditsPerSec: number): number {
  const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // 8 hours cap
  const EFFICIENCY = 0.5; // offline earns at 50%

  const elapsed = Math.min(
    (Date.now() - lastSaved) / 1000,
    MAX_OFFLINE_SECONDS
  );

  return elapsed * creditsPerSec * EFFICIENCY;
}
