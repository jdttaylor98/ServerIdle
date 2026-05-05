// Skill Tree — permanent upgrades purchased with Skill Points (SP).
// Four branches: Hardware, Operations, Security, AI.
// Skills persist across prestiges. Some require minimum prestige count.

enum SkillBranch { hardware, operations, security, ai }

class SkillBranchInfo {
  final SkillBranch id;
  final String name;
  final String icon;
  final int color; // hex int, e.g. 0xFF00FF88

  const SkillBranchInfo({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
  });
}

const List<SkillBranchInfo> skillBranches = [
  SkillBranchInfo(id: SkillBranch.hardware, name: 'Hardware', icon: '\u{1F5A5}️', color: 0xFF00FF88),
  SkillBranchInfo(id: SkillBranch.operations, name: 'Operations', icon: '⚙️', color: 0xFF44AAFF),
  SkillBranchInfo(id: SkillBranch.security, name: 'Security', icon: '\u{1F6E1}️', color: 0xFFFF5566),
  SkillBranchInfo(id: SkillBranch.ai, name: 'AI', icon: '\u{1F9E0}', color: 0xFFCC88FF),
];

class SkillNode {
  final String id;
  final String name;
  final String description;
  final SkillBranch branch;
  final int cost; // SP cost
  final List<String> prereqs; // skill ids that must be owned first
  final int minPrestiges; // minimum prestige count to unlock
  final String icon;

  const SkillNode({
    required this.id,
    required this.name,
    required this.description,
    required this.branch,
    required this.cost,
    required this.prereqs,
    required this.minPrestiges,
    required this.icon,
  });
}

