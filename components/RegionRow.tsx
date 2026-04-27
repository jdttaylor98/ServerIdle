import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CloudRegion } from '../engine/regions';
import { useGameStore } from '../engine/store';

interface Props {
  region: CloudRegion;
}

export function RegionRow({ region }: Props) {
  const credits = useGameStore((state) => state.credits);
  const owned = useGameStore((state) => !!state.regions[region.id]);
  const buyRegion = useGameStore((state) => state.buyRegion);
  const sellRegion = useGameStore((state) => state.sellRegion);
  const activeBuild = useGameStore((state) => state.activeBuild);
  const cancelBuild = useGameStore((state) => state.cancelBuild);

  const isBuildingThis =
    activeBuild?.kind === 'region' && activeBuild?.id === region.id;
  const isBuildingOther = !!activeBuild && !isBuildingThis;
  const canAfford = credits >= region.cost;

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isBuildingThis) return;
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [isBuildingThis]);

  return (
    <View style={[styles.row, owned && styles.rowOwned]}>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>
            🌐 {region.name}
            {owned ? '  ✓' : ''}
          </Text>
        </View>
        <Text style={styles.description}>{region.description}</Text>
        <Text style={styles.output}>
          {region.output.toLocaleString()} cr/sec
        </Text>
        <Text style={styles.consumption}>
          {region.powerDraw.toLocaleString()}W ·{' '}
          {region.heatOutput.toLocaleString()} BTU · {Math.round(region.buildTimeSeconds / 60)}min build
        </Text>

        {isBuildingThis && activeBuild && (
          <BuildIndicator
            startedAt={activeBuild.startedAt}
            completesAt={activeBuild.completesAt}
            onCancel={cancelBuild}
          />
        )}

        {owned && (
          <TouchableOpacity
            style={styles.sellButton}
            onPress={() => sellRegion(region.id)}
            activeOpacity={0.6}
          >
            <Text style={styles.sellText}>
              Decommission · refund {formatCost(Math.floor(region.cost * 0.5))}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!owned && !isBuildingThis && (
        <TouchableOpacity
          style={[
            styles.buildButton,
            (!canAfford || isBuildingOther) && styles.buildButtonDisabled,
          ]}
          onPress={() => buyRegion(region.id)}
          disabled={!canAfford || isBuildingOther}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.buildText,
              (!canAfford || isBuildingOther) && styles.buildTextDisabled,
            ]}
          >
            LEASE
          </Text>
          <Text
            style={[
              styles.cost,
              (!canAfford || isBuildingOther) && styles.costDisabled,
            ]}
          >
            {formatCost(region.cost)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function BuildIndicator({
  startedAt,
  completesAt,
  onCancel,
}: {
  startedAt: number;
  completesAt: number;
  onCancel: () => void;
}) {
  const now = Date.now();
  const total = completesAt - startedAt;
  const elapsed = Math.min(total, now - startedAt);
  const remainingMs = Math.max(0, completesAt - now);
  const fillWidth = `${Math.min(100, (elapsed / total) * 100)}%` as const;

  return (
    <View style={styles.buildBox}>
      <View style={styles.buildHeader}>
        <Text style={styles.buildLabel}>PROVISIONING…</Text>
        <Text style={styles.buildTimer}>{formatMs(remainingMs)}</Text>
      </View>
      <View style={styles.buildTrack}>
        <View style={[styles.buildFill, { width: fillWidth }]} />
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancel · 50% refund</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatCost(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatMs(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
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
  rowOwned: {
    backgroundColor: '#0e2418',
    borderColor: '#00ff88',
  },
  info: { flex: 1 },
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
  description: {
    color: '#888',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  output: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: 'bold',
  },
  consumption: {
    color: '#555',
    fontSize: 10,
    marginTop: 2,
  },
  buildBox: {
    backgroundColor: '#0d0d1a',
    borderWidth: 1,
    borderColor: '#00ff88',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  buildHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  buildLabel: {
    color: '#00ff88',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  buildTimer: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  buildTrack: {
    height: 6,
    backgroundColor: '#1a1a2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  buildFill: {
    height: '100%',
    backgroundColor: '#00ff88',
  },
  cancelButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  cancelText: {
    color: '#ff7755',
    fontSize: 10,
    textDecorationLine: 'underline',
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
    backgroundColor: '#00ff88',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  buildButtonDisabled: {
    backgroundColor: '#222',
  },
  buildText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  buildTextDisabled: {
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
