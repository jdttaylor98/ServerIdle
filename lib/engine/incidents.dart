import 'dart:math';

// ─── Incident types ───

enum IncidentType {
  ddos,
  diskFull,
  memoryLeak,
  vendorOffer,
  hackerBreach,
}

// ─── Per-type config ───

class IncidentConfig {
  final String name;
  final String icon;
  final String description;
  final int duration; // seconds
  final int tapsRequired;
  final double activeMultiplier;
  final double rewardSecondsOfCps;
  final double timeoutPenaltySecondsOfCps;
  final double timeoutCreditPercent;
  final int sequenceLength;
  final int decayDuration;
  final double minMultiplier;

  const IncidentConfig({
    required this.name,
    required this.icon,
    required this.description,
    required this.duration,
    this.tapsRequired = 0,
    this.activeMultiplier = 1.0,
    this.rewardSecondsOfCps = 0,
    this.timeoutPenaltySecondsOfCps = 0,
    this.timeoutCreditPercent = 0,
    this.sequenceLength = 0,
    this.decayDuration = 0,
    this.minMultiplier = 0,
  });
}

const Map<IncidentType, IncidentConfig> incidentConfigs = {
  IncidentType.ddos: IncidentConfig(
    name: 'DDoS Attack',
    icon: '\u{1F6D1}', // red octagonal
    description: 'Inbound flood is choking your servers. Mitigate fast.',
    duration: 15,
    tapsRequired: 3,
    activeMultiplier: 0.5,
    rewardSecondsOfCps: 30,
    timeoutPenaltySecondsOfCps: 120,
  ),
  IncidentType.diskFull: IncidentConfig(
    name: 'Disk Full',
    icon: '\u{1F4BE}', // floppy disk
    description: 'A runaway log filled the disk. Output is throttled.',
    duration: 20,
    activeMultiplier: 0.5,
    rewardSecondsOfCps: 15,
    timeoutPenaltySecondsOfCps: 30,
  ),
  IncidentType.vendorOffer: IncidentConfig(
    name: 'Vendor Offer',
    icon: '\u{1F4B0}', // money bag
    description: 'Sales rep is offering 50% off your next server purchase.',
    duration: 30,
    activeMultiplier: 1,
  ),
  IncidentType.memoryLeak: IncidentConfig(
    name: 'Memory Leak',
    icon: '\u{1F9E0}', // brain
    description: 'A buggy service is leaking RAM. Output is degrading.',
    duration: 30,
    decayDuration: 15,
    minMultiplier: 0.25,
    activeMultiplier: 1,
    rewardSecondsOfCps: 20,
    timeoutCreditPercent: 0.02,
  ),
  IncidentType.hackerBreach: IncidentConfig(
    name: 'Hacker Breach',
    icon: '\u{1F6A8}', // rotating light
    description: 'Someone is in. Patch the firewall in order.',
    duration: 12,
    sequenceLength: 4,
    activeMultiplier: 0.7,
    rewardSecondsOfCps: 90,
    timeoutCreditPercent: 0.10,
  ),
};

const double incidentTriggerChancePerSec = 0.01;

// ─── Active incident (single class with nullable fields) ───

class ActiveIncident {
  final IncidentType type;
  final int startedAt;
  final int expiresAt;
  final int? tapsRemaining;
  final List<String>? sequence;
  final List<String>? buttons;
  final int? currentStep;

  const ActiveIncident({
    required this.type,
    required this.startedAt,
    required this.expiresAt,
    this.tapsRemaining,
    this.sequence,
    this.buttons,
    this.currentStep,
  });

  ActiveIncident copyWith({
    IncidentType? type,
    int? startedAt,
    int? expiresAt,
    int? tapsRemaining,
    List<String>? sequence,
    List<String>? buttons,
    int? currentStep,
  }) {
    return ActiveIncident(
      type: type ?? this.type,
      startedAt: startedAt ?? this.startedAt,
      expiresAt: expiresAt ?? this.expiresAt,
      tapsRemaining: tapsRemaining ?? this.tapsRemaining,
      sequence: sequence ?? this.sequence,
      buttons: buttons ?? this.buttons,
      currentStep: currentStep ?? this.currentStep,
    );
  }
}

