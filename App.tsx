import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useGameStore } from './engine/store';
import { useTicker } from './engine/ticker';
import { WelcomeBack } from './components/WelcomeBack';

export default function App() {
  const credits = useGameStore((state) => state.credits);
  const creditsPerSec = useGameStore((state) => state.creditsPerSec);
  const addCredits = useGameStore((state) => state.addCredits);
  const loadGame = useGameStore((state) => state.loadGame);
  const collectOfflineEarnings = useGameStore((state) => state.collectOfflineEarnings);
  const pendingOfflineEarnings = useGameStore((state) => state.pendingOfflineEarnings);

  const [showWelcome, setShowWelcome] = useState(false);
  const hasLoaded = useRef(false);

  // Start the tick engine + AppState listeners
  useTicker();

  // Cold open: load save once on mount
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadGame();
  }, []);

  // Show modal whenever pending offline earnings arrive (cold open or foreground return)
  useEffect(() => {
    if (pendingOfflineEarnings >= 1) {
      setShowWelcome(true);
    }
  }, [pendingOfflineEarnings]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {showWelcome && (
        <WelcomeBack
          earnings={pendingOfflineEarnings}
          onDismiss={() => {
            collectOfflineEarnings();
            setShowWelcome(false);
          }}
        />
      )}

      <Text style={styles.title}>SERVER IDLE</Text>

      <View style={styles.statsBox}>
        <Text style={styles.credits}>{Math.floor(credits)}</Text>
        <Text style={styles.creditsLabel}>credits</Text>
        <Text style={styles.perSec}>{creditsPerSec.toFixed(2)} / sec</Text>
      </View>

      <TouchableOpacity
        style={styles.clickButton}
        onPress={() => addCredits(1)}
        activeOpacity={0.7}
      >
        <Text style={styles.clickButtonText}>PROVISION</Text>
        <Text style={styles.clickButtonSub}>+1 credit</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>Close the app and come back to see offline earnings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#00ff88',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 40,
  },
  statsBox: {
    alignItems: 'center',
    marginBottom: 48,
  },
  credits: {
    color: '#ffffff',
    fontSize: 56,
    fontWeight: 'bold',
  },
  creditsLabel: {
    color: '#888',
    fontSize: 16,
    marginTop: -4,
  },
  perSec: {
    color: '#00ff88',
    fontSize: 14,
    marginTop: 8,
  },
  clickButton: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 12,
    paddingHorizontal: 48,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  clickButtonText: {
    color: '#00ff88',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  clickButtonSub: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    color: '#444',
    fontSize: 12,
    textAlign: 'center',
    position: 'absolute',
    bottom: 48,
  },
});
