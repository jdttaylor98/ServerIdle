import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Text } from 'react-native';
import { getVisibleStaffRoles } from '../engine/staff';
import { useGameStore } from '../engine/store';
import { StaffRow } from './StaffRow';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  onClose: () => void;
}

export function StaffScreen({ onClose }: Props) {
  const credits = useGameStore((state) => state.credits);
  const totalSalary = useGameStore((state) => state.getTotalSalary());
  const getGateState = useGameStore((state) => state.getGateState);
  const visibleRoles = getVisibleStaffRoles(getGateState());

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="STAFF"
        rightLabel={`${Math.floor(credits).toLocaleString()} cr`}
        onBack={onClose}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {totalSalary > 0 && (
          <View style={styles.salaryCard}>
            <Text style={styles.salaryLabel}>TOTAL PAYROLL</Text>
            <Text style={styles.salaryValue}>−{totalSalary.toFixed(1)} cr/sec</Text>
          </View>
        )}
        {visibleRoles.map((role) => (
          <StaffRow key={role.id} role={role} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  salaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaryLabel: {
    color: '#888',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  salaryValue: {
    color: '#ff7755',
    fontSize: 14,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});
