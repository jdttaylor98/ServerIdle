// GPU hardware — expensive, power-hungry units that generate both flops AND
// Research Points.  Unlocked by the CUDA Drivers research node.

import 'dart:math';

class GpuTier {
  final String id;
  final String name;
  final String description;
  final int baseCost;
  final int baseOutput; // flops per second per unit
  final double rpOutput; // research points per second per unit
  final double costScaling;
  final int powerDraw; // watts per unit
  final int heatOutput; // BTU per unit
  final int buildTimeSeconds;

  const GpuTier({
    required this.id,
    required this.name,
    required this.description,
    required this.baseCost,
    required this.baseOutput,
    required this.rpOutput,
    required this.costScaling,
    required this.powerDraw,
    required this.heatOutput,
    required this.buildTimeSeconds,
  });
}

const List<GpuTier> gpuTiers = [
  GpuTier(
    id: 'gpu_node',
    name: 'GPU Node',
    description: 'NVIDIA rack. Melts your power bill.',
    baseCost: 2000000,
    baseOutput: 800,
    rpOutput: 0.5,
    costScaling: 1.18,
    powerDraw: 15000,
    heatOutput: 22000,
    buildTimeSeconds: 180, // 3 minutes
  ),
  GpuTier(
    id: 'ai_cluster',
    name: 'AI Cluster',
    description: 'Networked GPU farm. The machines are learning.',
    baseCost: 25000000,
    baseOutput: 5000,
    rpOutput: 3,
    costScaling: 1.20,
    powerDraw: 60000,
    heatOutput: 90000,
    buildTimeSeconds: 600, // 10 minutes
  ),
];

bool isGpuTierVisible(
  String tierId,
  Map<String, int> gpus,
  Map<String, bool> research,
) {
  if (research['cuda_drivers'] != true) return false;
  if (tierId == 'gpu_node') return true;
  if (tierId == 'ai_cluster') return (gpus['gpu_node'] ?? 0) >= 3;
  return false;
}

bool isGpuNavVisible(Map<String, bool> research) {
  return research['cuda_drivers'] == true;
}

int getGpuCost(GpuTier tier, int owned) {
  return (tier.baseCost * pow(tier.costScaling, owned)).floor();
}

int getGpuOutput(GpuTier tier, int owned) {
  return tier.baseOutput * owned;
}

double getGpuRpOutput(GpuTier tier, int owned) {
  return tier.rpOutput * owned;
}

int getTotalGpuOutput(Map<String, int> gpus) {
  return gpuTiers.fold(0, (total, tier) {
    return total + getGpuOutput(tier, gpus[tier.id] ?? 0);
  });
}

double getTotalGpuRpOutput(Map<String, int> gpus) {
  return gpuTiers.fold(0.0, (total, tier) {
    return total + getGpuRpOutput(tier, gpus[tier.id] ?? 0);
  });
}

int getTotalGpuPower(Map<String, int> gpus) {
  return gpuTiers.fold(0, (total, tier) {
    return total + tier.powerDraw * (gpus[tier.id] ?? 0);
  });
}

int getTotalGpuHeat(Map<String, int> gpus) {
  return gpuTiers.fold(0, (total, tier) {
    return total + tier.heatOutput * (gpus[tier.id] ?? 0);
  });
}
