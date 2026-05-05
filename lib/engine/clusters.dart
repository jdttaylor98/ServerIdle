import 'dart:math';

import 'servers.dart';

class ClusterType {
  final String id;
  final String name;
  final String description;
  final String sourceTierId; // which server tier to consume
  final int sourceCount; // how many of that tier are consumed per cluster
  final int buildCost; // base flop cost to build
  final double costScaling;
  final double outputMultiplier; // bonus over raw N x baseOutput
  final String unlockUpgradeId; // which upgrade unlocks this cluster type

  const ClusterType({
    required this.id,
    required this.name,
    required this.description,
    required this.sourceTierId,
    required this.sourceCount,
    required this.buildCost,
    required this.costScaling,
    required this.outputMultiplier,
    required this.unlockUpgradeId,
  });
}

const List<ClusterType> clusterTypes = [
  ClusterType(
    id: 'pi_cluster',
    name: 'Pi Cluster',
    description: 'Ten Pis, one heatsink, infinite vibes.',
    sourceTierId: 'pi',
    sourceCount: 10,
    buildCost: 2000,
    costScaling: 1.15,
    outputMultiplier: 1.5,
    unlockUpgradeId: 'cluster_software',
  ),
  ClusterType(
    id: 'rack_cluster',
    name: 'Rack Cluster',
    description: 'Five racks lashed together with fiber and prayers.',
    sourceTierId: 'rack',
    sourceCount: 5,
    buildCost: 50000,
    costScaling: 1.15,
    outputMultiplier: 1.5,
    unlockUpgradeId: 'rack_clustering',
  ),
];

int getClusterCost(ClusterType type, int owned) {
  return (type.buildCost * pow(type.costScaling, owned)).floor();
}

bool isClusterUnlocked(ClusterType type, Map<String, bool> upgrades) {
  return upgrades[type.unlockUpgradeId] == true;
}

/// Aggregate cluster output (factors in source tier's upgrade multipliers from caller).
double getClusterOutput(
    ClusterType type, int owned, double sourceTierMultiplier) {
  final sourceTier =
      serverTiers.cast<ServerTier?>().firstWhere(
            (t) => t!.id == type.sourceTierId,
            orElse: () => null,
          );
  if (sourceTier == null) return 0;
  return sourceTier.baseOutput *
      type.sourceCount *
      type.outputMultiplier *
      sourceTierMultiplier *
      owned;
}

double getClusterPowerDraw(ClusterType type, int owned) {
  final sourceTier =
      serverTiers.cast<ServerTier?>().firstWhere(
            (t) => t!.id == type.sourceTierId,
            orElse: () => null,
          );
  if (sourceTier == null) return 0;
  return sourceTier.powerDraw * type.sourceCount * owned.toDouble();
}

double getClusterHeatOutput(ClusterType type, int owned) {
  final sourceTier =
      serverTiers.cast<ServerTier?>().firstWhere(
            (t) => t!.id == type.sourceTierId,
            orElse: () => null,
          );
  if (sourceTier == null) return 0;
  return sourceTier.heatOutput * type.sourceCount * owned.toDouble();
}

double getTotalClusterOutput(
  Map<String, int> clusters,
  Map<String, bool> upgrades,
  double Function(String tierId) serverOutputMultiplier,
) {
  return clusterTypes.fold(0.0, (sum, type) {
    final owned = clusters[type.id] ?? 0;
    if (owned == 0) return sum;
    final mult = serverOutputMultiplier(type.sourceTierId);
    return sum + getClusterOutput(type, owned, mult);
  });
}

double getTotalClusterPower(Map<String, int> clusters) {
  return clusterTypes.fold(0.0, (sum, type) {
    return sum + getClusterPowerDraw(type, clusters[type.id] ?? 0);
  });
}

double getTotalClusterHeat(Map<String, int> clusters) {
  return clusterTypes.fold(0.0, (sum, type) {
    return sum + getClusterHeatOutput(type, clusters[type.id] ?? 0);
  });
}
