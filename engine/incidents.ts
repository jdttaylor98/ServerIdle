export type IncidentType = 'ddos' | 'disk_full' | 'vendor_offer';

export type ActiveIncident =
  | {
      type: 'ddos';
      startedAt: number;
      expiresAt: number;
      tapsRemaining: number;
    }
  | { type: 'disk_full'; startedAt: number; expiresAt: number }
  | { type: 'vendor_offer'; startedAt: number; expiresAt: number };

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
    duration: 30, // seconds
    tapsRequired: 3,
    activeMultiplier: 0.5, // output while incident is live
    rewardSecondsOfCps: 30,
    timeoutPenaltySecondsOfCps: 60,
  },
  disk_full: {
    name: 'Disk Full',
    icon: '💾',
    description: 'A runaway log filled the disk. Output is throttled.',
    duration: 45,
    activeMultiplier: 0.5,
    rewardSecondsOfCps: 15,
  },
  vendor_offer: {
    name: 'Vendor Offer',
    icon: '💰',
    description: 'Sales rep is offering 50% off your next server purchase.',
    duration: 60,
    activeMultiplier: 1, // no penalty
  },
} as const;

export const INCIDENT_TRIGGER_CHANCE_PER_SEC = 0.01; // ~1% per tick

const ALL_TYPES: IncidentType[] = ['ddos', 'disk_full', 'vendor_offer'];

export function pickRandomIncident(
  weights?: Partial<Record<IncidentType, number>>
): IncidentType | null {
  const w: Record<IncidentType, number> = {
    ddos: weights?.ddos ?? 1,
    disk_full: weights?.disk_full ?? 1,
    vendor_offer: weights?.vendor_offer ?? 1,
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
      return { type, startedAt: now, expiresAt };
  }
}

export function getIncidentMultiplier(incident: ActiveIncident | null): number {
  if (!incident) return 1;
  return INCIDENT_CONFIG[incident.type].activeMultiplier;
}

export function getIncidentTimeRemaining(
  incident: ActiveIncident | null
): number {
  if (!incident) return 0;
  return Math.max(0, (incident.expiresAt - Date.now()) / 1000);
}
