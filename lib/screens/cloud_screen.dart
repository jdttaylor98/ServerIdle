import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../engine/game_state.dart';
import '../engine/regions.dart';
import '../theme.dart';
import '../widgets/screen_header.dart';

class CloudScreen extends StatelessWidget {
  const CloudScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final totalOutput = getOwnedRegionsOutput(game.regions);
    final totalCost = getOwnedRegionsCost(game.regions);
    final totalNet = totalOutput - totalCost;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            ScreenHeader(
              title: 'CLOUD',
              rightLabel: '${game.flops.floor()} flops',
              onBack: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    const Text(
                      'Lease cloud regions. One of each. Provisioning takes real time.',
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
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            _summaryRow(
                              'OUTPUT',
                              '+${totalOutput.floor()} flops/sec',
                              AppColors.green,
                            ),
                            _summaryRow(
                              'OPS COSTS',
                              '−${totalCost.floor()} flops/sec',
                              AppColors.orange,
                            ),
                            Container(
                              padding: const EdgeInsets.only(top: 6),
                              margin: const EdgeInsets.only(top: 4),
                              decoration: const BoxDecoration(
                                border: Border(
                                  top: BorderSide(color: AppColors.border),
                                ),
                              ),
                              child: _summaryRow(
                                'NET',
                                '${totalNet >= 0 ? '+' : ''}${totalNet.floor()} flops/sec',
                                AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    for (final region in cloudRegions)
                      _RegionRow(region: region),
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

class _RegionRow extends StatefulWidget {
  final CloudRegion region;
  const _RegionRow({required this.region});

  @override
  State<_RegionRow> createState() => _RegionRowState();
}

class _RegionRowState extends State<_RegionRow> {
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final region = widget.region;
    final owned = game.regions[region.id] == true;
    final canAfford = game.flops >= region.cost;

    final isBuildingThis = game.activeBuild?.kind == BuildKind.region &&
        game.activeBuild?.id == region.id;
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
          color: owned ? const Color(0xFF0E2418) : AppColors.cardBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: owned ? AppColors.green : AppColors.border,
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
                    '🌐 ${region.name}${owned ? '  ✓' : ''}',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    region.description,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '+${region.output.floor()} flops/sec',
                    style: const TextStyle(
                      color: AppColors.green,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '−${region.operatingCost.floor()} flops/sec ops cost',
                    style: const TextStyle(
                      color: AppColors.orange,
                      fontSize: 11,
                    ),
                  ),
                  Text(
                    '= ${(region.output - region.operatingCost).floor()} net flops/sec',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '${region.powerDraw}W · ${region.heatOutput} BTU · ${(region.buildTimeSeconds / 60).round()}min build',
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
                      label: 'PROVISIONING…',
                      color: AppColors.green,
                    ),
                  if (owned)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: GestureDetector(
                        onTap: () => game.sellRegion(region.id),
                        child: Text(
                          'Decommission · refund ${_formatCost((region.cost * 0.5).floor())}',
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
            if (!owned && !isBuildingThis)
              GestureDetector(
                onTap: (canAfford && !isBuildingOther)
                    ? () => game.buyRegion(region.id)
                    : null,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 18, vertical: 10),
                  decoration: BoxDecoration(
                    color: (canAfford && !isBuildingOther)
                        ? AppColors.green
                        : const Color(0xFF222222),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'LEASE',
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
                        _formatCost(region.cost),
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
  final String label;
  final Color color;

  const _BuildIndicator({
    required this.startedAt,
    required this.completesAt,
    required this.onCancel,
    required this.label,
    required this.color,
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
        border: Border.all(color: color),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: color,
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
              valueColor: AlwaysStoppedAnimation(color),
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