// ─── Weighted random pick ───

const List<IncidentType> _allTypes = [
  IncidentType.ddos,
  IncidentType.diskFull,
  IncidentType.vendorOffer,
  IncidentType.memoryLeak,
  IncidentType.hackerBreach,
];

IncidentType? pickRandomIncident(
  Map<IncidentType, double> weights,
  Random rng,
) {
  final Map<IncidentType, double> w = {
    IncidentType.ddos: weights[IncidentType.ddos] ?? 1,
    IncidentType.diskFull: weights[IncidentType.diskFull] ?? 1,
    IncidentType.vendorOffer: weights[IncidentType.vendorOffer] ?? 1,
    IncidentType.memoryLeak: weights[IncidentType.memoryLeak] ?? 1,
    IncidentType.hackerBreach: weights[IncidentType.hackerBreach] ?? 1,
  };

  final total = _allTypes.fold<double>(0, (s, t) => s + w[t]!);
  if (total <= 0) return null; // fully blocked by staff

  double roll = rng.nextDouble() * total;
  for (final t in _allTypes) {
    roll -= w[t]!;
    if (roll <= 0) return t;
  }
  return _allTypes[0];
}

// ─── Hacker sequence generator ───

const List<String> _hackerLetterPool = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
];

Map<String, List<String>> _generateHackerSequence(int length, Random rng) {
  final shuffled = List<String>.from(_hackerLetterPool)..shuffle(rng);
  final letters = shuffled.sublist(0, length);
  final sequence = List<String>.from(letters)..shuffle(rng);
  final buttons = List<String>.from(letters)..shuffle(rng);
  return {'sequence': sequence, 'buttons': buttons};
}

// ─── Create incident ───

ActiveIncident createIncident(IncidentType type, [Random? rng]) {
  final now = DateTime.now().millisecondsSinceEpoch;
  final config = incidentConfigs[type]!;
  final expiresAt = now + config.duration * 1000;
  final random = rng ?? Random();

  switch (type) {
    case IncidentType.ddos:
      return ActiveIncident(
        type: type,
        startedAt: now,
        expiresAt: expiresAt,
        tapsRemaining: incidentConfigs[IncidentType.ddos]!.tapsRequired,
      );
    case IncidentType.diskFull:
    case IncidentType.vendorOffer:
    case IncidentType.memoryLeak:
      return ActiveIncident(
        type: type,
        startedAt: now,
        expiresAt: expiresAt,
      );
    case IncidentType.hackerBreach:
      final result = _generateHackerSequence(
        incidentConfigs[IncidentType.hackerBreach]!.sequenceLength,
        random,
      );
      return ActiveIncident(
        type: type,
        startedAt: now,
        expiresAt: expiresAt,
        sequence: result['sequence']!,
        buttons: result['buttons']!,
        currentStep: 0,
      );
  }
}

// ─── Multiplier while incident is active ───

double getIncidentMultiplier(ActiveIncident? incident) {
  if (incident == null) return 1;
  if (incident.type == IncidentType.memoryLeak) {
    final config = incidentConfigs[IncidentType.memoryLeak]!;
    final elapsedSec =
        (DateTime.now().millisecondsSinceEpoch - incident.startedAt) / 1000;
    final decayProgress =
        (elapsedSec / config.decayDuration).clamp(0.0, 1.0);
    final value = 1 - decayProgress * 0.5;
    return max(config.minMultiplier, value);
  }
  return incidentConfigs[incident.type]!.activeMultiplier;
}

// ─── Time remaining ───

double getIncidentTimeRemaining(ActiveIncident? incident) {
  if (incident == null) return 0;
  return max(
    0,
    (incident.expiresAt - DateTime.now().millisecondsSinceEpoch) / 1000,
  ).toDouble();
}
