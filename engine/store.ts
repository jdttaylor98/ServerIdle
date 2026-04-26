import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SERVER_TIERS,
  getServerCost,
  getServerOutput,
  getTotalPowerDraw,
  getTotalHeatOutput,
} from './servers';
import {
  CAPACITY_BUILDINGS,
  getCapacityBuildingCost,
  getTotalCapacity,
  getEfficiency,
} from './capacity';
import {
  UPGRADES,
  isUpgradeAvailable,
  getClickCreditBonus,
  getClickCreditMultiplier,
  getClickUptimeBonus,
  getServerOutputMultiplier,
  getOverclockFailureLost,
  hasCronJobs,
  getBonusPowerCapacity,
} from './upgrades';

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

const CRON_JOBS_INTERVAL_SEC = 5; // auto-tap every N seconds when Cron Jobs purchased

export interface GameState {
  credits: number;
  servers: Record<string, number>;
  capacity: Record<string, number>; // capacity building id -> count
  upgrades: Record<string, boolean>; // upgrade id -> purchased
  overclockEnabled: boolean;
  uptime: number; // 0-100, global output multiplier (with floor)
  cronTickAccumulator: number; // seconds accumulated toward next auto-tap
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
  buyUpgrade: (upgradeId: string) => void;
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
  upgrades: Record<string, boolean>;
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
  upgrades: Record<string, boolean>,
  overclockEnabled: boolean,
  uptime: number
): number {
  // Sum each tier's output WITH its upgrade multiplier applied
  const baseOutput =
    BASE_CREDITS_PER_SEC +
    SERVER_TIERS.reduce((sum, tier) => {
      const owned = servers[tier.id] ?? 0;
      const tierMult = getServerOutputMultiplier(tier.id, upgrades);
      return sum + getServerOutput(tier, owned) * tierMult;
    }, 0);

  const overclockMult = overclockEnabled ? OVERCLOCK_MULTIPLIER : 1;

  const powerCap =
    getTotalCapacity(capacity, 'power') + getBonusPowerCapacity(upgrades);
  const powerEff = getEfficiency(getTotalPowerDraw(servers), powerCap);
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
  upgrades: {},
  overclockEnabled: false,
  uptime: 100,
  cronTickAccumulator: 0,
  lastFailure: null,
  lastSavedAt: Date.now(),
  pendingOfflineEarnings: 0,
  hydrated: false,

  getCreditsPerSec: () => {
    const { servers, capacity, upgrades, overclockEnabled, uptime } = get();
    return calcCreditsPerSec(servers, capacity, upgrades, overclockEnabled, uptime);
  },

  getPowerStats: () => {
    const { servers, capacity, upgrades } = get();
    const used = getTotalPowerDraw(servers);
    const cap = getTotalCapacity(capacity, 'power') + getBonusPowerCapacity(upgrades);
    return { used, capacity: cap, efficiency: getEfficiency(used, cap) };
  },

  getCoolingStats: () => {
    const { servers, capacity } = get();
    const used = getTotalHeatOutput(servers);
    const cap = getTotalCapacity(capacity, 'cooling');
    return { used, capacity: cap, efficiency: getEfficiency(used, cap) };
  },

  getEfficiencyMultiplier: () => {
    const { servers, capacity, upgrades } = get();
    const powerCap =
      getTotalCapacity(capacity, 'power') + getBonusPowerCapacity(upgrades);
    const powerEff = getEfficiency(getTotalPowerDraw(servers), powerCap);
    const coolingEff = getEfficiency(
      getTotalHeatOutput(servers),
      getTotalCapacity(capacity, 'cooling')
    );
    return Math.min(powerEff, coolingEff);
  },

  tick: () => {
    const {
      credits,
      servers,
      capacity,
      upgrades,
      overclockEnabled,
      uptime,
      cronTickAccumulator,
    } = get();
    const cps = calcCreditsPerSec(
      servers,
      capacity,
      upgrades,
      overclockEnabled,
      uptime
    );
    const newUptime = Math.max(0, uptime - UPTIME_DECAY_PER_TICK);

    // Cron Jobs: auto-tap every 5 seconds if purchased
    let cronAccum = cronTickAccumulator + 1;
    let cronCredits = 0;
    let cronUptime = 0;
    if (hasCronJobs(upgrades) && cronAccum >= CRON_JOBS_INTERVAL_SEC) {
      const taps = Math.floor(cronAccum / CRON_JOBS_INTERVAL_SEC);
      cronAccum = cronAccum % CRON_JOBS_INTERVAL_SEC;
      const perTap =
        (1 + getClickCreditBonus(upgrades)) * getClickCreditMultiplier(upgrades);
      cronCredits = perTap * taps;
      cronUptime = (UPTIME_GAIN_TAP + getClickUptimeBonus(upgrades)) * taps;
    }

    if (overclockEnabled) {
      const totalServers = Object.values(servers).reduce((a, b) => a + b, 0);
      if (totalServers > 0 && Math.random() < OVERCLOCK_FAILURE_CHANCE) {
        const lost = getOverclockFailureLost(upgrades);
        const ownedTiers = SERVER_TIERS.filter(
          (t) => (servers[t.id] ?? 0) > 0
        );
        const victim =
          ownedTiers[Math.floor(Math.random() * ownedTiers.length)];
        set({
          credits: credits + cps + cronCredits,
          servers: lost
            ? { ...servers, [victim.id]: servers[victim.id] - lost }
            : servers,
          overclockEnabled: false,
          uptime: Math.min(100, newUptime + cronUptime),
          cronTickAccumulator: cronAccum,
          lastFailure: { tierId: victim.id, lost },
        });
        return;
      }
    }

    set({
      credits: credits + cps + cronCredits,
      uptime: Math.min(100, newUptime + cronUptime),
      cronTickAccumulator: cronAccum,
    });
  },

  addCredits: (amount) => {
    set((state) => ({ credits: state.credits + amount }));
  },

  tapProvision: () => {
    const { credits, uptime, upgrades } = get();
    const tapCredits =
      (1 + getClickCreditBonus(upgrades)) * getClickCreditMultiplier(upgrades);
    const tapUptime = UPTIME_GAIN_TAP + getClickUptimeBonus(upgrades);
    set({
      credits: credits + tapCredits,
      uptime: Math.min(100, uptime + tapUptime),
    });
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

  buyUpgrade: (upgradeId) => {
    const { credits, upgrades, servers } = get();
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return;
    if (upgrades[upgradeId]) return; // already owned
    if (!isUpgradeAvailable(upgrade, upgrades, servers)) return;
    if (credits < upgrade.cost) return;

    set({
      credits: credits - upgrade.cost,
      upgrades: { ...upgrades, [upgradeId]: true },
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
    const {
      credits,
      servers,
      capacity,
      upgrades,
      overclockEnabled,
      uptime,
      pendingOfflineEarnings,
    } = get();
    const now = Date.now();
    const data: SaveData = {
      credits,
      servers,
      capacity,
      upgrades,
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
    const savedUpgrades = data.upgrades ?? {};
    const cps = calcCreditsPerSec(
      data.servers ?? {},
      data.capacity ?? {},
      savedUpgrades,
      data.overclockEnabled ?? false,
      savedUptime
    );
    const newOffline = elapsedSec * cps * OFFLINE_EFFICIENCY;
    const totalPending = (data.pendingOfflineEarnings || 0) + newOffline;

    set({
      credits: data.credits ?? 0,
      servers: data.servers ?? {},
      capacity: data.capacity ?? {},
      upgrades: savedUpgrades,
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
      upgrades: savedUpgrades,
      overclockEnabled: data.overclockEnabled ?? false,
      uptime: savedUptime,
      savedAt: now,
      pendingOfflineEarnings: totalPending,
    };
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(refreshed));
  },
}));
