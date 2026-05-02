// AI Agents — endgame automation. The meta-joke: your AI is idle-clicking
// for you. Each agent automates a different aspect of gameplay.
// Global autonomy slider (1-10) affects all agents: higher autonomy = more
// aggressive behavior but with tradeoffs (less reward, more risk).

import 'dart:math';

class AgentType {
  final String id;
  final String name;
  final String description;
  final String icon;
  final int cost;
  final int salaryPerSec;
  final String Function(int autonomy) effectDescription;

  const AgentType({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.cost,
    required this.salaryPerSec,
    required this.effectDescription,
  });
}

final List<AgentType> agentTypes = [
  AgentType(
    id: 'devops_agent',
    name: 'DevOps Agent',
    description: 'Auto-buys servers and capacity on a timer. Keeps your infra balanced.',
    icon: '\u{1F916}', // robot
    cost: 5000000,
    salaryPerSec: 50,
    effectDescription: (a) =>
        'Every ${getDevOpsInterval(a)}s · min eff ${(getDevOpsMinEfficiency(a) * 100).round()}%',
  ),
  AgentType(
    id: 'cost_optimizer',
    name: 'Cost Optimizer',
    description: 'Manages overclock automatically based on risk tolerance.',
    icon: '\u{1F4CA}', // chart
    cost: 3000000,
    salaryPerSec: 30,
    effectDescription: (a) => a >= 7
        ? 'Overclock always ON (aggressive)'
        : a >= 4
            ? 'Overclock ON when failure chance is low'
            : 'Overclock ON only with Redundant PSU + SRE',
  ),
  AgentType(
    id: 'incident_responder',
    name: 'Incident Responder',
    description: 'Auto-resolves incidents for a reduced reward.',
    icon: '\u{1F680}', // rocket
    cost: 8000000,
    salaryPerSec: 80,
    effectDescription: (a) =>
        'Auto-resolves in ${getResponderDelay(a)}s · ${(getResponderRewardMult(a) * 100).round()}% reward',
  ),
];

// --- Autonomy-scaled parameters ---

/// DevOps Agent: seconds between auto-buy attempts
int getDevOpsInterval(int autonomy) {
  // Autonomy 1 = every 30s, autonomy 10 = every 3s
  return max(3, 33 - autonomy * 3);
}

/// DevOps Agent: minimum efficiency before it stops buying servers and buys
/// capacity instead.
/// Low autonomy = only buys when efficiency is high (90%+).
/// High autonomy = tolerates efficiency dropping to 50%.
double getDevOpsMinEfficiency(int autonomy) {
  // Autonomy 1 = 0.90, autonomy 10 = 0.50
  return max(0.50, 0.94 - autonomy * 0.044);
}

/// Incident Responder: seconds delay before auto-resolve
int getResponderDelay(int autonomy) {
  // Autonomy 1 = 8s delay, autonomy 10 = 1s delay
  return max(1, (9 - autonomy * 0.8).round());
}

/// Incident Responder: reward multiplier (lower than manual)
double getResponderRewardMult(int autonomy) {
  // Autonomy 1 = 75% reward, autonomy 10 = 30% reward
  // Higher autonomy = faster but less reward
  return max(0.3, 0.80 - autonomy * 0.05);
}

/// Cost Optimizer: should overclock be enabled?
bool shouldOverclock(int autonomy, bool hasRedundantPsu, int sreCount) {
  if (autonomy >= 7) return true; // aggressive — always on
  if (autonomy >= 4) return hasRedundantPsu || sreCount >= 2; // moderate
  return hasRedundantPsu && sreCount >= 1; // conservative — needs both
}

bool isAgentsNavVisible(Map<String, int> gpus) {
  final totalGpus = gpus.values.fold(0, (a, b) => a + b);
  return totalGpus >= 1;
}

int getTotalAgentSalary(Map<String, bool> agents) {
  return agentTypes.fold(0, (sum, a) {
    return sum + (agents[a.id] == true ? a.salaryPerSec : 0);
  });
}
