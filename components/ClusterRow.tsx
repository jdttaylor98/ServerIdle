import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  ClusterType,
  getClusterCost,
  isClusterUnlocked,
  getClusterOutput,
} from '../engine/clusters';
import { SERVER_TIERS } from '../engine/servers';
import { getServerOutputMultiplier } from '../engine/upgrades';
import { useGameStore } from '../engine/store';

interface Props {
  type: ClusterType;
}

export function ClusterRow({ type }: Props) {
  const credits = useGameStore((state) => state.credits);
  const servers = useGameStore((state) => state.servers);
  const clusters = useGameStore((state) => state.clusters);
  const upgrades = useGameStore((state) => state.upgrades);
  const buildCluster = useGameStore((state) => state.buildCluster);
  const sellCluster = useGameStore((state) => state.sellCluster);

  const owned = clusters[type.id] ?? 0;
  const unlocked = isClusterUnlocked(type, upgrades);
  const cost = getClusterCost(type, owned);
  const sourceOwned = servers[type.sourceTierId] ?? 0;

  const sourceTier = SERVER_TIERS.find((t) => t.id === type.sourceTierId);
  const tierMult = getServerOutputMultiplier(type.sourceTierId, upgrades);
  const outputPerCluster = sourceTier
    ? sourceTier.baseOutput * type.sourceCount * type.outputMultiplier * tierMult
    : 0;
  const totalOutput = getClusterOutput(type, owned, tierMult);
  const totalPower = sourceTier ? sourceTier.powerDraw * type.sourceCount * owned : 0;
  const totalHeat = sourceTier ? sourceTier.heatOutput * type.sourceCount * owned : 0;

  const enoughSource = sourceOwned >= type.sourceCount;
  const canAfford = credits >= cost;
  const canBuild = unlocked && enoughSource && canAfford;
  const refund = owned > 0 ? Math.floor(getClusterCost(type, owned - 1) * 0.5) : 0;

  return (
    <View style={[styles.row, !unlocked && styles.rowLocked]}>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>
            {!unlocked && '🔒 '}
            {type.name}
          </Text>
          <Text style={styles.owned}>×{owned}</Text>
        </View>
        <Text style={styles.description}>{type.description}</Text>

        <Text style={styles.statLine}>
          {outputPerCluster.toFixed(1)} cr/sec each
          {tierMult > 1 ? ` (×${tierMult.toFixed(2)})` : ''}
        </Text>
        {owned > 0 && (
          <Text style={styles.totalLine}>
            Total: {totalOutput.toFixed(1)} cr/sec · {totalPower}W · {totalHeat} BTU
          </Text>
        )}
        <Text style={styles.recipe}>
          Build cost: {type.sourceCount} × {sourceTier?.name} + {formatCost(cost)} cr
        </Text>

        {!unlocked && (
          <Text style={styles.lockedHint}>
            Requires CLUSTER SOFTWARE upgrade
          </Text>
        )}
        {unlocked && !enoughSource && (
          <Text style={styles.warning}>
            Need {type.sourceCount - sourceOwned} more {sourceTier?.name}
          </Text>
        )}

        {owned > 0 && (
          <TouchableOpacity
            style={styles.sellButton}
            onPress={() => sellCluster(type.id)}
            activeOpacity={0.6}
          >
            <Text style={styles.sellText}>
              Sell 1 · refund {formatCost(refund)} (servers don't return)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.buildButton, !canBuild && styles.buildButtonDisabled]}
        onPress={() => buildCluster(type.id)}
        disabled={!canBuild}
        activeOpacity={0.7}
      >
        <Text style={[styles.buildText, !canBuild && styles.buildTextDisabled]}>
          BUILD
        </Text>
        <Text style={[styles.cost, !canBuild && styles.costDisabled]}>
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
    borderColor: '#7af',
  },
  rowLocked: {
    borderColor: '#1a1a2e',
    borderStyle: 'dashed',
    opacity: 0.6,
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
    color: '#7af',
    fontSize: 13,
    marginLeft: 8,
  },
  description: {
    color: '#888',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  statLine: {
    color: '#7af',
    fontSize: 12,
    marginTop: 2,
  },
  totalLine: {
    color: '#7af',
    fontSize: 11,
    marginTop: 2,
  },
  recipe: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  lockedHint: {
    color: '#ffaa44',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 4,
  },
  warning: {
    color: '#ff7755',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sellButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  sellText: {
    color: '#ff7755',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  buildButton: {
    backgroundColor: '#7af',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  buildButtonDisabled: {
    backgroundColor: '#222',
  },
  buildText: {
    color: '#001',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  buildTextDisabled: {
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
