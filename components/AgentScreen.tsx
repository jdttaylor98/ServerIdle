import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { AGENT_TYPES, getTotalAgentSalary } from '../engine/agents';
import { useGameStore } from '../engine/store';
import { AgentRow } from './AgentRow';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  onClose: () => void;
}

export function AgentScreen({ onClose }: Props) {
  const credits = useGameStore((state) => state.credits);
  const agents = useGameStore((state) => state.agents);
  const autonomy = useGameStore((state) => state.agentAutonomy);
  const setAutonomy = useGameStore((state) => state.setAgentAutonomy);
  const totalSalary = getTotalAgentSalary(agents);
  const hiredCount = Object.values(agents).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="AI AGENTS"
        rightLabel={`${Math.floor(credits).toLocaleString()} cr`}
        onBack={onClose}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subheading}>
          Your AI does the clicking for you. The future is now.
        </Text>

        {/* Autonomy slider */}
        <View style={styles.autonomyCard}>
          <Text style={styles.autonomyLabel}>AUTONOMY LEVEL</Text>
          <View style={styles.sliderRow}>
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => setAutonomy(Math.max(1, autonomy - 1))}
              activeOpacity={0.6}
            >
              <Text style={styles.sliderButtonText}>−</Text>
            </TouchableOpacity>

            <View style={styles.sliderTrack}>
              {Array.from({ length: 10 }, (_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.sliderNotch,
                    i < autonomy && styles.sliderNotchActive,
                  ]}
                  onPress={() => setAutonomy(i + 1)}
                  activeOpacity={0.7}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => setAutonomy(Math.min(10, autonomy + 1))}
              activeOpacity={0.6}
            >
              <Text style={styles.sliderButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.autonomyValue}>{autonomy} / 10</Text>
          <Text style={styles.autonomyHint}>
            {autonomy <= 3
              ? 'Conservative — safe but slow'
              : autonomy <= 6
                ? 'Balanced — moderate risk & reward'
                : 'Aggressive — fast but risky'}
          </Text>
        </View>

        {/* Summary */}
        {hiredCount > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>AGENTS ACTIVE</Text>
              <Text style={styles.summaryValue}>{hiredCount} / 3</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>AGENT SALARY</Text>
              <Text style={styles.summaryBad}>
                −{totalSalary.toLocaleString()} cr/sec
              </Text>
            </View>
          </View>
        )}

        {AGENT_TYPES.map((agent) => (
          <AgentRow key={agent.id} agent={agent} autonomy={autonomy} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
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
  autonomyCard: {
    backgroundColor: '#1a1a2e',
    borderColor: '#cc88ff',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  autonomyLabel: {
    color: '#888',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonText: {
    color: '#cc88ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sliderTrack: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  sliderNotch: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#2a2a4a',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  sliderNotchActive: {
    backgroundColor: '#cc88ff',
    borderColor: '#cc88ff',
  },
  autonomyValue: {
    color: '#cc88ff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  autonomyHint: {
    color: '#666',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderColor: '#2a2a4a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  summaryLabel: {
    color: '#888',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  summaryBad: {
    color: '#ff7755',
    fontSize: 13,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});
