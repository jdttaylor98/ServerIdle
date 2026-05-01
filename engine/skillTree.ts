// Skill Tree — permanent upgrades purchased with Skill Points (SP).
// Four branches: Hardware, Operations, Security, AI.
// Skills persist across prestiges. Some require minimum prestige count.

export type SkillBranch = 'hardware' | 'operations' | 'security' | 'ai';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  branch: SkillBranch;
  cost: number; // SP cost
  prereqs: string[]; // skill ids that must be owned first
  minPrestiges: number; // minimum prestige count to unlock
  icon: string;
}

export const SKILL_BRANCHES: { id: SkillBranch; name: string; icon: string; color: string }[] = [
  { id: 'hardware', name: 'Hardware', icon: '🖥️', color: '#00ff88' },
  { id: 'operations', name: 'Operations', icon: '⚙️', color: '#44aaff' },
  { id: 'security', name: 'Security', icon: '🛡️', color: '#ff5566' },
  { id: 'ai', name: 'AI', icon: '🧠', color: '#cc88ff' },
];

// ─── Hardware Branch (8 nodes) ───
// Focus: servers, capacity, build times

// ─── Operations Branch (8 nodes) ───
// Focus: economy, research, efficiency

// ─── Security Branch (8 nodes) ───
// Focus: incidents, overclock safety

// ─── AI Branch (8 nodes) ───
// Focus: GPU output, agent efficiency

