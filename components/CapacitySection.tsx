import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  CAPACITY_BUILDINGS,
  getTotalCapacity,
  getEfficiency,
} from '../engine/capacity';
import {
  getTotalPowerDraw,
  getTotalHeatOutput,
} from '../engine/servers';
import { useGameStore } from '../engine/store';
import { CapacityMeter } from './CapacityMeter';
import { CapacityRow } from './CapacityRow';

export function CapacitySection() {
  const servers = useGameStore((state) => state.servers);
  const capacity = useGameStore((state) => state.capacity);

  const powerUsed = getTotalPowerDraw(servers);
  const powerCap = getTotalCapacity(capacity, 'power');
  const coolingUsed = getTotalHeatOutput(servers);
  const coolingCap = getTotalCapacity(capacity, 'cooling');

  const powerBuildings = CAPACITY_BUILDINGS.filter((b) => b.resource === 'power');
  const coolingBuildings = CAPACITY_BUILDINGS.filter((b) => b.resource === 'cooling');

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>CAPACITY</Text>

      <CapacityMeter label="POWER" used={powerUsed} capacity={powerCap} unit="W" />
      <CapacityMeter
        label="COOLING"
        used={coolingUsed}
        capacity={coolingCap}
        unit="BTU"
      />

      <Text style={styles.subheading}>POWER</Text>
      {powerBuildings.map((b) => (
        <CapacityRow key={b.id} building={b} />
      ))}

      <Text style={styles.subheading}>COOLING</Text>
      {coolingBuildings.map((b) => (
        <CapacityRow key={b.id} building={b} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 18,
  },
  heading: {
    color: '#666',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 10,
  },
  subheading: {
    color: '#444',
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 14,
    marginBottom: 6,
  },
});