const List<SkillNode> skillNodes = [
  // ══════════════════════════════════════
  // HARDWARE
  // ══════════════════════════════════════
  SkillNode(
    id: 'bootstrapper',
    name: 'Bootstrapper',
    description: 'Start each run with 2 Raspberry Pis.',
    branch: SkillBranch.hardware,
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '\u{1F97E}',
  ),
  SkillNode(
    id: 'bulk_discount',
    name: 'Bulk Discount',
    description: 'Server purchase costs −10%.',
    branch: SkillBranch.hardware,
    cost: 1,
    prereqs: ['bootstrapper'],
    minPrestiges: 1,
    icon: '\u{1F3F7}️',
  ),
  SkillNode(
    id: 'quick_deploy',
    name: 'Quick Deploy',
    description: 'Build queue times −25%.',
    branch: SkillBranch.hardware,
    cost: 2,
    prereqs: ['bulk_discount'],
    minPrestiges: 1,
    icon: '⚡',
  ),
  SkillNode(
    id: 'power_surplus',
    name: 'Power Surplus',
    description: 'Start each run with +200W bonus power.',
    branch: SkillBranch.hardware,
    cost: 1,
    prereqs: ['bootstrapper'],
    minPrestiges: 1,
    icon: '\u{1F50C}',
  ),
  SkillNode(
    id: 'cool_start',
    name: 'Cool Start',
    description: 'Start each run with +300 BTU bonus cooling.',
    branch: SkillBranch.hardware,
    cost: 1,
    prereqs: ['power_surplus'],
    minPrestiges: 1,
    icon: '❄️',
  ),
  SkillNode(
    id: 'overbuilt',
    name: 'Overbuilt',
    description: 'All server output +15%.',
    branch: SkillBranch.hardware,
    cost: 2,
    prereqs: ['bulk_discount'],
    minPrestiges: 2,
    icon: '\u{1F4AA}',
  ),
  SkillNode(
    id: 'datacenter_express',
    name: 'Datacenter Express',
    description: 'Build queue times −25% more (total −50%).',
    branch: SkillBranch.hardware,
    cost: 3,
    prereqs: ['quick_deploy'],
    minPrestiges: 3,
    icon: '\u{1F680}',
  ),
  SkillNode(
    id: 'mega_capacity',
    name: 'Mega Capacity',
    description: 'Start each run with +500W power and +500 BTU cooling.',
    branch: SkillBranch.hardware,
    cost: 2,
    prereqs: ['cool_start'],
    minPrestiges: 2,
    icon: '\u{1F3D7}️',
  ),

  // ══════════════════════════════════════
  // OPERATIONS
  // ══════════════════════════════════════
  SkillNode(
    id: 'venture_capital',
    name: 'Venture Capital',
    description: 'Start each run with 50,000 flops.',
    branch: SkillBranch.operations,
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '\u{1F4B0}',
  ),
  SkillNode(
    id: 'penny_pincher',
    name: 'Penny Pincher',
    description: 'Upgrade costs −15%.',
    branch: SkillBranch.operations,
    cost: 1,
    prereqs: ['venture_capital'],
    minPrestiges: 1,
    icon: '\u{1FA99}',
  ),
  SkillNode(
    id: 'fast_learner',
    name: 'Fast Learner',
    description: 'Research point generation +25%.',
    branch: SkillBranch.operations,
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '\u{1F4DA}',
  ),
  SkillNode(
    id: 'click_training',
    name: 'Click Training',
    description: 'Tap provision gives +5 bonus flops.',
    branch: SkillBranch.operations,
    cost: 2,
    prereqs: ['venture_capital'],
    minPrestiges: 1,
    icon: '\u{1F446}',
  ),
  SkillNode(
    id: 'headhunter',
    name: 'Headhunter',
    description: 'Staff hire costs −20%.',
    branch: SkillBranch.operations,
    cost: 2,
    prereqs: ['penny_pincher'],
    minPrestiges: 2,
    icon: '\u{1F3AF}',
  ),
  SkillNode(
    id: 'cloud_discount',
    name: 'Cloud Discount',
    description: 'Cloud region lease costs −20%.',
    branch: SkillBranch.operations,
    cost: 2,
    prereqs: ['penny_pincher'],
    minPrestiges: 1,
    icon: '☁️',
  ),
  SkillNode(
    id: 'angel_investor',
    name: 'Angel Investor',
    description: 'Start each run with 500,000 flops.',
    branch: SkillBranch.operations,
    cost: 3,
    prereqs: ['venture_capital'],
    minPrestiges: 2,
    icon: '\u{1F47C}',
  ),
  SkillNode(
    id: 'offline_mogul',
    name: 'Offline Mogul',
    description: 'Offline earnings rate 75% (up from 50%).',
    branch: SkillBranch.operations,
    cost: 3,
    prereqs: ['fast_learner'],
    minPrestiges: 3,
    icon: '\u{1F634}',
  ),

  // ══════════════════════════════════════
  // SECURITY
  // ══════════════════════════════════════
  SkillNode(
    id: 'firewall',
    name: 'Firewall',
    description: 'DDoS mitigation requires 2 fewer taps.',
    branch: SkillBranch.security,
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '\u{1F9F1}',
  ),
  SkillNode(
    id: 'backup_systems',
    name: 'Backup Systems',
    description: 'Incident timeout penalties −30%.',
    branch: SkillBranch.security,
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '\u{1F4BE}',
  ),
  SkillNode(
    id: 'incident_pay',
    name: 'Incident Pay',
    description: 'Incident rewards +25%.',
    branch: SkillBranch.security,
    cost: 2,
    prereqs: ['firewall'],
    minPrestiges: 1,
    icon: '\u{1F4B5}',
  ),
  SkillNode(
    id: 'rapid_response',
    name: 'Rapid Response',
    description: 'Incident timers extended by +5 seconds.',
    branch: SkillBranch.security,
    cost: 1,
    prereqs: ['backup_systems'],
    minPrestiges: 1,
    icon: '⏱️',
  ),
  SkillNode(
    id: 'hardened_servers',
    name: 'Hardened Servers',
    description: 'Overclock failure chance −30%.',
    branch: SkillBranch.security,
    cost: 2,
    prereqs: ['firewall'],
    minPrestiges: 2,
    icon: '\u{1F512}',
  ),
  SkillNode(
    id: 'threat_intel',
    name: 'Threat Intel',
    description: 'Random incident trigger chance −25%.',
    branch: SkillBranch.security,
    cost: 2,
    prereqs: ['rapid_response'],
    minPrestiges: 2,
    icon: '\u{1F575}️',
  ),
  SkillNode(
    id: 'bug_bounty',
    name: 'Bug Bounty',
    description: 'Hacker breach rewards ×2.',
    branch: SkillBranch.security,
    cost: 3,
    prereqs: ['incident_pay'],
    minPrestiges: 3,
    icon: '\u{1F41B}',
  ),
  SkillNode(
    id: 'iron_defense',
    name: 'Iron Defense',
    description: 'Overclock failure chance −30% more (stacks).',
    branch: SkillBranch.security,
    cost: 3,
    prereqs: ['hardened_servers'],
    minPrestiges: 3,
    icon: '\u{1F6E1}️',
  ),

  // ══════════════════════════════════════
  // AI
  // ══════════════════════════════════════
  SkillNode(
    id: 'gpu_overclock',
    name: 'GPU Overclock',
    description: 'GPU flop output +20%.',
    branch: SkillBranch.ai,
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '\u{1F3AE}',
  ),
  SkillNode(
    id: 'agent_discount',
    name: 'Agent Discount',
    description: 'Agent hire costs −25%.',
    branch: SkillBranch.ai,
    cost: 1,
    prereqs: [],
    minPrestiges: 1,
    icon: '\u{1F91D}',
  ),
  SkillNode(
    id: 'neural_boost',
    name: 'Neural Boost',
    description: 'GPU research point output +30%.',
    branch: SkillBranch.ai,
    cost: 2,
    prereqs: ['gpu_overclock'],
    minPrestiges: 1,
    icon: '\u{1F9EC}',
  ),
  SkillNode(
    id: 'loyal_agents',
    name: 'Loyal Agents',
    description: 'Agent salaries −25%.',
    branch: SkillBranch.ai,
    cost: 2,
    prereqs: ['agent_discount'],
    minPrestiges: 1,
    icon: '\u{1F916}',
  ),
  SkillNode(
    id: 'quantum_leap',
    name: 'Quantum Leap',
    description: 'GPU flop output +40% more (stacks).',
    branch: SkillBranch.ai,
    cost: 3,
    prereqs: ['gpu_overclock'],
    minPrestiges: 2,
    icon: '⚛️',
  ),
  SkillNode(
    id: 'smart_agents',
    name: 'Smart Agents',
    description: 'Incident Responder reward penalty halved.',
    branch: SkillBranch.ai,
    cost: 2,
    prereqs: ['loyal_agents'],
    minPrestiges: 2,
    icon: '\u{1F9E0}',
  ),
  SkillNode(
    id: 'singularity',
    name: 'Singularity',
    description: 'All GPU output ×2.',
    branch: SkillBranch.ai,
    cost: 4,
    prereqs: ['quantum_leap'],
    minPrestiges: 3,
    icon: '\u{1F300}',
  ),
  SkillNode(
    id: 'hivemind',
    name: 'Hivemind',
    description: 'All agents act 50% faster.',
    branch: SkillBranch.ai,
    cost: 3,
    prereqs: ['smart_agents'],
    minPrestiges: 3,
    icon: '\u{1F578}️',
  ),
];

