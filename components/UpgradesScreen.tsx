import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {
  getUpgradesByEra,
  getUpgradeDepth,
  UpgradeEra,
} from '../engine/upgrades';
import { useGameStore } from '../engine/store';
import { UpgradeCard } from './UpgradeCard';

const ERAS: { era: UpgradeEra; label: string }[] = [
  { era: 'homelab', label: 'HOMELAB' },
  { era: 'rack', label: 'RACK' },
];

interface Props {
  onClose: () => void;
}

export function UpgradesScreen({ onClose }: Props) {
  const credits = useGameStore((state) => state.credits);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>UPGRADES</Text>
        <Text style={styles.credits}>
          {Math.floor(credits).toLocaleString()} cr
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {ERAS.map(({ era, label }) => {
          const upgrades = getUpgradesByEra(era);
          // Sort by (depth, cost) so roots appear first
          const sorted = [...upgrades].sort((a, b) => {
            const depthDiff = getUpgradeDepth(a.id) - getUpgradeDepth(b.id);
            if (depthDiff !== 0) return depthDiff;
            return a.cost - b.cost;
          });

          return (
            <View key={era} style={styles.eraSection}>
              <Text style={styles.eraLabel}>{label}</Text>
              {sorted.map((upgrade) => {
                const depth = getUpgradeDepth(upgrade.id);
                return (
                  <View
                    key={upgrade.id}
                    style={[
                      styles.row,
                      { marginLeft: depth * 18 },
                    ]}
                  >
                    {depth > 0 && <View style={styles.connector} />}
                    <View style={styles.cardWrap}>
                      <UpgradeCard upgrade={upgrade} />
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
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
  credits: {
    color: '#fff',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  eraSection: {
    marginBottom: 22,
  },
  eraLabel: {
    color: '#666',
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  connector: {
    width: 12,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2a2a4a',
    marginRight: 6,
    marginTop: 12,
    marginBottom: 24,
    borderBottomLeftRadius: 6,
  },
  cardWrap: {
    flex: 1,
  },
});
