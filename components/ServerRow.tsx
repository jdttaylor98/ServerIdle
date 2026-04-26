import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ServerTier, getServerCost, getServerOutput } from '../engine/servers';
import { getServerOutputMultiplier } from '../engine/upgrades';
import { useGameStore } from '../engine/store';

interface Props {
  tier: ServerTier;
}

export function ServerRow({ tier }: Props) {
  const credits = useGameStore((state) => state.credits);
  const owned = useGameStore((state) => state.servers[tier.id] ?? 0);
  const upgrades = useGameStore((state) => state.upgrades);
  const buyServer = useGameStore((state) => state.buyServer);

  const cost = getServerCost(tier, owned);
  const tierMult = getServerOutputMultiplier(tier.id, upgrades);
  const perUnit = tier.baseOutput * tierMult;
  const totalOutput = getServerOutput(tier, owned) * tierMult;
  const canAfford = credits >= cost;

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{tier.name}</Text>
          <Text style={styles.owned}>×{owned}</Text>
        </View>
        <Text style={styles.description}>{tier.description}</Text>
        <Text style={styles.perUnit}>
          {perUnit.toFixed(2)} credits/sec each
          {tierMult > 1 ? ` (×${tierMult.toFixed(2)})` : ''}
        </Text>
        <Text style={styles.output}>
          Total: {totalOutput.toFixed(1)} credits/sec
        </Text>
        <Text style={styles.consumption}>
          {tier.powerDraw}W · {tier.heatOutput} BTU per unit
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
        onPress={() => buyServer(tier.id)}
        disabled={!canAfford}
        activeOpacity={0.7}
      >
        <Text style={[styles.buyText, !canAfford && styles.buyTextDisabled]}>
          BUY
        </Text>
        <Text style={[styles.cost, !canAfford && styles.costDisabled]}>
          {formatCost(cost)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function formatCost(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  owned: {
    color: '#00ff88',
    fontSize: 13,
    marginLeft: 8,
  },
  description: {
    color: '#666',
    fontSize: 11,
    marginBottom: 4,
  },
  perUnit: {
    color: '#666',
    fontSize: 11,
    marginBottom: 2,
  },
  output: {
    color: '#00ff88',
    fontSize: 12,
  },
  consumption: {
    color: '#555',
    fontSize: 10,
    marginTop: 2,
  },
  buyButton: {
    backgroundColor: '#00ff88',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  buyButtonDisabled: {
    backgroundColor: '#222',
  },
  buyText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  buyTextDisabled: {
    color: '#555',
  },
  cost: {
    color: '#000',
    fontSize: 12,
    marginTop: 2,
  },
  costDisabled: {
    color: '#444',
  },
});
