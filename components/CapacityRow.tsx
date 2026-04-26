import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CapacityBuilding, getCapacityBuildingCost } from '../engine/capacity';
import { useGameStore } from '../engine/store';

interface Props {
  building: CapacityBuilding;
}

export function CapacityRow({ building }: Props) {
  const credits = useGameStore((state) => state.credits);
  const owned = useGameStore((state) => state.capacity[building.id] ?? 0);
  const buy = useGameStore((state) => state.buyCapacityBuilding);

  const cost = getCapacityBuildingCost(building, owned);
  const totalProvided = building.capacity * owned;
  const canAfford = credits >= cost;
  const unit = building.resource === 'power' ? 'W' : 'BTU';

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{building.name}</Text>
          <Text style={styles.owned}>×{owned}</Text>
        </View>
        <Text style={styles.description}>{building.description}</Text>
        <Text style={styles.perUnit}>
          +{building.capacity} {unit} each
        </Text>
        <Text style={styles.output}>
          Total: +{totalProvided} {unit}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
        onPress={() => buy(building.id)}
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
    fontSize: 15,
    fontWeight: 'bold',
  },
  owned: {
    color: '#7af',
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
    color: '#7af',
    fontSize: 12,
  },
  buyButton: {
    backgroundColor: '#7af',
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
    color: '#001',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  buyTextDisabled: {
    color: '#555',
  },
  cost: {
    color: '#001',
    fontSize: 12,
    marginTop: 2,
  },
  costDisabled: {
    color: '#444',
  },
});
