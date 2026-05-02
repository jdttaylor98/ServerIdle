import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../engine/game_state.dart';
import '../engine/upgrades.dart';
import '../theme.dart';
import '../widgets/screen_header.dart';

const List<Map<String, String>> _eras = [
  {'era': 'homelab', 'label': 'HOMELAB'},
  {'era': 'rack', 'label': 'RACK'},
  {'era': 'datacenter', 'label': 'DATA CENTER'},
];

class UpgradesScreen extends StatelessWidget {
  const UpgradesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            ScreenHeader(
              title: 'UPGRADES',
              rightLabel: '${game.credits.floor()} cr',
              onBack: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final e in _eras) ...[
                      _EraSection(era: e['era']!, label: e['label']!),
                    ],
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

class _EraSection extends StatelessWidget {
  final String era;
  final String label;

  const _EraSection({required this.era, required this.label});

  @override
  Widget build(BuildContext context) {
    final tree = _buildTree(getUpgradesByEra(era));

    return Padding(
      padding: const EdgeInsets.only(bottom: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textDim,
              fontSize: 11,
              letterSpacing: 3,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          for (final node in tree) _TreeNodeRow(node: node, depth: 0),
        ],
      ),
    );
  }
}

class _TreeNode {
  final Upgrade upgrade;
  final List<_TreeNode> children;
  _TreeNode({required this.upgrade, required this.children});
}

List<_TreeNode> _buildTree(List<Upgrade> upgrades) {
  final byId = {for (final u in upgrades) u.id: u};
  final childrenOf = <String, List<Upgrade>>{};

  for (final u in upgrades) {
    if (u.prereqs.isEmpty) continue;
    final parentId = u.prereqs[0];
    if (!byId.containsKey(parentId)) continue;
    childrenOf.putIfAbsent(parentId, () => []).add(u);
  }

  _TreeNode makeNode(Upgrade u) {
    final kids = (childrenOf[u.id] ?? [])
      ..sort((a, b) => a.cost.compareTo(b.cost));
    return _TreeNode(
      upgrade: u,
      children: kids.map(makeNode).toList(),
    );
  }

  final roots = upgrades.where((u) => u.prereqs.isEmpty).toList()
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
                  margin: const EdgeInsets.only(right: 6, top: 12),
                  decoration: const BoxDecoration(
                    border: Border(
                      left: BorderSide(color: AppColors.border),
                      bottom: BorderSide(color: AppColors.border),
                    ),
                    borderRadius:
                        BorderRadius.only(bottomLeft: Radius.circular(6)),
                  ),
                  height: 24,
                ),
              Expanded(child: _UpgradeCard(upgrade: node.upgrade)),
            ],
          ),
        ),
        for (final child in node.children)
          _TreeNodeRow(node: child, depth: depth + 1),
      ],
    );
  }
}

class _UpgradeCard extends StatelessWidget {
  final Upgrade upgrade;

  const _UpgradeCard({required this.upgrade});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final owned = game.upgrades[upgrade.id] == true;
    final available =
        isUpgradeAvailable(upgrade, game.upgrades, game.servers);
    final canAfford = game.credits >= upgrade.cost;

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

    final missingPrereqs = upgrade.prereqs
        .where((id) => game.upgrades[id] != true)
        .map((id) =>
            allUpgrades.where((u) => u.id == id).firstOrNull?.name ?? id)
        .toList();

    Color cardBg;
    Color cardBorder;
    Color nameColor;
    Color descColor;
    Color costColor;

    switch (state) {
      case 'owned':
        cardBg = const Color(0xFF0E2418);
        cardBorder = AppColors.green;
        nameColor = AppColors.green;
        descColor = const Color(0xFF5FBF8F);
        costColor = AppColors.green;
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
        cardBorder = AppColors.green;
        nameColor = AppColors.textPrimary;
        descColor = const Color(0xFFAAAAAA);
        costColor = AppColors.green;
    }

    return GestureDetector(
      onTap: state == 'buyable' ? () => game.buyUpgrade(upgrade.id) : null,
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
                          upgrade.name,
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
                      color: AppColors.green,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                else
                  Text(
                    _formatCost(upgrade.cost),
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
              upgrade.description,
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
            if (state == 'locked' &&
                missingPrereqs.isEmpty &&
                upgrade.unlockHint != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'REQUIRES: ${upgrade.unlockHint!.toUpperCase()}',
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
                  'Need ${_formatCost(upgrade.cost - game.credits)} more credits',
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

String _formatCost(num n) {
  if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
  if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
  return '${n.ceil()}';
}
