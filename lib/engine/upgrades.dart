class Upgrade {
  final String id;
  final String name;
  final String description;
  final String era; // 'homelab' | 'rack' | 'datacenter' | 'cloud' | 'ai'
  final int cost;
  final List<String> prereqs; // upgrade ids that must be purchased first
  /// Optional unlock condition beyond prereqs (e.g., "own 25 Pi").
  final bool Function(Map<String, int> servers)? unlockCheck;
  final String? unlockHint;

  const Upgrade({
    required this.id,
    required this.name,
    required this.description,
    required this.era,
    required this.cost,
    required this.prereqs,
    this.unlockCheck,
    this.unlockHint,
  });
}

final List<Upgrade> allUpgrades = [
  // ───── HOMELAB ERA ─────
  const Upgrade(
    id: 'mechanical_keyboard',
    name: 'Mechanical Keyboard',
    description: '+1 credit per PROVISION tap',
    era: 'homelab',
    cost: 25,
    prereqs: [],
  ),
  const Upgrade(
    id: 'cron_jobs',
    name: 'Cron Jobs',
    description: 'Auto-tap PROVISION every 5 seconds',
    era: 'homelab',
    cost: 200,
    prereqs: [],
  ),
  const Upgrade(
    id: 'containerization',
    name: 'Containerization',
    description: 'Raspberry Pi output ×1.25',
    era: 'homelab',
    cost: 500,
    prereqs: [],
  ),
  const Upgrade(
    id: 'macro_recorder',
    name: 'Macro Recorder',
    description: '+2 more credits per PROVISION tap',
    era: 'homelab',
    cost: 1000,
    prereqs: ['mechanical_keyboard'],
  ),
  const Upgrade(
    id: 'ssd_upgrade',
    name: 'SSD Upgrade',
    description: 'Raspberry Pi output ×1.5 (stacks with Containerization)',
    era: 'homelab',
    cost: 2000,
    prereqs: ['containerization'],
  ),
  const Upgrade(
    id: 'hyperthreading',
    name: 'Hyperthreading',
    description: 'PROVISION taps grant 1.5× credits',
    era: 'homelab',
    cost: 5000,
    prereqs: ['macro_recorder'],
  ),
  Upgrade(
    id: 'cluster_software',
    name: 'Cluster Software',
    description: 'Unlock the Cluster tier',
    era: 'homelab',
    cost: 10000,
    prereqs: const [],
    unlockCheck: (servers) => (servers['pi'] ?? 0) >= 25,
    unlockHint: 'Own 25 Raspberry Pi',
  ),

  // ───── RACK ERA ─────
  const Upgrade(
    id: 'rack_pdu',
    name: 'Rack PDU',
    description: 'Power capacity +500W (free)',
    era: 'rack',
    cost: 2000,
    prereqs: [],
  ),
  const Upgrade(
    id: 'load_balancing',
    name: 'Load Balancing',
    description: 'Rack Server output ×1.25',
    era: 'rack',
    cost: 8000,
    prereqs: [],
  ),
  const Upgrade(
    id: 'hot_swap',
    name: 'Redundant PSU',
    description: 'Overclock failure chance reduced by 50%',
    era: 'rack',
    cost: 25000,
    prereqs: ['load_balancing'],
  ),
  const Upgrade(
    id: 'blade_chassis',
    name: 'Blade Chassis',
    description: 'Blade Server output ×1.25',
    era: 'rack',
    cost: 50000,
    prereqs: [],
  ),
  const Upgrade(
    id: 'rack_clustering',
    name: 'Rack Clustering',
    description: 'Unlock the Rack Cluster tier',
    era: 'rack',
    cost: 30000,
    prereqs: ['load_balancing'],
  ),

  // ───── DATA CENTER ERA ─────
  Upgrade(
    id: 'research_lab',
    name: 'Research Lab',
    description:
        'Unlock Data Scientist hires and start generating Research Points',
    era: 'datacenter',
    cost: 250000,
    prereqs: const [],
    unlockCheck: (servers) => (servers['datacenter'] ?? 0) >= 1,
    unlockHint: 'Build a Data Center',
  ),
  Upgrade(
    id: 'multi_region',
    name: 'Multi-Region Deployment',
    description:
        'Unlock the Cloud screen — lease cloud regions worldwide',
    era: 'datacenter',
    cost: 1000000,
    prereqs: const [],
    unlockCheck: (servers) => (servers['datacenter'] ?? 0) >= 1,
    unlockHint: 'Build a Data Center',
  ),
];

bool isUpgradeAvailable(
  Upgrade upgrade,
  Map<String, bool> purchased,
  Map<String, int> servers,
) {
  // All prereqs must be purchased
  if (!upgrade.prereqs.every((id) => purchased[id] == true)) return false;
  // Unlock check (e.g., own enough servers) must pass
  if (upgrade.unlockCheck != null && !upgrade.unlockCheck!(servers)) {
    return false;
  }
  return true;
}

List<Upgrade> getUpgradesByEra(String era) {
  return allUpgrades.where((u) => u.era == era).toList();
}

// ─── Effect helpers ───

double getClickCreditBonus(Map<String, bool> purchased) {
  double bonus = 0;
  if (purchased['mechanical_keyboard'] == true) bonus += 1;
  if (purchased['macro_recorder'] == true) bonus += 2;
  return bonus;
}

double getClickCreditMultiplier(Map<String, bool> purchased) {
  return purchased['hyperthreading'] == true ? 1.5 : 1;
}

double getServerOutputMultiplier(
    String tierId, Map<String, bool> purchased) {
  double mult = 1;
  if (tierId == 'pi') {
    if (purchased['containerization'] == true) mult *= 1.25;
    if (purchased['ssd_upgrade'] == true) mult *= 1.5;
  } else if (tierId == 'rack') {
    if (purchased['load_balancing'] == true) mult *= 1.25;
  } else if (tierId == 'blade') {
    if (purchased['blade_chassis'] == true) mult *= 1.25;
  }
  return mult;
}

double getOverclockFailureChanceMultiplier(Map<String, bool> purchased) {
  return purchased['hot_swap'] == true ? 0.5 : 1;
}

bool hasCronJobs(Map<String, bool> purchased) {
  return purchased['cron_jobs'] == true;
}

double getBonusPowerCapacity(Map<String, bool> purchased) {
  return purchased['rack_pdu'] == true ? 500 : 0;
}
