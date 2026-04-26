import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGameStore } from '../engine/store';
import {
  INCIDENT_CONFIG,
  getIncidentTimeRemaining,
} from '../engine/incidents';

export function IncidentBanner() {
  const incident = useGameStore((state) => state.activeIncident);
  const tapDdosMitigate = useGameStore((state) => state.tapDdosMitigate);
  const resolveIncident = useGameStore((state) => state.resolveIncident);
  const acceptVendorOffer = useGameStore((state) => state.acceptVendorOffer);

  // Force re-render every second so the timer ticks down smoothly
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!incident) return;
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [incident?.startedAt]);

  if (!incident) return null;

  const config = INCIDENT_CONFIG[incident.type];
  const remaining = getIncidentTimeRemaining(incident);
  const ratio = remaining / config.duration;
  const fillWidth = `${Math.max(0, Math.min(1, ratio)) * 100}%` as const;

  // Per-type styling and action button
  const themeMap = {
    ddos: { bg: '#2a0d18', border: '#ff3355', text: '#ff7799' },
    disk_full: { bg: '#2a1d0d', border: '#ffaa44', text: '#ffcc77' },
    vendor_offer: { bg: '#1a1f0d', border: '#cccc44', text: '#ddee77' },
  } as const;
  const theme = themeMap[incident.type];

  let actionLabel = '';
  let onAction = () => {};
  let actionSub = '';
  if (incident.type === 'ddos') {
    actionLabel = `MITIGATE (${incident.tapsRemaining} more)`;
    actionSub = 'Tap to fight back';
    onAction = tapDdosMitigate;
  } else if (incident.type === 'disk_full') {
    actionLabel = 'CLEAR DISK';
    actionSub = `Reward: ${INCIDENT_CONFIG.disk_full.rewardSecondsOfCps}s of cps`;
    onAction = resolveIncident;
  } else if (incident.type === 'vendor_offer') {
    actionLabel = 'ACCEPT 50% OFF';
    actionSub = 'Next server purchase';
    onAction = acceptVendorOffer;
  }

  return (
    <View style={[styles.banner, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>
          {config.icon} {config.name.toUpperCase()}
        </Text>
        <Text style={[styles.timer, { color: theme.text }]}>
          {Math.ceil(remaining)}s
        </Text>
      </View>
      <Text style={styles.description}>{config.description}</Text>

      <View style={styles.track}>
        <View
          style={[styles.fill, { width: fillWidth, backgroundColor: theme.border }]}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { borderColor: theme.border }]}
        onPress={onAction}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, { color: theme.text }]}>
          {actionLabel}
        </Text>
        <Text style={styles.buttonSub}>{actionSub}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  timer: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: 'bold',
  },
  description: {
    color: '#aaa',
    fontSize: 11,
    marginBottom: 8,
  },
  track: {
    height: 4,
    backgroundColor: '#0a0a14',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#0d0d1a',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  buttonSub: {
    color: '#888',
    fontSize: 10,
    marginTop: 3,
  },
});
