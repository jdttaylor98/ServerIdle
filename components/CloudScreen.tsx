import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CLOUD_REGIONS,
  getOwnedRegionsOutput,
  getOwnedRegionsCost,
} from '../engine/regions';
import { useGameStore } from '../engine/store';
import { RegionRow } from './RegionRow';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  onClose: () => void;
}

export function CloudScreen({ onClose }: Props) {
  const credits = useGameStore((state) => state.credits);
  const regions = useGameStore((state) => state.regions);
  const totalRegionOutput = getOwnedRegionsOutput(regions);
  const totalRegionCost = getOwnedRegionsCost(regions);
  const totalRegionNet = totalRegionOutput - totalRegionCost;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="CLOUD"
        rightLabel={`${Math.floor(credits).toLocaleString()} cr`}
        onBack={onClose}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subheading}>
          Lease cloud regions. One of each. Provisioning takes real time.
        </Text>
        {totalRegionOutput > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>OUTPUT</Text>
              <Text style={styles.summaryGood}>
                +{totalRegionOutput.toLocaleString()} cr/sec
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>OPS COSTS</Text>
              <Text style={styles.summaryBad}>
                −{totalRegionCost.toLocaleString()} cr/sec
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryNet]}>
              <Text style={styles.summaryLabel}>NET</Text>
              <Text style={styles.summaryNetValue}>
                {totalRegionNet >= 0 ? '+' : ''}
                {totalRegionNet.toLocaleString()} cr/sec
              </Text>
            </View>
          </View>
        )}
        {CLOUD_REGIONS.map((region) => (
          <RegionRow key={region.id} region={region} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  subheading: {
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderColor: '#2a2a4a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  summaryNet: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
    marginTop: 4,
    paddingTop: 6,
  },
  summaryLabel: {
    color: '#888',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  summaryGood: {
    color: '#00ff88',
    fontSize: 13,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  summaryBad: {
    color: '#ff7755',
    fontSize: 13,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  summaryNetValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});
