import 'dart:math';

class CapacityBuilding {
  final String id;
  final String name;
  final String description;
  final String resource; // 'power' or 'cooling'
  final int baseCost;
  final int capacity; // amount of resource provided per unit
  final double costScaling;

  const CapacityBuilding({
    required this.id,
    required this.name,
    required this.description,
    required this.resource,
    required this.baseCost,
    required this.capacity,
    required this.costScaling,
  });
}

const List<CapacityBuilding> capacityBuildings = [
  // Power
  CapacityBuilding(
    id: 'power_strip',
    name: 'Power Strip',
    description: "Don't blame the surge protector.",
    resource: 'power',
    baseCost: 50,
    capacity: 50,
    costScaling: 1.15,
  ),
  CapacityBuilding(
    id: 'pdu',
    name: 'PDU',
    description: 'Rack-mounted power distribution.',
    resource: 'power',
    baseCost: 1000,
    capacity: 500,
    costScaling: 1.15,
  ),
  CapacityBuilding(
    id: 'ups',
    name: 'UPS',
    description: 'Battery backup for the paranoid.',
    resource: 'power',
    baseCost: 20000,
    capacity: 5000,
    costScaling: 1.15,
  ),
  CapacityBuilding(
    id: 'generator',
    name: 'Generator',
    description: 'Diesel-powered. Hope you have fuel.',
    resource: 'power',
    baseCost: 500000,
    capacity: 50000,
    costScaling: 1.15,
  ),
  // Cooling
  CapacityBuilding(
    id: 'desk_fan',
    name: 'Desk Fan',
    description: "It's something.",
    resource: 'cooling',
    baseCost: 50,
    capacity: 75,
    costScaling: 1.15,
  ),
  CapacityBuilding(
    id: 'ac_unit',
    name: 'AC Unit',
    description: 'Window-mounted. Professional enough.',
    resource: 'cooling',
    baseCost: 1000,
    capacity: 750,
    costScaling: 1.15,
  ),
  CapacityBuilding(
    id: 'liquid_cooling',
    name: 'Liquid Cooling',
    description: "Don't spring a leak.",
    resource: 'cooling',
    baseCost: 20000,
    capacity: 7500,
    costScaling: 1.15,
  ),
  CapacityBuilding(
    id: 'industrial_hvac',
    name: 'Industrial HVAC',
    description: 'Datacenter-grade. The room hums.',
    resource: 'cooling',
    baseCost: 500000,
    capacity: 75000,
    costScaling: 1.15,
  ),
];

// Free starting capacity so brand-new players don't immediately stall.
const int startingPowerCapacity = 100;
const int startingCoolingCapacity = 150;

int getCapacityBuildingCost(CapacityBuilding building, int owned) {
  return (building.baseCost * pow(building.costScaling, owned)).floor();
}

/// A capacity building is visible if:
/// - It's the first tier in its resource (always shown), OR
/// - The player owns at least 1 of the previous tier (progressive reveal)
bool isCapacityBuildingVisible(
    CapacityBuilding building, Map<String, int> owned) {
  final sameResource =
      capacityBuildings.where((b) => b.resource == building.resource).toList();
  final idx = sameResource.indexWhere((b) => b.id == building.id);
  if (idx <= 0) return true;
  final prev = sameResource[idx - 1];
  return (owned[prev.id] ?? 0) >= 1;
}

double getTotalCapacityAmount(
    Map<String, int> buildings, String resource) {
  final starting =
      resource == 'power' ? startingPowerCapacity : startingCoolingCapacity;
  return capacityBuildings
      .where((b) => b.resource == resource)
      .fold(starting.toDouble(), (total, b) {
    return total + b.capacity * (buildings[b.id] ?? 0);
  });
}

/// Efficiency multiplier based on whether usage exceeds capacity.
/// 1.0 if capacity meets usage; scales linearly down toward 0.25 as usage grows.
/// Floor at 0.25 so the game never fully stalls.
double getEfficiency(double usage, double capacity) {
  if (usage <= 0) return 1;
  if (capacity >= usage) return 1;
  final ratio = capacity / usage;
  return max(0.25, ratio);
}
