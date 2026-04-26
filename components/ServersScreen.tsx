import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { SERVER_TIERS } from '../engine/servers';
import { useGameStore } from '../engine/store';
import { ServerRow } from './ServerRow';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  onClose: () => void;
}

export function ServersScreen({ onClose }: Props) {
  const credits = useGameStore((state) => state.credits);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="SERVERS"
        rightLabel={`${Math.floor(credits).toLocaleString()} cr`}
        onBack={onClose}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {SERVER_TIERS.map((tier) => (
          <ServerRow key={tier.id} tier={tier} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
});
