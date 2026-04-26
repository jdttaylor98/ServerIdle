export type CapacityResource = 'power' | 'cooling';

export interface CapacityBuilding {
  id: string;
  name: string;
  description: string;
  resource: CapacityResource;
  baseCost: number;
  capacity: number; // amount of resource provided per unit
  costScaling: number;
}

export const CAPACITY_BUILDINGS: CapacityBuilding[] = [
  // Power
  {
    id: 'power_strip',
    name: 'Power Strip',
    description: 'Don\'t blame the surge protector.',
    resource: 'power',
    baseCost: 50,
    capacity: 50,
    costScaling: 1.15,
  },
  {
    id: 'pdu',
    name: 'PDU',
    description: 'Rack-mounted power distribution.',
    resource: 'power',
    baseCost: 1000,
    capacity: 500,
    costScaling: 1.15,
  },
  {
    id: 'ups',
    name: 'UPS',
    description: 'Battery backup for the paranoid.',
    resource: 'power',
    baseCost: 20000,
    capacity: 5000,
    costScaling: 1.15,
  },
  {
    id: 'generator',
    name: 'Generator',
    description: 'Diesel-powered. Hope you have fuel.',
    resource: 'power',
    baseCost: 500000,
    capacity: 50000,
    costScaling: 1.15,
  },
  // Cooling
  {
    id: 'desk_fan',
    name: 'Desk Fan',
    description: 'It\'s something.',
    resource: 'cooling',
    baseCost: 50,
    capacity: 150,
    costScaling: 1.15,
  },
  {
    id: 'ac_unit',
    name: 'AC Unit',
    description: 'Window-mounted. Professional enough.',
    resource: 'cooling',
    baseCost: 1000,
    capacity: 1500,
    costScaling: 1.15,
  },
  {
    id: 'liquid_cooling',
    name: 'Liquid Cooling',
    description: 'Don\'t spring a leak.',
    resource: 'cooling',
    baseCost: 20000,
    capacity: 15000,
    costScaling: 1.15,
  },
  {
    id: 'industrial_hvac',
    name: 'Industrial HVAC',
    description: 'Datacenter-grade. The room hums.',
    resource: 'cooling',
    baseCost: 500000,
    capacity: 150000,
    costScaling: 1.15,
  },
];

// Free starting capacity so brand-new players don't immediately stall.
export const STARTING_POWER_CAPACITY = 100;
export const STARTING_COOLING_CAPACITY = 200;

export function getCapacityBuildingCost(
  building: CapacityBuilding,
  owned: number
): number {
  return Math.floor(building.baseCost * Math.pow(building.costScaling, owned));
}

export function getTotalCapacity(
  buildings: Record<string, number>,
  resource: CapacityResource
): number {
  const starting =
    resource === 'power'
      ? STARTING_POWER_CAPACITY
      : STARTING_COOLING_CAPACITY;
  return CAPACITY_BUILDINGS.filter((b) => b.resource === resource).reduce(
    (total, b) => total + b.capacity * (buildings[b.id] ?? 0),
    starting
  );
}

/**
 * Efficiency multiplier based on whether usage exceeds capacity.
 * 1.0 if capacity meets usage; scales linearly down toward 0.25 as usage grows.
 * Floor at 0.25 so the game never fully stalls — you just earn slowly until you fix it.
 */
export function getEfficiency(usage: number, capacity: number): number {
  if (usage <= 0) return 1;
  if (capacity >= usage) return 1;
  const ratio = capacity / usage;
  return Math.max(0.25, ratio);
}
