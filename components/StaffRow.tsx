import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StaffRole, getHireCost } from '../engine/staff';
import { useGameStore } from '../engine/store';

interface Props {
  role: StaffRole;
}

export function StaffRow({ role }: Props) {
  const credits = useGameStore((state) => state.credits);
  const owned = useGameStore((state) => state.staff[role.id] ?? 0);
  const hireStaff = useGameStore((state) => state.hireStaff);
  const fireStaff = useGameStore((state) => state.fireStaff);
  const getGateState = useGameStore((state) => state.getGateState);

  const gates = getGateState();
  const unlocked = role.isUnlocked(gates);
  const cost = getHireCost(role, owned);
  const refund = owned > 0 ? Math.floor(getHireCost(role, owned - 1) * 0.5) : 0;
  const canAfford = credits >= cost;
  const canHire = unlocked && canAfford;

  return (
    <View style={[styles.row, !unlocked && styles.rowLocked]}>
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>
            {!unlocked && '🔒 '}
            {role.icon} {role.name}
          </Text>
          <Text style={styles.owned}>×{owned}</Text>
        </View>
        <Text style={styles.description}>{role.description}</Text>

        <Text style={styles.effect}>{role.effectHint}</Text>

        <Text style={styles.cost}>
          Salary: {role.salary} cr/sec each
          {owned > 0 ? ` · Total ${(role.salary * owned).toFixed(1)} cr/sec` : ''}
        </Text>

        {!unlocked && (
          <Text style={styles.lockHint}>REQUIRES: {role.unlockHint.toUpperCase()}</Text>
        )}

        {owned > 0 && (
          <TouchableOpacity
            style={styles.fireButton}
            onPress={() => fireStaff(role.id)}
            activeOpacity={0.6}
          >
            <Text style={styles.fireText}>
              Fire 1 · refund {formatCost(refund)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.hireButton, !canHire && styles.hireButtonDisabled]}
        onPress={() => hireStaff(role.id)}
        disabled={!canHire}
        activeOpacity={0.7}
      >
        <Text style={[styles.hireText, !canHire && styles.hireTextDisabled]}>
          HIRE
        </Text>
        <Text style={[styles.hireCost, !canHire && styles.hireCostDisabled]}>
          {formatCost(cost)}
        </Text>
      </TouchableOpacity>
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
    borderColor: '#cc88ff',
  },
  rowLocked: {
    borderColor: '#1a1a2e',
    borderStyle: 'dashed',
    opacity: 0.55,
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  owned: {
    color: '#cc88ff',
    fontSize: 13,
    marginLeft: 8,
  },
  description: {
    color: '#888',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  effect: {
    color: '#cc88ff',
    fontSize: 11,
    marginTop: 2,
  },
  cost: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  lockHint: {
    color: '#ffaa44',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 4,
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
    color: '#001',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  hireTextDisabled: {
    color: '#555',
  },
  hireCost: {
    color: '#001',
    fontSize: 12,
    marginTop: 2,
  },
  hireCostDisabled: {
    color: '#444',
  },
});
