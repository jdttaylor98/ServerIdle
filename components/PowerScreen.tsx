import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import {
  CAPACITY_BUILDINGS,
  getTotalCapacity,
} from '../engine/capacity';
import { getTotalPowerDraw } from '../engine/servers';
import { getBonusPowerCapacity } from '../engine/upgrades';
import { useGameStore } from '../engine/store';
import { CapacityRow } from './CapacityRow';
import { CapacityMeter } from './CapacityMeter';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  onClose: () => void;
}

export function PowerScreen({ onClose }: Props) {
  const credits = useGameStore((state) => state.credits);
  const servers = useGameStore((state) => state.servers);
  const capacity = useGameStore((state) => state.capacity);
  const upgrades = useGameStore((state) => state.upgrades);

  const used = getTotalPowerDraw(servers);
  const total =
    getTotalCapacity(capacity, 'power') + getBonusPowerCapacity(upgrades);

  const buildings = CAPACITY_BUILDINGS.filter((b) => b.resource === 'power');

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="POWER"
        rightLabel={`${Math.floor(credits).toLocaleString()} cr`}
        onBack={onClose}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.meterWrap}>
          <CapacityMeter
            label="POWER USAGE"
            used={used}
            capacity={total}
            unit="W"
          />
        </View>
        {buildings.map((b) => (
          <CapacityRow key={b.id} building={b} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  meterWrap: { marginBottom: 14 },
});
