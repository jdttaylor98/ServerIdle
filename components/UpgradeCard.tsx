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

  let statusText = '';
  if (owned) statusText = 'PURCHASED';
  else if (!available && upgrade.prereqs.length && missingPrereqs.length)
    statusText = `Requires: ${missingPrereqs.join(', ')}`;
  else if (!available && upgrade.unlockHint) statusText = upgrade.unlockHint;
  else if (!canAfford) statusText = `${formatCost(upgrade.cost)} credits`;

  const onPress = () => {
    if (!owned && available && canAfford) buyUpgrade(upgrade.id);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        owned && styles.cardOwned,
        !owned && !available && styles.cardLocked,
        !owned && available && !canAfford && styles.cardUnaffordable,
      ]}
      onPress={onPress}
      disabled={owned || !available || !canAfford}
      activeOpacity={0.7}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.name, owned && styles.nameOwned]}>
          {upgrade.name}
        </Text>
        {owned ? (
          <Text style={styles.checkmark}>✓</Text>
        ) : (
          <Text style={[styles.cost, !canAfford && styles.costDisabled]}>
            {formatCost(upgrade.cost)}
          </Text>
        )}
      </View>
      <Text style={[styles.description, owned && styles.descriptionOwned]}>
        {upgrade.description}
      </Text>
      {statusText && !owned && (
        <Text style={styles.status}>{statusText}</Text>
      )}
    </TouchableOpacity>
  );
}

function formatCost(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  cardOwned: {
    backgroundColor: '#0e2418',
    borderColor: '#00ff88',
  },
  cardLocked: {
    opacity: 0.4,
  },
  cardUnaffordable: {
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  nameOwned: {
    color: '#00ff88',
  },
  checkmark: {
    color: '#00ff88',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cost: {
    color: '#00ff88',
    fontSize: 13,
    fontWeight: 'bold',
  },
  costDisabled: {
    color: '#666',
  },
  description: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  descriptionOwned: {
    color: '#5fbf8f',
  },
  status: {
    color: '#666',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
