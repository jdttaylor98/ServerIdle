import 'package:flutter/material.dart';
import '../theme.dart';

class ScreenHeader extends StatelessWidget {
  final String title;
  final String? rightLabel;
  final VoidCallback onBack;

  const ScreenHeader({
    super.key,
    required this.title,
    this.rightLabel,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.border, width: 1),
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: onBack,
            child: const Row(
              children: [
                Icon(Icons.arrow_back_ios, color: AppColors.green, size: 16),
                SizedBox(width: 4),
                Text(
                  'BACK',
                  style: TextStyle(
                    color: AppColors.green,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
                letterSpacing: 3,
              ),
            ),
          ),
          if (rightLabel != null)
            Text(
              rightLabel!,
              style: const TextStyle(
                color: AppColors.gold,
                fontSize: 12,
                fontWeight: FontWeight.bold,
                fontFeatures: [FontFeature.tabularFigures()],
              ),
            )
          else
            const SizedBox(width: 60), // balance the back button
        ],
      ),
    );
  }
}
