import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SERVER_TIERS } from '../engine/servers';
import { useGameStore } from '../engine/store';

export function FailureNotice() {
  const failure = useGameStore((state) => state.lastFailure);
  const clear = useGameStore((state) => state.clearFailureNotice);

  if (!failure) return null;
  const tier = SERVER_TIERS.find((t) => t.id === failure.tierId);

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>HARDWARE FAILURE</Text>
          <Text style={styles.body}>
            Your overclocked {tier?.name ?? 'servers'} caught fire.
          </Text>
          <Text style={styles.lost}>−{failure.lost} {tier?.name ?? 'units'}</Text>
          <Text style={styles.note}>Overclock has been disabled.</Text>
          <TouchableOpacity style={styles.button} onPress={clear}>
            <Text style={styles.buttonText}>Acknowledge</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3355',
    width: 290,
  },
  title: {
    color: '#ff3355',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
  },
  body: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  lost: {
    color: '#ff7799',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  note: {
    color: '#888',
    fontSize: 12,
    marginBottom: 22,
  },
  button: {
    backgroundColor: '#ff3355',
    paddingHorizontal: 36,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
