import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../engine/game_state.dart';
import '../engine/gpus.dart';
import '../theme.dart';
import '../widgets/screen_header.dart';

class GpuScreen extends StatelessWidget {
  const GpuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final totalOutput = getTotalGpuOutput(game.gpus);
    final totalRp = getTotalGpuRpOutput(game.gpus);

    final visibleTiers = gpuTiers
        .where((t) => isGpuTierVisible(t.id, game.gpus, game.research))
        .toList();

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            ScreenHeader(
              title: 'GPU',
              rightLabel: '${game.credits.floor()} cr',
              onBack: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    const Text(
                      'GPU hardware. Generates credits and Research Points. Power-hungry.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textDim,
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (totalOutput > 0) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: AppColors.cardBg,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.purple),
                        ),
                        child: Column(
                          children: [
                            _summaryRow(
                              'CREDIT OUTPUT',
                              '+$totalOutput cr/sec',
                              AppColors.green,
                            ),
                            _summaryRow(
                              'RP OUTPUT',
                              '+${totalRp.toStringAsFixed(1)} RP/sec',
                              AppColors.purple,
                            ),
                          ],
                        ),
                      ),
                    ],
                    for (final tier in visibleTiers)
                      _GpuRow(tier: tier),
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

class _GpuRow extends StatefulWidget {
  final GpuTier tier;
  const _GpuRow({required this.tier});

  @override
  State<_GpuRow> createState() => _GpuRowState();
}

class _GpuRowState extends State<_GpuRow> {
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final tier = widget.tier;
    final owned = game.gpus[tier.id] ?? 0;
    final cost = getGpuCost(tier, owned);
    final totalOutput = getGpuOutput(tier, owned);
    final totalRp = getGpuRpOutput(tier, owned);
    final canAfford = game.credits >= cost;
    final refund =
        owned > 0 ? (getGpuCost(tier, owned - 1) * 0.5).floor() : 0;

    final isBuildingThis = game.activeBuild?.kind == BuildKind.gpu &&
        game.activeBuild?.id == tier.id;
    final isBuildingOther = game.activeBuild != null && !isBuildingThis;

    if (isBuildingThis) {
      _timer ??= Timer.periodic(
        const Duration(milliseconds: 250),
        (_) => setState(() {}),
      );
    } else {
      _timer?.cancel();
      _timer = null;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        '🎮 ${tier.name}',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '×$owned',
                        style: const TextStyle(
                          color: AppColors.purple,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    tier.description,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '+${tier.baseOutput} cr/sec each',
                    style: const TextStyle(
                      color: AppColors.green,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '+${tier.rpOutput} RP/sec each',
                    style: const TextStyle(
                      color: AppColors.purple,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (owned > 0)
                    Text(
                      'Total: $totalOutput cr/sec · ${totalRp.toStringAsFixed(1)} RP/sec',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  Text(
                    '${tier.powerDraw}W · ${tier.heatOutput} BTU · ${(tier.buildTimeSeconds / 60).round()}min build',
                    style: const TextStyle(
                      color: AppColors.textDim,
                      fontSize: 10,
                    ),
                  ),
                  if (isBuildingThis && game.activeBuild != null)
                    _BuildIndicator(
                      startedAt: game.activeBuild!.startedAt,
                      completesAt: game.activeBuild!.completesAt,
                      onCancel: game.cancelBuild,
                    ),
                  if (owned > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: GestureDetector(
                        onTap: () => game.sellGpu(tier.id),
                        child: Text(
                          'Sell 1 · refund ${_formatCost(refund)}',
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
            if (!isBuildingThis)
              GestureDetector(
                onTap: (canAfford && !isBuildingOther)
                    ? () => game.buyGpu(tier.id)
                    : null,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 18, vertical: 10),
                  decoration: BoxDecoration(
                    color: (canAfford && !isBuildingOther)
                        ? AppColors.purple
                        : const Color(0xFF222222),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'BUILD',
                        style: TextStyle(
                          color: (canAfford && !isBuildingOther)
                              ? Colors.black
                              : AppColors.textDim,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatCost(cost),
                        style: TextStyle(
                          color: (canAfford && !isBuildingOther)
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

class _BuildIndicator extends StatelessWidget {
  final int startedAt;
  final int completesAt;
  final VoidCallback onCancel;

  const _BuildIndicator({
    required this.startedAt,
    required this.completesAt,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now().millisecondsSinceEpoch;
    final total = completesAt - startedAt;
    final elapsed = (now - startedAt).clamp(0, total);
    final remainingMs = (completesAt - now).clamp(0, total);
    final pct = total > 0 ? elapsed / total : 0.0;

    final s = (remainingMs / 1000).ceil();
    final m = s ~/ 60;
    final r = s % 60;

    return Container(
      padding: const EdgeInsets.all(8),
      margin: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF0D0D1A),
        border: Border.all(color: AppColors.purple),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'FABRICATING…',
                style: TextStyle(
                  color: AppColors.purple,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
              Text(
                '$m:${r.toString().padLeft(2, '0')}',
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: pct.clamp(0.0, 1.0),
              backgroundColor: AppColors.cardBg,
              valueColor: const AlwaysStoppedAnimation(AppColors.purple),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 6),
          GestureDetector(
            onTap: onCancel,
            child: const Text(
              'Cancel · 50% refund',
              style: TextStyle(
                color: AppColors.orange,
                fontSize: 10,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _formatCost(num n) {
  if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
  if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
  return '$n';
}