// --- Availability checks ---

bool isSkillAvailable(
  SkillNode node,
  Map<String, bool> skills,
  int prestigeCount,
) {
  if (skills[node.id] == true) return false; // already owned
  if (prestigeCount < node.minPrestiges) return false;
  return node.prereqs.every((p) => skills[p] == true);
}

bool isSkillVisible(
  SkillNode node,
  Map<String, bool> skills,
  int prestigeCount,
) {
  // Show if owned, available, or prereqs met (even if prestige gated — show as locked)
  if (skills[node.id] == true) return true;
  if (node.prereqs.isEmpty) return true;
  return node.prereqs.every((p) => skills[p] == true);
}

List<SkillNode> getSkillsInBranch(SkillBranch branch) {
  return skillNodes.where((n) => n.branch == branch).toList();
}

// --- Bonus getter functions ---
// Each returns a multiplier or flat bonus based on owned skills.

/// Server purchase cost multiplier (< 1 means cheaper)
double getSkillServerCostMult(Map<String, bool> skills) {
  return skills['bulk_discount'] == true ? 0.90 : 1;
}

/// Build queue time multiplier (< 1 means faster)
double getSkillBuildTimeMult(Map<String, bool> skills) {
  double mult = 1;
  if (skills['quick_deploy'] == true) mult *= 0.75;
  if (skills['datacenter_express'] == true) mult *= 0.75; // stacks: 0.75 x 0.75 ~ 0.56
  return mult;
}

/// Server output multiplier (> 1 means more output)
double getSkillServerOutputMult(Map<String, bool> skills) {
  return skills['overbuilt'] == true ? 1.15 : 1;
}

/// Starting flops from skills
double getSkillStartingFlops(Map<String, bool> skills) {
  double flops = 0;
  if (skills['venture_capital'] == true) flops += 50000;
  if (skills['angel_investor'] == true) flops += 500000;
  return flops;
}

/// Starting servers from skills: returns a map of tierId to count
Map<String, int> getSkillStartingServers(Map<String, bool> skills) {
  final Map<String, int> servers = {};
  if (skills['bootstrapper'] == true) servers['raspberry_pi'] = 2;
  return servers;
}

