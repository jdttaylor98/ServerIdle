import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AgentType } from '../engine/agents';
import { useGameStore } from '../engine/store';

interface Props {
  agent: AgentType;
  autonomy: number;
}

export function AgentRow({ agent, autonomy }: Props) {
  const credits = useGameStore((state) => state.credits);
  const hired = useGameStore((state) => !!state.agents[agent.id]);
  const hireAgent = useGameStore((state) => state.hireAgent);
  const fireAgent = useGameStore((state) => state.fireAgent);
  const canAfford = credits >= agent.cost;

  return (
    <View style={[styles.row, hired && styles.rowHired]}>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>
            {agent.icon} {agent.name}
            {hired ? '  ✓' : ''}
          </Text>
        </View>
        <Text style={styles.description}>{agent.description}</Text>
        <Text style={styles.effect}>{agent.effectDescription(autonomy)}</Text>
        <Text style={styles.salary}>
          −{agent.salaryPerSec} cr/sec salary
        </Text>

        {hired && (
          <TouchableOpacity
            style={styles.fireButton}
            onPress={() => fireAgent(agent.id)}
            activeOpacity={0.6}
          >
            <Text style={styles.fireText}>
              Terminate · refund {formatCost(Math.floor(agent.cost * 0.5))}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!hired && (
        <TouchableOpacity
          style={[styles.hireButton, !canAfford && styles.hireButtonDisabled]}
          onPress={() => hireAgent(agent.id)}
          disabled={!canAfford}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.hireText, !canAfford && styles.hireTextDisabled]}
          >
            HIRE
          </Text>
          <Text
            style={[styles.cost, !canAfford && styles.costDisabled]}
          >
            {formatCost(agent.cost)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function formatCost(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  rowHired: {
    backgroundColor: '#1a0e24',
    borderColor: '#cc88ff',
  },
  info: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    color: '#888',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  effect: {
    color: '#cc88ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  salary: {
    color: '#ff7755',
    fontSize: 11,
    marginTop: 2,
  },
  fireButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  fireText: {
    color: '#ff7755',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  hireButton: {
    backgroundColor: '#cc88ff',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  hireButtonDisabled: {
    backgroundColor: '#222',
  },
  hireText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  hireTextDisabled: {
    color: '#555',
  },
  cost: {
    color: '#000',
    fontSize: 12,
    marginTop: 2,
  },
  costDisabled: {
    color: '#444',
  },
});
