import 'dart:math';

class ServerTier {
  final String id;
  final String name;
  final String description;
  final int baseCost;
  final double baseOutput; // flops per second per unit
  final double costScaling; // multiplier per purchase
  final int powerDraw; // watts consumed per unit
  final int heatOutput; // BTU generated per unit
  final int? buildTimeSeconds; // if set, purchase queues a build

  const ServerTier({
    required this.id,
    required this.name,
    required this.description,
    required this.baseCost,
    required this.baseOutput,
    required this.costScaling,
    required this.powerDraw,
    required this.heatOutput,
    this.buildTimeSeconds,
  });
}

const List<ServerTier> serverTiers = [
  ServerTier(
    id: 'pi',
    name: 'Raspberry Pi',
    description: 'A humble little board. It runs.',
    baseCost: 10,
    baseOutput: 0.5,
    costScaling: 1.15,
    powerDraw: 8,
    heatOutput: 12,
  ),
  ServerTier(
    id: 'rack',
    name: 'Rack Server',
    description: '1U of pure professionalism.',
    baseCost: 250,
    baseOutput: 5,
    costScaling: 1.15,
    powerDraw: 350,
    heatOutput: 500,
  ),
  ServerTier(
    id: 'blade',
    name: 'Blade Server',
    description: 'High-density compute. Loud.',
    baseCost: 5000,
    baseOutput: 30,
    costScaling: 1.15,
    powerDraw: 1200,
    heatOutput: 1800,
  ),
  ServerTier(
    id: 'datacenter',
    name: 'Data Center',
    description: 'A whole room. Walk in, feel small.',
    baseCost: 500000,
    baseOutput: 500,
    costScaling: 1.15,
    powerDraw: 5000,
    heatOutput: 7000,
    buildTimeSeconds: 300, // 5 minutes
  ),
];

bool isServerTierVisible(String tierId, Map<String, int> servers) {
  if (tierId == 'pi') return true;
  if (tierId == 'rack') return (servers['pi'] ?? 0) >= 5;
  if (tierId == 'blade') return (servers['rack'] ?? 0) >= 1;
  if (tierId == 'datacenter') return (servers['blade'] ?? 0) >= 1;
  return true;
}

double getTotalPowerDraw(Map<String, int> servers) {
  return serverTiers.fold(0.0, (total, tier) {
    return total + tier.powerDraw * (servers[tier.id] ?? 0);
  });
}

double getTotalHeatOutput(Map<String, int> servers) {
  return serverTiers.fold(0.0, (total, tier) {
    return total + tier.heatOutput * (servers[tier.id] ?? 0);
  });
}

int getServerCost(ServerTier tier, int owned) {
  return (tier.baseCost * pow(tier.costScaling, owned)).floor();
}

double getServerOutput(ServerTier tier, int owned) {
  return tier.baseOutput * owned;
}

double getTotalOutput(Map<String, int> servers) {
  return serverTiers.fold(0.0, (total, tier) {
    final owned = servers[tier.id] ?? 0;
    return total + getServerOutput(tier, owned);
  });
}
