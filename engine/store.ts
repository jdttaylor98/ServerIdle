import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SERVER_TIERS,
  getServerCost,
  getTotalOutput,
  getTotalPowerDraw,
  getTotalHeatOutput,
} from './servers';
import {
  CAPACITY_BUILDINGS,
  getCapacityBuildingCost,
  getTotalCapacity,
  getEfficiency,
} from './capacity';

const SAVE_KEY = 'serverIdle_save';
const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // 8 hour cap
const OFFLINE_EFFICIENCY = 0.5; // earn at 50% rate while offline

const BASE_CREDITS_PER_SEC = 0; // no passive income without servers

const OVERCLOCK_MULTIPLIER = 1.5; // +50% output
const OVERCLOCK_FAILURE_CHANCE = 0.005; // 0.5% per tick

const UPTIME_DECAY_PER_TICK = 0.2; // % per second while foregrounded
const UPTIME_FLOOR = 50; // never drops below this
const UPTIME_GAIN_TAP = 2;
const UPTIME_GAIN_PURCHASE = 5;

export interface GameState {
  credits: number;
  servers: Record<string, number>;
  capacity: Record<string, number>; // capacity building id -> count
  overclockEnabled: boolean;
  uptime: number; // 0-100, global output multiplier (with floor)
  lastFailure: { tierId: string; lost: number } | null;

  lastSavedAt: number;
  pendingOfflineEarnings: number;
  hydrated: boolean;

  // Derived getters
  getCreditsPerSec: () => number;
  getPowerStats: () => { used: number; capacity: number; efficiency: number };
  getCoolingStats: () => { used: number; capacity: number; efficiency: number };
  getEfficiencyMultiplier: () => number;

  // Actions
  tick: () => void;
  addCredits: (amount: number) => void;
  tapProvision: () => void;
  buyServer: (tierId: string) => void;
  buyCapacityBuilding: (buildingId: string) => void;
  toggleOverclock: () => void;
  clearFailureNotice: () => void;
  collectOfflineEarnings: () => Promise<void>;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
}

interface SaveData {
  credits: number;
  servers: Record<string, number>;
  capacity: Record<string, number>;
  overclockEnabled: boolean;
  uptime: number;
  savedAt: number;
  pendingOfflineEarnings: number;
}

function getUptimeMultiplier(uptime: number): number {
  return Math.max(UPTIME_FLOOR, uptime) / 100;
}

function calcCreditsPerSec(
  servers: Record<string, number>,
  capacity: Record<string, number>,
  overclockEnabled: boolean,
  uptime: number
): number {
  const baseOutput = BASE_CREDITS_PER_SEC + getTotalOutput(servers);
  const overclockMult = overclockEnabled ? OVERCLOCK_MULTIPLIER : 1;

  const powerEff = getEfficiency(
    getTotalPowerDraw(servers),
    getTotalCapacity(capacity, 'power')
  );
  const coolingEff = getEfficiency(
    getTotalHeatOutput(servers),
    getTotalCapacity(capacity, 'cooling')
  );
  const efficiency = Math.min(powerEff, coolingEff);
  const uptimeMult = getUptimeMultiplier(uptime);

  return baseOutput * overclockMult * efficiency * uptimeMult;
}

