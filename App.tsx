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
import { OverclockToggle } from './components/OverclockToggle';
import { FailureNotice } from './components/FailureNotice';
import { IncidentBanner } from './components/IncidentBanner';
import { IncidentToast } from './components/IncidentToast';
import { UpgradesScreen } from './components/UpgradesScreen';
import { ServersScreen } from './components/ServersScreen';
import { PowerScreen } from './components/PowerScreen';
import { CoolingScreen } from './components/CoolingScreen';
import { StaffScreen } from './components/StaffScreen';
import { isStaffNavVisible } from './engine/staff';
import { MiniMeter } from './components/MiniMeter';
import { NavTile } from './components/NavTile';
import {
  getClickCreditBonus,
  getClickCreditMultiplier,
  getBonusPowerCapacity,
} from './engine/upgrades';
import {
  getTotalPowerDraw,
  getTotalHeatOutput,
} from './engine/servers';
import { getTotalCapacity } from './engine/capacity';

type Screen = 'main' | 'upgrades' | 'servers' | 'power' | 'cooling' | 'staff';

export default function App() {
  const credits = useGameStore((state) => state.credits);
  const getCreditsPerSec = useGameStore((state) => state.getCreditsPerSec);
  const overclockEnabled = useGameStore((state) => state.overclockEnabled);
  const upgrades = useGameStore((state) => state.upgrades);
  const servers = useGameStore((state) => state.servers);
  const capacity = useGameStore((state) => state.capacity);
  const tapProvision = useGameStore((state) => state.tapProvision);
  const addCredits = useGameStore((state) => state.addCredits);
  const vendorDiscountAvailable = useGameStore((state) => state.vendorDiscountAvailable);
  const staff = useGameStore((state) => state.staff);
  const getTotalSalaryFn = useGameStore((state) => state.getTotalSalary);
  const getGateState = useGameStore((state) => state.getGateState);
  const loadGame = useGameStore((state) => state.loadGame);
  const collectOfflineEarnings = useGameStore((state) => state.collectOfflineEarnings);
  const pendingOfflineEarnings = useGameStore((state) => state.pendingOfflineEarnings);

  const [showWelcome, setShowWelcome] = useState(false);
  const [screen, setScreen] = useState<Screen>('main');
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

  // Drill-down screens
  if (screen === 'upgrades') {
    return (
      <>
        <StatusBar style="light" />
        <UpgradesScreen onClose={() => setScreen('main')} />
      </>
    );
  }
  if (screen === 'servers') {
    return (
      <>
        <StatusBar style="light" />
        <ServersScreen onClose={() => setScreen('main')} />
      </>
    );
  }
  if (screen === 'power') {
    return (
      <>
        <StatusBar style="light" />
        <PowerScreen onClose={() => setScreen('main')} />
      </>
    );
  }
  if (screen === 'cooling') {
    return (
      <>
        <StatusBar style="light" />
        <CoolingScreen onClose={() => setScreen('main')} />
      </>
    );
  }
  if (screen === 'staff') {
    return (
      <>
        <StatusBar style="light" />
        <StaffScreen onClose={() => setScreen('main')} />
      </>
    );
  }

  // Main dashboard
  const cps = getCreditsPerSec();
  const salary = getTotalSalaryFn();
  const netCps = cps - salary;
  const totalStaff = Object.values(staff).reduce((a, b) => a + b, 0);
  const showStaffNav = isStaffNavVisible(getGateState());
  const tapCredits =
    (1 + getClickCreditBonus(upgrades)) * getClickCreditMultiplier(upgrades);

  const powerUsed = getTotalPowerDraw(servers);
  const powerCap =
    getTotalCapacity(capacity, 'power') + getBonusPowerCapacity(upgrades);
  const heatUsed = getTotalHeatOutput(servers);
  const coolingCap = getTotalCapacity(capacity, 'cooling');

  const totalServers = Object.values(servers).reduce((a, b) => a + b, 0);

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
      <IncidentToast />

      <View style={styles.topBar}>
        <Text style={styles.title}>SERVER IDLE</Text>
        <TouchableOpacity
          onPress={() => setScreen('upgrades')}
          style={styles.upgradesButton}
        >
          <Text style={styles.upgradesText}>UPGRADES →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <IncidentBanner />

        {/* Stats card */}
        <View style={styles.statsCard}>
          <Text style={styles.credits}>
            {Math.floor(credits).toLocaleString()}
          </Text>
          <Text style={styles.creditsLabel}>credits</Text>
          <Text style={[styles.perSec, overclockEnabled && styles.perSecBoosted]}>
            {cps.toFixed(1)} / sec {overclockEnabled ? '⚡' : ''}
          </Text>
          {salary > 0 && (
            <View style={styles.netRow}>
              <Text style={styles.salaryLine}>− {salary.toFixed(1)} payroll</Text>
              <Text
                style={[
                  styles.netLine,
                  netCps < 0 && styles.netLineNegative,
                ]}
              >
                = {netCps.toFixed(1)} net
              </Text>
            </View>
          )}
          {vendorDiscountAvailable && (
            <Text style={styles.discountBadge}>💰 50% OFF NEXT SERVER</Text>
          )}

          <View style={styles.divider} />

          <MiniMeter
            icon="⚡"
            label="POWER"
            used={powerUsed}
            capacity={powerCap}
            unit="W"
          />
          <MiniMeter
            icon="❄"
            label="COOLING"
            used={heatUsed}
            capacity={coolingCap}
            unit="BTU"
          />
        </View>

        {/* Action buttons */}
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

        {/* DEV — remove before ship */}
        <TouchableOpacity
          style={styles.devButton}
          onPress={() => addCredits(10000)}
          activeOpacity={0.7}
        >
          <Text style={styles.devButtonText}>+10K (DEV)</Text>
        </TouchableOpacity>

        {/* Drill-down nav */}
        <View style={styles.navSection}>
          <Text style={styles.navHeading}>BUILD</Text>
          <NavTile
            icon="🖥️"
            label="SERVERS"
            hint={`${totalServers} owned`}
            onPress={() => setScreen('servers')}
          />
          <NavTile
            icon="⚡"
            label="POWER"
            hint={`${Math.floor(powerUsed)} / ${Math.floor(powerCap)} W`}
            onPress={() => setScreen('power')}
          />
          <NavTile
            icon="❄"
            label="COOLING"
            hint={`${Math.floor(heatUsed)} / ${Math.floor(coolingCap)} BTU`}
            onPress={() => setScreen('cooling')}
          />
          {showStaffNav && (
            <NavTile
              icon="👥"
              label="STAFF"
              hint={
                totalStaff > 0
                  ? `${totalStaff} hired · ${salary.toFixed(1)} cr/sec payroll`
                  : 'Hire your team'
              }
              onPress={() => setScreen('staff')}
            />
          )}
        </View>
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
  upgradesButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    borderRadius: 6,
  },
  upgradesText: {
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
  },
  statsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    alignItems: 'stretch',
  },
  credits: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  creditsLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: -4,
    textAlign: 'center',
  },
  perSec: {
    color: '#00ff88',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  perSecBoosted: {
    color: '#ff3355',
  },
  netRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  salaryLine: {
    color: '#ff7755',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  netLine: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  netLineNegative: {
    color: '#ff3355',
  },
  discountBadge: {
    color: '#ddee77',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 6,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a4a',
    marginVertical: 14,
  },
  clickButton: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 12,
    paddingHorizontal: 48,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
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
  navSection: {
    marginTop: 14,
  },
  navHeading: {
    color: '#666',
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  // DEV — remove before ship
  devButton: {
    backgroundColor: '#332200',
    borderColor: '#aa6600',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 14,
  },
  devButtonText: {
    color: '#ffaa44',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