export const SKILL_NODES: SkillNode[] = [
  // ══════════════════════════════════════
  // HARDWARE
  // ══════════════════════════════════════
  {
    id: 'bootstrapper',
    name: 'Bootstrapper',
    description: 'Start each run with 2 Raspberry Pis.',
    branch: 'hardware',
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '🥾',
  },
  {
    id: 'bulk_discount',
    name: 'Bulk Discount',
    description: 'Server purchase costs −10%.',
    branch: 'hardware',
    cost: 1,
    prereqs: ['bootstrapper'],
    minPrestiges: 1,
    icon: '🏷️',
  },
  {
    id: 'quick_deploy',
    name: 'Quick Deploy',
    description: 'Build queue times −25%.',
    branch: 'hardware',
    cost: 2,
    prereqs: ['bulk_discount'],
    minPrestiges: 1,
    icon: '⚡',
  },
  {
    id: 'power_surplus',
    name: 'Power Surplus',
    description: 'Start each run with +200W bonus power.',
    branch: 'hardware',
    cost: 1,
    prereqs: ['bootstrapper'],
    minPrestiges: 1,
    icon: '🔌',
  },
  {
    id: 'cool_start',
    name: 'Cool Start',
    description: 'Start each run with +300 BTU bonus cooling.',
    branch: 'hardware',
    cost: 1,
    prereqs: ['power_surplus'],
    minPrestiges: 1,
    icon: '❄️',
  },
  {
    id: 'overbuilt',
    name: 'Overbuilt',
    description: 'All server output +15%.',
    branch: 'hardware',
    cost: 2,
    prereqs: ['bulk_discount'],
    minPrestiges: 2,
    icon: '💪',
  },
  {
    id: 'datacenter_express',
    name: 'Datacenter Express',
    description: 'Build queue times −25% more (total −50%).',
    branch: 'hardware',
    cost: 3,
    prereqs: ['quick_deploy'],
    minPrestiges: 3,
    icon: '🚀',
  },
  {
    id: 'mega_capacity',
    name: 'Mega Capacity',
    description: 'Start each run with +500W power and +500 BTU cooling.',
    branch: 'hardware',
    cost: 2,
    prereqs: ['cool_start'],
    minPrestiges: 2,
    icon: '🏗️',
  },

  // ══════════════════════════════════════
  // OPERATIONS
  // ══════════════════════════════════════
  {
    id: 'venture_capital',
    name: 'Venture Capital',
    description: 'Start each run with 50,000 credits.',
    branch: 'operations',
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '💰',
  },
  {
    id: 'penny_pincher',
    name: 'Penny Pincher',
    description: 'Upgrade costs −15%.',
    branch: 'operations',
    cost: 1,
    prereqs: ['venture_capital'],
    minPrestiges: 1,
    icon: '🪙',
  },
  {
    id: 'fast_learner',
    name: 'Fast Learner',
    description: 'Research point generation +25%.',
    branch: 'operations',
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '📚',
  },
  {
    id: 'click_training',
    name: 'Click Training',
    description: 'Tap provision gives +5 bonus credits.',
    branch: 'operations',
    cost: 2,
    prereqs: ['venture_capital'],
    minPrestiges: 1,
    icon: '👆',
  },
  {
    id: 'headhunter',
    name: 'Headhunter',
    description: 'Staff hire costs −20%.',
    branch: 'operations',
    cost: 2,
    prereqs: ['penny_pincher'],
    minPrestiges: 2,
    icon: '🎯',
  },
  {
    id: 'cloud_discount',
    name: 'Cloud Discount',
    description: 'Cloud region lease costs −20%.',
    branch: 'operations',
    cost: 2,
    prereqs: ['penny_pincher'],
    minPrestiges: 1,
    icon: '☁️',
  },
  {
    id: 'angel_investor',
    name: 'Angel Investor',
    description: 'Start each run with 500,000 credits.',
    branch: 'operations',
    cost: 3,
    prereqs: ['venture_capital'],
    minPrestiges: 2,
    icon: '👼',
  },
  {
    id: 'offline_mogul',
    name: 'Offline Mogul',
    description: 'Offline earnings rate 75% (up from 50%).',
    branch: 'operations',
    cost: 3,
    prereqs: ['fast_learner'],
    minPrestiges: 3,
    icon: '😴',
  },

  // ══════════════════════════════════════
  // SECURITY
  // ══════════════════════════════════════
  {
    id: 'firewall',
    name: 'Firewall',
    description: 'DDoS mitigation requires 2 fewer taps.',
    branch: 'security',
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '🧱',
  },
  {
    id: 'backup_systems',
    name: 'Backup Systems',
    description: 'Incident timeout penalties −30%.',
    branch: 'security',
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '💾',
  },
  {
    id: 'incident_pay',
    name: 'Incident Pay',
    description: 'Incident rewards +25%.',
    branch: 'security',
    cost: 2,
    prereqs: ['firewall'],
    minPrestiges: 1,
    icon: '💵',
  },
  {
    id: 'rapid_response',
    name: 'Rapid Response',
    description: 'Incident timers extended by +5 seconds.',
    branch: 'security',
    cost: 1,
    prereqs: ['backup_systems'],
    minPrestiges: 1,
    icon: '⏱️',
  },
  {
    id: 'hardened_servers',
    name: 'Hardened Servers',
    description: 'Overclock failure chance −30%.',
    branch: 'security',
    cost: 2,
    prereqs: ['firewall'],
    minPrestiges: 2,
    icon: '🔒',
  },
  {
    id: 'threat_intel',
    name: 'Threat Intel',
    description: 'Random incident trigger chance −25%.',
    branch: 'security',
    cost: 2,
    prereqs: ['rapid_response'],
    minPrestiges: 2,
    icon: '🕵️',
  },
  {
    id: 'bug_bounty',
    name: 'Bug Bounty',
    description: 'Hacker breach rewards ×2.',
    branch: 'security',
    cost: 3,
    prereqs: ['incident_pay'],
    minPrestiges: 3,
    icon: '🐛',
  },
  {
    id: 'iron_defense',
    name: 'Iron Defense',
    description: 'Overclock failure chance −30% more (stacks).',
    branch: 'security',
    cost: 3,
    prereqs: ['hardened_servers'],
    minPrestiges: 3,
    icon: '🛡️',
  },

  // ══════════════════════════════════════
  // AI
  // ══════════════════════════════════════
  {
    id: 'gpu_overclock',
    name: 'GPU Overclock',
    description: 'GPU credit output +20%.',
    branch: 'ai',
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '🎮',
  },
  {
    id: 'agent_discount',
    name: 'Agent Discount',
    description: 'Agent hire costs −25%.',
    branch: 'ai',
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '🤝',
  },
  {
    id: 'neural_boost',
    name: 'Neural Boost',
    description: 'GPU research point output +30%.',
    branch: 'ai',
    cost: 2,
    prereqs: ['gpu_overclock'],
    minPrestiges: 1,
    icon: '🧬',
  },
  {
    id: 'loyal_agents',
    name: 'Loyal Agents',
    description: 'Agent salaries −25%.',
    branch: 'ai',
    cost: 2,
    prereqs: ['agent_discount'],
    minPrestiges: 1,
    icon: '🤖',
  },
  {
    id: 'quantum_leap',
    name: 'Quantum Leap',
    description: 'GPU credit output +40% more (stacks).',
    branch: 'ai',
    cost: 3,
    prereqs: ['gpu_overclock'],
    minPrestiges: 2,
    icon: '⚛️',
  },
  {
    id: 'smart_agents',
    name: 'Smart Agents',
    description: 'Incident Responder reward penalty halved.',
    branch: 'ai',
    cost: 2,
    prereqs: ['loyal_agents'],
    minPrestiges: 2,
    icon: '🧠',
  },
  {
    id: 'singularity',
    name: 'Singularity',
    description: 'All GPU output ×2.',
    branch: 'ai',
    cost: 4,
    prereqs: ['quantum_leap'],
    minPrestiges: 3,
    icon: '🌀',
  },
  {
    id: 'hivemind',
    name: 'Hivemind',
    description: 'All agents act 50% faster.',
    branch: 'ai',
    cost: 3,
    prereqs: ['smart_agents'],
    minPrestiges: 3,
    icon: '🕸️',
  },
];

