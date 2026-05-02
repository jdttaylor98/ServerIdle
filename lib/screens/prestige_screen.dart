import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../engine/game_state.dart';
import '../engine/prestige.dart';
import '../theme.dart';
import '../widgets/screen_header.dart';

class PrestigeScreen extends StatelessWidget {
  const PrestigeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final spEarned = calcSkillPointsEarned(game.highestCredits);
    final canDo = canPrestige(game.highestCredits);
    final nextThreshold = pow(10, spEarned + 7).toDouble();

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            ScreenHeader(
              title: 'ACQUI-HIRE',
              rightLabel: '${game.skillPoints} SP',
              onBack: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    const Text(
                      'BigCorp wants to buy you out. Reset everything. Keep your Skill Points.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textDim,
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Meta stats
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: AppColors.cardBg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.gold),
                      ),
                      child: Column(
                        children: [
                          _metaRow('PRESTIGE COUNT', '${game.prestigeCount}',
                              AppColors.textPrimary),
                          _metaRow('TOTAL SKILL POINTS',
                              '${game.skillPoints} SP', AppColors.gold),
                        ],
                      ),
                    ),

                    // This run
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: AppColors.cardBg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'THIS RUN',
                            style: TextStyle(
                              color: AppColors.textDim,
                              fontSize: 10,
                              letterSpacing: 3,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          _metaRow('CURRENT CREDITS',
                              _fmtBig(game.credits), AppColors.textPrimary),
                          _metaRow('PEAK CREDITS',
                              _fmtBig(game.highestCredits), AppColors.textPrimary),
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.only(top: 8),
                            decoration: const BoxDecoration(
                              border: Border(
                                top: BorderSide(color: AppColors.border),
                              ),
                            ),
                            child: _metaRow(
                              'SP FROM THIS RUN',
                              spEarned > 0 ? '+$spEarned' : '0',
                              AppColors.gold,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Thresholds
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: AppColors.cardBg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'SP THRESHOLDS',
                            style: TextStyle(
                              color: AppColors.textDim,
                              fontSize: 10,
                              letterSpacing: 3,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          for (int exp = 7; exp <= 12; exp++) ...[
                            _thresholdRow(
                              exp - 6,
                              pow(10, exp).toDouble(),
                              game.highestCredits,
                            ),
                          ],
                        ],
                      ),
                    ),

                    if (!canDo)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(
                          'Reach ${_fmtBig(prestigeMinCredits.toDouble())} peak credits to prestige.${game.highestCredits > 0 ? ' (${(game.highestCredits / prestigeMinCredits * 100).toStringAsFixed(1)}% there)' : ''}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: AppColors.textDim,
                            fontSize: 11,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),

                    // Prestige button
                    GestureDetector(
                      onTap: canDo
                          ? () => _confirmPrestige(context, game, spEarned)
                          : null,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: canDo
                              ? AppColors.gold
                              : const Color(0xFF222222),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'SELL TO BIGCORP',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: canDo
                                    ? Colors.black
                                    : AppColors.textDim,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              canDo
                                  ? 'Earn $spEarned Skill Point${spEarned != 1 ? 's' : ''}'
                                  : 'Not enough credits yet',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: canDo
                                    ? Colors.black
                                    : AppColors.textDim,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    if (canDo && spEarned < 6)
                      Text(
                        'Next SP at ${_fmtBig(nextThreshold)} peak credits',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: AppColors.textDim,
                          fontSize: 10,
                          fontStyle: FontStyle.italic,
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

  void _confirmPrestige(BuildContext context, GameState game, int spEarned) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.cardBg,
        title: const Text(
          'Acqui-hire?',
          style: TextStyle(color: AppColors.textPrimary),
        ),
        content: Text(
          'BigCorp will acquire your infrastructure.\n\n'
          'You earn $spEarned Skill Point${spEarned != 1 ? 's' : ''}.\n\n'
          'All credits, servers, upgrades, research, staff, agents, and regions reset. '
          'Skill Points and prestige count are permanent.',
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel',
                style: TextStyle(color: AppColors.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              game.doPrestige();
              Navigator.of(ctx).pop();
              Navigator.of(context).pop();
            },
            child: Text(
              'Sell for $spEarned SP',
              style: const TextStyle(color: AppColors.red),
            ),
          ),
        ],
      ),
    );
  }

  Widget _metaRow(String label, String value, Color valueColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
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
              fontSize: 14,
              fontWeight: FontWeight.bold,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }

  Widget _thresholdRow(int sp, double threshold, double highestCredits) {
    final reached = highestCredits >= threshold;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '${reached ? '✓' : '○'} ${_fmtBig(threshold)} credits',
            style: TextStyle(
              color: reached ? AppColors.gold : AppColors.textDim,
              fontSize: 12,
            ),
          ),
          Text(
            '$sp SP',
            style: TextStyle(
              color: reached ? AppColors.gold : AppColors.textDim,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

String _fmtBig(double n) {
  if (n >= 1e12) return '${(n / 1e12).toStringAsFixed(0)}T';
  if (n >= 1e9) return '${(n / 1e9).toStringAsFixed(0)}B';
  if (n >= 1e6) return '${(n / 1e6).toStringAsFixed(0)}M';
  if (n >= 1e3) return '${(n / 1e3).toStringAsFixed(0)}K';
  return '${n.floor()}';
}
