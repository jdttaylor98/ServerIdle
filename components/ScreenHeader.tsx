import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  title: string;
  rightLabel?: string;
  onBack: () => void;
}

export function ScreenHeader({ title, rightLabel, onBack }: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.right}>{rightLabel ?? ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backText: {
    color: '#00ff88',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  right: {
    color: '#fff',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    minWidth: 60,
    textAlign: 'right',
  },
});
