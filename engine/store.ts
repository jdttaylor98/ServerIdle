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
  CLUSTER_TYPES,
  getClusterCost,
  isClusterUnlocked,
  getTotalClusterOutput,
  getTotalClusterPower,
  getTotalClusterHeat,
} from './clusters';
import {
  ActiveIncident,
  INCIDENT_CONFIG,
  INCIDENT_TRIGGER_CHANCE_PER_SEC,
  pickRandomIncident,
  createIncident,
  getIncidentMultiplier,
} from './incidents';
import {
  UPGRADES,
  isUpgradeAvailable,
  getClickCreditBonus,
  getClickCreditMultiplier,
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

const CRON_JOBS_INTERVAL_SEC = 5; // auto-tap every N seconds when Cron Jobs purchased

const SELL_REFUND_RATIO = 0.5; // refund 50% of the most recent purchase price when selling

export interface GameState {
  credits: number;
  servers: Record<string, number>;
  clusters: Record<string, number>; // cluster type id -> count
  capacity: Record<string, number>; // capacity building id -> count
  upgrades: Record<string, boolean>; // upgrade id -> purchased
  overclockEnabled: boolean;
  cronTickAccumulator: number; // seconds accumulated toward next auto-tap
  activeIncident: ActiveIncident | null;
  vendorDiscountAvailable: boolean; // one-shot 50% off next server purchase
  lastIncidentResolution: {
    type: ActiveIncident['type'];
    success: boolean;
    rewardCredits: number;
    penaltyCredits: number;
  } | null;
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
  sellServer: (tierId: string) => void;
  buildCluster: (clusterId: string) => void;
  sellCluster: (clusterId: string) => void;
  buyCapacityBuilding: (buildingId: string) => void;
  sellCapacityBuilding: (buildingId: string) => void;
  buyUpgrade: (upgradeId: string) => void;
  toggleOverclock: () => void;
  clearFailureNotice: () => void;
  resolveIncident: () => void;
  tapDdosMitigate: () => void;
  acceptVendorOffer: () => void;
  clearIncidentResolution: () => void;
  collectOfflineEarnings: () => Promise<void>;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
}

interface SaveData {
  credits: number;
  servers: Record<string, number>;
  clusters: Record<string, number>;
  capacity: Record<string, number>;
  upgrades: Record<string, boolean>;
  overclockEnabled: boolean;
  vendorDiscountAvailable: boolean;
  savedAt: number;
  pendingOfflineEarnings: number;
}

function calcCreditsPerSec(
  servers: Record<string, number>,
  clusters: Record<string, number>,
  capacity: Record<string, number>,
  upgrades: Record<string, boolean>,
  overclockEnabled: boolean,
  activeIncident: ActiveIncident | null
): number {
  // Sum each tier's output WITH its upgrade multiplier applied
  const serverOutput = SERVER_TIERS.reduce((sum, tier) => {
    const owned = servers[tier.id] ?? 0;
    const tierMult = getServerOutputMultiplier(tier.id, upgrades);
    return sum + getServerOutput(tier, owned) * tierMult;
  }, 0);

  const clusterOutput = getTotalClusterOutput(clusters, upgrades, (tierId) =>
    getServerOutputMultiplier(tierId, upgrades)
  );

  const baseOutput = BASE_CREDITS_PER_SEC + serverOutput + clusterOutput;
  const overclockMult = overclockEnabled ? OVERCLOCK_MULTIPLIER : 1;

  const totalPower = getTotalPowerDraw(servers) + getTotalClusterPower(clusters);
  const totalHeat = getTotalHeatOutput(servers) + getTotalClusterHeat(clusters);

  const powerCap =
    getTotalCapacity(capacity, 'power') + getBonusPowerCapacity(upgrades);
  const powerEff = getEfficiency(totalPower, powerCap);
  const coolingEff = getEfficiency(
    totalHeat,
    getTotalCapacity(capacity, 'cooling')
  );
  const efficiency = Math.min(powerEff, coolingEff);
  const incidentMult = getIncidentMultiplier(activeIncident);

  return baseOutput * overclockMult * efficiency * incidentMult;
}

export const useGameStore = create<GameState>((set, get) => ({
  credits: 0,
  servers: {},
  clusters: {},
  capacity: {},
  upgrades: {},
  overclockEnabled: false,
  cronTickAccumulator: 0,
  activeIncident: null,
  vendorDiscountAvailable: false,
  lastIncidentResolution: null,
  lastFailure: null,
  lastSavedAt: Date.now(),
  pendingOfflineEarnings: 0,
  hydrated: false,

  getCreditsPerSec: () => {
    const { servers, clusters, capacity, upgrades, overclockEnabled, activeIncident } = get();
    return calcCreditsPerSec(
      servers,
      clusters,
      capacity,
      upgrades,
      overclockEnabled,
      activeIncident
    );
  },

  getPowerStats: () => {
    const { servers, clusters, capacity, upgrades } = get();
    const used = getTotalPowerDraw(servers) + getTotalClusterPower(clusters);
    const cap =
      getTotalCapacity(capacity, 'power') + getBonusPowerCapacity(upgrades);
    return { used, capacity: cap, efficiency: getEfficiency(used, cap) };
  },

  getCoolingStats: () => {
    const { servers, clusters, capacity } = get();
    const used = getTotalHeatOutput(servers) + getTotalClusterHeat(clusters);
    const cap = getTotalCapacity(capacity, 'cooling');
    return { used, capacity: cap, efficiency: getEfficiency(used, cap) };
  },

  getEfficiencyMultiplier: () => {
    const { servers, clusters, capacity, upgrades } = get();
    const powerCap =
      getTotalCapacity(capacity, 'power') + getBonusPowerCapacity(upgrades);
    const totalPower =
      getTotalPowerDraw(servers) + getTotalClusterPower(clusters);
    const totalHeat =
      getTotalHeatOutput(servers) + getTotalClusterHeat(clusters);
    const powerEff = getEfficiency(totalPower, powerCap);
    const coolingEff = getEfficiency(
      totalHeat,
      getTotalCapacity(capacity, 'cooling')
    );
    return Math.min(powerEff, coolingEff);
  },

  tick: () => {
    const {
      credits,
      servers,
      clusters,
      capacity,
      upgrades,
      overclockEnabled,
      cronTickAccumulator,
      activeIncident,
    } = get();

    // ─── Incident expiration / random trigger ───
    let nextIncident = activeIncident;
    let incidentPenalty = 0;
    let incidentResolution: GameState['lastIncidentResolution'] = null;
    if (nextIncident && Date.now() >= nextIncident.expiresAt) {
      // Timed out
      const baseCps = calcCreditsPerSec(servers, clusters, capacity, upgrades, false, null);
      if (nextIncident.type === 'ddos') {
        incidentPenalty = baseCps * INCIDENT_CONFIG.ddos.timeoutPenaltySecondsOfCps;
        incidentResolution = {
          type: 'ddos',
          success: false,
          rewardCredits: 0,
          penaltyCredits: incidentPenalty,
        };
      } else {
        // disk_full, vendor_offer just expire silently
        incidentResolution = {
          type: nextIncident.type,
          success: false,
          rewardCredits: 0,
          penaltyCredits: 0,
        };
      }
      nextIncident = null;
    } else if (!nextIncident) {
      // Roll for a new incident — only after the player has any servers/clusters
      const totalServers = Object.values(servers).reduce((a, b) => a + b, 0);
      const totalClusters = Object.values(clusters).reduce((a, b) => a + b, 0);
      if (
        totalServers + totalClusters > 0 &&
        Math.random() < INCIDENT_TRIGGER_CHANCE_PER_SEC
      ) {
        nextIncident = createIncident(pickRandomIncident());
      }
    }

    const cps = calcCreditsPerSec(
      servers,
      clusters,
      capacity,
      upgrades,
      overclockEnabled,
      nextIncident
    );

    // Cron Jobs: auto-tap every 5 seconds if purchased
    let cronAccum = cronTickAccumulator + 1;
    let cronCredits = 0;
    if (hasCronJobs(upgrades) && cronAccum >= CRON_JOBS_INTERVAL_SEC) {
      const taps = Math.floor(cronAccum / CRON_JOBS_INTERVAL_SEC);
      cronAccum = cronAccum % CRON_JOBS_INTERVAL_SEC;
      const perTap =
        (1 + getClickCreditBonus(upgrades)) * getClickCreditMultiplier(upgrades);
      cronCredits = perTap * taps;
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
          credits: Math.max(0, credits + cps + cronCredits - incidentPenalty),
          servers: lost
            ? { ...servers, [victim.id]: servers[victim.id] - lost }
            : servers,
          overclockEnabled: false,
          cronTickAccumulator: cronAccum,
          activeIncident: nextIncident,
          lastIncidentResolution: incidentResolution,
          lastFailure: { tierId: victim.id, lost },
        });
        return;
      }
    }

    set({
      credits: Math.max(0, credits + cps + cronCredits - incidentPenalty),
      cronTickAccumulator: cronAccum,
      activeIncident: nextIncident,
      lastIncidentResolution: incidentResolution,
    });
  },

  addCredits: (amount) => {
    set((state) => ({ credits: state.credits + amount }));
  },

  tapProvision: () => {
    const { credits, upgrades } = get();
    const tapCredits =
      (1 + getClickCreditBonus(upgrades)) * getClickCreditMultiplier(upgrades);
    set({ credits: credits + tapCredits });
  },

  buyServer: (tierId) => {
    const { credits, servers, vendorDiscountAvailable } = get();
    const tier = SERVER_TIERS.find((t) => t.id === tierId);
    if (!tier) return;

    const owned = servers[tierId] ?? 0;
    const fullCost = getServerCost(tier, owned);
    const cost = vendorDiscountAvailable ? Math.floor(fullCost * 0.5) : fullCost;
    if (credits < cost) return;

    set({
      credits: credits - cost,
      servers: { ...servers, [tierId]: owned + 1 },
      vendorDiscountAvailable: false, // consumed
    });
  },

  sellServer: (tierId) => {
    const { credits, servers } = get();
    const tier = SERVER_TIERS.find((t) => t.id === tierId);
    if (!tier) return;
    const owned = servers[tierId] ?? 0;
    if (owned <= 0) return;

    // Refund half of what the most recent unit cost
    const refund = Math.floor(getServerCost(tier, owned - 1) * SELL_REFUND_RATIO);
    set({
      credits: credits + refund,
      servers: { ...servers, [tierId]: owned - 1 },
    });
  },

  buildCluster: (clusterId) => {
    const { credits, servers, clusters, upgrades } = get();
    const type = CLUSTER_TYPES.find((c) => c.id === clusterId);
    if (!type) return;
    if (!isClusterUnlocked(type, upgrades)) return;

    const owned = clusters[clusterId] ?? 0;
    const cost = getClusterCost(type, owned);
    if (credits < cost) return;

    const sourceOwned = servers[type.sourceTierId] ?? 0;
    if (sourceOwned < type.sourceCount) return;

    set({
      credits: credits - cost,
      servers: {
        ...servers,
        [type.sourceTierId]: sourceOwned - type.sourceCount,
      },
      clusters: { ...clusters, [clusterId]: owned + 1 },
    });
  },

  sellCluster: (clusterId) => {
    const { credits, clusters } = get();
    const type = CLUSTER_TYPES.find((c) => c.id === clusterId);
    if (!type) return;
    const owned = clusters[clusterId] ?? 0;
    if (owned <= 0) return;

    // Refund half of what the most recent cluster cost (consumed servers don't return)
    const refund = Math.floor(getClusterCost(type, owned - 1) * SELL_REFUND_RATIO);
    set({
      credits: credits + refund,
      clusters: { ...clusters, [clusterId]: owned - 1 },
    });
  },

  buyCapacityBuilding: (buildingId) => {
    const { credits, capacity } = get();
    const building = CAPACITY_BUILDINGS.find((b) => b.id === buildingId);
    if (!building) return;

    const owned = capacity[buildingId] ?? 0;
    const cost = getCapacityBuildingCost(building, owned);
    if (credits < cost) return;

    set({
      credits: credits - cost,
      capacity: { ...capacity, [buildingId]: owned + 1 },
    });
  },

  sellCapacityBuilding: (buildingId) => {
    const { credits, capacity } = get();
    const building = CAPACITY_BUILDINGS.find((b) => b.id === buildingId);
    if (!building) return;
    const owned = capacity[buildingId] ?? 0;
    if (owned <= 0) return;

    const refund = Math.floor(
      getCapacityBuildingCost(building, owned - 1) * SELL_REFUND_RATIO
    );
    set({
      credits: credits + refund,
      capacity: { ...capacity, [buildingId]: owned - 1 },
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

  // ─── Incident actions ───
  resolveIncident: () => {
    // Generic single-tap resolve (used by Disk Full)
    const { credits, activeIncident, servers, clusters, capacity, upgrades } = get();
    if (!activeIncident) return;
    if (activeIncident.type === 'ddos' || activeIncident.type === 'vendor_offer') return;

    const baseCps = calcCreditsPerSec(servers, clusters, capacity, upgrades, false, null);
    const reward =
      baseCps * INCIDENT_CONFIG[activeIncident.type].rewardSecondsOfCps;

    set({
      credits: credits + reward,
      activeIncident: null,
      lastIncidentResolution: {
        type: activeIncident.type,
        success: true,
        rewardCredits: reward,
        penaltyCredits: 0,
      },
    });
  },

  tapDdosMitigate: () => {
    const { credits, activeIncident, servers, clusters, capacity, upgrades } = get();
    if (!activeIncident || activeIncident.type !== 'ddos') return;

    const remaining = activeIncident.tapsRemaining - 1;
    if (remaining > 0) {
      set({ activeIncident: { ...activeIncident, tapsRemaining: remaining } });
      return;
    }

    // Mitigation complete
    const baseCps = calcCreditsPerSec(servers, clusters, capacity, upgrades, false, null);
    const reward = baseCps * INCIDENT_CONFIG.ddos.rewardSecondsOfCps;
    set({
      credits: credits + reward,
      activeIncident: null,
      lastIncidentResolution: {
        type: 'ddos',
        success: true,
        rewardCredits: reward,
        penaltyCredits: 0,
      },
    });
  },

  acceptVendorOffer: () => {
    const { activeIncident } = get();
    if (!activeIncident || activeIncident.type !== 'vendor_offer') return;

    set({
      activeIncident: null,
      vendorDiscountAvailable: true,
      lastIncidentResolution: {
        type: 'vendor_offer',
        success: true,
        rewardCredits: 0,
        penaltyCredits: 0,
      },
    });
  },

  clearIncidentResolution: () => {
    set({ lastIncidentResolution: null });
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
      clusters,
      capacity,
      upgrades,
      overclockEnabled,
      vendorDiscountAvailable,
      pendingOfflineEarnings,
    } = get();
    const now = Date.now();
    const data: SaveData = {
      credits,
      servers,
      clusters,
      capacity,
      upgrades,
      overclockEnabled,
      vendorDiscountAvailable,
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

    const savedUpgrades = data.upgrades ?? {};
    const savedClusters = data.clusters ?? {};
    const savedVendorDiscount = data.vendorDiscountAvailable ?? false;
    const cps = calcCreditsPerSec(
      data.servers ?? {},
      savedClusters,
      data.capacity ?? {},
      savedUpgrades,
      data.overclockEnabled ?? false,
      null
    );
    const newOffline = elapsedSec * cps * OFFLINE_EFFICIENCY;
    const totalPending = (data.pendingOfflineEarnings || 0) + newOffline;

    set({
      credits: data.credits ?? 0,
      servers: data.servers ?? {},
      clusters: savedClusters,
      capacity: data.capacity ?? {},
      upgrades: savedUpgrades,
      overclockEnabled: data.overclockEnabled ?? false,
      vendorDiscountAvailable: savedVendorDiscount,
      activeIncident: null, // don't carry an incident across loads
      pendingOfflineEarnings: totalPending,
      lastSavedAt: now,
      hydrated: true,
    });

    const refreshed: SaveData = {
      credits: data.credits ?? 0,
      servers: data.servers ?? {},
      clusters: savedClusters,
      capacity: data.capacity ?? {},
      upgrades: savedUpgrades,
      overclockEnabled: data.overclockEnabled ?? false,
      vendorDiscountAvailable: savedVendorDiscount,
      savedAt: now,
      pendingOfflineEarnings: totalPending,
    };
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(refreshed));
  },
}));
