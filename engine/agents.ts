// AI Agents — endgame automation. The meta-joke: your AI is idle-clicking
// for you. Each agent automates a different aspect of gameplay.
// Global autonomy slider (1–10) affects all agents: higher autonomy = more
// aggressive behavior but with tradeoffs (less reward, more risk).

export interface AgentType {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  salaryPerSec: number;
  effectDescription: (autonomy: number) => string;
}

export const AGENT_TYPES: AgentType[] = [
  {
    id: 'devops_agent',
    name: 'DevOps Agent',
    description: 'Auto-buys the best affordable server on a timer.',
    icon: '🤖',
    cost: 5_000_000,
    salaryPerSec: 50,
    effectDescription: (a) =>
      `Buys a server every ${getDevOpsInterval(a)}s`,
  },
  {
    id: 'cost_optimizer',
    name: 'Cost Optimizer',
    description: 'Manages overclock automatically based on risk tolerance.',
    icon: '📊',
    cost: 3_000_000,
    salaryPerSec: 30,
    effectDescription: (a) =>
      a >= 7
        ? 'Overclock always ON (aggressive)'
        : a >= 4
          ? 'Overclock ON when failure chance is low'
          : 'Overclock ON only with Redundant PSU + SRE',
  },
  {
    id: 'incident_responder',
    name: 'Incident Responder',
    description: 'Auto-resolves incidents for a reduced reward.',
    icon: '🚀',
    cost: 8_000_000,
    salaryPerSec: 80,
    effectDescription: (a) =>
      `Auto-resolves in ${getResponderDelay(a)}s · ${Math.round(getResponderRewardMult(a) * 100)}% reward`,
  },
];

// ─── Autonomy-scaled parameters ───

/** DevOps Agent: seconds between auto-buy attempts */
export function getDevOpsInterval(autonomy: number): number {
  // Autonomy 1 = every 30s, autonomy 10 = every 3s
  return Math.max(3, 33 - autonomy * 3);
}

/** Incident Responder: seconds delay before auto-resolve */
export function getResponderDelay(autonomy: number): number {
  // Autonomy 1 = 8s delay, autonomy 10 = 1s delay
  return Math.max(1, Math.round(9 - autonomy * 0.8));
}

/** Incident Responder: reward multiplier (lower than manual) */
export function getResponderRewardMult(autonomy: number): number {
  // Autonomy 1 = 75% reward, autonomy 10 = 30% reward
  // Higher autonomy = faster but less reward
  return Math.max(0.3, 0.80 - autonomy * 0.05);
}

/** Cost Optimizer: should overclock be enabled? */
export function shouldOverclock(
  autonomy: number,
  hasRedundantPsu: boolean,
  sreCount: number
): boolean {
  if (autonomy >= 7) return true; // aggressive — always on
  if (autonomy >= 4) return hasRedundantPsu || sreCount >= 2; // moderate — needs some protection
  return hasRedundantPsu && sreCount >= 1; // conservative — needs both
}

export function isAgentsNavVisible(gpus: Record<string, number>): boolean {
  const totalGpus = Object.values(gpus).reduce((a, b) => a + b, 0);
  return totalGpus >= 1;
}

export function getTotalAgentSalary(agents: Record<string, boolean>): number {
  return AGENT_TYPES.reduce((sum, a) => {
    return sum + (agents[a.id] ? a.salaryPerSec : 0);
  }, 0);
}
