import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SERVER_TIERS, isServerTierVisible } from '../engine/servers';
import { CLUSTER_TYPES, isClusterUnlocked } from '../engine/clusters';
import { useGameStore } from '../engine/store';
import { ServerRow } from './ServerRow';
import { ClusterRow } from './ClusterRow';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  onClose: () => void;
}

export function ServersScreen({ onClose }: Props) {
  const credits = useGameStore((state) => state.credits);
  const upgrades = useGameStore((state) => state.upgrades);
  const servers = useGameStore((state) => state.servers);

  const visibleTiers = SERVER_TIERS.filter((t) =>
    isServerTierVisible(t.id, servers)
  );

  // Always show the cluster section once any cluster type is unlocked
  const anyClusterUnlocked = CLUSTER_TYPES.some((c) =>
    isClusterUnlocked(c, upgrades)
  );

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
        {visibleTiers.map((tier) => (
          <ServerRow key={tier.id} tier={tier} />
        ))}

        {anyClusterUnlocked && (
          <View style={styles.clusterSection}>
            <Text style={styles.heading}>CLUSTERS</Text>
            <Text style={styles.subheading}>
              Combine servers for a 1.5× output multiplier
            </Text>
            {CLUSTER_TYPES.map((type) => (
              <ClusterRow key={type.id} type={type} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  clusterSection: {
    marginTop: 18,
  },
  heading: {
    color: '#7af',
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subheading: {
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 12,
  },
});
