import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getUpgradesByEra, UpgradeEra } from '../engine/upgrades';
import { UpgradeCard } from './UpgradeCard';

const ERAS: { era: UpgradeEra; label: string }[] = [
  { era: 'homelab', label: 'HOMELAB' },
  { era: 'rack', label: 'RACK' },
];

export function UpgradeTree() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>UPGRADES</Text>
      {ERAS.map(({ era, label }) => (
        <View key={era} style={styles.eraSection}>
          <Text style={styles.eraLabel}>{label}</Text>
          {getUpgradesByEra(era).map((upgrade) => (
            <UpgradeCard key={upgrade.id} upgrade={upgrade} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 18,
  },
  heading: {
    color: '#666',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 10,
  },
  eraSection: {
    marginBottom: 14,
  },
  eraLabel: {
    color: '#444',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 6,
  },
});
