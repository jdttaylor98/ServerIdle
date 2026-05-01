import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useGameStore } from '../engine/store';
import {
  calcSkillPointsEarned,
  canPrestige,
  PRESTIGE_MIN_CREDITS,
} from '../engine/prestige';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  onClose: () => void;
}

export function PrestigeScreen({ onClose }: Props) {
  const credits = useGameStore((state) => state.credits);
  const highestCredits = useGameStore((state) => state.highestCredits);
  const skillPoints = useGameStore((state) => state.skillPoints);
  const prestigeCount = useGameStore((state) => state.prestigeCount);
  const prestige = useGameStore((state) => state.prestige);

  const spEarned = calcSkillPointsEarned(highestCredits);
  const canDo = canPrestige(highestCredits);
  const nextSp = calcSkillPointsEarned(highestCredits) + 1;
  const nextThreshold = Math.pow(10, nextSp + 6);

  const confirmPrestige = () => {
    Alert.alert(
      'Acqui-hire?',
      `BigCorp will acquire your infrastructure.\n\nYou earn ${spEarned} Skill Point${spEarned !== 1 ? 's' : ''}.\n\nAll credits, servers, upgrades, research, staff, agents, and regions reset. Skill Points and prestige count are permanent.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Sell for ${spEarned} SP`,
          style: 'destructive',
          onPress: () => {
            prestige();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="ACQUI-HIRE"
        rightLabel={`${skillPoints} SP`}
        onBack={onClose}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subheading}>
          BigCorp wants to buy you out. Reset everything. Keep your Skill Points.
        </Text>

        {/* Meta stats */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>PRESTIGE COUNT</Text>
            <Text style={styles.metaValue}>{prestigeCount}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>TOTAL SKILL POINTS</Text>
            <Text style={styles.metaValueGold}>{skillPoints} SP</Text>
          </View>
        </View>

        {/* Current run stats */}
        <View style={styles.runCard}>
          <Text style={styles.runTitle}>THIS RUN</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>CURRENT CREDITS</Text>
            <Text style={styles.metaValue}>
              {Math.floor(credits).toLocaleString()}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>PEAK CREDITS</Text>
            <Text style={styles.metaValue}>
              {Math.floor(highestCredits).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.metaRow, styles.metaRowHighlight]}>
            <Text style={styles.metaLabel}>SP FROM THIS RUN</Text>
            <Text style={styles.metaValueGold}>
              {spEarned > 0 ? `+${spEarned}` : '0'}
            </Text>
          </View>
        </View>

        {/* Threshold info */}
        <View style={styles.thresholdCard}>
          <Text style={styles.thresholdTitle}>SP THRESHOLDS</Text>
          {[7, 8, 9, 10, 11, 12].map((exp) => {
            const sp = exp - 6;
            const threshold = Math.pow(10, exp);
            const reached = highestCredits >= threshold;
            return (
              <View key={exp} style={styles.thresholdRow}>
                <Text
                  style={[
                    styles.thresholdText,
                    reached && styles.thresholdReached,
                  ]}
                >
                  {reached ? '✓' : '○'} {formatBigNumber(threshold)} credits
                </Text>
                <Text
                  style={[
                    styles.thresholdSp,
                    reached && styles.thresholdReached,
                  ]}
                >
                  {sp} SP
                </Text>
              </View>
            );
          })}
        </View>

        {!canDo && (
          <Text style={styles.lockedText}>
            Reach {formatBigNumber(PRESTIGE_MIN_CREDITS)} peak credits to
            prestige.
            {highestCredits > 0
              ? ` (${((highestCredits / PRESTIGE_MIN_CREDITS) * 100).toFixed(1)}% there)`
              : ''}
          </Text>
        )}

        {/* Prestige button */}
        <TouchableOpacity
          style={[styles.prestigeButton, !canDo && styles.prestigeButtonDisabled]}
          onPress={confirmPrestige}
          disabled={!canDo}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.prestigeText,
              !canDo && styles.prestigeTextDisabled,
            ]}
          >
            SELL TO BIGCORP
          </Text>
          <Text
            style={[
              styles.prestigeSub,
              !canDo && styles.prestigeTextDisabled,
            ]}
          >
            {canDo
              ? `Earn ${spEarned} Skill Point${spEarned !== 1 ? 's' : ''}`
              : 'Not enough credits yet'}
          </Text>
        </TouchableOpacity>

        {canDo && spEarned < 6 && (
          <Text style={styles.hintText}>
            Next SP at {formatBigNumber(nextThreshold)} peak credits
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatBigNumber(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(0)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(0)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  subheading: {
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  metaCard: {
    backgroundColor: '#1a1a2e',
    borderColor: '#ffaa44',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metaRowHighlight: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
    marginTop: 4,
    paddingTop: 8,
  },
  metaLabel: {
    color: '#888',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  metaValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  metaValueGold: {
    color: '#ffaa44',
    fontSize: 16,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  runCard: {
    backgroundColor: '#1a1a2e',
    borderColor: '#2a2a4a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  runTitle: {
    color: '#666',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  thresholdCard: {
    backgroundColor: '#1a1a2e',
    borderColor: '#2a2a4a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  thresholdTitle: {
    color: '#666',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  thresholdText: {
    color: '#555',
    fontSize: 12,
  },
  thresholdSp: {
    color: '#555',
    fontSize: 12,
    fontWeight: 'bold',
  },
  thresholdReached: {
    color: '#ffaa44',
  },
  lockedText: {
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  prestigeButton: {
    backgroundColor: '#ffaa44',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  prestigeButtonDisabled: {
    backgroundColor: '#222',
  },
  prestigeText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  prestigeTextDisabled: {
    color: '#555',
  },
  prestigeSub: {
    color: '#000',
    fontSize: 12,
    marginTop: 2,
  },
  hintText: {
    color: '#666',
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
