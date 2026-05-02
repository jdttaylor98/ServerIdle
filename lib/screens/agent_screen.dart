import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../engine/game_state.dart';
import '../engine/agents.dart';
import '../theme.dart';
import '../widgets/screen_header.dart';

class AgentScreen extends StatelessWidget {
  const AgentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final totalSalary = getTotalAgentSalary(game.agents);
    final hiredCount = game.agents.values.where((v) => v).length;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            ScreenHeader(
              title: 'AI AGENTS',
              rightLabel: '${game.credits.floor()} cr',
              onBack: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    const Text(
                      'Your AI does the clicking for you. The future is now.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textDim,
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Autonomy card
                    _AutonomyCard(
                      autonomy: game.agentAutonomy,
                      onSet: game.setAgentAutonomyLevel,
                    ),

                    // Summary
                    if (hiredCount > 0) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: AppColors.cardBg,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            _summaryRow('AGENTS ACTIVE', '$hiredCount / 3',
                                AppColors.textPrimary),
                            _summaryRow('AGENT SALARY',
                                '−$totalSalary cr/sec', AppColors.orange),
                          ],
                        ),
                      ),
                    ],

                    for (final agent in agentTypes)
                      _AgentRow(agent: agent, autonomy: game.agentAutonomy),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value, Color valueColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 10,
              letterSpacing: 2,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: valueColor,
              fontSize: 13,
              fontWeight: FontWeight.bold,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }
}

class _AutonomyCard extends StatelessWidget {
  final int autonomy;
  final void Function(int) onSet;

  const _AutonomyCard({required this.autonomy, required this.onSet});

  @override
  Widget build(BuildContext context) {
    String hint;
    if (autonomy <= 3) {
      hint = 'Conservative — safe but slow';
    } else if (autonomy <= 6) {
      hint = 'Balanced — moderate risk & reward';
    } else {
      hint = 'Aggressive — fast but risky';
    }

    return Container(
      padding: const EdgeInsets.all(14),
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.purple),
      ),
      child: Column(
        children: [
          const Text(
            'AUTONOMY LEVEL',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 10,
              letterSpacing: 2,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _circleButton('−', () => onSet(max(1, autonomy - 1))),
              const SizedBox(width: 8),
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(10, (i) {
                    return GestureDetector(
                      onTap: () => onSet(i + 1),
                      child: Container(
                        width: 20,
                        height: 20,
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        decoration: BoxDecoration(
                          color: i < autonomy
                              ? AppColors.purple
                              : AppColors.border,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: i < autonomy
                                ? AppColors.purple
                                : const Color(0xFF3A3A5A),
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(width: 8),
              _circleButton('+', () => onSet(min(10, autonomy + 1))),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '$autonomy / 10',
            style: const TextStyle(
              color: AppColors.purple,
              fontSize: 16,
              fontWeight: FontWeight.bold,
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            hint,
            style: const TextStyle(
              color: AppColors.textDim,
              fontSize: 10,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  Widget _circleButton(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: AppColors.border,
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: const TextStyle(
            color: AppColors.purple,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

class _AgentRow extends StatelessWidget {
  final AgentType agent;
  final int autonomy;

  const _AgentRow({required this.agent, required this.autonomy});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final hired = game.agents[agent.id] == true;
    final canAfford = game.credits >= agent.cost;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: hired ? const Color(0xFF1A0E24) : AppColors.cardBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: hired ? AppColors.purple : AppColors.border,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${agent.icon} ${agent.name}${hired ? '  ✓' : ''}',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    agent.description,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    agent.effectDescription(autonomy),
                    style: const TextStyle(
                      color: AppColors.purple,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '−${agent.salaryPerSec} cr/sec salary',
                    style: const TextStyle(
                      color: AppColors.orange,
                      fontSize: 11,
                    ),
                  ),
                  if (hired)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: GestureDetector(
                        onTap: () => game.fireAgent(agent.id),
                        child: Text(
                          'Terminate · refund ${_formatCost((agent.cost * 0.5).floor())}',
                          style: const TextStyle(
                            color: AppColors.orange,
                            fontSize: 11,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (!hired)
              GestureDetector(
                onTap: canAfford ? () => game.hireAgent(agent.id) : null,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 18, vertical: 10),
                  decoration: BoxDecoration(
                    color: canAfford
                        ? AppColors.purple
                        : const Color(0xFF222222),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'HIRE',
                        style: TextStyle(
                          color: canAfford ? Colors.black : AppColors.textDim,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatCost(agent.cost),
                        style: TextStyle(
                          color: canAfford
                              ? Colors.black
                              : const Color(0xFF444444),
                          fontSize: 12,
                        ),
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

String _formatCost(num n) {
  if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
  if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
  return '$n';
}
