import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GPU_TIERS, isGpuTierVisible, getTotalGpuOutput, getTotalGpuRpOutput } from '../engine/gpus';
import { useGameStore } from '../engine/store';
import { GpuRow } from './GpuRow';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  onClose: () => void;
}

export function GpuScreen({ onClose }: Props) {
  const credits = useGameStore((state) => state.credits);
  const gpus = useGameStore((state) => state.gpus);
  const research = useGameStore((state) => state.research);
  const totalGpuOutput = getTotalGpuOutput(gpus);
  const totalGpuRp = getTotalGpuRpOutput(gpus);

  const visibleTiers = GPU_TIERS.filter((t) =>
    isGpuTierVisible(t.id, gpus, research)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="GPU"
        rightLabel={`${Math.floor(credits).toLocaleString()} cr`}
        onBack={onClose}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subheading}>
          GPU hardware. Generates credits and Research Points. Power-hungry.
        </Text>

        {totalGpuOutput > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>CREDIT OUTPUT</Text>
              <Text style={styles.summaryGood}>
                +{totalGpuOutput.toLocaleString()} cr/sec
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>RP OUTPUT</Text>
              <Text style={styles.summaryRp}>
                +{totalGpuRp.toFixed(1)} RP/sec
              </Text>
            </View>
          </View>
        )}

        {visibleTiers.map((tier) => (
          <GpuRow key={tier.id} tier={tier} />
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
    borderColor: '#cc88ff',
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
  summaryRp: {
    color: '#cc88ff',
    fontSize: 13,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});