/// Bonus starting power capacity from skills
int getSkillBonusPower(Map<String, bool> skills) {
  int bonus = 0;
  if (skills['power_surplus'] == true) bonus += 200;
  if (skills['mega_capacity'] == true) bonus += 500;
  return bonus;
}

/// Bonus starting cooling capacity from skills
int getSkillBonusCooling(Map<String, bool> skills) {
  int bonus = 0;
  if (skills['cool_start'] == true) bonus += 300;
  if (skills['mega_capacity'] == true) bonus += 500;
  return bonus;
}

/// Upgrade cost multiplier
double getSkillUpgradeCostMult(Map<String, bool> skills) {
  return skills['penny_pincher'] == true ? 0.85 : 1;
}

/// Research point generation multiplier
double getSkillResearchMult(Map<String, bool> skills) {
  return skills['fast_learner'] == true ? 1.25 : 1;
}

/// Tap provision flat bonus flops
int getSkillTapBonus(Map<String, bool> skills) {
  return skills['click_training'] == true ? 5 : 0;
}

/// Staff hire cost multiplier
double getSkillStaffCostMult(Map<String, bool> skills) {
  return skills['headhunter'] == true ? 0.80 : 1;
}

/// Cloud region cost multiplier
double getSkillCloudCostMult(Map<String, bool> skills) {
  return skills['cloud_discount'] == true ? 0.80 : 1;
}

/// Offline earnings efficiency (base 0.5, Offline Mogul makes it 0.75)
double getSkillOfflineEfficiency(Map<String, bool> skills) {
  return skills['offline_mogul'] == true ? 0.75 : 0.50;
}

/// DDoS tap reduction
int getSkillDdosTapReduction(Map<String, bool> skills) {
  return skills['firewall'] == true ? 2 : 0;
}

/// Incident timeout penalty multiplier (< 1 means less penalty)
double getSkillTimeoutPenaltyMult(Map<String, bool> skills) {
  return skills['backup_systems'] == true ? 0.70 : 1;
}

/// Incident reward multiplier
double getSkillIncidentRewardMult(Map<String, bool> skills) {
  double mult = 1;
  if (skills['incident_pay'] == true) mult *= 1.25;
  return mult;
}

/// Incident timer extension in seconds
int getSkillIncidentTimerBonus(Map<String, bool> skills) {
  return skills['rapid_response'] == true ? 5 : 0;
}

/// Overclock failure chance multiplier from skills (stacks with upgrade + SRE)
double getSkillOverclockFailureMult(Map<String, bool> skills) {
  double mult = 1;
  if (skills['hardened_servers'] == true) mult *= 0.70;
  if (skills['iron_defense'] == true) mult *= 0.70; // stacks: 0.70 x 0.70 = 0.49
  return mult;
}

/// Incident trigger chance multiplier
double getSkillIncidentTriggerMult(Map<String, bool> skills) {
  return skills['threat_intel'] == true ? 0.75 : 1;
}

/// Hacker breach reward multiplier (on top of incident_pay)
double getSkillHackerRewardMult(Map<String, bool> skills) {
  return skills['bug_bounty'] == true ? 2 : 1;
}

/// GPU flop output multiplier
double getSkillGpuOutputMult(Map<String, bool> skills) {
  double mult = 1;
  if (skills['gpu_overclock'] == true) mult *= 1.20;
  if (skills['quantum_leap'] == true) mult *= 1.40;
  if (skills['singularity'] == true) mult *= 2.0;
  return mult;
}

/// GPU research point output multiplier
double getSkillGpuRpMult(Map<String, bool> skills) {
  double mult = 1;
  if (skills['neural_boost'] == true) mult *= 1.30;
  if (skills['singularity'] == true) mult *= 2.0; // singularity boosts all GPU output
  return mult;
}

/// Agent hire cost multiplier
double getSkillAgentCostMult(Map<String, bool> skills) {
  return skills['agent_discount'] == true ? 0.75 : 1;
}

/// Agent salary multiplier
double getSkillAgentSalaryMult(Map<String, bool> skills) {
  return skills['loyal_agents'] == true ? 0.75 : 1;
}

/// Incident Responder reward penalty reduction — returns whether smart_agents
/// is owned. Base responder reward is already penalized (30-75% of manual).
/// Smart Agents halves the penalty.
bool getSkillResponderBonus(Map<String, bool> skills) {
  return skills['smart_agents'] == true;
}

/// Agent speed multiplier (< 1 means intervals are shorter = faster)
double getSkillAgentSpeedMult(Map<String, bool> skills) {
  return skills['hivemind'] == true ? 0.50 : 1;
}
