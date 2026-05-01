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
  STAFF_ROLES,
  GateState,
  getHireCost,
  getStaffOutputMultiplier,
  getTotalSalary,
  getOverclockFailureMultiplier,
  getIncidentWeightModifiers,
  getTotalStaffCount,
  getResearchPointsPerSec,
} from './staff';
import {
  RESEARCH_NODES,
  isResearchAvailable,
  getResearchOutputMultiplier,
  getResearchClickMultiplier,
  getResearchRpMultiplier,
  getResearchCoolingMultiplier,
  getResearchPowerDrawMultiplier,
} from './research';
import {
  CLOUD_REGIONS,
  getOwnedRegionsOutput,
  getOwnedRegionsPower,
  getOwnedRegionsHeat,
  getOwnedRegionsCost,
} from './regions';
import {
  GPU_TIERS,
  getGpuCost,
  getTotalGpuOutput,
  getTotalGpuRpOutput,
  getTotalGpuPower,
  getTotalGpuHeat,
} from './gpus';
import {
  AGENT_TYPES,
  getTotalAgentSalary,
  getDevOpsInterval,
  getDevOpsMinEfficiency,
  getResponderDelay,
  getResponderRewardMult,
  shouldOverclock,
} from './agents';
import { calcSkillPointsEarned } from './prestige';
import {
  SKILL_NODES,
  isSkillAvailable,
  getSkillStartingCredits,
  getSkillStartingServers,
  getSkillServerCostMult,
  getSkillBuildTimeMult,
  getSkillServerOutputMult,
  getSkillUpgradeCostMult,
  getSkillResearchMult,
  getSkillTapBonus,
  getSkillStaffCostMult,
  getSkillCloudCostMult,
  getSkillOfflineEfficiency,
  getSkillDdosTapReduction,
  getSkillTimeoutPenaltyMult,
  getSkillIncidentRewardMult,
  getSkillIncidentTimerBonus,
  getSkillOverclockFailureMult,
  getSkillIncidentTriggerMult,
  getSkillHackerRewardMult,
  getSkillGpuOutputMult,
  getSkillGpuRpMult,
  getSkillAgentCostMult,
  getSkillAgentSalaryMult,
  getSkillResponderBonus,
  getSkillAgentSpeedMult,
  getSkillBonusPower,
  getSkillBonusCooling,
} from './skillTree';
import {
  UPGRADES,
  isUpgradeAvailable,
  getClickCreditBonus,
  getClickCreditMultiplier,
  getServerOutputMultiplier,
  getOverclockFailureChanceMultiplier,
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
const STAFF_REFUND_RATIO = 0.5; // 50% refund when firing staff

export interface GameState {
  credits: number;
  researchPoints: number;
  servers: Record<string, number>;
  clusters: Record<string, number>; // cluster type id -> count
  gpus: Record<string, number>; // gpu tier id -> count
  capacity: Record<string, number>; // capacity building id -> count
  upgrades: Record<string, boolean>; // upgrade id -> purchased
  research: Record<string, boolean>; // research node id -> purchased
  regions: Record<string, boolean>; // cloud region id -> owned
  staff: Record<string, number>; // role id -> count hired
  agents: Record<string, boolean>; // agent id -> hired
  agentAutonomy: number; // 1–10 global autonomy slider
  agentDevOpsAccum: number; // seconds since last DevOps Agent auto-buy
  agentResponderAccum: number; // seconds since incident started (for auto-resolve delay)
  highestCredits: number; // peak credits this run (watermark for prestige SP calc)
  skillPoints: number; // permanent SP earned across prestiges
  prestigeCount: number; // how many times player has prestiged
  skills: Record<string, boolean>; // skill tree nodes purchased with SP
  totalStaffEverHired: number; // cumulative count for "hire 10 staff" gate
  activeBuild: {
    kind: 'server' | 'region' | 'gpu';
    id: string;
    startedAt: number;
    completesAt: number;
  } | null;
  overclockEnabled: boolean;
  cronTickAccumulator: number; // seconds accumulated toward next auto-tap
  activeIncident: ActiveIncident | null;
  vendorDiscountAvailable: boolean; // one-shot 50% off next server purchase
  // Event flags for staff unlock gates
  ddosResolvedCount: number;
  diskFullResolvedCount: number;
  vendorOfferAcceptedCount: number;
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
  getNetCreditsPerSec: () => number;
  getTotalSalary: () => number;
  getCloudOperatingCost: () => number;
  getAgentSalary: () => number;
  getGateState: () => GateState;
  getPowerStats: () => { used: number; capacity: number; efficiency: number };
  getCoolingStats: () => { used: number; capacity: number; efficiency: number };
  getEfficiencyMultiplier: () => number;

  // Actions
  tick: () => void;
  addCredits: (amount: number) => void;
  tapProvision: () => void;
  buyServer: (tierId: string) => void;
  sellServer: (tierId: string) => void;
  buyGpu: (tierId: string) => void;
  sellGpu: (tierId: string) => void;
  buyRegion: (regionId: string) => void;
  sellRegion: (regionId: string) => void;
  cancelBuild: () => void;
  buildCluster: (clusterId: string) => void;
  sellCluster: (clusterId: string) => void;
  buyCapacityBuilding: (buildingId: string) => void;
  sellCapacityBuilding: (buildingId: string) => void;
  buyUpgrade: (upgradeId: string) => void;
  buyResearch: (nodeId: string) => void;
  hireStaff: (roleId: string) => void;
  fireStaff: (roleId: string) => void;
  hireAgent: (agentId: string) => void;
  fireAgent: (agentId: string) => void;
  setAgentAutonomy: (level: number) => void;
  prestige: () => void;
  buySkill: (skillId: string) => void;
  toggleOverclock: () => void;
  clearFailureNotice: () => void;
  resolveIncident: () => void;
  tapDdosMitigate: () => void;
  tapHackerSequence: (letter: string) => void;
  acceptVendorOffer: () => void;
  clearIncidentResolution: () => void;
  // DEV ONLY — remove before ship
  devTriggerIncident: (type: import('./incidents').IncidentType) => void;
  devSkipBuild: () => void;
  devAddResearchPoints: (n: number) => void;
  devResetGame: () => Promise<void>;
  collectOfflineEarnings: () => Promise<void>;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
}

interface SaveData {
  credits: number;
  researchPoints: number;
  servers: Record<string, number>;
  clusters: Record<string, number>;
  gpus: Record<string, number>;
  capacity: Record<string, number>;
  upgrades: Record<string, boolean>;
  research: Record<string, boolean>;
  regions: Record<string, boolean>;
  staff: Record<string, number>;
  agents: Record<string, boolean>;
  agentAutonomy: number;
  highestCredits: number;
  skillPoints: number;
  prestigeCount: number;
  skills: Record<string, boolean>;
  totalStaffEverHired: number;
  activeBuild: GameState['activeBuild'];
  overclockEnabled: boolean;
  vendorDiscountAvailable: boolean;
  ddosResolvedCount: number;
  diskFullResolvedCount: number;
  vendorOfferAcceptedCount: number;
  savedAt: number;
  pendingOfflineEarnings: number;
}

function calcCreditsPerSec(
  servers: Record<string, number>,
  clusters: Record<string, number>,
  gpus: Record<string, number>,
  capacity: Record<string, number>,
  upgrades: Record<string, boolean>,
  staff: Record<string, number>,
  research: Record<string, boolean>,
  regions: Record<string, boolean>,
  overclockEnabled: boolean,
  activeIncident: ActiveIncident | null,
  skills: Record<string, boolean> = {}
): number {
  const skillServerMult = getSkillServerOutputMult(skills);
  const skillGpuMult = getSkillGpuOutputMult(skills);

  // Sum each tier's output WITH its upgrade multiplier applied
  const serverOutput = SERVER_TIERS.reduce((sum, tier) => {
    const owned = servers[tier.id] ?? 0;
    const tierMult = getServerOutputMultiplier(tier.id, upgrades);
    return sum + getServerOutput(tier, owned) * tierMult;
  }, 0) * skillServerMult;

  const clusterOutput = getTotalClusterOutput(clusters, upgrades, (tierId) =>
    getServerOutputMultiplier(tierId, upgrades)
  ) * skillServerMult; // clusters are server-based, scale with server skill

  const regionsOutput = getOwnedRegionsOutput(regions);
  const gpuOutput = getTotalGpuOutput(gpus) * skillGpuMult;

  const staffMult = getStaffOutputMultiplier(staff);
  const researchMult = getResearchOutputMultiplier(research);
  const baseOutput =
    BASE_CREDITS_PER_SEC +
    (serverOutput + clusterOutput + regionsOutput + gpuOutput) * staffMult * researchMult;
  const overclockMult = overclockEnabled ? OVERCLOCK_MULTIPLIER : 1;

  const powerDrawMult = getResearchPowerDrawMultiplier(research);
  const coolingCapMult = getResearchCoolingMultiplier(research);
  const totalPower =
    (getTotalPowerDraw(servers) +
      getTotalClusterPower(clusters) +
      getOwnedRegionsPower(regions) +
      getTotalGpuPower(gpus)) *
    powerDrawMult;
  const totalHeat =
    getTotalHeatOutput(servers) +
    getTotalClusterHeat(clusters) +
    getOwnedRegionsHeat(regions) +
    getTotalGpuHeat(gpus);

  const powerCap =
    getTotalCapacity(capacity, 'power') + getBonusPowerCapacity(upgrades) + getSkillBonusPower(skills);
  const powerEff = getEfficiency(totalPower, powerCap);
  const coolingEff = getEfficiency(
    totalHeat,
    getTotalCapacity(capacity, 'cooling') * coolingCapMult + getSkillBonusCooling(skills)
  );
  const efficiency = Math.min(powerEff, coolingEff);
  const incidentMult = getIncidentMultiplier(activeIncident);

  return baseOutput * overclockMult * efficiency * incidentMult;
}

export const useGameStore = create<GameState>((set, get) => ({
  credits: 0,
  researchPoints: 0,
  servers: {},
  clusters: {},
  gpus: {},
  capacity: {},
  upgrades: {},
  research: {},
  regions: {},
  staff: {},
  agents: {},
  agentAutonomy: 5,
  agentDevOpsAccum: 0,
  agentResponderAccum: 0,
  highestCredits: 0,
  skillPoints: 0,
  prestigeCount: 0,
  skills: {},
  totalStaffEverHired: 0,
  activeBuild: null,
  overclockEnabled: false,
  cronTickAccumulator: 0,
  activeIncident: null,
  vendorDiscountAvailable: false,
  ddosResolvedCount: 0,
  diskFullResolvedCount: 0,
  vendorOfferAcceptedCount: 0,
  lastIncidentResolution: null,
  lastFailure: null,
  lastSavedAt: Date.now(),
  pendingOfflineEarnings: 0,
  hydrated: false,

  getCreditsPerSec: () => {
    const { servers, clusters, gpus, capacity, upgrades, staff, research, regions, overclockEnabled, activeIncident, skills } = get();
    return calcCreditsPerSec(
      servers,
      clusters,
      gpus,
      capacity,
      upgrades,
      staff,
      research,
      regions,
      overclockEnabled,
      activeIncident,
      skills
    );
  },

  getNetCreditsPerSec: () => {
    const cps = get().getCreditsPerSec();
    const salary = getTotalSalary(get().staff);
    const cloudCost = getOwnedRegionsCost(get().regions);
    const agentSalary = getTotalAgentSalary(get().agents) * getSkillAgentSalaryMult(get().skills);
    return cps - salary - cloudCost - agentSalary;
  },

  getTotalSalary: () => getTotalSalary(get().staff),

  getCloudOperatingCost: () => getOwnedRegionsCost(get().regions),

  getAgentSalary: () => getTotalAgentSalary(get().agents) * getSkillAgentSalaryMult(get().skills),

  getGateState: () => {
    const {
      servers,
      clusters,
      upgrades,
      ddosResolvedCount,
      diskFullResolvedCount,
      vendorOfferAcceptedCount,
      totalStaffEverHired,
    } = get();
    return {
      totalServers: Object.values(servers).reduce((a, b) => a + b, 0),
      totalClusters: Object.values(clusters).reduce((a, b) => a + b, 0),
      ddosResolvedCount,
      diskFullResolvedCount,
      vendorOfferAcceptedCount,
      hotSwapOwned: !!upgrades['hot_swap'],
      researchLabOwned: !!upgrades['research_lab'],
      totalStaffHired: totalStaffEverHired,
    };
  },

  getPowerStats: () => {
    const { servers, clusters, gpus, capacity, upgrades, research, regions, skills } = get();
    const drawMult = getResearchPowerDrawMultiplier(research);
    const used =
      (getTotalPowerDraw(servers) +
        getTotalClusterPower(clusters) +
        getOwnedRegionsPower(regions) +
        getTotalGpuPower(gpus)) *
      drawMult;
    const cap =
      getTotalCapacity(capacity, 'power') + getBonusPowerCapacity(upgrades) + getSkillBonusPower(skills);
    return { used, capacity: cap, efficiency: getEfficiency(used, cap) };
  },

  getCoolingStats: () => {
    const { servers, clusters, gpus, capacity, research, regions, skills } = get();
    const used =
      getTotalHeatOutput(servers) +
      getTotalClusterHeat(clusters) +
      getOwnedRegionsHeat(regions) +
      getTotalGpuHeat(gpus);
    const cap =
      getTotalCapacity(capacity, 'cooling') *
      getResearchCoolingMultiplier(research) + getSkillBonusCooling(skills);
    return { used, capacity: cap, efficiency: getEfficiency(used, cap) };
  },

  getEfficiencyMultiplier: () => {
    const { servers, clusters, gpus, capacity, upgrades, research, regions, skills } = get();
    const powerCap =
      getTotalCapacity(capacity, 'power') + getBonusPowerCapacity(upgrades) + getSkillBonusPower(skills);
    const drawMult = getResearchPowerDrawMultiplier(research);
    const totalPower =
      (getTotalPowerDraw(servers) +
        getTotalClusterPower(clusters) +
        getOwnedRegionsPower(regions) +
        getTotalGpuPower(gpus)) *
      drawMult;
    const totalHeat =
      getTotalHeatOutput(servers) +
      getTotalClusterHeat(clusters) +
      getOwnedRegionsHeat(regions) +
      getTotalGpuHeat(gpus);
    const powerEff = getEfficiency(totalPower, powerCap);
    const coolingEff = getEfficiency(
      totalHeat,
      getTotalCapacity(capacity, 'cooling') *
        getResearchCoolingMultiplier(research) + getSkillBonusCooling(skills)
    );
    return Math.min(powerEff, coolingEff);
  },

  tick: () => {
    const {
      credits,
      highestCredits,
      skills,
      servers,
      clusters,
      gpus,
      capacity,
      upgrades,
      staff,
      research,
      regions,
      overclockEnabled,
      cronTickAccumulator,
      activeIncident,
      activeBuild,
      agents,
      agentAutonomy,
      agentDevOpsAccum,
      agentResponderAccum,
    } = get();

    // ─── Build queue completion ───
    let nextServers = servers;
    let nextRegions = regions;
    let nextGpus = gpus;
    let nextActiveBuild = activeBuild;
    if (activeBuild && Date.now() >= activeBuild.completesAt) {
      if (activeBuild.kind === 'server') {
        const owned = servers[activeBuild.id] ?? 0;
        nextServers = { ...servers, [activeBuild.id]: owned + 1 };
      } else if (activeBuild.kind === 'gpu') {
        const owned = gpus[activeBuild.id] ?? 0;
        nextGpus = { ...gpus, [activeBuild.id]: owned + 1 };
      } else {
        nextRegions = { ...regions, [activeBuild.id]: true };
      }
      nextActiveBuild = null;
    }

    // ─── Incident expiration / random trigger ───
    let nextIncident = activeIncident;
    let incidentPenalty = 0;
    let incidentResolution: GameState['lastIncidentResolution'] = null;
    const skillPenaltyMult = getSkillTimeoutPenaltyMult(skills);
    if (nextIncident && Date.now() >= nextIncident.expiresAt) {
      // Timed out
      const baseCps = calcCreditsPerSec(nextServers, clusters, nextGpus, capacity, upgrades, staff, research, nextRegions, false, null, skills);
      if (nextIncident.type === 'ddos') {
        incidentPenalty = baseCps * INCIDENT_CONFIG.ddos.timeoutPenaltySecondsOfCps * skillPenaltyMult;
        incidentResolution = {
          type: 'ddos',
          success: false,
          rewardCredits: 0,
          penaltyCredits: incidentPenalty,
        };
      } else if (nextIncident.type === 'disk_full') {
        incidentPenalty = baseCps * INCIDENT_CONFIG.disk_full.timeoutPenaltySecondsOfCps * skillPenaltyMult;
        incidentResolution = {
          type: 'disk_full',
          success: false,
          rewardCredits: 0,
          penaltyCredits: incidentPenalty,
        };
      } else if (nextIncident.type === 'memory_leak') {
        incidentPenalty = credits * INCIDENT_CONFIG.memory_leak.timeoutCreditPercent * skillPenaltyMult;
        incidentResolution = {
          type: 'memory_leak',
          success: false,
          rewardCredits: 0,
          penaltyCredits: incidentPenalty,
        };
      } else if (nextIncident.type === 'hacker_breach') {
        // Lose 10% of total credits on missed hack
        incidentPenalty = credits * INCIDENT_CONFIG.hacker_breach.timeoutCreditPercent * skillPenaltyMult;
        incidentResolution = {
          type: 'hacker_breach',
          success: false,
          rewardCredits: 0,
          penaltyCredits: incidentPenalty,
        };
      } else {
        // vendor_offer just expires silently
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
      const totalServers = Object.values(nextServers).reduce((a, b) => a + b, 0);
      const totalClusters = Object.values(clusters).reduce((a, b) => a + b, 0);
      if (
        totalServers + totalClusters > 0 &&
        Math.random() < INCIDENT_TRIGGER_CHANCE_PER_SEC * getSkillIncidentTriggerMult(skills)
      ) {
        const weights = getIncidentWeightModifiers(staff);
        const chosen = pickRandomIncident(weights);
        if (chosen) {
          nextIncident = createIncident(chosen);
          // Apply skill bonuses to newly created incident
          const timerBonus = getSkillIncidentTimerBonus(skills);
          if (timerBonus > 0) {
            nextIncident = { ...nextIncident, expiresAt: nextIncident.expiresAt + timerBonus * 1000 };
          }
          const tapReduction = getSkillDdosTapReduction(skills);
          if (tapReduction > 0 && nextIncident.type === 'ddos') {
            nextIncident = {
              ...nextIncident,
              tapsRemaining: Math.max(1, nextIncident.tapsRemaining - tapReduction),
            };
          }
        }
      }
    }

    const cps = calcCreditsPerSec(
      nextServers,
      clusters,
      nextGpus,
      capacity,
      upgrades,
      staff,
      research,
      nextRegions,
      overclockEnabled,
      nextIncident,
      skills
    );

    // Salary + cloud operating costs + agent salaries drain every tick
    const salary = getTotalSalary(staff);
    const cloudCost = getOwnedRegionsCost(nextRegions);
    const agentSalary = getTotalAgentSalary(agents) * getSkillAgentSalaryMult(skills);
    const totalDrain = salary + cloudCost + agentSalary;

    // Research Points generated by Data Scientists + GPU hardware, boosted by research nodes + skills
    const skillGpuRpMult = getSkillGpuRpMult(skills);
    const rpGain =
      (getResearchPointsPerSec(staff) + getTotalGpuRpOutput(nextGpus) * skillGpuRpMult) *
      getResearchRpMultiplier(research) *
      getSkillResearchMult(skills);

    // Cron Jobs: auto-tap every 5 seconds if purchased
    let cronAccum = cronTickAccumulator + 1;
    let cronCredits = 0;
    if (hasCronJobs(upgrades) && cronAccum >= CRON_JOBS_INTERVAL_SEC) {
      const taps = Math.floor(cronAccum / CRON_JOBS_INTERVAL_SEC);
      cronAccum = cronAccum % CRON_JOBS_INTERVAL_SEC;
      const perTap =
        (1 + getClickCreditBonus(upgrades)) *
        getClickCreditMultiplier(upgrades) *
        getResearchClickMultiplier(research);
      cronCredits = perTap * taps;
    }

    // ─── AI Agent actions ───
    let nextOverclock = overclockEnabled;
    let devOpsAccum = agentDevOpsAccum + 1;
    let responderAccum = agentResponderAccum;
    let agentAutoResolved = false;
    let agentAutoReward = 0;

    // Cost Optimizer: manage overclock toggle
    if (agents['cost_optimizer']) {
      const hasRedundantPsu = !!upgrades['hot_swap'];
      const sreCount = staff['sre'] ?? 0;
      nextOverclock = shouldOverclock(agentAutonomy, hasRedundantPsu, sreCount);
    }

    // DevOps Agent: auto-buy servers AND capacity to keep efficiency healthy
    const agentSpeedMult = getSkillAgentSpeedMult(skills);
    let nextCapacity = capacity;
    if (agents['devops_agent']) {
      const interval = Math.max(1, Math.round(getDevOpsInterval(agentAutonomy) * agentSpeedMult));
      if (devOpsAccum >= interval) {
        devOpsAccum = 0;
        const currentCredits = credits + cps + cronCredits - totalDrain - incidentPenalty;
        const minEff = getDevOpsMinEfficiency(agentAutonomy);

        // Check current efficiency
        const powerDrawMult = getResearchPowerDrawMultiplier(research);
        const coolingCapMult = getResearchCoolingMultiplier(research);
        const curPowerUsed =
          (getTotalPowerDraw(nextServers) +
            getTotalClusterPower(clusters) +
            getOwnedRegionsPower(nextRegions) +
            getTotalGpuPower(nextGpus)) *
          powerDrawMult;
        const curHeatUsed =
          getTotalHeatOutput(nextServers) +
          getTotalClusterHeat(clusters) +
          getOwnedRegionsHeat(nextRegions) +
          getTotalGpuHeat(nextGpus);
        const curPowerCap =
          getTotalCapacity(nextCapacity, 'power') + getBonusPowerCapacity(upgrades);
        const curCoolingCap = getTotalCapacity(nextCapacity, 'cooling') * coolingCapMult;
        const powerEff = getEfficiency(curPowerUsed, curPowerCap);
        const coolingEff = getEfficiency(curHeatUsed, curCoolingCap);
        const curEff = Math.min(powerEff, coolingEff);

        let spent = 0;
        if (curEff < minEff) {
          // Efficiency is low — buy capacity instead of servers
          // Buy power if power is the bottleneck, cooling if cooling is
          const resourceNeeded = powerEff <= coolingEff ? 'power' : 'cooling';
          const candidates = CAPACITY_BUILDINGS.filter(
            (b) => b.resource === resourceNeeded
          );
          // Find the most expensive affordable capacity building
          for (let i = candidates.length - 1; i >= 0; i--) {
            const b = candidates[i];
            const owned = nextCapacity[b.id] ?? 0;
            const cost = getCapacityBuildingCost(b, owned);
            if (cost <= currentCredits - spent) {
              nextCapacity = { ...nextCapacity, [b.id]: owned + 1 };
              spent += cost;
              break;
            }
          }
        } else {
          // Efficiency is healthy — buy a server
          const affordableTiers = SERVER_TIERS.filter((t) => {
            const owned = nextServers[t.id] ?? 0;
            const cost = getServerCost(t, owned);
            return cost <= currentCredits - spent && !t.buildTimeSeconds;
          });
          if (affordableTiers.length > 0) {
            const best = affordableTiers[affordableTiers.length - 1]; // highest tier
            const owned = nextServers[best.id] ?? 0;
            const cost = getServerCost(best, owned);
            nextServers = { ...nextServers, [best.id]: owned + 1 };
            spent += cost;
          }
        }
        // Deduct total spent via incidentPenalty (it all goes through Math.max(0,...))
        incidentPenalty += spent;
      }
    }

    // Incident Responder: auto-resolve incidents after delay
    if (agents['incident_responder'] && nextIncident) {
      responderAccum += 1;
      const delay = Math.max(1, Math.round(getResponderDelay(agentAutonomy) * agentSpeedMult));
      if (responderAccum >= delay) {
        const baseCps = calcCreditsPerSec(nextServers, clusters, nextGpus, capacity, upgrades, staff, research, nextRegions, false, null, skills);
        let rewardMult = getResponderRewardMult(agentAutonomy);
        // Smart Agents skill: halve the penalty (move reward mult halfway to 1.0)
        if (getSkillResponderBonus(skills)) {
          rewardMult = rewardMult + (1 - rewardMult) / 2;
        }

        if (nextIncident.type === 'ddos') {
          agentAutoReward = baseCps * INCIDENT_CONFIG.ddos.rewardSecondsOfCps * rewardMult;
          agentAutoResolved = true;
        } else if (nextIncident.type === 'disk_full') {
          agentAutoReward = baseCps * INCIDENT_CONFIG.disk_full.rewardSecondsOfCps * rewardMult;
          agentAutoResolved = true;
        } else if (nextIncident.type === 'memory_leak') {
          agentAutoReward = baseCps * INCIDENT_CONFIG.memory_leak.rewardSecondsOfCps * rewardMult;
          agentAutoResolved = true;
        } else if (nextIncident.type === 'vendor_offer') {
          // Auto-accept vendor offer
          set({ vendorDiscountAvailable: true, vendorOfferAcceptedCount: get().vendorOfferAcceptedCount + 1 });
          agentAutoResolved = true;
        } else if (nextIncident.type === 'hacker_breach') {
          agentAutoReward = baseCps * INCIDENT_CONFIG.hacker_breach.rewardSecondsOfCps * rewardMult;
          agentAutoResolved = true;
        }

        if (agentAutoResolved) {
          incidentResolution = {
            type: nextIncident.type,
            success: true,
            rewardCredits: agentAutoReward,
            penaltyCredits: 0,
          };
          nextIncident = null;
          responderAccum = 0;
        }
      }
    } else {
      responderAccum = 0; // reset when no incident
    }

    if (nextOverclock !== overclockEnabled || !agents['cost_optimizer']) {
      // Only the Cost Optimizer controls overclock; if not hired, leave it as-is
      if (agents['cost_optimizer']) {
        // handled above — nextOverclock already set
      } else {
        nextOverclock = overclockEnabled;
      }
    }

    if (nextOverclock) {
      const totalServers = Object.values(nextServers).reduce((a, b) => a + b, 0);
      const failureChance =
        OVERCLOCK_FAILURE_CHANCE *
        getOverclockFailureMultiplier(staff) *
        getOverclockFailureChanceMultiplier(upgrades) *
        getSkillOverclockFailureMult(skills);
      if (totalServers > 0 && Math.random() < failureChance) {
        const ownedTiers = SERVER_TIERS.filter(
          (t) => (nextServers[t.id] ?? 0) > 0
        );
        const victim =
          ownedTiers[Math.floor(Math.random() * ownedTiers.length)];
        const newCredits = Math.max(0, credits + cps + cronCredits + agentAutoReward - totalDrain - incidentPenalty);
        set({
          credits: newCredits,
          highestCredits: Math.max(highestCredits, newCredits),
          researchPoints: get().researchPoints + rpGain,
          servers: { ...nextServers, [victim.id]: nextServers[victim.id] - 1 },
          gpus: nextGpus,
          capacity: nextCapacity,
          regions: nextRegions,
          overclockEnabled: false,
          cronTickAccumulator: cronAccum,
          activeBuild: nextActiveBuild,
          activeIncident: nextIncident,
          lastIncidentResolution: incidentResolution,
          lastFailure: { tierId: victim.id, lost: 1 },
          agentDevOpsAccum: devOpsAccum,
          agentResponderAccum: responderAccum,
        });
        return;
      }
    }

    const newCredits = Math.max(0, credits + cps + cronCredits + agentAutoReward - totalDrain - incidentPenalty);
    set({
      credits: newCredits,
      highestCredits: Math.max(highestCredits, newCredits),
      researchPoints: get().researchPoints + rpGain,
      servers: nextServers,
      gpus: nextGpus,
      capacity: nextCapacity,
      regions: nextRegions,
      overclockEnabled: nextOverclock,
      cronTickAccumulator: cronAccum,
      activeBuild: nextActiveBuild,
      activeIncident: nextIncident,
      lastIncidentResolution: incidentResolution,
      agentDevOpsAccum: devOpsAccum,
      agentResponderAccum: responderAccum,
    });
  },

  addCredits: (amount) => {
    set((state) => ({ credits: state.credits + amount }));
  },

  tapProvision: () => {
    const { credits, upgrades, research, skills } = get();
    const tapCredits =
      (1 + getClickCreditBonus(upgrades) + getSkillTapBonus(skills)) *
      getClickCreditMultiplier(upgrades) *
      getResearchClickMultiplier(research);
    set({ credits: credits + tapCredits });
  },

  buyServer: (tierId) => {
    const { credits, servers, skills, vendorDiscountAvailable, activeBuild } = get();
    const tier = SERVER_TIERS.find((t) => t.id === tierId);
    if (!tier) return;

    const owned = servers[tierId] ?? 0;
    const rawCost = getServerCost(tier, owned);
    const fullCost = Math.floor(rawCost * getSkillServerCostMult(skills));
    const cost = vendorDiscountAvailable ? Math.floor(fullCost * 0.5) : fullCost;
    if (credits < cost) return;

    // Tiers with a build time queue instead of being instant
    if (tier.buildTimeSeconds && tier.buildTimeSeconds > 0) {
      if (activeBuild) return; // only one build at a time
      const now = Date.now();
      const buildMs = tier.buildTimeSeconds * 1000 * getSkillBuildTimeMult(skills);
      set({
        credits: credits - cost,
        vendorDiscountAvailable: false,
        activeBuild: {
          kind: 'server',
          id: tierId,
          startedAt: now,
          completesAt: now + buildMs,
        },
      });
      return;
    }

    set({
      credits: credits - cost,
      servers: { ...servers, [tierId]: owned + 1 },
      vendorDiscountAvailable: false,
    });
  },

  cancelBuild: () => {
    const { activeBuild, credits, servers, gpus } = get();
    if (!activeBuild) return;

    let refund = 0;
    if (activeBuild.kind === 'server') {
      const tier = SERVER_TIERS.find((t) => t.id === activeBuild.id);
      if (tier) {
        const owned = servers[activeBuild.id] ?? 0;
        refund = Math.floor(getServerCost(tier, owned) * 0.5);
      }
    } else if (activeBuild.kind === 'gpu') {
      const tier = GPU_TIERS.find((t) => t.id === activeBuild.id);
      if (tier) {
        const owned = gpus[activeBuild.id] ?? 0;
        refund = Math.floor(getGpuCost(tier, owned) * 0.5);
      }
    } else {
      const region = CLOUD_REGIONS.find((r) => r.id === activeBuild.id);
      if (region) refund = Math.floor(region.cost * 0.5);
    }

    set({
      credits: credits + refund,
      activeBuild: null,
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

  buyGpu: (tierId) => {
    const { credits, gpus, skills, activeBuild } = get();
    const tier = GPU_TIERS.find((t) => t.id === tierId);
    if (!tier) return;
    if (activeBuild) return; // build slot occupied

    const owned = gpus[tierId] ?? 0;
    const cost = getGpuCost(tier, owned);
    if (credits < cost) return;

    const now = Date.now();
    const buildMs = tier.buildTimeSeconds * 1000 * getSkillBuildTimeMult(skills);
    set({
      credits: credits - cost,
      activeBuild: {
        kind: 'gpu',
        id: tierId,
        startedAt: now,
        completesAt: now + buildMs,
      },
    });
  },

  sellGpu: (tierId) => {
    const { credits, gpus } = get();
    const tier = GPU_TIERS.find((t) => t.id === tierId);
    if (!tier) return;
    const owned = gpus[tierId] ?? 0;
    if (owned <= 0) return;

    const refund = Math.floor(getGpuCost(tier, owned - 1) * SELL_REFUND_RATIO);
    set({
      credits: credits + refund,
      gpus: { ...gpus, [tierId]: owned - 1 },
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

  buyRegion: (regionId) => {
    const { credits, regions, skills, activeBuild } = get();
    const region = CLOUD_REGIONS.find((r) => r.id === regionId);
    if (!region) return;
    if (regions[regionId]) return; // already owned (one per region)
    if (activeBuild) return; // build slot occupied
    const cost = Math.floor(region.cost * getSkillCloudCostMult(skills));
    if (credits < cost) return;

    const now = Date.now();
    const buildMs = region.buildTimeSeconds * 1000 * getSkillBuildTimeMult(skills);
    set({
      credits: credits - cost,
      activeBuild: {
        kind: 'region',
        id: regionId,
        startedAt: now,
        completesAt: now + buildMs,
      },
    });
  },

  sellRegion: (regionId) => {
    const { credits, regions } = get();
    const region = CLOUD_REGIONS.find((r) => r.id === regionId);
    if (!region) return;
    if (!regions[regionId]) return;
    const refund = Math.floor(region.cost * SELL_REFUND_RATIO);
    const next = { ...regions };
    delete next[regionId];
    set({
      credits: credits + refund,
      regions: next,
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
    const { credits, upgrades, servers, skills } = get();
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return;
    if (upgrades[upgradeId]) return; // already owned
    if (!isUpgradeAvailable(upgrade, upgrades, servers)) return;
    const cost = Math.floor(upgrade.cost * getSkillUpgradeCostMult(skills));
    if (credits < cost) return;

    set({
      credits: credits - cost,
      upgrades: { ...upgrades, [upgradeId]: true },
    });
  },

  buyResearch: (nodeId) => {
    const { researchPoints, research } = get();
    const node = RESEARCH_NODES.find((n) => n.id === nodeId);
    if (!node) return;
    if (research[nodeId]) return; // already purchased
    if (!isResearchAvailable(node, research)) return;
    if (researchPoints < node.cost) return;

    set({
      researchPoints: researchPoints - node.cost,
      research: { ...research, [nodeId]: true },
    });
  },

  hireStaff: (roleId) => {
    const { credits, staff, skills, totalStaffEverHired } = get();
    const role = STAFF_ROLES.find((r) => r.id === roleId);
    if (!role) return;
    const owned = staff[roleId] ?? 0;
    const cost = Math.floor(getHireCost(role, owned) * getSkillStaffCostMult(skills));
    if (credits < cost) return;
    // Verify gate is open
    const gates = get().getGateState();
    if (!role.isUnlocked(gates)) return;

    set({
      credits: credits - cost,
      staff: { ...staff, [roleId]: owned + 1 },
      totalStaffEverHired: totalStaffEverHired + 1,
    });
  },

  fireStaff: (roleId) => {
    const { credits, staff } = get();
    const role = STAFF_ROLES.find((r) => r.id === roleId);
    if (!role) return;
    const owned = staff[roleId] ?? 0;
    if (owned <= 0) return;
    const refund = Math.floor(getHireCost(role, owned - 1) * STAFF_REFUND_RATIO);
    set({
      credits: credits + refund,
      staff: { ...staff, [roleId]: owned - 1 },
    });
  },

  hireAgent: (agentId) => {
    const { credits, agents, skills } = get();
    const agent = AGENT_TYPES.find((a) => a.id === agentId);
    if (!agent) return;
    if (agents[agentId]) return; // already hired
    const cost = Math.floor(agent.cost * getSkillAgentCostMult(skills));
    if (credits < cost) return;
    set({
      credits: credits - cost,
      agents: { ...agents, [agentId]: true },
    });
  },

  fireAgent: (agentId) => {
    const { credits, agents } = get();
    const agent = AGENT_TYPES.find((a) => a.id === agentId);
    if (!agent) return;
    if (!agents[agentId]) return;
    const refund = Math.floor(agent.cost * 0.5);
    const next = { ...agents };
    delete next[agentId];
    set({
      credits: credits + refund,
      agents: next,
    });
  },

  setAgentAutonomy: (level) => {
    set({ agentAutonomy: Math.max(1, Math.min(10, level)) });
  },

  prestige: () => {
    const { highestCredits, skillPoints, prestigeCount, skills } = get();
    const spEarned = calcSkillPointsEarned(highestCredits);
    if (spEarned <= 0) return;

    // Apply skill-tree starting bonuses for the new run
    const startCredits = getSkillStartingCredits(skills);
    const startServers = getSkillStartingServers(skills);

    // Reset all run state, keep meta-progression (SP, prestige count, skills)
    set({
      credits: startCredits,
      researchPoints: 0,
      servers: startServers,
      clusters: {},
      gpus: {},
      capacity: {},
      upgrades: {},
      research: {},
      regions: {},
      staff: {},
      agents: {},
      agentAutonomy: 5,
      agentDevOpsAccum: 0,
      agentResponderAccum: 0,
      highestCredits: startCredits, // watermark starts at starting credits
      skillPoints: skillPoints + spEarned,
      prestigeCount: prestigeCount + 1,
      skills, // preserved
      totalStaffEverHired: 0,
      activeBuild: null,
      overclockEnabled: false,
      cronTickAccumulator: 0,
      activeIncident: null,
      vendorDiscountAvailable: false,
      ddosResolvedCount: 0,
      diskFullResolvedCount: 0,
      vendorOfferAcceptedCount: 0,
      lastIncidentResolution: null,
      lastFailure: null,
      pendingOfflineEarnings: 0,
    });
  },

  buySkill: (skillId) => {
    const { skillPoints, skills, prestigeCount } = get();
    const node = SKILL_NODES.find((n) => n.id === skillId);
    if (!node) return;
    if (!isSkillAvailable(node, skills, prestigeCount)) return;
    if (skillPoints < node.cost) return;

    set({
      skillPoints: skillPoints - node.cost,
      skills: { ...skills, [skillId]: true },
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
    // Generic single-tap resolve (used by Disk Full and Memory Leak)
    const { credits, activeIncident, servers, clusters, gpus, capacity, upgrades, staff, research, regions, skills, diskFullResolvedCount } = get();
    if (!activeIncident) return;
    if (
      activeIncident.type !== 'disk_full' &&
      activeIncident.type !== 'memory_leak'
    )
      return;

    const baseCps = calcCreditsPerSec(servers, clusters, gpus, capacity, upgrades, staff, research, regions, false, null, skills);
    const config = INCIDENT_CONFIG[activeIncident.type];
    const reward = baseCps * config.rewardSecondsOfCps * getSkillIncidentRewardMult(skills);

    set({
      credits: credits + reward,
      activeIncident: null,
      diskFullResolvedCount:
        activeIncident.type === 'disk_full'
          ? diskFullResolvedCount + 1
          : diskFullResolvedCount,
      lastIncidentResolution: {
        type: activeIncident.type,
        success: true,
        rewardCredits: reward,
        penaltyCredits: 0,
      },
    });
  },

  tapDdosMitigate: () => {
    const { credits, activeIncident, servers, clusters, gpus, capacity, upgrades, staff, research, regions, skills, ddosResolvedCount } = get();
    if (!activeIncident || activeIncident.type !== 'ddos') return;

    const remaining = activeIncident.tapsRemaining - 1;
    if (remaining > 0) {
      set({ activeIncident: { ...activeIncident, tapsRemaining: remaining } });
      return;
    }

    // Mitigation complete
    const baseCps = calcCreditsPerSec(servers, clusters, gpus, capacity, upgrades, staff, research, regions, false, null, skills);
    const reward = baseCps * INCIDENT_CONFIG.ddos.rewardSecondsOfCps * getSkillIncidentRewardMult(skills);
    set({
      credits: credits + reward,
      activeIncident: null,
      ddosResolvedCount: ddosResolvedCount + 1,
      lastIncidentResolution: {
        type: 'ddos',
        success: true,
        rewardCredits: reward,
        penaltyCredits: 0,
      },
    });
  },

  tapHackerSequence: (letter: string) => {
    const { credits, activeIncident, servers, clusters, gpus, capacity, upgrades, staff, research, regions, skills } = get();
    if (!activeIncident || activeIncident.type !== 'hacker_breach') return;

    const expectedLetter = activeIncident.sequence[activeIncident.currentStep];
    if (letter === expectedLetter) {
      const nextStep = activeIncident.currentStep + 1;
      if (nextStep >= activeIncident.sequence.length) {
        // Sequence complete — patched the breach
        const baseCps = calcCreditsPerSec(servers, clusters, gpus, capacity, upgrades, staff, research, regions, false, null, skills);
        const reward = baseCps * INCIDENT_CONFIG.hacker_breach.rewardSecondsOfCps * getSkillIncidentRewardMult(skills) * getSkillHackerRewardMult(skills);
        set({
          credits: credits + reward,
          activeIncident: null,
          lastIncidentResolution: {
            type: 'hacker_breach',
            success: true,
            rewardCredits: reward,
            penaltyCredits: 0,
          },
        });
      } else {
        set({ activeIncident: { ...activeIncident, currentStep: nextStep } });
      }
    } else {
      // Wrong letter — reset progress to step 0
      set({ activeIncident: { ...activeIncident, currentStep: 0 } });
    }
  },

  acceptVendorOffer: () => {
    const { activeIncident, vendorOfferAcceptedCount } = get();
    if (!activeIncident || activeIncident.type !== 'vendor_offer') return;

    set({
      activeIncident: null,
      vendorDiscountAvailable: true,
      vendorOfferAcceptedCount: vendorOfferAcceptedCount + 1,
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

  // DEV ONLY — remove before ship
  devTriggerIncident: (type) => {
    set({ activeIncident: createIncident(type) });
  },

  devSkipBuild: () => {
    const { activeBuild, servers, gpus, regions } = get();
    if (!activeBuild) return;
    if (activeBuild.kind === 'server') {
      const owned = servers[activeBuild.id] ?? 0;
      set({
        servers: { ...servers, [activeBuild.id]: owned + 1 },
        activeBuild: null,
      });
    } else if (activeBuild.kind === 'gpu') {
      const owned = gpus[activeBuild.id] ?? 0;
      set({
        gpus: { ...gpus, [activeBuild.id]: owned + 1 },
        activeBuild: null,
      });
    } else {
      set({
        regions: { ...regions, [activeBuild.id]: true },
        activeBuild: null,
      });
    }
  },

  devAddResearchPoints: (n) => {
    set((state) => ({ researchPoints: state.researchPoints + n }));
  },

  devResetGame: async () => {
    await AsyncStorage.removeItem(SAVE_KEY);
    set({
      credits: 0,
      researchPoints: 0,
      servers: {},
      clusters: {},
      gpus: {},
      capacity: {},
      upgrades: {},
      research: {},
      regions: {},
      staff: {},
      agents: {},
      agentAutonomy: 5,
      agentDevOpsAccum: 0,
      agentResponderAccum: 0,
      highestCredits: 0,
      skillPoints: 0,
      prestigeCount: 0,
      skills: {},
      totalStaffEverHired: 0,
      activeBuild: null,
      overclockEnabled: false,
      cronTickAccumulator: 0,
      activeIncident: null,
      vendorDiscountAvailable: false,
      ddosResolvedCount: 0,
      diskFullResolvedCount: 0,
      vendorOfferAcceptedCount: 0,
      lastIncidentResolution: null,
      lastFailure: null,
      pendingOfflineEarnings: 0,
      lastSavedAt: Date.now(),
    });
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
      researchPoints,
      servers,
      clusters,
      gpus,
      capacity,
      upgrades,
      research,
      regions,
      staff,
      agents,
      agentAutonomy,
      highestCredits,
      skillPoints,
      prestigeCount,
      skills,
      totalStaffEverHired,
      activeBuild,
      overclockEnabled,
      vendorDiscountAvailable,
      ddosResolvedCount,
      diskFullResolvedCount,
      vendorOfferAcceptedCount,
      pendingOfflineEarnings,
    } = get();
    const now = Date.now();
    const data: SaveData = {
      credits,
      researchPoints,
      servers,
      clusters,
      gpus,
      capacity,
      upgrades,
      research,
      regions,
      staff,
      agents,
      agentAutonomy,
      highestCredits,
      skillPoints,
      prestigeCount,
      skills,
      totalStaffEverHired,
      activeBuild,
      overclockEnabled,
      vendorDiscountAvailable,
      ddosResolvedCount,
      diskFullResolvedCount,
      vendorOfferAcceptedCount,
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
    const savedResearch = data.research ?? {};
    const savedClusters = data.clusters ?? {};
    const savedGpus = data.gpus ?? {};
    const savedRegions = data.regions ?? {};
    const savedStaff = data.staff ?? {};
    const savedAgents = data.agents ?? {};
    const savedAgentAutonomy = data.agentAutonomy ?? 5;
    const savedHighestCredits = data.highestCredits ?? 0;
    const savedSkillPoints = data.skillPoints ?? 0;
    const savedPrestigeCount = data.prestigeCount ?? 0;
    const savedSkills = data.skills ?? {};
    const savedVendorDiscount = data.vendorDiscountAvailable ?? false;
    const savedDdos = data.ddosResolvedCount ?? 0;
    const savedDisk = data.diskFullResolvedCount ?? 0;
    const savedVendor = data.vendorOfferAcceptedCount ?? 0;
    const savedTotalHired = data.totalStaffEverHired ?? 0;

    // Build queue: complete it if its timer ran out while away
    let savedServers = data.servers ?? {};
    let savedGpusLocal = savedGpus;
    let savedRegionsLocal = savedRegions;
    let savedBuild = data.activeBuild ?? null;
    if (savedBuild && now >= savedBuild.completesAt) {
      if (savedBuild.kind === 'server') {
        const owned = savedServers[savedBuild.id] ?? 0;
        savedServers = { ...savedServers, [savedBuild.id]: owned + 1 };
      } else if (savedBuild.kind === 'gpu') {
        const owned = savedGpusLocal[savedBuild.id] ?? 0;
        savedGpusLocal = { ...savedGpusLocal, [savedBuild.id]: owned + 1 };
      } else {
        savedRegionsLocal = { ...savedRegionsLocal, [savedBuild.id]: true };
      }
      savedBuild = null;
    }

    const grossCps = calcCreditsPerSec(
      savedServers,
      savedClusters,
      savedGpusLocal,
      data.capacity ?? {},
      savedUpgrades,
      savedStaff,
      savedResearch,
      savedRegionsLocal,
      data.overclockEnabled ?? false,
      null,
      savedSkills
    );
    const salary = getTotalSalary(savedStaff);
    const cloudCost = getOwnedRegionsCost(savedRegionsLocal);
    const agentCost = getTotalAgentSalary(savedAgents);
    const netCps = Math.max(0, grossCps - salary - cloudCost - agentCost);
    const offlineEff = getSkillOfflineEfficiency(savedSkills);
    const newOffline = elapsedSec * netCps * offlineEff;
    const totalPending = (data.pendingOfflineEarnings || 0) + newOffline;

    // Research points accumulate offline at full rate (no efficiency penalty —
    // research isn't gated by power/cooling) — includes GPU RP output
    const rpRate =
      (getResearchPointsPerSec(savedStaff) + getTotalGpuRpOutput(savedGpusLocal)) *
      getResearchRpMultiplier(savedResearch);
    const rpGained = elapsedSec * rpRate;
    const totalRp = (data.researchPoints ?? 0) + rpGained;

    set({
      credits: data.credits ?? 0,
      researchPoints: totalRp,
      servers: savedServers,
      clusters: savedClusters,
      gpus: savedGpusLocal,
      capacity: data.capacity ?? {},
      upgrades: savedUpgrades,
      research: savedResearch,
      regions: savedRegionsLocal,
      staff: savedStaff,
      agents: savedAgents,
      agentAutonomy: savedAgentAutonomy,
      agentDevOpsAccum: 0,
      agentResponderAccum: 0,
      highestCredits: savedHighestCredits,
      skillPoints: savedSkillPoints,
      prestigeCount: savedPrestigeCount,
      skills: savedSkills,
      totalStaffEverHired: savedTotalHired,
      activeBuild: savedBuild,
      overclockEnabled: data.overclockEnabled ?? false,
      vendorDiscountAvailable: savedVendorDiscount,
      ddosResolvedCount: savedDdos,
      diskFullResolvedCount: savedDisk,
      vendorOfferAcceptedCount: savedVendor,
      activeIncident: null,
      pendingOfflineEarnings: totalPending,
      lastSavedAt: now,
      hydrated: true,
    });

    const refreshed: SaveData = {
      credits: data.credits ?? 0,
      researchPoints: totalRp,
      servers: savedServers,
      clusters: savedClusters,
      gpus: savedGpusLocal,
      capacity: data.capacity ?? {},
      upgrades: savedUpgrades,
      research: savedResearch,
      regions: savedRegionsLocal,
      staff: savedStaff,
      agents: savedAgents,
      agentAutonomy: savedAgentAutonomy,
      highestCredits: savedHighestCredits,
      skillPoints: savedSkillPoints,
      prestigeCount: savedPrestigeCount,
      skills: savedSkills,
      totalStaffEverHired: savedTotalHired,
      activeBuild: savedBuild,
      overclockEnabled: data.overclockEnabled ?? false,
      vendorDiscountAvailable: savedVendorDiscount,
      ddosResolvedCount: savedDdos,
      diskFullResolvedCount: savedDisk,
      vendorOfferAcceptedCount: savedVendor,
      savedAt: now,
      pendingOfflineEarnings: totalPending,
    };
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(refreshed));
  },
}));
