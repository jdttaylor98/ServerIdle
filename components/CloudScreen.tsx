import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { CLOUD_REGIONS, getOwnedRegionsOutput } from '../engine/regions';
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
          <Text style={styles.totalLine}>
            Cloud output: {totalRegionOutput.toLocaleString()} cr/sec
          </Text>
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
  totalLine: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
  },
});
