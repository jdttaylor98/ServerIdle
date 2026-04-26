import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Upgrade, isUpgradeAvailable, UPGRADES } from '../engine/upgrades';
import { useGameStore } from '../engine/store';

interface Props {
  upgrade: Upgrade;
}

export function UpgradeCard({ upgrade }: Props) {
  const credits = useGameStore((state) => state.credits);
  const purchased = useGameStore((state) => state.upgrades);
  const servers = useGameStore((state) => state.servers);
  const buyUpgrade = useGameStore((state) => state.buyUpgrade);

  const owned = !!purchased[upgrade.id];
  const available = isUpgradeAvailable(upgrade, purchased, servers);
  const canAfford = credits >= upgrade.cost;

  const missingPrereqs = upgrade.prereqs
    .filter((id) => !purchased[id])
    .map((id) => UPGRADES.find((u) => u.id === id)?.name ?? id);

  // Determine state for styling
  let state: 'owned' | 'locked' | 'unaffordable' | 'buyable';
  if (owned) state = 'owned';
  else if (!available) state = 'locked';
  else if (!canAfford) state = 'unaffordable';
  else state = 'buyable';

  const onPress = () => {
    if (state === 'buyable') buyUpgrade(upgrade.id);
  };

  return (
    <TouchableOpacity
      style={[styles.card, stateStyles[state].card]}
      onPress={onPress}
      disabled={state !== 'buyable'}
      activeOpacity={0.7}
    >
      <View style={styles.headerRow}>
        <View style={styles.nameRow}>
          {state === 'locked' && <Text style={styles.lockIcon}>🔒</Text>}
          <Text style={[styles.name, stateStyles[state].name]}>
            {upgrade.name}
          </Text>
        </View>
        {state === 'owned' ? (
          <Text style={styles.checkmark}>✓</Text>
        ) : (
          <Text style={[styles.cost, stateStyles[state].cost]}>
            {formatCost(upgrade.cost)}
          </Text>
        )}
      </View>

      <Text style={[styles.description, stateStyles[state].description]}>
        {upgrade.description}
      </Text>

      {state === 'locked' && missingPrereqs.length > 0 && (
        <Text style={styles.requirement}>
          REQUIRES: {missingPrereqs.join(', ').toUpperCase()}
        </Text>
      )}
      {state === 'locked' &&
        missingPrereqs.length === 0 &&
        upgrade.unlockHint && (
          <Text style={styles.requirement}>
            REQUIRES: {upgrade.unlockHint.toUpperCase()}
          </Text>
        )}
      {state === 'unaffordable' && (
        <Text style={styles.unaffordableHint}>
          Need {formatCost(upgrade.cost - credits)} more credits
        </Text>
      )}
    </TouchableOpacity>
  );
}

function formatCost(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.ceil(n)}`;
}

// Per-state style overrides
const stateStyles = {
  owned: {
    card: { backgroundColor: '#0e2418', borderColor: '#00ff88' },
    name: { color: '#00ff88' },
    description: { color: '#5fbf8f' },
    cost: { color: '#00ff88' },
  },
  locked: {
    card: {
      backgroundColor: '#15151f',
      borderColor: '#1a1a2e',
      borderStyle: 'dashed' as const,
    },
    name: { color: '#555' },
    description: { color: '#3a3a4a' },
    cost: { color: '#3a3a4a' },
  },
  unaffordable: {
    card: { backgroundColor: '#1a1a2e', borderColor: '#2a2a4a' },
    name: { color: '#999' },
    description: { color: '#666' },
    cost: { color: '#666' },
  },
  buyable: {
    card: { backgroundColor: '#1a1a2e', borderColor: '#00ff88' },
    name: { color: '#fff' },
    description: { color: '#aaa' },
    cost: { color: '#00ff88' },
  },
} as const;

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lockIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  checkmark: {
    color: '#00ff88',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cost: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 12,
    marginBottom: 4,
  },
  requirement: {
    color: '#ffaa44',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 4,
  },
  unaffordableHint: {
    color: '#666',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
