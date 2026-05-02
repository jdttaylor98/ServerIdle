import 'package:flutter/material.dart';
import '../theme.dart';

class MiniMeter extends StatelessWidget {
  final String icon;
  final String label;
  final double used;
  final double capacity;
  final String unit;

  const MiniMeter({
    super.key,
    required this.icon,
    required this.label,
    required this.used,
    required this.capacity,
    required this.unit,
  });

  @override
  Widget build(BuildContext context) {
    final pct = capacity > 0 ? (used / capacity).clamp(0.0, 1.0) : 0.0;
    final color = pct > 0.9
        ? AppColors.red
        : pct > 0.7
            ? AppColors.gold
            : AppColors.green;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$icon $label',
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
              Text(
                '${used.floor()} / ${capacity.floor()} $unit',
                style: TextStyle(
                  color: color,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: pct,
              backgroundColor: AppColors.border,
              valueColor: AlwaysStoppedAnimation(color),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }
}
