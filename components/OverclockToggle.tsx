import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useGameStore } from '../engine/store';

export function OverclockToggle() {
  const enabled = useGameStore((state) => state.overclockEnabled);
  const toggle = useGameStore((state) => state.toggleOverclock);

  return (
    <TouchableOpacity
      style={[styles.button, enabled && styles.buttonActive]}
      onPress={toggle}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.dot, enabled && styles.dotActive]} />
        <Text style={[styles.label, enabled && styles.labelActive]}>
          OVERCLOCK
        </Text>
      </View>
      <Text style={[styles.sub, enabled && styles.subActive]}>
        {enabled ? '+50% output · risk of failure' : 'tap to boost'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a4a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
    marginBottom: 14,
  },
  buttonActive: {
    borderColor: '#ff3355',
    backgroundColor: '#2a0d18',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
    marginRight: 8,
  },
  dotActive: {
    backgroundColor: '#ff3355',
  },
  label: {
    color: '#888',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  labelActive: {
    color: '#ff3355',
  },
  sub: {
    color: '#555',
    fontSize: 11,
    marginTop: 3,
    marginLeft: 16,
  },
  subActive: {
    color: '#ff7799',
  },
});
