import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../engine/game_state.dart';
import '../engine/staff.dart';
import '../theme.dart';
import '../widgets/screen_header.dart';

class StaffScreen extends StatelessWidget {
  const StaffScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final visibleRoles = getVisibleStaffRoles(game.gateState);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            ScreenHeader(
              title: 'STAFF',
              rightLabel: '${game.flops.floor()} flops',
              onBack: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    if (game.totalSalary > 0)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: AppColors.cardBg,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'TOTAL PAYROLL',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 11,
                                letterSpacing: 2,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '−${game.totalSalary.toStringAsFixed(1)} flops/sec',
                              style: const TextStyle(
                                color: AppColors.orange,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                fontFeatures: [FontFeature.tabularFigures()],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ...visibleRoles.map((role) => _StaffRow(role: role)),
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

class _StaffRow extends StatelessWidget {
  final StaffRole role;
  const _StaffRow({required this.role});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final owned = game.staff[role.id] ?? 0;
    final gates = game.gateState;
    final unlocked = role.isUnlocked(gates);
    final cost = getHireCost(role, owned);
    final refund =
        owned > 0 ? (getHireCost(role, owned - 1) * 0.5).floor() : 0;
    final canAfford = game.flops >= cost;
    final canHire = unlocked && canAfford;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Opacity(
        opacity: unlocked ? 1.0 : 0.55,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.cardBg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: unlocked ? AppColors.purple : AppColors.cardBg,
            ),
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
                          '${unlocked ? '' : '🔒 '}${role.icon} ${role.name}',
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
                            color: AppColors.purple,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      role.description,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      role.effectHint,
                      style: const TextStyle(
                        color: AppColors.purple,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Salary: ${role.salary} flops/sec each${owned > 0 ? ' · Total ${(role.salary * owned).toStringAsFixed(1)} flops/sec' : ''}',
                      style: const TextStyle(
                        color: AppColors.textDim,
                        fontSize: 11,
                      ),
                    ),
                    if (!unlocked)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          'REQUIRES: ${role.unlockHint.toUpperCase()}',
                          style: const TextStyle(
                            color: AppColors.gold,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                    if (owned > 0)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: GestureDetector(
                          onTap: () => game.fireStaff(role.id),
                          child: Text(
                            'Fire 1 · refund ${_formatCost(refund)}',
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
              GestureDetector(
                onTap: canHire ? () => game.hireStaff(role.id) : null,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                  decoration: BoxDecoration(
                    color: canHire
                        ? AppColors.purple
                        : const Color(0xFF222222),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'HIRE',
                        style: TextStyle(
                          color: canHire
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
                          color: canHire
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
      ),
    );
  }
}

String _formatCost(num n) {
  if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
  if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
  return '$n';
}
