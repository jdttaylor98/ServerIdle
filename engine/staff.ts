// Staff roles — separate unit category with per-second salaries and gated unlocks.

export interface GateState {
  totalServers: number;
  totalClusters: number;
  ddosResolvedCount: number;
  diskFullResolvedCount: number;
  vendorOfferAcceptedCount: number;
  hotSwapOwned: boolean;
  totalStaffHired: number;
}

export interface StaffRole {
  id: string;
  name: string;
  icon: string;
  description: string;
  effectHint: string; // displayed under the description
  hireCost: number;
  costScaling: number;
  salary: number; // cr/sec drain per unit
  isUnlocked: (gates: GateState) => boolean;
  unlockHint: string;
}

export const STAFF_ROLES: StaffRole[] = [
  {
    id: 'devops_engineer',
    name: 'DevOps Engineer',
    icon: '🛠',
    description: 'Pushes to prod on a Friday and means it.',
    effectHint: '+5% global server/cluster output per hire',
    hireCost: 5_000,
    costScaling: 1.20,
    salary: 0.5,
    isUnlocked: (g) => g.totalServers >= 5,
    unlockHint: 'Own 5 servers',
  },
  {
    id: 'security_engineer',
    name: 'Security Engineer',
    icon: '🔒',
    description: 'Wears a black hoodie. Blocks attacks.',
    effectHint: 'DDoS trigger rate −20% per hire (90% cap)',
    hireCost: 10_000,
    costScaling: 1.20,
    salary: 1,
    isUnlocked: (g) => g.ddosResolvedCount >= 1,
    unlockHint: 'Resolve a DDoS attack',
  },
  {
    id: 'sysadmin',
    name: 'SysAdmin',
    icon: '🖥',
    description: 'Once cleaned 50TB of logs by hand. Never again.',
    effectHint: 'Disk Full incidents stop occurring',
    hireCost: 8_000,
    costScaling: 1.20,
    salary: 0.8,
    isUnlocked: (g) => g.diskFullResolvedCount >= 1,
    unlockHint: 'Clear a Disk Full incident',
  },
  {
    id: 'sre',
    name: 'SRE',
    icon: '📈',
    description: 'Has opinions about percentile latencies.',
    effectHint: 'Overclock failure chance −15% per hire',
    hireCost: 25_000,
    costScaling: 1.20,
    salary: 2.5,
    isUnlocked: (g) => g.hotSwapOwned,
    unlockHint: 'Buy the Hot Swap upgrade',
  },
  {
    id: 'sales_engineer',
    name: 'Sales Engineer',
    icon: '💼',
    description: 'Knows a guy at every vendor. Always.',
    effectHint: 'Vendor Offer trigger rate +25% per hire',
    hireCost: 15_000,
    costScaling: 1.20,
    salary: 1.5,
    isUnlocked: (g) => g.vendorOfferAcceptedCount >= 1,
    unlockHint: 'Accept a Vendor Offer',
  },
  {
    id: 'engineering_manager',
    name: 'Engineering Manager',
    icon: '👔',
    description: 'Schedules a 1:1 to discuss your 1:1.',
    effectHint: 'All other staff effects ×1.25 per hire',
    hireCost: 100_000,
    costScaling: 1.20,
    salary: 10,
    isUnlocked: (g) => g.totalStaffHired >= 10,
    unlockHint: 'Hire 10 total staff',
  },
];

// ─── Cost / refund ───
export function getHireCost(role: StaffRole, owned: number): number {
  return Math.floor(role.hireCost * Math.pow(role.costScaling, owned));
}

// ─── Aggregate effect helpers ───

function getCount(staff: Record<string, number>, id: string): number {
  return staff[id] ?? 0;
}

function getManagerBoost(staff: Record<string, number>): number {
  return 1 + 0.25 * getCount(staff, 'engineering_manager');
}

/** Multiplier applied to server + cluster output. 1.0 if no staff. */
export function getStaffOutputMultiplier(staff: Record<string, number>): number {
  return 1 + 0.05 * getCount(staff, 'devops_engineer') * getManagerBoost(staff);
}

/** Total salary drain in credits per second. */
export function getTotalSalary(staff: Record<string, number>): number {
  return STAFF_ROLES.reduce((sum, role) => {
    return sum + role.salary * getCount(staff, role.id);
  }, 0);
}

/** Multiplier applied to base overclock failure chance (1 = unchanged). */
export function getOverclockFailureMultiplier(
  staff: Record<string, number>
): number {
  const reduction = Math.min(
    0.9,
    0.15 * getCount(staff, 'sre') * getManagerBoost(staff)
  );
  return 1 - reduction;
}

/** Per-incident-type weight modifiers used when picking a random incident. */
export function getIncidentWeightModifiers(
  staff: Record<string, number>
): { ddos: number; disk_full: number; vendor_offer: number } {
  const m = getManagerBoost(staff);

  const securityReduction = Math.min(
    0.9,
    0.20 * getCount(staff, 'security_engineer') * m
  );
  const ddos = 1 - securityReduction;

  const diskFull = getCount(staff, 'sysadmin') >= 1 ? 0 : 1;

  const salesBoost = 0.25 * getCount(staff, 'sales_engineer') * m;
  const vendorOffer = 1 + salesBoost;

  return {
    ddos,
    disk_full: diskFull,
    vendor_offer: vendorOffer,
  };
}

export function getTotalStaffCount(staff: Record<string, number>): number {
  return Object.values(staff).reduce((a, b) => a + b, 0);
}

/** Whether the STAFF nav tile should appear at all (any role currently unlockable). */
export function isStaffNavVisible(gates: GateState): boolean {
  return STAFF_ROLES.some((r) => r.isUnlocked(gates));
}

/**
 * Returns the roles to display on the Staff screen:
 * all unlocked roles, plus one "teaser" locked role (the cheapest one still locked).
 * Hides everything further out so the screen doesn't feel like a menu.
 */
export function getVisibleStaffRoles(gates: GateState): StaffRole[] {
  const unlocked = STAFF_ROLES.filter((r) => r.isUnlocked(gates));
  const locked = STAFF_ROLES.filter((r) => !r.isUnlocked(gates));
  // Cheapest locked acts as the teaser (matches natural progression curve)
  const teaser = [...locked].sort((a, b) => a.hireCost - b.hireCost)[0];
  return teaser ? [...unlocked, teaser] : unlocked;
}
