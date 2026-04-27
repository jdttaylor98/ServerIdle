import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RESEARCH_NODES, ResearchNode } from '../engine/research';
import { useGameStore } from '../engine/store';
import { ResearchCard } from './ResearchCard';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  onClose: () => void;
}

interface TreeNode {
  node: ResearchNode;
  children: TreeNode[];
}

function buildTree(nodes: ResearchNode[]): TreeNode[] {
  const childrenOf = new Map<string, ResearchNode[]>();
  for (const n of nodes) {
    if (n.prereqs.length === 0) continue;
    const parentId = n.prereqs[0];
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId)!.push(n);
  }

  function makeNode(n: ResearchNode): TreeNode {
    const kids = (childrenOf.get(n.id) ?? []).sort((a, b) => a.cost - b.cost);
    return { node: n, children: kids.map(makeNode) };
  }

  return nodes
    .filter((n) => n.prereqs.length === 0)
    .sort((a, b) => a.cost - b.cost)
    .map(makeNode);
}

export function ResearchScreen({ onClose }: Props) {
  const researchPoints = useGameStore((state) => state.researchPoints);
  const tree = buildTree(RESEARCH_NODES);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="RESEARCH"
        rightLabel={`${researchPoints.toFixed(1)} RP`}
        onBack={onClose}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subheading}>
          Spend Research Points on permanent in-run buffs.
        </Text>
        {tree.map((node) => (
          <TreeNodeRow key={node.node.id} node={node} depth={0} />
        ))}
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
          <ResearchCard node={node.node} />
        </View>
      </View>
      {node.children.map((child) => (
        <TreeNodeRow key={child.node.id} node={child} depth={depth + 1} />
      ))}
    </View>
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
    marginBottom: 14,
    textAlign: 'center',
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
