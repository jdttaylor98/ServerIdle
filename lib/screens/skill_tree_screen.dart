import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../engine/game_state.dart';
import '../engine/skill_tree.dart';
import '../theme.dart';
import '../widgets/screen_header.dart';

class SkillTreeScreen extends StatefulWidget {
  const SkillTreeScreen({super.key});

  @override
  State<SkillTreeScreen> createState() => _SkillTreeScreenState();
}

class _SkillTreeScreenState extends State<SkillTreeScreen> {
  SkillBranch _selectedBranch = SkillBranch.hardware;

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final branchMeta =
        skillBranches.firstWhere((b) => b.id == _selectedBranch);
    final branchColor = Color(branchMeta.color);
    final branchNodes = getSkillsInBranch(_selectedBranch);
    final ownedCount = skillNodes.where((n) => game.skills[n.id] == true).length;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            ScreenHeader(
              title: 'SKILL TREE',
              rightLabel: '${game.skillPoints} SP',
              onBack: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Meta row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '$ownedCount/${skillNodes.length} skills',
                          style: const TextStyle(
                            color: AppColors.textDim,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                        Text(
                          'Prestige #${game.prestigeCount}',
                          style: const TextStyle(
                            color: AppColors.textDim,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Branch tabs
                    Row(
                      children: skillBranches.map((branch) {
                        final isActive = branch.id == _selectedBranch;
                        final bc = Color(branch.color);
                        final branchOwned = getSkillsInBranch(branch.id)
                            .where((n) => game.skills[n.id] == true)
                            .length;
                        return Expanded(
                          child: GestureDetector(
                            onTap: () =>
                                setState(() => _selectedBranch = branch.id),
                            child: Container(
                              margin:
                                  const EdgeInsets.symmetric(horizontal: 3),
                              padding:
                                  const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: isActive
                                    ? bc.withValues(alpha: 0.08)
                                    : AppColors.cardBg,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isActive ? bc : AppColors.border,
                                ),
                              ),
                              child: Column(
                                children: [
                                  Text(branch.icon,
                                      style: const TextStyle(fontSize: 16)),
                                  const SizedBox(height: 2),
                                  Text(
                                    branch.name,
                                    style: TextStyle(
                                      color:
                                          isActive ? bc : AppColors.textSecondary,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                  if (branchOwned > 0) ...[
                                    const SizedBox(height: 1),
                                    Text(
                                      '$branchOwned',
                                      style: TextStyle(
                                        color: bc,
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Branch title
                    Text(
                      '${branchMeta.icon} ${branchMeta.name.toUpperCase()}',
                      style: TextStyle(
                        color: branchColor,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 3,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Skill nodes
                    for (final node in branchNodes)
                      _SkillNodeCard(
                        node: node,
                        branchColor: branchColor,
                      ),
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

class _SkillNodeCard extends StatelessWidget {
  final SkillNode node;
  final Color branchColor;

  const _SkillNodeCard({required this.node, required this.branchColor});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final owned = game.skills[node.id] == true;
    final available = isSkillAvailable(node, game.skills, game.prestigeCount);
    final visible = isSkillVisible(node, game.skills, game.prestigeCount);
    final canAfford = game.skillPoints >= node.cost;
    final prestigeLocked = game.prestigeCount < node.minPrestiges;
    final prereqsMet = node.prereqs.every((p) => game.skills[p] == true);

    if (!visible) return const SizedBox.shrink();

    final prereqNames = node.prereqs
        .map((pid) =>
            skillNodes.where((n) => n.id == pid).firstOrNull?.name ?? pid)
        .join(', ');

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Opacity(
        opacity: (!owned && !available) ? 0.5 : 1.0,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: owned
                ? branchColor.withValues(alpha: 0.07)
                : AppColors.cardBg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: owned ? branchColor : AppColors.border,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(node.icon,
                      style: const TextStyle(fontSize: 22)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${node.name}${owned ? ' ✓' : ''}',
                          style: TextStyle(
                            color: owned
                                ? branchColor
                                : (available
                                    ? AppColors.textPrimary
                                    : AppColors.textDim),
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          node.description,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (!owned)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0D0D1A),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '${node.cost} SP',
                        style: TextStyle(
                          color: (canAfford && available)
                              ? AppColors.gold
                              : AppColors.textDim,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),

              // Requirements
              if (!owned) ...[
                if (node.prereqs.isNotEmpty && !prereqsMet)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      'Requires: $prereqNames',
                      style: const TextStyle(
                        color: AppColors.red,
                        fontSize: 10,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                if (prestigeLocked)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Needs ${node.minPrestiges} prestige${node.minPrestiges != 1 ? 's' : ''} (you: ${game.prestigeCount})',
                      style: const TextStyle(
                        color: AppColors.red,
                        fontSize: 10,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
              ],

              // Buy button
              if (!owned && available)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: GestureDetector(
                    onTap: canAfford ? () => game.buySkill(node.id) : null,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: canAfford
                            ? branchColor
                            : const Color(0xFF222222),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        canAfford
                            ? 'LEARN (${node.cost} SP)'
                            : 'NEED ${node.cost} SP',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: canAfford
                              ? Colors.black
                              : AppColors.textDim,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
