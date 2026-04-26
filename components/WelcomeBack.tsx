import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  earnings: number;
  onDismiss: () => void;
}

export function WelcomeBack({ earnings, onDismiss }: Props) {
  if (earnings < 1) return null;

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Your servers kept running.</Text>
          <Text style={styles.earnings}>+{Math.floor(earnings)} credits</Text>
          <Text style={styles.note}>earned while you were away</Text>
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Collect</Text>
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
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ff88',
    width: 280,
  },
  title: {
    color: '#00ff88',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  earnings: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  note: {
    color: '#888',
    fontSize: 12,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
