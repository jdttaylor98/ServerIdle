import 'dart:math';

import 'incidents.dart';

// ─── Gate state (unlocking conditions) ───

class GateState {
  final int totalServers;
  final int totalClusters;
  final int ddosResolvedCount;
  final int diskFullResolvedCount;
  final int vendorOfferAcceptedCount;
  final bool hotSwapOwned;
  final bool researchLabOwned;
  final int totalStaffHired;

  const GateState({
    required this.totalServers,
    required this.totalClusters,
    required this.ddosResolvedCount,
    required this.diskFullResolvedCount,
    required this.vendorOfferAcceptedCount,
    required this.hotSwapOwned,
    required this.researchLabOwned,
    required this.totalStaffHired,
  });
}

// ─── Staff role definition ───

class StaffRole {
  final String id;
  final String name;
  final String icon;
  final String description;
  final String effectHint;
  final int hireCost;
  final double costScaling;
  final double salary; // cr/sec drain per unit
  final bool Function(GateState) isUnlocked;
  final String unlockHint;

  const StaffRole({
    required this.id,
    required this.name,
    required this.icon,
    required this.description,
    required this.effectHint,
    required this.hireCost,
    required this.costScaling,
    required this.salary,
    required this.isUnlocked,
    required this.unlockHint,
  });
}

// ─── Role definitions ───

final List<StaffRole> staffRoles = [
  StaffRole(
    id: 'devops_engineer',
    name: 'DevOps Engineer',
    icon: '\u{1F6E0}', // hammer and wrench
    description: 'Pushes to prod on a Friday and means it.',
    effectHint: '+5% global server/cluster output per hire',
    hireCost: 5000,
    costScaling: 1.20,
    salary: 0.5,
    isUnlocked: (g) => g.totalServers >= 5,
    unlockHint: 'Own 5 servers',
  ),
  StaffRole(
    id: 'security_engineer',
    name: 'Security Engineer',
    icon: '\u{1F512}', // lock
    description: 'Wears a black hoodie. Blocks attacks.',
    effectHint: 'DDoS trigger rate −20% per hire (90% cap)',
    hireCost: 10000,
    costScaling: 1.20,
    salary: 1,
    isUnlocked: (g) => g.ddosResolvedCount >= 1,
    unlockHint: 'Resolve a DDoS attack',
  ),
  StaffRole(
    id: 'sysadmin',
    name: 'SysAdmin',
    icon: '\u{1F5A5}', // desktop computer
    description: 'Once cleaned 50TB of logs by hand. Never again.',
    effectHint: 'Disk Full incidents stop occurring',
    hireCost: 8000,
    costScaling: 1.20,
    salary: 0.8,
    isUnlocked: (g) => g.diskFullResolvedCount >= 1,
    unlockHint: 'Clear a Disk Full incident',
  ),
  StaffRole(
    id: 'sre',
    name: 'SRE',
    icon: '\u{1F4C8}', // chart increasing
    description: 'Has opinions about percentile latencies.',
    effectHint: 'Overclock failure chance −15% per hire',
    hireCost: 25000,
    costScaling: 1.20,
    salary: 2.5,
    isUnlocked: (g) => g.hotSwapOwned,
    unlockHint: 'Buy the Hot Swap upgrade',
  ),
  StaffRole(
    id: 'sales_engineer',
    name: 'Sales Engineer',
    icon: '\u{1F4BC}', // briefcase
    description: 'Knows a guy at every vendor. Always.',
    effectHint: 'Vendor Offer trigger rate +25% per hire',
    hireCost: 15000,
    costScaling: 1.20,
    salary: 1.5,
    isUnlocked: (g) => g.vendorOfferAcceptedCount >= 1,
    unlockHint: 'Accept a Vendor Offer',
  ),
  StaffRole(
    id: 'data_scientist',
    name: 'Data Scientist',
    icon: '\u{1F9EA}', // test tube
    description: 'Trains models on yesterday\'s logs. Drinks cold brew.',
    effectHint: 'Generates 0.1 Research Points/sec per hire',
    hireCost: 50000,
    costScaling: 1.20,
    salary: 5,
    isUnlocked: (g) => g.researchLabOwned,
    unlockHint: 'Buy the Research Lab upgrade',
  ),
  StaffRole(
    id: 'engineering_manager',
    name: 'Engineering Manager',
    icon: '\u{1F454}', // necktie
    description: 'Schedules a 1:1 to discuss your 1:1.',
    effectHint: 'All other staff effects ×1.25 per hire',
    hireCost: 100000,
    costScaling: 1.20,
    salary: 10,
    isUnlocked: (g) => g.totalStaffHired >= 10,
    unlockHint: 'Hire 10 total staff',
  ),
];

