import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useGameStore } from './engine/store';
import { useTicker } from './engine/ticker';
import { WelcomeBack } from './components/WelcomeBack';
import { ServerList } from './components/ServerList';
import { OverclockToggle } from './components/OverclockToggle';
import { FailureNotice } from './components/FailureNotice';
import { CapacitySection } from './components/CapacitySection';
import { UptimeIndicator } from './components/UptimeIndicator';

export default function App() {
  const credits = useGameStore((state) => state.credits);
  const getCreditsPerSec = useGameStore((state) => state.getCreditsPerSec);
  const servers = useGameStore((state) => state.servers);
  const overclockEnabled = useGameStore((state) => state.overclockEnabled);
  const tapProvision = useGameStore((state) => state.tapProvision);
  const loadGame = useGameStore((state) => state.loadGame);
  const collectOfflineEarnings = useGameStore((state) => state.collectOfflineEarnings);
  const pendingOfflineEarnings = useGameStore((state) => state.pendingOfflineEarnings);

  const [showWelcome, setShowWelcome] = useState(false);
  const hasLoaded = useRef(false);

  useTicker();

  // Cold open
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadGame();
  }, []);

  // Show welcome modal whenever pending offline earnings appear
  useEffect(() => {
    if (pendingOfflineEarnings >= 1) setShowWelcome(true);
  }, [pendingOfflineEarnings]);

  const cps = getCreditsPerSec();

  return (
    <SafeAreaView style={styles.safe}>
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

      <FailureNotice />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>SERVER IDLE</Text>

        <View style={styles.statsBox}>
          <Text style={styles.credits}>{Math.floor(credits).toLocaleString()}</Text>
          <Text style={styles.creditsLabel}>credits</Text>
          <Text style={[styles.perSec, overclockEnabled && styles.perSecBoosted]}>
            {cps.toFixed(1)} / sec {overclockEnabled ? '⚡' : ''}
          </Text>
          <UptimeIndicator />
        </View>

        <TouchableOpacity
          style={styles.clickButton}
          onPress={tapProvision}
          activeOpacity={0.7}
        >
          <Text style={styles.clickButtonText}>PROVISION</Text>
          <Text style={styles.clickButtonSub}>+1 credit · +2% uptime</Text>
        </TouchableOpacity>

        <OverclockToggle />
        <ServerList />
        <CapacitySection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    color: '#00ff88',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 24,
    marginTop: 8,
  },
  statsBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  credits: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  creditsLabel: {
    color: '#888',
    fontSize: 14,
    marginTop: -4,
  },
  perSec: {
    color: '#00ff88',
    fontSize: 14,
    marginTop: 6,
  },
  perSecBoosted: {
    color: '#ff3355',
  },
  clickButton: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 12,
    paddingHorizontal: 48,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 22,
  },
  clickButtonText: {
    color: '#00ff88',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  clickButtonSub: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
});
