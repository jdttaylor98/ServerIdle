import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SERVER_TIERS } from '../engine/servers';
import { ServerRow } from './ServerRow';

export function ServerList() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>INFRASTRUCTURE</Text>
      {SERVER_TIERS.map((tier) => (
        <ServerRow key={tier.id} tier={tier} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  heading: {
    color: '#666',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 10,
  },
});
