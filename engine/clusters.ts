import { SERVER_TIERS } from './servers';

export interface ClusterType {
  id: string;
  name: string;
  description: string;
  sourceTierId: string; // which server tier to consume
  sourceCount: number; // how many of that tier are consumed per cluster
  buildCost: number; // base credit cost to build
  costScaling: number;
  outputMultiplier: number; // bonus over raw N × baseOutput
  unlockUpgradeId: string; // which upgrade unlocks this cluster type
}

export const CLUSTER_TYPES: ClusterType[] = [
  {
    id: 'pi_cluster',
    name: 'Pi Cluster',
    description: 'Ten Pis, one heatsink, infinite vibes.',
    sourceTierId: 'pi',
    sourceCount: 10,
    buildCost: 2000,
    costScaling: 1.15,
    outputMultiplier: 1.5,
    unlockUpgradeId: 'cluster_software',
  },
  {
    id: 'rack_cluster',
    name: 'Rack Cluster',
    description: 'Five racks lashed together with fiber and prayers.',
    sourceTierId: 'rack',
    sourceCount: 5,
    buildCost: 50000,
    costScaling: 1.15,
    outputMultiplier: 1.5,
    unlockUpgradeId: 'rack_clustering',
  },
];

export function getClusterCost(type: ClusterType, owned: number): number {
  return Math.floor(type.buildCost * Math.pow(type.costScaling, owned));
}

export function isClusterUnlocked(
  type: ClusterType,
  upgrades: Record<string, boolean>
): boolean {
  return !!upgrades[type.unlockUpgradeId];
}

/** Aggregate cluster output (factors in source tier's upgrade multipliers from caller). */
export function getClusterOutput(
  type: ClusterType,
  owned: number,
  sourceTierMultiplier: number
): number {
  const sourceTier = SERVER_TIERS.find((t) => t.id === type.sourceTierId);
  if (!sourceTier) return 0;
  return (
    sourceTier.baseOutput *
    type.sourceCount *
    type.outputMultiplier *
    sourceTierMultiplier *
    owned
  );
}

export function getClusterPowerDraw(type: ClusterType, owned: number): number {
  const sourceTier = SERVER_TIERS.find((t) => t.id === type.sourceTierId);
  if (!sourceTier) return 0;
  return sourceTier.powerDraw * type.sourceCount * owned;
}

export function getClusterHeatOutput(type: ClusterType, owned: number): number {
  const sourceTier = SERVER_TIERS.find((t) => t.id === type.sourceTierId);
  if (!sourceTier) return 0;
  return sourceTier.heatOutput * type.sourceCount * owned;
}

export function getTotalClusterOutput(
  clusters: Record<string, number>,
  upgrades: Record<string, boolean>,
  serverOutputMultiplier: (tierId: string) => number
): number {
  return CLUSTER_TYPES.reduce((sum, type) => {
    const owned = clusters[type.id] ?? 0;
    if (owned === 0) return sum;
    const mult = serverOutputMultiplier(type.sourceTierId);
    return sum + getClusterOutput(type, owned, mult);
  }, 0);
}

export function getTotalClusterPower(
  clusters: Record<string, number>
): number {
  return CLUSTER_TYPES.reduce((sum, type) => {
    return sum + getClusterPowerDraw(type, clusters[type.id] ?? 0);
  }, 0);
}

export function getTotalClusterHeat(clusters: Record<string, number>): number {
  return CLUSTER_TYPES.reduce((sum, type) => {
    return sum + getClusterHeatOutput(type, clusters[type.id] ?? 0);
  }, 0);
}