// ─── Availability checks ───

export function isSkillAvailable(
  node: SkillNode,
  skills: Record<string, boolean>,
  prestigeCount: number
): boolean {
  if (skills[node.id]) return false; // already owned
  if (prestigeCount < node.minPrestiges) return false;
  return node.prereqs.every((p) => !!skills[p]);
}

export function isSkillVisible(
  node: SkillNode,
  skills: Record<string, boolean>,
  prestigeCount: number
): boolean {
  // Show if owned, available, or prereqs met (even if prestige gated — show as locked)
  if (skills[node.id]) return true;
  if (node.prereqs.length === 0) return true;
  return node.prereqs.every((p) => !!skills[p]);
}

export function getSkillsInBranch(branch: SkillBranch): SkillNode[] {
  return SKILL_NODES.filter((n) => n.branch === branch);
}

// ─── Bonus getter functions ───
// Each returns a multiplier or flat bonus based on owned skills.

/** Server purchase cost multiplier (< 1 means cheaper) */
export function getSkillServerCostMult(skills: Record<string, boolean>): number {
  return skills['bulk_discount'] ? 0.90 : 1;
}

/** Build queue time multiplier (< 1 means faster) */
export function getSkillBuildTimeMult(skills: Record<string, boolean>): number {
  let mult = 1;
  if (skills['quick_deploy']) mult *= 0.75;
  if (skills['datacenter_express']) mult *= 0.75; // stacks: 0.75 × 0.75 ≈ 0.56
  return mult;
}

/** Server output multiplier (> 1 means more output) */
export function getSkillServerOutputMult(skills: Record<string, boolean>): number {
  return skills['overbuilt'] ? 1.15 : 1;
}

/** Starting credits from skills */
export function getSkillStartingCredits(skills: Record<string, boolean>): number {
  let credits = 0;
  if (skills['venture_capital']) credits += 50_000;
  if (skills['angel_investor']) credits += 500_000;
  return credits;
}

/** Starting servers from skills: returns Record<tierId, count> */
export function getSkillStartingServers(skills: Record<string, boolean>): Record<string, number> {
  const servers: Record<string, number> = {};
  if (skills['bootstrapper']) servers['raspberry_pi'] = 2;
  return servers;
}

/** Bonus starting power capacity from skills */
export function getSkillBonusPower(skills: Record<string, boolean>): number {
  let bonus = 0;
  if (skills['power_surplus']) bonus += 200;
  if (skills['mega_capacity']) bonus += 500;
  return bonus;
}

/** Bonus starting cooling capacity from skills */
export function getSkillBonusCooling(skills: Record<string, boolean>): number {
  let bonus = 0;
  if (skills['cool_start']) bonus += 300;
  if (skills['mega_capacity']) bonus += 500;
  return bonus;
}

/** Upgrade cost multiplier */
export function getSkillUpgradeCostMult(skills: Record<string, boolean>): number {
  return skills['penny_pincher'] ? 0.85 : 1;
}

