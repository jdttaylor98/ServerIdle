import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../engine/store';
import { INCIDENT_CONFIG } from '../engine/incidents';

export function IncidentToast() {
  const resolution = useGameStore((state) => state.lastIncidentResolution);
  const clear = useGameStore((state) => state.clearIncidentResolution);

  useEffect(() => {
    if (!resolution) return;
    const t = setTimeout(() => clear(), 3500);
    return () => clearTimeout(t);
  }, [resolution]);

  if (!resolution) return null;

  const config = INCIDENT_CONFIG[resolution.type];
  let message = '';
  let color = '#888';
  if (resolution.success) {
    if (resolution.rewardCredits > 0) {
      message = `${config.icon} Resolved · +${Math.floor(resolution.rewardCredits).toLocaleString()} credits`;
    } else if (resolution.type === 'vendor_offer') {
      message = `${config.icon} Discount banked — buy a server to use it`;
    }
    color = '#00ff88';
  } else {
    if (resolution.penaltyCredits > 0) {
      message = `${config.icon} Timed out · −${Math.floor(resolution.penaltyCredits).toLocaleString()} credits`;
    } else {
      message = `${config.icon} ${config.name} expired`;
    }
    color = '#ff7755';
  }

  return (
    <View style={styles.toast}>
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#0d0d1a',
    borderWidth: 1,
    borderColor: '#2a2a4a',
    borderRadius: 8,
    padding: 12,
    zIndex: 100,
    elevation: 10,
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
