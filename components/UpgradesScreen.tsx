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
  Upgrade,
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

interface TreeNode {
  upgrade: Upgrade;
  children: TreeNode[];
}

function buildTree(upgrades: Upgrade[]): TreeNode[] {
  const byId = new Map(upgrades.map((u) => [u.id, u]));
  const childrenOf = new Map<string, Upgrade[]>();

  // Group children by their first prereq (each upgrade renders under its first parent)
  for (const u of upgrades) {
    if (u.prereqs.length === 0) continue;
    const parentId = u.prereqs[0];
    if (!byId.has(parentId)) continue;
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId)!.push(u);
  }

  function makeNode(u: Upgrade): TreeNode {
    const kids = (childrenOf.get(u.id) ?? []).sort((a, b) => a.cost - b.cost);
    return {
      upgrade: u,
      children: kids.map(makeNode),
    };
  }

  // Roots = upgrades with no prereqs (sorted by cost)
  return upgrades
    .filter((u) => u.prereqs.length === 0)
    .sort((a, b) => a.cost - b.cost)
    .map(makeNode);
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
          const tree = buildTree(getUpgradesByEra(era));
          return (
            <View key={era} style={styles.eraSection}>
              <Text style={styles.eraLabel}>{label}</Text>
              {tree.map((node) => (
                <TreeNodeRow key={node.upgrade.id} node={node} depth={0} />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function TreeNodeRow({ node, depth }: { node: TreeNode; depth: number }) {
  return (
    <View>
      <View style={[styles.row, { marginLeft: depth * 18 }]}>
        {depth > 0 && <View style={styles.connector} />}
        <View style={styles.cardWrap}>
          <UpgradeCard upgrade={node.upgrade} />
        </View>
      </View>
      {node.children.map((child) => (
        <TreeNodeRow key={child.upgrade.id} node={child} depth={depth + 1} />
      ))}
    </View>
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