/** Research point generation multiplier */
export function getSkillResearchMult(skills: Record<string, boolean>): number {
  return skills['fast_learner'] ? 1.25 : 1;
}

/** Tap provision flat bonus credits */
export function getSkillTapBonus(skills: Record<string, boolean>): number {
  return skills['click_training'] ? 5 : 0;
}

/** Staff hire cost multiplier */
export function getSkillStaffCostMult(skills: Record<string, boolean>): number {
  return skills['headhunter'] ? 0.80 : 1;
}

/** Cloud region cost multiplier */
export function getSkillCloudCostMult(skills: Record<string, boolean>): number {
  return skills['cloud_discount'] ? 0.80 : 1;
}

/** Offline earnings efficiency (base 0.5, Offline Mogul makes it 0.75) */
export function getSkillOfflineEfficiency(skills: Record<string, boolean>): number {
  return skills['offline_mogul'] ? 0.75 : 0.50;
}

/** DDoS tap reduction */
export function getSkillDdosTapReduction(skills: Record<string, boolean>): number {
  return skills['firewall'] ? 2 : 0;
}

/** Incident timeout penalty multiplier (< 1 means less penalty) */
export function getSkillTimeoutPenaltyMult(skills: Record<string, boolean>): number {
  return skills['backup_systems'] ? 0.70 : 1;
}

/** Incident reward multiplier */
export function getSkillIncidentRewardMult(skills: Record<string, boolean>): number {
  let mult = 1;
  if (skills['incident_pay']) mult *= 1.25;
  return mult;
}

/** Incident timer extension in seconds */
export function getSkillIncidentTimerBonus(skills: Record<string, boolean>): number {
  return skills['rapid_response'] ? 5 : 0;
}

/** Overclock failure chance multiplier from skills (stacks with upgrade + SRE) */
export function getSkillOverclockFailureMult(skills: Record<string, boolean>): number {
  let mult = 1;
  if (skills['hardened_servers']) mult *= 0.70;
  if (skills['iron_defense']) mult *= 0.70; // stacks: 0.70 × 0.70 = 0.49
  return mult;
}

/** Incident trigger chance multiplier */
export function getSkillIncidentTriggerMult(skills: Record<string, boolean>): number {
  return skills['threat_intel'] ? 0.75 : 1;
}

/** Hacker breach reward multiplier (on top of incident_pay) */
export function getSkillHackerRewardMult(skills: Record<string, boolean>): number {
  return skills['bug_bounty'] ? 2 : 1;
}

/** GPU credit output multiplier */
export function getSkillGpuOutputMult(skills: Record<string, boolean>): number {
  let mult = 1;
  if (skills['gpu_overclock']) mult *= 1.20;
  if (skills['quantum_leap']) mult *= 1.40;
  if (skills['singularity']) mult *= 2.0;
  return mult;
}

/** GPU research point output multiplier */
export function getSkillGpuRpMult(skills: Record<string, boolean>): number {
  let mult = 1;
  if (skills['neural_boost']) mult *= 1.30;
  if (skills['singularity']) mult *= 2.0; // singularity boosts all GPU output
  return mult;
}

/** Agent hire cost multiplier */
export function getSkillAgentCostMult(skills: Record<string, boolean>): number {
  return skills['agent_discount'] ? 0.75 : 1;
}

/** Agent salary multiplier */
export function getSkillAgentSalaryMult(skills: Record<string, boolean>): number {
  return skills['loyal_agents'] ? 0.75 : 1;
}

/** Incident Responder reward penalty reduction — returns bonus multiplier on top of base responder reward.
 *  Base responder reward is already penalized (30-75% of manual). Smart Agents halves the penalty.
 *  e.g. if base reward mult is 0.50 (50% of manual), smart_agents makes it 0.75 (halfway to 1.0). */
export function getSkillResponderBonus(skills: Record<string, boolean>): boolean {
  return !!skills['smart_agents'];
}

/** Agent speed multiplier (< 1 means intervals are shorter = faster) */
export function getSkillAgentSpeedMult(skills: Record<string, boolean>): number {
  return skills['hivemind'] ? 0.50 : 1;
}