export const useGameStore = create<GameState>((set, get) => ({
  credits: 0,
  servers: {},
  capacity: {},
  overclockEnabled: false,
  uptime: 100,
  lastFailure: null,
  lastSavedAt: Date.now(),
  pendingOfflineEarnings: 0,
  hydrated: false,

  getCreditsPerSec: () => {
    const { servers, capacity, overclockEnabled, uptime } = get();
    return calcCreditsPerSec(servers, capacity, overclockEnabled, uptime);
  },

  getPowerStats: () => {
    const { servers, capacity } = get();
    const used = getTotalPowerDraw(servers);
    const cap = getTotalCapacity(capacity, 'power');
    return { used, capacity: cap, efficiency: getEfficiency(used, cap) };
  },

  getCoolingStats: () => {
    const { servers, capacity } = get();
    const used = getTotalHeatOutput(servers);
    const cap = getTotalCapacity(capacity, 'cooling');
    return { used, capacity: cap, efficiency: getEfficiency(used, cap) };
  },

  getEfficiencyMultiplier: () => {
    const { servers, capacity } = get();
    const powerEff = getEfficiency(
      getTotalPowerDraw(servers),
      getTotalCapacity(capacity, 'power')
    );
    const coolingEff = getEfficiency(
      getTotalHeatOutput(servers),
      getTotalCapacity(capacity, 'cooling')
    );
    return Math.min(powerEff, coolingEff);
  },

  tick: () => {
    const { credits, servers, capacity, overclockEnabled, uptime } = get();
    const cps = calcCreditsPerSec(servers, capacity, overclockEnabled, uptime);
    const newUptime = Math.max(0, uptime - UPTIME_DECAY_PER_TICK);

    if (overclockEnabled) {
      const totalServers = Object.values(servers).reduce((a, b) => a + b, 0);
      if (totalServers > 0 && Math.random() < OVERCLOCK_FAILURE_CHANCE) {
        const ownedTiers = SERVER_TIERS.filter(
          (t) => (servers[t.id] ?? 0) > 0
        );
        const victim =
          ownedTiers[Math.floor(Math.random() * ownedTiers.length)];
        set({
          credits: credits + cps,
          servers: { ...servers, [victim.id]: servers[victim.id] - 1 },
          overclockEnabled: false,
          uptime: newUptime,
          lastFailure: { tierId: victim.id, lost: 1 },
        });
        return;
      }
    }

    set({ credits: credits + cps, uptime: newUptime });
  },

  addCredits: (amount) => {
    set((state) => ({ credits: state.credits + amount }));
  },

  tapProvision: () => {
    set((state) => ({
      credits: state.credits + 1,
      uptime: Math.min(100, state.uptime + UPTIME_GAIN_TAP),
    }));
  },

  buyServer: (tierId) => {
    const { credits, servers, uptime } = get();
    const tier = SERVER_TIERS.find((t) => t.id === tierId);
    if (!tier) return;

    const owned = servers[tierId] ?? 0;
    const cost = getServerCost(tier, owned);
    if (credits < cost) return;

    set({
      credits: credits - cost,
      servers: { ...servers, [tierId]: owned + 1 },
      uptime: Math.min(100, uptime + UPTIME_GAIN_PURCHASE),
    });
  },

  buyCapacityBuilding: (buildingId) => {
    const { credits, capacity, uptime } = get();
    const building = CAPACITY_BUILDINGS.find((b) => b.id === buildingId);
    if (!building) return;

    const owned = capacity[buildingId] ?? 0;
    const cost = getCapacityBuildingCost(building, owned);
    if (credits < cost) return;

    set({
      credits: credits - cost,
      capacity: { ...capacity, [buildingId]: owned + 1 },
      uptime: Math.min(100, uptime + UPTIME_GAIN_PURCHASE),
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
    const { credits, servers, capacity, overclockEnabled, uptime, pendingOfflineEarnings } = get();
    const now = Date.now();
    const data: SaveData = {
      credits,
      servers,
      capacity,
      overclockEnabled,
      uptime,
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

    const savedUptime = data.uptime ?? 100;
    const cps = calcCreditsPerSec(
      data.servers ?? {},
      data.capacity ?? {},
      data.overclockEnabled ?? false,
      savedUptime
    );
    const newOffline = elapsedSec * cps * OFFLINE_EFFICIENCY;
    const totalPending = (data.pendingOfflineEarnings || 0) + newOffline;

    set({
      credits: data.credits ?? 0,
      servers: data.servers ?? {},
      capacity: data.capacity ?? {},
      overclockEnabled: data.overclockEnabled ?? false,
      uptime: savedUptime,
      pendingOfflineEarnings: totalPending,
      lastSavedAt: now,
      hydrated: true,
    });

    const refreshed: SaveData = {
      credits: data.credits ?? 0,
      servers: data.servers ?? {},
      capacity: data.capacity ?? {},
      overclockEnabled: data.overclockEnabled ?? false,
      uptime: savedUptime,
      savedAt: now,
      pendingOfflineEarnings: totalPending,
    };
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(refreshed));
  },
}));
