import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  used: number;
  capacity: number;
  unit: string;
}

export function CapacityMeter({ label, used, capacity, unit }: Props) {
  const ratio = capacity > 0 ? Math.min(used / capacity, 1.5) : 0;
  const overloaded = used > capacity;
  const fillWidth = `${Math.min(ratio * 100, 100)}%` as const;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, overloaded && styles.valueOver]}>
          {Math.floor(used)} / {Math.floor(capacity)} {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: fillWidth },
            overloaded && styles.fillOver,
          ]}
        />
      </View>
      {overloaded && (
        <Text style={styles.warning}>
          OVERLOADED — output capped at {Math.floor((capacity / used) * 100)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#888',
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  value: {
    color: '#ccc',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  valueOver: {
    color: '#ff3355',
    fontWeight: 'bold',
  },
  track: {
    height: 6,
    backgroundColor: '#1a1a2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 3,
  },
  fillOver: {
    backgroundColor: '#ff3355',
  },
  warning: {
    color: '#ff3355',
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 1,
  },
});
