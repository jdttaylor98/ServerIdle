// Cloud regions — one-time-per-region purchases. Each region is a unique
// entity (max 1 owned). They share the build queue with server tiers.

export interface CloudRegion {
  id: string;
  name: string;
  description: string;
  cost: number;
  output: number; // cr/sec
  powerDraw: number; // W
  heatOutput: number; // BTU
  buildTimeSeconds: number;
}

export const CLOUD_REGIONS: CloudRegion[] = [
  {
    id: 'us_east',
    name: 'US-East',
    description: 'Cheap, common, somehow always on fire.',
    cost: 1_000_000,
    output: 1_500,
    powerDraw: 8_000,
    heatOutput: 12_000,
    buildTimeSeconds: 180, // 3 min
  },
  {
    id: 'eu_west',
    name: 'EU-West',
    description: 'GDPR-compliant. Pricier in every sense.',
    cost: 2_500_000,
    output: 3_500,
    powerDraw: 12_000,
    heatOutput: 18_000,
    buildTimeSeconds: 300, // 5 min
  },
  {
    id: 'ap_south',
    name: 'AP-South',
    description: 'Latency to half the world. Worth it.',
    cost: 5_000_000,
    output: 7_000,
    powerDraw: 18_000,
    heatOutput: 27_000,
    buildTimeSeconds: 480, // 8 min
  },
  {
    id: 'edge_network',
    name: 'Edge Network',
    description: 'Tiny PoPs in 50 cities. Latency: yes.',
    cost: 12_000_000,
    output: 15_000,
    powerDraw: 25_000,
    heatOutput: 37_500,
    buildTimeSeconds: 720, // 12 min
  },
];

export function isCloudUnlocked(upgrades: Record<string, boolean>): boolean {
  return !!upgrades['multi_region'];
}

export function getOwnedRegionsOutput(
  regions: Record<string, boolean>
): number {
  return CLOUD_REGIONS.reduce((sum, r) => {
    return sum + (regions[r.id] ? r.output : 0);
  }, 0);
}

export function getOwnedRegionsPower(
  regions: Record<string, boolean>
): number {
  return CLOUD_REGIONS.reduce((sum, r) => {
    return sum + (regions[r.id] ? r.powerDraw : 0);
  }, 0);
}

export function getOwnedRegionsHeat(regions: Record<string, boolean>): number {
  return CLOUD_REGIONS.reduce((sum, r) => {
    return sum + (regions[r.id] ? r.heatOutput : 0);
  }, 0);
}
