import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../engine/game_state.dart';
import '../engine/research.dart';
import '../theme.dart';
import '../widgets/screen_header.dart';

class ResearchScreen extends StatelessWidget {
  const ResearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final tree = _buildTree(researchNodes);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            ScreenHeader(
              title: 'RESEARCH',
              rightLabel: '${game.researchPoints.toStringAsFixed(1)} RP',
              onBack: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    const Text(
                      'Spend Research Points on permanent in-run buffs.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textDim,
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 14),
                    for (final node in tree) _TreeNodeRow(node: node, depth: 0),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TreeNode {
  final ResearchNode node;
  final List<_TreeNode> children;
  _TreeNode({required this.node, required this.children});
}

List<_TreeNode> _buildTree(List<ResearchNode> nodes) {
  final childrenOf = <String, List<ResearchNode>>{};
  for (final n in nodes) {
    if (n.prereqs.isEmpty) continue;
    final parentId = n.prereqs[0];
    childrenOf.putIfAbsent(parentId, () => []).add(n);
  }

  _TreeNode makeNode(ResearchNode n) {
    final kids = (childrenOf[n.id] ?? [])
      ..sort((a, b) => a.cost.compareTo(b.cost));
    return _TreeNode(node: n, children: kids.map(makeNode).toList());
  }

  final roots = nodes.where((n) => n.prereqs.isEmpty).toList()
    ..sort((a, b) => a.cost.compareTo(b.cost));
  return roots.map(makeNode).toList();
}

class _TreeNodeRow extends StatelessWidget {
  final _TreeNode node;
  final int depth;
  const _TreeNodeRow({required this.node, required this.depth});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: EdgeInsets.only(left: depth * 18.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (depth > 0)
                Container(
                  width: 12,
                  height: 24,
                  margin: const EdgeInsets.only(right: 6, top: 12),
                  decoration: const BoxDecoration(
                    border: Border(
                      left: BorderSide(color: AppColors.border),
                      bottom: BorderSide(color: AppColors.border),
                    ),
                    borderRadius:
                        BorderRadius.only(bottomLeft: Radius.circular(6)),
                  ),
                ),
              Expanded(child: _ResearchCard(node: node.node)),
            ],
          ),
        ),
        for (final child in node.children)
          _TreeNodeRow(node: child, depth: depth + 1),
      ],
    );
  }
}

class _ResearchCard extends StatelessWidget {
  final ResearchNode node;
  const _ResearchCard({required this.node});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final owned = game.research[node.id] == true;
    final available = isResearchAvailable(node, game.research);
    final canAfford = game.researchPoints >= node.cost;

    late final String state;
    if (owned) {
      state = 'owned';
    } else if (!available) {
      state = 'locked';
    } else if (!canAfford) {
      state = 'unaffordable';
    } else {
      state = 'buyable';
    }

    final missingPrereqs = node.prereqs
        .where((id) => game.research[id] != true)
        .map((id) =>
            researchNodes.where((n) => n.id == id).firstOrNull?.name ?? id)
        .toList();

    Color cardBg, cardBorder, nameColor, descColor, costColor;

    switch (state) {
      case 'owned':
        cardBg = const Color(0xFF180E2A);
        cardBorder = AppColors.purple;
        nameColor = AppColors.purple;
        descColor = const Color(0xFF9966CC);
        costColor = AppColors.purple;
        break;
      case 'locked':
        cardBg = const Color(0xFF15151F);
        cardBorder = AppColors.cardBg;
        nameColor = AppColors.textDim;
        descColor = const Color(0xFF3A3A4A);
        costColor = const Color(0xFF3A3A4A);
        break;
      case 'unaffordable':
        cardBg = AppColors.cardBg;
        cardBorder = AppColors.border;
        nameColor = const Color(0xFF999999);
        descColor = AppColors.textDim;
        costColor = AppColors.textDim;
        break;
      default: // buyable
        cardBg = AppColors.cardBg;
        cardBorder = AppColors.purple;
        nameColor = AppColors.textPrimary;
        descColor = const Color(0xFFAAAAAA);
        costColor = AppColors.purple;
    }

    return GestureDetector(
      onTap: state == 'buyable' ? () => game.buyResearch(node.id) : null,
      child: Container(
        padding: const EdgeInsets.all(14),
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: cardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      if (state == 'locked')
                        const Padding(
                          padding: EdgeInsets.only(right: 6),
                          child: Text('🔒', style: TextStyle(fontSize: 12)),
                        ),
                      Flexible(
                        child: Text(
                          node.name,
                          style: TextStyle(
                            color: nameColor,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (state == 'owned')
                  const Text(
                    '✓',
                    style: TextStyle(
                      color: AppColors.purple,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                else
                  Text(
                    '${node.cost} RP',
                    style: TextStyle(
                      color: costColor,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              node.description,
              style: TextStyle(color: descColor, fontSize: 12),
            ),
            if (state == 'locked' && missingPrereqs.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'REQUIRES: ${missingPrereqs.join(', ').toUpperCase()}',
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ),
            if (state == 'unaffordable')
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Need ${(node.cost - game.researchPoints).toStringAsFixed(1)} more RP',
                  style: const TextStyle(
                    color: AppColors.textDim,
                    fontSize: 10,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
