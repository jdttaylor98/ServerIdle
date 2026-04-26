import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SERVER_TIERS,
  getServerCost,
  getTotalOutput,
} from './servers';

const SAVE_KEY = 'serverIdle_save';
const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // 8 hour cap
const OFFLINE_EFFICIENCY = 0.5; // earn at 50% rate while offline

const BASE_CREDITS_PER_SEC = 0; // no passive income without servers

const OVERCLOCK_MULTIPLIER = 1.5; // +50% output
const OVERCLOCK_FAILURE_CHANCE = 0.005; // 0.5% per tick

export interface GameState {
  credits: number;
  servers: Record<string, number>; // tier id -> count owned
  overclockEnabled: boolean;
  lastFailure: { tierId: string; lost: number } | null;

  lastSavedAt: number;
  pendingOfflineEarnings: number;
  hydrated: boolean;

  // Derived
  getCreditsPerSec: () => number;

  // Actions
  tick: () => void;
  addCredits: (amount: number) => void;
  buyServer: (tierId: string) => void;
  toggleOverclock: () => void;
  clearFailureNotice: () => void;
  collectOfflineEarnings: () => Promise<void>;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
}

interface SaveData {
  credits: number;
  servers: Record<string, number>;
  overclockEnabled: boolean;
  savedAt: number;
  pendingOfflineEarnings: number;
}

function calcCreditsPerSec(
  servers: Record<string, number>,
  overclockEnabled: boolean
): number {
  const base = BASE_CREDITS_PER_SEC + getTotalOutput(servers);
  return overclockEnabled ? base * OVERCLOCK_MULTIPLIER : base;
}

export const useGameStore = create<GameState>((set, get) => ({
  credits: 0,
  servers: {},
  overclockEnabled: false,
  lastFailure: null,
  lastSavedAt: Date.now(),
  pendingOfflineEarnings: 0,
  hydrated: false,

  getCreditsPerSec: () => {
    const { servers, overclockEnabled } = get();
    return calcCreditsPerSec(servers, overclockEnabled);
  },

  tick: () => {
    const { credits, servers, overclockEnabled } = get();
    const cps = calcCreditsPerSec(servers, overclockEnabled);

    // Overclock failure check — only matters if overclock is on AND there are servers
    if (overclockEnabled) {
      const totalServers = Object.values(servers).reduce((a, b) => a + b, 0);
      if (totalServers > 0 && Math.random() < OVERCLOCK_FAILURE_CHANCE) {
        // Pick a random tier the player owns and wipe it
        const ownedTiers = SERVER_TIERS.filter(
          (t) => (servers[t.id] ?? 0) > 0
        );
        const victim = ownedTiers[Math.floor(Math.random() * ownedTiers.length)];
        const lost = servers[victim.id];
        set({
          credits: credits + cps,
          servers: { ...servers, [victim.id]: 0 },
          overclockEnabled: false,
          lastFailure: { tierId: victim.id, lost },
        });
        return;
      }
    }

    set({ credits: credits + cps });
  },

  addCredits: (amount) => {
    set((state) => ({ credits: state.credits + amount }));
  },

  buyServer: (tierId) => {
    const { credits, servers } = get();
    const tier = SERVER_TIERS.find((t) => t.id === tierId);
    if (!tier) return;

    const owned = servers[tierId] ?? 0;
    const cost = getServerCost(tier, owned);
    if (credits < cost) return;

    set({
      credits: credits - cost,
      servers: { ...servers, [tierId]: owned + 1 },
    });
  },

  toggleOverclock: () => {
    set((state) => ({ overclockEnabled: !state.overclockEnabled }));
  },

  clearFailureNotice: () => {
    set({ lastFailure: null });
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
    const { credits, servers, overclockEnabled, pendingOfflineEarnings } = get();
    const now = Date.now();
    const data: SaveData = {
      credits,
      servers,
      overclockEnabled,
      savedAt: now,
      pendingOfflineEarnings,
    };
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(data));
    set({ lastSavedAt: now });
  },

  loadGame: async () => {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) {
      set({ hydrated: true, lastSavedAt: Date.now() });
      return;
    }

    const data: SaveData = JSON.parse(raw);
    const now = Date.now();

    const elapsedSec = Math.min(
      Math.max((now - data.savedAt) / 1000, 0),
      MAX_OFFLINE_SECONDS
    );

    const cps = calcCreditsPerSec(
      data.servers ?? {},
      data.overclockEnabled ?? false
    );
    const newOffline = elapsedSec * cps * OFFLINE_EFFICIENCY;
    const totalPending = (data.pendingOfflineEarnings || 0) + newOffline;

    set({
      credits: data.credits ?? 0,
      servers: data.servers ?? {},
      overclockEnabled: data.overclockEnabled ?? false,
      pendingOfflineEarnings: totalPending,
      lastSavedAt: now,
      hydrated: true,
    });

    // Persist immediately so we don't double-count this period
    const refreshed: SaveData = {
      credits: data.credits ?? 0,
      servers: data.servers ?? {},
      overclockEnabled: data.overclockEnabled ?? false,
      savedAt: now,
      pendingOfflineEarnings: totalPending,
    };
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(refreshed));
  },
}));
