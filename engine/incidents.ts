export type IncidentType =
  | 'ddos'
  | 'disk_full'
  | 'vendor_offer'
  | 'memory_leak'
  | 'hacker_breach';

export type ActiveIncident =
  | {
      type: 'ddos';
      startedAt: number;
      expiresAt: number;
      tapsRemaining: number;
    }
  | { type: 'disk_full'; startedAt: number; expiresAt: number }
  | { type: 'vendor_offer'; startedAt: number; expiresAt: number }
  | { type: 'memory_leak'; startedAt: number; expiresAt: number }
  | {
      type: 'hacker_breach';
      startedAt: number;
      expiresAt: number;
      sequence: string[]; // letters in the order to tap
      buttons: string[]; // letters as displayed (shuffled)
      currentStep: number; // index into sequence
    };

export interface IncidentResolution {
  success: boolean;
  rewardCredits: number;
  penaltyCredits: number;
  vendorDiscountActivated: boolean;
}

// ─── Tunable config per incident type ───
export const INCIDENT_CONFIG = {
  ddos: {
    name: 'DDoS Attack',
    icon: '🛑',
    description: 'Inbound flood is choking your servers. Mitigate fast.',
    duration: 15, // seconds (was 30)
    tapsRequired: 3,
    activeMultiplier: 0.5, // output while incident is live
    rewardSecondsOfCps: 30,
    timeoutPenaltySecondsOfCps: 120, // harsher (was 60)
  },
  disk_full: {
    name: 'Disk Full',
    icon: '💾',
    description: 'A runaway log filled the disk. Output is throttled.',
    duration: 20, // seconds (was 45)
    activeMultiplier: 0.5,
    rewardSecondsOfCps: 15,
    timeoutPenaltySecondsOfCps: 30, // NEW — was silent
  },
  vendor_offer: {
    name: 'Vendor Offer',
    icon: '💰',
    description: 'Sales rep is offering 50% off your next server purchase.',
    duration: 30, // seconds (was 60)
    activeMultiplier: 1, // no penalty
  },
  memory_leak: {
    name: 'Memory Leak',
    icon: '🧠',
    description: 'A buggy service is leaking RAM. Output is degrading.',
    duration: 30, // expires after 30s (was 60)
    decayDuration: 15, // takes 15s to decay from 1.0 to 0.5 (was 30)
    minMultiplier: 0.25, // floor below the 0.5 mark
    activeMultiplier: 1, // base, but recomputed dynamically
    rewardSecondsOfCps: 20,
    timeoutCreditPercent: 0.02, // NEW — lose 2% credits on timeout
  },
  hacker_breach: {
    name: 'Hacker Breach',
    icon: '🚨',
    description: 'Someone is in. Patch the firewall in order.',
    duration: 12, // 12 seconds to complete the sequence
    sequenceLength: 4,
    activeMultiplier: 0.7, // mild output penalty while active
    rewardSecondsOfCps: 90,
    timeoutCreditPercent: 0.10, // harsher (was 0.05)
  },
} as const;

export const INCIDENT_TRIGGER_CHANCE_PER_SEC = 0.01; // ~1% per tick

const ALL_TYPES: IncidentType[] = [
  'ddos',
  'disk_full',
  'vendor_offer',
  'memory_leak',
  'hacker_breach',
];

export function pickRandomIncident(
  weights?: Partial<Record<IncidentType, number>>
): IncidentType | null {
  const w: Record<IncidentType, number> = {
    ddos: weights?.ddos ?? 1,
    disk_full: weights?.disk_full ?? 1,
    vendor_offer: weights?.vendor_offer ?? 1,
    memory_leak: weights?.memory_leak ?? 1,
    hacker_breach: weights?.hacker_breach ?? 1,
  };
  const total = ALL_TYPES.reduce((s, t) => s + w[t], 0);
  if (total <= 0) return null; // fully blocked by staff
  let roll = Math.random() * total;
  for (const t of ALL_TYPES) {
    roll -= w[t];
    if (roll <= 0) return t;
  }
  return ALL_TYPES[0];
}

const HACKER_LETTER_POOL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function generateHackerSequence(length: number): {
  sequence: string[];
  buttons: string[];
} {
  // Pick `length` unique letters from the pool
  const shuffled = [...HACKER_LETTER_POOL].sort(() => Math.random() - 0.5);
  const letters = shuffled.slice(0, length);
  // The sequence is the letters in a random order (must be tapped in this order)
  const sequence = [...letters].sort(() => Math.random() - 0.5);
  // Buttons display the same letters in another random order
  const buttons = [...letters].sort(() => Math.random() - 0.5);
  return { sequence, buttons };
}

export function createIncident(type: IncidentType): ActiveIncident {
  const now = Date.now();
  const config = INCIDENT_CONFIG[type];
  const expiresAt = now + config.duration * 1000;

  switch (type) {
    case 'ddos':
      return {
        type,
        startedAt: now,
        expiresAt,
        tapsRemaining: INCIDENT_CONFIG.ddos.tapsRequired,
      };
    case 'disk_full':
    case 'vendor_offer':
    case 'memory_leak':
      return { type, startedAt: now, expiresAt };
    case 'hacker_breach': {
      const { sequence, buttons } = generateHackerSequence(
        INCIDENT_CONFIG.hacker_breach.sequenceLength
      );
      return {
        type,
        startedAt: now,
        expiresAt,
        sequence,
        buttons,
        currentStep: 0,
      };
    }
  }
}

export function getIncidentMultiplier(incident: ActiveIncident | null): number {
  if (!incident) return 1;
  if (incident.type === 'memory_leak') {
    // Decays linearly from 1.0 → 0.5 over decayDuration, then floors
    const config = INCIDENT_CONFIG.memory_leak;
    const elapsedSec = (Date.now() - incident.startedAt) / 1000;
    const decayProgress = Math.min(1, elapsedSec / config.decayDuration);
    const value = 1 - decayProgress * 0.5;
    return Math.max(config.minMultiplier, value);
  }
  return INCIDENT_CONFIG[incident.type].activeMultiplier;
}

export function getIncidentTimeRemaining(
  incident: ActiveIncident | null
): number {
  if (!incident) return 0;
  return Math.max(0, (incident.expiresAt - Date.now()) / 1000);
}
