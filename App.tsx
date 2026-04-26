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
import { UpgradesScreen } from './components/UpgradesScreen';
import {
  getClickCreditBonus,
  getClickCreditMultiplier,
} from './engine/upgrades';

type Screen = 'main' | 'upgrades';

export default function App() {
  const credits = useGameStore((state) => state.credits);
  const getCreditsPerSec = useGameStore((state) => state.getCreditsPerSec);
  const overclockEnabled = useGameStore((state) => state.overclockEnabled);
  const upgrades = useGameStore((state) => state.upgrades);
  const tapProvision = useGameStore((state) => state.tapProvision);
  const loadGame = useGameStore((state) => state.loadGame);
  const collectOfflineEarnings = useGameStore((state) => state.collectOfflineEarnings);
  const pendingOfflineEarnings = useGameStore((state) => state.pendingOfflineEarnings);

  const [showWelcome, setShowWelcome] = useState(false);
  const [view, setView] = useState<Screen>('main');
  const hasLoaded = useRef(false);

  useTicker();

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadGame();
  }, []);

  useEffect(() => {
    if (pendingOfflineEarnings >= 1) setShowWelcome(true);
  }, [pendingOfflineEarnings]);

  const cps = getCreditsPerSec();
  const tapCredits =
    (1 + getClickCreditBonus(upgrades)) * getClickCreditMultiplier(upgrades);

  if (view === 'upgrades') {
    return (
      <>
        <StatusBar style="light" />
        <UpgradesScreen onClose={() => setView('main')} />
      </>
    );
  }

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

      <View style={styles.topBar}>
        <Text style={styles.title}>SERVER IDLE</Text>
        <TouchableOpacity
          onPress={() => setView('upgrades')}
          style={styles.navButton}
        >
          <Text style={styles.navText}>UPGRADES →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsBox}>
          <Text style={styles.credits}>{Math.floor(credits).toLocaleString()}</Text>
          <Text style={styles.creditsLabel}>credits</Text>
          <Text style={[styles.perSec, overclockEnabled && styles.perSecBoosted]}>
            {cps.toFixed(1)} / sec {overclockEnabled ? '⚡' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.clickButton}
          onPress={tapProvision}
          activeOpacity={0.7}
        >
          <Text style={styles.clickButtonText}>PROVISION</Text>
          <Text style={styles.clickButtonSub}>
            +{tapCredits % 1 === 0 ? tapCredits : tapCredits.toFixed(1)} credit
            {tapCredits === 1 ? '' : 's'}
          </Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  title: {
    color: '#00ff88',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  navButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    borderRadius: 6,
  },
  navText: {
    color: '#00ff88',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  statsBox: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  credits: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: 'bold',
  },
  creditsLabel: {
    color: '#888',
    fontSize: 13,
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
    marginBottom: 18,
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
