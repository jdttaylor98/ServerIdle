export type UpgradeEra = 'homelab' | 'rack' | 'datacenter' | 'cloud' | 'ai';



export interface Upgrade {
  id: string;
  name: string;
  description: string;
  era: UpgradeEra;
  cost: number;
  prereqs: string[]; // upgrade ids that must be purchased first
  // Optional unlock condition beyond prereqs (e.g., "own 25 Pi")
  unlockCheck?: (servers: Record<string, number>) => boolean;
  unlockHint?: string;
}

export const UPGRADES: Upgrade[] = [
  // ───── HOMELAB ERA ─────
  {
    id: 'mechanical_keyboard',
    name: 'Mechanical Keyboard',
    description: '+1 credit per PROVISION tap',
    era: 'homelab',
    cost: 25,
    prereqs: [],
  },
  {
    id: 'cron_jobs',
    name: 'Cron Jobs',
    description: 'Auto-tap PROVISION every 5 seconds',
    era: 'homelab',
    cost: 200,
    prereqs: [],
  },
  {
    id: 'containerization',
    name: 'Containerization',
    description: 'Raspberry Pi output ×1.25',
    era: 'homelab',
    cost: 500,
    prereqs: [],
  },
  {
    id: 'macro_recorder',
    name: 'Macro Recorder',
    description: '+2 more credits per PROVISION tap',
    era: 'homelab',
    cost: 1000,
    prereqs: ['mechanical_keyboard'],
  },
  {
    id: 'ssd_upgrade',
    name: 'SSD Upgrade',
    description: 'Raspberry Pi output ×1.5 (stacks with Containerization)',
    era: 'homelab',
    cost: 2000,
    prereqs: ['containerization'],
  },
  {
    id: 'hyperthreading',
    name: 'Hyperthreading',
    description: 'PROVISION taps grant 1.5× credits',
    era: 'homelab',
    cost: 5000,
    prereqs: ['macro_recorder'],
  },
  {
    id: 'cluster_software',
    name: 'Cluster Software',
    description: 'Unlock the Cluster tier',
    era: 'homelab',
    cost: 10000,
    prereqs: [],
    unlockCheck: (servers) => (servers['pi'] ?? 0) >= 25,
    unlockHint: 'Own 25 Raspberry Pi',
  },

  // ───── RACK ERA ─────
  {
    id: 'rack_pdu',
    name: 'Rack PDU',
    description: 'Power capacity +500W (free)',
    era: 'rack',
    cost: 2000,
    prereqs: [],
  },
  {
    id: 'load_balancing',
    name: 'Load Balancing',
    description: 'Rack Server output ×1.25',
    era: 'rack',
    cost: 8000,
    prereqs: [],
  },
  {
    id: 'hot_swap',
    name: 'Hot Swap',
    description: 'Overclock failures lose 0 units instead of 1',
    era: 'rack',
    cost: 25000,
    prereqs: ['load_balancing'],
  },
  {
    id: 'blade_chassis',
    name: 'Blade Chassis',
    description: 'Blade Server output ×1.25',
    era: 'rack',
    cost: 50000,
    prereqs: [],
  },
  {
    id: 'rack_clustering',
    name: 'Rack Clustering',
    description: 'Unlock the Rack Cluster tier',
    era: 'rack',
    cost: 30000,
    prereqs: ['load_balancing'],
  },

  // ───── DATA CENTER ERA ─────
  {
    id: 'research_lab',
    name: 'Research Lab',
    description: 'Unlock Data Scientist hires and start generating Research Points',
    era: 'datacenter',
    cost: 250_000,
    prereqs: [],
    unlockCheck: (servers) => (servers['datacenter'] ?? 0) >= 1,
    unlockHint: 'Build a Data Center',
  },
  {
    id: 'multi_region',
    name: 'Multi-Region Deployment',
    description: 'Unlock the Cloud screen — lease cloud regions worldwide',
    era: 'datacenter',
    cost: 1_000_000,
    prereqs: [],
    unlockCheck: (servers) => (servers['datacenter'] ?? 0) >= 1,
    unlockHint: 'Build a Data Center',
  },
];

export function isUpgradeAvailable(
  upgrade: Upgrade,
  purchased: Record<string, boolean>,
  servers: Record<string, number>
): boolean {
  // All prereqs must be purchased
  if (!upgrade.prereqs.every((id) => purchased[id])) return false;
  // Unlock check (e.g., own enough servers) must pass
  if (upgrade.unlockCheck && !upgrade.unlockCheck(servers)) return false;
  return true;
}

export function getUpgradesByEra(era: UpgradeEra): Upgrade[] {
  return UPGRADES.filter((u) => u.era === era);
}

// ─── Effect helpers ───

export function getClickCreditBonus(purchased: Record<string, boolean>): number {
  let bonus = 0;
  if (purchased['mechanical_keyboard']) bonus += 1;
  if (purchased['macro_recorder']) bonus += 2;
  return bonus;
}

export function getClickCreditMultiplier(
  purchased: Record<string, boolean>
): number {
  return purchased['hyperthreading'] ? 1.5 : 1;
}

export function getServerOutputMultiplier(
  tierId: string,
  purchased: Record<string, boolean>
): number {
  let mult = 1;
  if (tierId === 'pi') {
    if (purchased['containerization']) mult *= 1.25;
    if (purchased['ssd_upgrade']) mult *= 1.5;
  } else if (tierId === 'rack') {
    if (purchased['load_balancing']) mult *= 1.25;
  } else if (tierId === 'blade') {
    if (purchased['blade_chassis']) mult *= 1.25;
  }
  return mult;
}

export function getOverclockFailureLost(
  purchased: Record<string, boolean>
): number {
  return purchased['hot_swap'] ? 0 : 1;
}

export function hasCronJobs(purchased: Record<string, boolean>): boolean {
  return !!purchased['cron_jobs'];
}

export function getBonusPowerCapacity(
  purchased: Record<string, boolean>
): number {
  return purchased['rack_pdu'] ? 500 : 0;
}
