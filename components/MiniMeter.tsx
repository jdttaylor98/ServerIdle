import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  icon: string;
  label: string;
  used: number;
  capacity: number;
  unit: string;
}

export function MiniMeter({ icon, label, used, capacity, unit }: Props) {
  const ratio = capacity > 0 ? Math.min(used / capacity, 1.5) : 0;
  const overloaded = used > capacity;
  const fillWidth = `${Math.min(ratio * 100, 100)}%` as const;

  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.body}>
        <View style={styles.labelRow}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 14,
    marginRight: 8,
    width: 18,
  },
  body: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    color: '#888',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  value: {
    color: '#aaa',
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  valueOver: {
    color: '#ff3355',
    fontWeight: 'bold',
  },
  track: {
    height: 4,
    backgroundColor: '#0a0a14',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 2,
  },
  fillOver: {
    backgroundColor: '#ff3355',
  },
});
