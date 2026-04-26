import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface Props {
  icon: string;
  label: string;
  hint?: string;
  onPress: () => void;
}

export function NavTile({ icon, label, hint, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  icon: {
    fontSize: 22,
    marginRight: 14,
  },
  body: {
    flex: 1,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hint: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    color: '#444',
    fontSize: 24,
    marginLeft: 8,
  },
});
