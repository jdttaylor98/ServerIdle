import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVE_KEY = 'serverIdle_save';
const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // 8 hour cap
const OFFLINE_EFFICIENCY = 0.5; // earn at 50% rate while offline

export interface GameState {
  credits: number;
  creditsPerSec: number;
  lastSavedAt: number; // timestamp of the last save (used for offline calc)
  pendingOfflineEarnings: number;
  hydrated: boolean; // true once loadGame has run at least once

  tick: () => void;
  addCredits: (amount: number) => void;
  collectOfflineEarnings: () => Promise<void>;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
}

interface SaveData {
  credits: number;
  creditsPerSec: number;
  savedAt: number;
  pendingOfflineEarnings: number;
}

export const useGameStore = create<GameState>((set, get) => ({
  credits: 0,
  creditsPerSec: 2,
  lastSavedAt: Date.now(),
  pendingOfflineEarnings: 0,
  hydrated: false,

  tick: () => {
    const { credits, creditsPerSec } = get();
    set({ credits: credits + creditsPerSec });
  },

  addCredits: (amount) => {
    set((state) => ({ credits: state.credits + amount }));
  },

  collectOfflineEarnings: async () => {
    const { credits, pendingOfflineEarnings, saveGame } = get();
    if (pendingOfflineEarnings <= 0) return;
    set({
      credits: credits + pendingOfflineEarnings,
      pendingOfflineEarnings: 0,
    });
    await saveGame();
  },

  saveGame: async () => {
    const { credits, creditsPerSec, pendingOfflineEarnings } = get();
    const now = Date.now();
    const data: SaveData = {
      credits,
      creditsPerSec,
      savedAt: now,
      pendingOfflineEarnings,
    };
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(data));
    set({ lastSavedAt: now });
  },

  loadGame: async () => {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) {
      // First-time player — no save exists
      set({ hydrated: true, lastSavedAt: Date.now() });
      return;
    }

    const data: SaveData = JSON.parse(raw);
    const now = Date.now();

    // How long has it been since the last save?
    const elapsedSec = Math.min(
      Math.max((now - data.savedAt) / 1000, 0),
      MAX_OFFLINE_SECONDS
    );

    // Earn at reduced rate during the gap
    const newOffline = elapsedSec * data.creditsPerSec * OFFLINE_EFFICIENCY;

    // Add to any uncollected pending earnings from before
    const totalPending = (data.pendingOfflineEarnings || 0) + newOffline;

    set({
      credits: data.credits,
      creditsPerSec: data.creditsPerSec,
      pendingOfflineEarnings: totalPending,
      lastSavedAt: now,
      hydrated: true,
    });

    // Persist immediately so we don't double-count this period on next load
    const refreshed: SaveData = {
      credits: data.credits,
      creditsPerSec: data.creditsPerSec,
      savedAt: now,
      pendingOfflineEarnings: totalPending,
    };
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(refreshed));
  },
}));
