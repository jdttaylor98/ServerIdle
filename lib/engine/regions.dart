// Cloud regions — one-time-per-region purchases. Each region is a unique
// entity (max 1 owned). They share the build queue with server tiers.

class CloudRegion {
  final String id;
  final String name;
  final String description;
  final int cost;
  final double output; // cr/sec gross
  final double operatingCost; // cr/sec drain while leased
  final double powerDraw; // W
  final double heatOutput; // BTU
  final int buildTimeSeconds;

  const CloudRegion({
    required this.id,
    required this.name,
    required this.description,
    required this.cost,
    required this.output,
    required this.operatingCost,
    required this.powerDraw,
    required this.heatOutput,
    required this.buildTimeSeconds,
  });
}

const List<CloudRegion> cloudRegions = [
  CloudRegion(
    id: 'edge_network',
    name: 'Edge Network',
    description: 'Tiny PoPs in 50 cities. Latency: yes.',
    cost: 1000000,
    output: 1500,
    operatingCost: 300,
    powerDraw: 8000,
    heatOutput: 12000,
    buildTimeSeconds: 180, // 3 min
  ),
  CloudRegion(
    id: 'ap_south',
    name: 'AP-South',
    description: 'Latency to half the world. Worth it.',
    cost: 2500000,
    output: 3500,
    operatingCost: 875,
    powerDraw: 12000,
    heatOutput: 18000,
    buildTimeSeconds: 300, // 5 min
  ),
  CloudRegion(
    id: 'eu_west',
    name: 'EU-West',
    description: 'GDPR-compliant. Pricier in every sense.',
    cost: 5000000,
    output: 7000,
    operatingCost: 1750,
    powerDraw: 18000,
    heatOutput: 27000,
    buildTimeSeconds: 480, // 8 min
  ),
  CloudRegion(
    id: 'us_east',
    name: 'US-East',
    description: 'The big one. Everyone wants us-east-1.',
    cost: 12000000,
    output: 15000,
    operatingCost: 4500,
    powerDraw: 25000,
    heatOutput: 37500,
    buildTimeSeconds: 720, // 12 min
  ),
];

// ─── Unlock check ───

bool isCloudUnlocked(Map<String, bool> upgrades) {
  return upgrades['multi_region'] == true;
}

// ─── Aggregate helpers ───

double getOwnedRegionsOutput(Map<String, bool> regions) {
  return cloudRegions.fold<double>(
    0,
    (sum, r) => sum + (regions[r.id] == true ? r.output : 0),
  );
}

double getOwnedRegionsPower(Map<String, bool> regions) {
  return cloudRegions.fold<double>(
    0,
    (sum, r) => sum + (regions[r.id] == true ? r.powerDraw : 0),
  );
}

double getOwnedRegionsHeat(Map<String, bool> regions) {
  return cloudRegions.fold<double>(
    0,
    (sum, r) => sum + (regions[r.id] == true ? r.heatOutput : 0),
  );
}

double getOwnedRegionsCost(Map<String, bool> regions) {
  return cloudRegions.fold<double>(
    0,
    (sum, r) => sum + (regions[r.id] == true ? r.operatingCost : 0),
  );
}
