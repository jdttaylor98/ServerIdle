import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  ResearchNode,
  RESEARCH_NODES,
  isResearchAvailable,
} from '../engine/research';
import { useGameStore } from '../engine/store';

interface Props {
  node: ResearchNode;
}

export function ResearchCard({ node }: Props) {
  const researchPoints = useGameStore((state) => state.researchPoints);
  const research = useGameStore((state) => state.research);
  const buyResearch = useGameStore((state) => state.buyResearch);

  const owned = !!research[node.id];
  const available = isResearchAvailable(node, research);
  const canAfford = researchPoints >= node.cost;

  const missingPrereqs = node.prereqs
    .filter((id) => !research[id])
    .map((id) => RESEARCH_NODES.find((n) => n.id === id)?.name ?? id);

  let state: 'owned' | 'locked' | 'unaffordable' | 'buyable';
  if (owned) state = 'owned';
  else if (!available) state = 'locked';
  else if (!canAfford) state = 'unaffordable';
  else state = 'buyable';

  const onPress = () => {
    if (state === 'buyable') buyResearch(node.id);
  };

  return (
    <TouchableOpacity
      style={[styles.card, stateStyles[state].card]}
      onPress={onPress}
      disabled={state !== 'buyable'}
      activeOpacity={0.7}
    >
      <View style={styles.headerRow}>
        <View style={styles.nameRow}>
          {state === 'locked' && <Text style={styles.lockIcon}>🔒</Text>}
          <Text style={[styles.name, stateStyles[state].name]}>
            {node.name}
          </Text>
        </View>
        {state === 'owned' ? (
          <Text style={styles.checkmark}>✓</Text>
        ) : (
          <Text style={[styles.cost, stateStyles[state].cost]}>
            {node.cost} RP
          </Text>
        )}
      </View>

      <Text style={[styles.description, stateStyles[state].description]}>
        {node.description}
      </Text>

      {state === 'locked' && missingPrereqs.length > 0 && (
        <Text style={styles.requirement}>
          REQUIRES: {missingPrereqs.join(', ').toUpperCase()}
        </Text>
      )}
      {state === 'unaffordable' && (
        <Text style={styles.unaffordableHint}>
          Need {(node.cost - researchPoints).toFixed(1)} more RP
        </Text>
      )}
    </TouchableOpacity>
  );
}

const stateStyles = {
  owned: {
    card: { backgroundColor: '#180e2a', borderColor: '#cc88ff' },
    name: { color: '#cc88ff' },
    description: { color: '#9966cc' },
    cost: { color: '#cc88ff' },
  },
  locked: {
    card: {
      backgroundColor: '#15151f',
      borderColor: '#1a1a2e',
      borderStyle: 'dashed' as const,
    },
    name: { color: '#555' },
    description: { color: '#3a3a4a' },
    cost: { color: '#3a3a4a' },
  },
  unaffordable: {
    card: { backgroundColor: '#1a1a2e', borderColor: '#2a2a4a' },
    name: { color: '#999' },
    description: { color: '#666' },
    cost: { color: '#666' },
  },
  buyable: {
    card: { backgroundColor: '#1a1a2e', borderColor: '#cc88ff' },
    name: { color: '#fff' },
    description: { color: '#aaa' },
    cost: { color: '#cc88ff' },
  },
} as const;

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lockIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  checkmark: {
    color: '#cc88ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cost: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 12,
    marginBottom: 4,
  },
  requirement: {
    color: '#ffaa44',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 4,
  },
  unaffordableHint: {
    color: '#666',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
