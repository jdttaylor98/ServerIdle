import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../engine/store';

export function UptimeIndicator() {
  const uptime = useGameStore((state) => state.uptime);
  const display = Math.max(50, uptime); // floored multiplier
  const color =
    display >= 90 ? '#00ff88' : display >= 70 ? '#ffcc55' : '#ff7755';

  return (
    <View style={styles.row}>
      <Text style={styles.label}>UPTIME</Text>
      <Text style={[styles.value, { color }]}>{display.toFixed(1)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  label: {
    color: '#666',
    fontSize: 11,
    letterSpacing: 2,
    marginRight: 6,
  },
  value: {
    fontSize: 13,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});
