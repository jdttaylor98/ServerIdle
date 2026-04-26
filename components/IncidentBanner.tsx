import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGameStore } from '../engine/store';
import {
  INCIDENT_CONFIG,
  getIncidentTimeRemaining,
  ActiveIncident,
} from '../engine/incidents';

export function IncidentBanner() {
  const incident = useGameStore((state) => state.activeIncident);
  const tapDdosMitigate = useGameStore((state) => state.tapDdosMitigate);
  const tapHackerSequence = useGameStore((state) => state.tapHackerSequence);
  const resolveIncident = useGameStore((state) => state.resolveIncident);
  const acceptVendorOffer = useGameStore((state) => state.acceptVendorOffer);

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

  const themeMap = {
    ddos: { bg: '#2a0d18', border: '#ff3355', text: '#ff7799' },
    disk_full: { bg: '#2a1d0d', border: '#ffaa44', text: '#ffcc77' },
    vendor_offer: { bg: '#1a1f0d', border: '#cccc44', text: '#ddee77' },
    memory_leak: { bg: '#1f0d2a', border: '#aa55dd', text: '#cc88ff' },
    hacker_breach: { bg: '#2a0d0d', border: '#ff5544', text: '#ff8866' },
  } as const;
  const theme = themeMap[incident.type];

  return (
    <View
      style={[styles.banner, { backgroundColor: theme.bg, borderColor: theme.border }]}
    >
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

      <IncidentAction
        incident={incident}
        theme={theme}
        onTapDdos={tapDdosMitigate}
        onTapHacker={tapHackerSequence}
        onResolve={resolveIncident}
        onAcceptVendor={acceptVendorOffer}
      />
    </View>
  );
}

interface ActionProps {
  incident: ActiveIncident;
  theme: { bg: string; border: string; text: string };
  onTapDdos: () => void;
  onTapHacker: (letter: string) => void;
  onResolve: () => void;
  onAcceptVendor: () => void;
}

function IncidentAction({
  incident,
  theme,
  onTapDdos,
  onTapHacker,
  onResolve,
  onAcceptVendor,
}: ActionProps) {
  if (incident.type === 'hacker_breach') {
    return (
      <View>
        {/* Sequence display */}
        <View style={styles.sequenceRow}>
          {incident.sequence.map((letter, idx) => {
            const isDone = idx < incident.currentStep;
            const isNext = idx === incident.currentStep;
            return (
              <View
                key={idx}
                style={[
                  styles.sequenceCell,
                  isDone && {
                    backgroundColor: theme.border,
                    borderColor: theme.border,
                  },
                  isNext && { borderColor: theme.border, borderWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    styles.sequenceLetter,
                    isDone && { color: '#000' },
                    isNext && { color: theme.text },
                  ]}
                >
                  {letter}
                </Text>
              </View>
            );
          })}
        </View>
        {/* Buttons */}
        <View style={styles.buttonGrid}>
          {incident.buttons.map((letter) => (
            <TouchableOpacity
              key={letter}
              style={[styles.hackerButton, { borderColor: theme.border }]}
              onPress={() => onTapHacker(letter)}
              activeOpacity={0.7}
            >
              <Text style={[styles.hackerButtonText, { color: theme.text }]}>
                {letter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  let actionLabel = '';
  let onAction = () => {};
  let actionSub = '';

  if (incident.type === 'ddos') {
    actionLabel = `MITIGATE (${incident.tapsRemaining} more)`;
    actionSub = 'Tap to fight back';
    onAction = onTapDdos;
  } else if (incident.type === 'disk_full') {
    actionLabel = 'CLEAR DISK';
    actionSub = `Reward: ${INCIDENT_CONFIG.disk_full.rewardSecondsOfCps}s of cps`;
    onAction = onResolve;
  } else if (incident.type === 'memory_leak') {
    actionLabel = 'RESTART SERVICE';
    actionSub = `Reward: ${INCIDENT_CONFIG.memory_leak.rewardSecondsOfCps}s of cps`;
    onAction = onResolve;
  } else if (incident.type === 'vendor_offer') {
    actionLabel = 'ACCEPT 50% OFF';
    actionSub = 'Next server purchase';
    onAction = onAcceptVendor;
  }

  return (
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
  // Hacker minigame
  sequenceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 6,
  },
  sequenceCell: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#0a0a14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequenceLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  hackerButton: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  hackerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
