import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useGameStore } from '../engine/store';
import {
  SKILL_BRANCHES,
  SKILL_NODES,
  SkillBranch,
  SkillNode,
  isSkillAvailable,
  isSkillVisible,
  getSkillsInBranch,
} from '../engine/skillTree';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  onClose: () => void;
}

export function SkillTreeScreen({ onClose }: Props) {
  const skillPoints = useGameStore((state) => state.skillPoints);
  const prestigeCount = useGameStore((state) => state.prestigeCount);
  const skills = useGameStore((state) => state.skills);
  const buySkill = useGameStore((state) => state.buySkill);

  const [selectedBranch, setSelectedBranch] = useState<SkillBranch>('hardware');

  const branchMeta = SKILL_BRANCHES.find((b) => b.id === selectedBranch)!;
  const branchNodes = getSkillsInBranch(selectedBranch);
  const ownedCount = SKILL_NODES.filter((n) => skills[n.id]).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="SKILL TREE"
        rightLabel={`${skillPoints} SP`}
        onBack={onClose}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Meta stats */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {ownedCount}/{SKILL_NODES.length} skills
          </Text>
          <Text style={styles.metaText}>
            Prestige #{prestigeCount}
          </Text>
        </View>

        {/* Branch tabs */}
        <View style={styles.tabRow}>
          {SKILL_BRANCHES.map((branch) => {
            const isActive = branch.id === selectedBranch;
            const branchOwned = getSkillsInBranch(branch.id).filter(
              (n) => skills[n.id]
            ).length;
            return (
              <TouchableOpacity
                key={branch.id}
                style={[
                  styles.tab,
                  isActive && { borderColor: branch.color, backgroundColor: branch.color + '15' },
                ]}
                onPress={() => setSelectedBranch(branch.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.tabIcon}>{branch.icon}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && { color: branch.color },
                  ]}
                >
                  {branch.name}
                </Text>
                {branchOwned > 0 && (
                  <Text style={[styles.tabCount, { color: branch.color }]}>
                    {branchOwned}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Branch title */}
        <Text style={[styles.branchTitle, { color: branchMeta.color }]}>
          {branchMeta.icon} {branchMeta.name.toUpperCase()}
        </Text>

        {/* Skill nodes */}
        {branchNodes.map((node) => {
          const owned = !!skills[node.id];
          const available = isSkillAvailable(node, skills, prestigeCount);
          const visible = isSkillVisible(node, skills, prestigeCount);
          const canAfford = skillPoints >= node.cost;
          const prestigeLocked = prestigeCount < node.minPrestiges;
          const prereqsMet = node.prereqs.every((p) => !!skills[p]);

          if (!visible) return null;

          return (
            <SkillNodeCard
              key={node.id}
              node={node}
              owned={owned}
              available={available}
              canAfford={canAfford}
              prestigeLocked={prestigeLocked}
              prereqsMet={prereqsMet}
              branchColor={branchMeta.color}
              onBuy={() => buySkill(node.id)}
              prestigeCount={prestigeCount}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function SkillNodeCard({
  node,
  owned,
  available,
  canAfford,
  prestigeLocked,
  prereqsMet,
  branchColor,
  onBuy,
  prestigeCount,
}: {
  node: SkillNode;
  owned: boolean;
  available: boolean;
  canAfford: boolean;
  prestigeLocked: boolean;
  prereqsMet: boolean;
  branchColor: string;
  onBuy: () => void;
  prestigeCount: number;
}) {
  const prereqNames = node.prereqs
    .map((pid) => SKILL_NODES.find((n) => n.id === pid)?.name ?? pid)
    .join(', ');

  return (
    <View
      style={[
        styles.nodeCard,
        owned && { borderColor: branchColor, backgroundColor: branchColor + '12' },
        !owned && !available && styles.nodeCardLocked,
      ]}
    >
      <View style={styles.nodeHeader}>
        <Text style={styles.nodeIcon}>{node.icon}</Text>
        <View style={styles.nodeHeaderText}>
          <Text
            style={[
              styles.nodeName,
              owned && { color: branchColor },
              !owned && !available && styles.nodeNameLocked,
            ]}
          >
            {node.name}
            {owned && ' ✓'}
          </Text>
          <Text style={styles.nodeDesc}>{node.description}</Text>
        </View>
        {!owned && (
          <View style={styles.nodeCostBadge}>
            <Text
              style={[
                styles.nodeCostText,
                canAfford && available && { color: '#ffaa44' },
              ]}
            >
              {node.cost} SP
            </Text>
          </View>
        )}
      </View>

      {/* Requirements line */}
      {!owned && (
        <View style={styles.nodeReqs}>
          {node.prereqs.length > 0 && !prereqsMet && (
            <Text style={styles.nodeReqText}>
              Requires: {prereqNames}
            </Text>
          )}
          {prestigeLocked && (
            <Text style={styles.nodeReqText}>
              Needs {node.minPrestiges} prestige{node.minPrestiges !== 1 ? 's' : ''} (you: {prestigeCount})
            </Text>
          )}
        </View>
      )}

      {/* Buy button */}
      {!owned && available && (
        <TouchableOpacity
          style={[
            styles.buyButton,
            canAfford
              ? { backgroundColor: branchColor }
              : styles.buyButtonDisabled,
          ]}
          onPress={onBuy}
          disabled={!canAfford}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.buyButtonText,
              !canAfford && styles.buyButtonTextDisabled,
            ]}
          >
            {canAfford ? `LEARN (${node.cost} SP)` : `NEED ${node.cost} SP`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaText: {
    color: '#666',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    backgroundColor: '#1a1a2e',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tabCount: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 1,
  },
  branchTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 12,
  },
  nodeCard: {
    backgroundColor: '#1a1a2e',
    borderColor: '#2a2a4a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  nodeCardLocked: {
    opacity: 0.5,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeIcon: {
    fontSize: 22,
    marginRight: 10,
    marginTop: 2,
  },
  nodeHeaderText: {
    flex: 1,
  },
  nodeName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nodeNameLocked: {
    color: '#666',
  },
  nodeDesc: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  nodeCostBadge: {
    backgroundColor: '#0d0d1a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  nodeCostText: {
    color: '#666',
    fontSize: 11,
    fontWeight: 'bold',
  },
  nodeReqs: {
    marginTop: 6,
  },
  nodeReqText: {
    color: '#ff5566',
    fontSize: 10,
    fontStyle: 'italic',
  },
  buyButton: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: '#222',
  },
  buyButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buyButtonTextDisabled: {
    color: '#555',
  },
});
