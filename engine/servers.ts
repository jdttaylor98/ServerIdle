export interface ServerTier {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  baseOutput: number; // credits per second per unit
  costScaling: number; // multiplier per purchase
  powerDraw: number; // watts consumed per unit
  heatOutput: number; // BTU generated per unit
}

export const SERVER_TIERS: ServerTier[] = [
  {
    id: 'pi',
    name: 'Raspberry Pi',
    description: 'A humble little board. It runs.',
    baseCost: 10,
    baseOutput: 0.5,
    costScaling: 1.15,
    powerDraw: 8,
    heatOutput: 12,
  },
  {
    id: 'rack',
    name: 'Rack Server',
    description: '1U of pure professionalism.',
    baseCost: 250,
    baseOutput: 5,
    costScaling: 1.15,
    powerDraw: 350,
    heatOutput: 500,
  },
  {
    id: 'blade',
    name: 'Blade Server',
    description: 'High-density compute. Loud.',
    baseCost: 5000,
    baseOutput: 30,
    costScaling: 1.15,
    powerDraw: 1200,
    heatOutput: 1800,
  },
];

export function getTotalPowerDraw(servers: Record<string, number>): number {
  return SERVER_TIERS.reduce((total, tier) => {
    return total + tier.powerDraw * (servers[tier.id] ?? 0);
  }, 0);
}

export function getTotalHeatOutput(servers: Record<string, number>): number {
  return SERVER_TIERS.reduce((total, tier) => {
    return total + tier.heatOutput * (servers[tier.id] ?? 0);
  }, 0);
}

export function getServerCost(tier: ServerTier, owned: number): number {
  return Math.floor(tier.baseCost * Math.pow(tier.costScaling, owned));
}

export function getServerOutput(tier: ServerTier, owned: number): number {
  return tier.baseOutput * owned;
}

export function getTotalOutput(servers: Record<string, number>): number {
  return SERVER_TIERS.reduce((total, tier) => {
    const owned = servers[tier.id] ?? 0;
    return total + getServerOutput(tier, owned);
  }, 0);
}
