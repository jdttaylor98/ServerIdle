// GPU hardware — expensive, power-hungry units that generate both credits AND
// Research Points.  Unlocked by the CUDA Drivers research node.

export interface GpuTier {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  baseOutput: number; // credits per second per unit
  rpOutput: number; // research points per second per unit
  costScaling: number;
  powerDraw: number; // watts per unit
  heatOutput: number; // BTU per unit
  buildTimeSeconds: number;
}

export const GPU_TIERS: GpuTier[] = [
  {
    id: 'gpu_node',
    name: 'GPU Node',
    description: 'NVIDIA rack. Melts your power bill.',
    baseCost: 2_000_000,
    baseOutput: 800,
    rpOutput: 0.5,
    costScaling: 1.18,
    powerDraw: 15_000,
    heatOutput: 22_000,
    buildTimeSeconds: 180, // 3 minutes
  },
  {
    id: 'ai_cluster',
    name: 'AI Cluster',
    description: 'Networked GPU farm. The machines are learning.',
    baseCost: 25_000_000,
    baseOutput: 5_000,
    rpOutput: 3,
    costScaling: 1.20,
    powerDraw: 60_000,
    heatOutput: 90_000,
    buildTimeSeconds: 600, // 10 minutes
  },
];

export function isGpuTierVisible(
  tierId: string,
  gpus: Record<string, number>,
  research: Record<string, boolean>
): boolean {
  if (!research['cuda_drivers']) return false;
  if (tierId === 'gpu_node') return true;
  if (tierId === 'ai_cluster') return (gpus['gpu_node'] ?? 0) >= 3;
  return false;
}

export function isGpuNavVisible(research: Record<string, boolean>): boolean {
  return !!research['cuda_drivers'];
}

export function getGpuCost(tier: GpuTier, owned: number): number {
  return Math.floor(tier.baseCost * Math.pow(tier.costScaling, owned));
}

export function getGpuOutput(tier: GpuTier, owned: number): number {
  return tier.baseOutput * owned;
}

export function getGpuRpOutput(tier: GpuTier, owned: number): number {
  return tier.rpOutput * owned;
}

export function getTotalGpuOutput(gpus: Record<string, number>): number {
  return GPU_TIERS.reduce((total, tier) => {
    return total + getGpuOutput(tier, gpus[tier.id] ?? 0);
  }, 0);
}

export function getTotalGpuRpOutput(gpus: Record<string, number>): number {
  return GPU_TIERS.reduce((total, tier) => {
    return total + getGpuRpOutput(tier, gpus[tier.id] ?? 0);
  }, 0);
}

export function getTotalGpuPower(gpus: Record<string, number>): number {
  return GPU_TIERS.reduce((total, tier) => {
    return total + tier.powerDraw * (gpus[tier.id] ?? 0);
  }, 0);
}

export function getTotalGpuHeat(gpus: Record<string, number>): number {
  return GPU_TIERS.reduce((total, tier) => {
    return total + tier.heatOutput * (gpus[tier.id] ?? 0);
  }, 0);
}
