import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../engine/game_state.dart';
import '../engine/capacity.dart';
import '../engine/servers.dart';
import '../theme.dart';
import '../widgets/screen_header.dart';

class CoolingScreen extends StatelessWidget {
  const CoolingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final used = getTotalHeatOutput(game.servers);
    final total = getTotalCapacityAmount(game.capacity, 'cooling');

    final buildings = capacityBuildings
        .where((b) =>
            b.resource == 'cooling' &&
            isCapacityBuildingVisible(b, game.capacity))
        .toList();

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            ScreenHeader(
              title: 'COOLING',
              rightLabel: '${game.flops.floor()} flops',
              onBack: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    _CapacityMeter(
                      label: 'HEAT OUTPUT',
                      used: used,
                      capacity: total,
                      unit: 'BTU',
                    ),
                    const SizedBox(height: 14),
                    ...buildings.map((b) => _CapacityRow(building: b)),
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

class _CapacityMeter extends StatelessWidget {
  final String label;
  final double used;
  final double capacity;
  final String unit;

  const _CapacityMeter({
    required this.label,
    required this.used,
    required this.capacity,
    required this.unit,
  });

  @override
  Widget build(BuildContext context) {
    final ratio = capacity > 0 ? (used / capacity).clamp(0.0, 1.0) : 0.0;
    final overloaded = used > capacity;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 11,
                letterSpacing: 1,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              '${used.floor()} / ${capacity.floor()} $unit',
              style: TextStyle(
                color: overloaded ? AppColors.red : AppColors.textSecondary,
                fontSize: 11,
                fontWeight: overloaded ? FontWeight.bold : FontWeight.normal,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(3),
          child: LinearProgressIndicator(
            value: ratio,
            backgroundColor: AppColors.border,
            valueColor: AlwaysStoppedAnimation(
              overloaded ? AppColors.red : AppColors.green,
            ),
            minHeight: 6,
          ),
        ),
        if (overloaded)
          Padding(
            padding: const EdgeInsets.only(top: 3),
            child: Text(
              'OVERLOADED — output capped at ${(capacity / used * 100).floor()}%',
              style: const TextStyle(
                color: AppColors.red,
                fontSize: 10,
                letterSpacing: 1,
              ),
            ),
          ),
      ],
    );
  }
}

class _CapacityRow extends StatelessWidget {
  final CapacityBuilding building;

  const _CapacityRow({required this.building});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final owned = game.capacity[building.id] ?? 0;
    final cost = getCapacityBuildingCost(building, owned);
    final totalProvided = building.capacity * owned;
    final canAfford = game.flops >= cost;
    final refund = owned > 0
        ? (getCapacityBuildingCost(building, owned - 1) * 0.5).floor()
        : 0;

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
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        building.name,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '×$owned',
                        style: const TextStyle(
                          color: Color(0xFF77AAFF),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    building.description,
                    style: const TextStyle(
                      color: AppColors.textDim,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '+${building.capacity} BTU each',
                    style: const TextStyle(
                      color: AppColors.textDim,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Total: +$totalProvided BTU',
                    style: const TextStyle(
                      color: Color(0xFF77AAFF),
                      fontSize: 12,
                    ),
                  ),
                  if (owned > 0) ...[
                    const SizedBox(height: 6),
                    GestureDetector(
                      onTap: () => game.sellCapacityBuilding(building.id),
                      child: Text(
                        'Sell 1 · refund ${_formatCost(refund)}',
                        style: const TextStyle(
                          color: AppColors.orange,
                          fontSize: 11,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            GestureDetector(
              onTap: canAfford
                  ? () => game.buyCapacityBuilding(building.id)
                  : null,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                decoration: BoxDecoration(
                  color: canAfford ? const Color(0xFF77AAFF) : const Color(0xFF222222),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    Text(
                      'BUY',
                      style: TextStyle(
                        color: canAfford
                            ? const Color(0xFF000011)
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
                        color: canAfford
                            ? const Color(0xFF000011)
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