// ─── Cost helpers ───

int getHireCost(StaffRole role, int owned) {
  return (role.hireCost * pow(role.costScaling, owned)).floor();
}

// ─── Internal helpers ───

int _getCount(Map<String, int> staff, String id) {
  return staff[id] ?? 0;
}

double _getManagerBoost(Map<String, int> staff) {
  return 1 + 0.25 * _getCount(staff, 'engineering_manager');
}

// ─── Aggregate effect functions ───

/// Multiplier applied to server + cluster output. 1.0 if no staff.
double getStaffOutputMultiplier(Map<String, int> staff) {
  return 1 + 0.05 * _getCount(staff, 'devops_engineer') * _getManagerBoost(staff);
}

/// Research points generated per second by the Data Scientist staff.
double getResearchPointsPerSec(Map<String, int> staff) {
  return 0.1 * _getCount(staff, 'data_scientist') * _getManagerBoost(staff);
}

/// Total salary drain in flops per second.
double getTotalSalaryAmount(Map<String, int> staff) {
  return staffRoles.fold<double>(
    0,
    (sum, role) => sum + role.salary * _getCount(staff, role.id),
  );
}

/// Multiplier applied to base overclock failure chance (1 = unchanged).
double getOverclockFailureMultiplier(Map<String, int> staff) {
  final reduction = min(
    0.9,
    0.15 * _getCount(staff, 'sre') * _getManagerBoost(staff),
  );
  return 1 - reduction;
}

/// Per-incident-type weight modifiers used when picking a random incident.
Map<IncidentType, double> getIncidentWeightModifiers(Map<String, int> staff) {
  final m = _getManagerBoost(staff);

  final securityReduction = min(
    0.9,
    0.20 * _getCount(staff, 'security_engineer') * m,
  );
  final attackWeight = 1 - securityReduction;

  final diskFull = _getCount(staff, 'sysadmin') >= 1 ? 0.0 : 1.0;

  final salesBoost = 0.25 * _getCount(staff, 'sales_engineer') * m;
  final vendorOffer = 1 + salesBoost;

  return {
    IncidentType.ddos: attackWeight,
    IncidentType.diskFull: diskFull,
    IncidentType.vendorOffer: vendorOffer,
    IncidentType.memoryLeak: 1, // not affected by staff (yet)
    IncidentType.hackerBreach: attackWeight,
  };
}

int getTotalStaffCount(Map<String, int> staff) {
  return staff.values.fold(0, (a, b) => a + b);
}

/// Whether the STAFF nav tile should appear at all.
bool isStaffNavVisible(GateState gates) {
  return staffRoles.any((r) => r.isUnlocked(gates));
}

/// Returns roles to display: all unlocked + one teaser locked role.
List<StaffRole> getVisibleStaffRoles(GateState gates) {
  final unlocked = staffRoles.where((r) => r.isUnlocked(gates)).toList();
  final locked = staffRoles.where((r) => !r.isUnlocked(gates)).toList();
  locked.sort((a, b) => a.hireCost.compareTo(b.hireCost));
  final teaser = locked.isNotEmpty ? locked.first : null;
  return teaser != null ? [...unlocked, teaser] : unlocked;
}
