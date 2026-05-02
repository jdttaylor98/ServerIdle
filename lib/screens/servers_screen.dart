import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../engine/game_state.dart';
import '../engine/servers.dart';
import '../engine/clusters.dart';
import '../engine/upgrades.dart';
import '../theme.dart';
import '../widgets/screen_header.dart';

class ServersScreen extends StatelessWidget {
  const ServersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();

    final visibleTiers = serverTiers
        .where((t) => isServerTierVisible(t.id, game.servers))
        .toList();

    final anyClusterUnlocked =
        clusterTypes.any((c) => isClusterUnlocked(c, game.upgrades));

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            ScreenHeader(
              title: 'SERVERS',
              rightLabel: '${game.credits.floor()} cr',
              onBack: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final tier in visibleTiers) _ServerRow(tier: tier),
                    if (anyClusterUnlocked) ...[
                      const SizedBox(height: 18),
                      const Text(
                        'CLUSTERS',
                        style: TextStyle(
                          color: Color(0xFF77AAFF),
                          fontSize: 12,
                          letterSpacing: 3,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Combine servers for a 1.5× output multiplier',
                        style: TextStyle(
                          color: AppColors.textDim,
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      const SizedBox(height: 12),
                      for (final ct in clusterTypes) _ClusterRow(type: ct),
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

class _ServerRow extends StatefulWidget {
  final ServerTier tier;
  const _ServerRow({required this.tier});

  @override
  State<_ServerRow> createState() => _ServerRowState();
}

class _ServerRowState extends State<_ServerRow> {
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer ??= Timer.periodic(
      const Duration(milliseconds: 250),
      (_) => setState(() {}),
    );
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final tier = widget.tier;
    final owned = game.servers[tier.id] ?? 0;
    final cost = getServerCost(tier, owned);
    final tierMult = getServerOutputMultiplier(tier.id, game.upgrades);
    final perUnit = tier.baseOutput * tierMult;
    final totalOutput = getServerOutput(tier, owned) * tierMult;
    final canAfford = game.credits >= cost;
    final refund = owned > 0
        ? (getServerCost(tier, owned - 1) * 0.5).floor()
        : 0;

    final isBuildingThis = game.activeBuild?.kind == BuildKind.server &&
        game.activeBuild?.id == tier.id;
    final isBuildingOther = game.activeBuild != null && !isBuildingThis;
    final buildable =
        tier.buildTimeSeconds != null && tier.buildTimeSeconds! > 0;

    if (isBuildingThis) {
      _startTimer();
    } else {
      _stopTimer();
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
                        tier.name,
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
                          color: AppColors.green,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    tier.description,
                    style: const TextStyle(
                      color: AppColors.textDim,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${perUnit.toStringAsFixed(2)} credits/sec each${tierMult > 1 ? ' (×${tierMult.toStringAsFixed(2)})' : ''}',
                    style: const TextStyle(
                      color: AppColors.textDim,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Total: ${totalOutput.toStringAsFixed(1)} credits/sec',
                    style: const TextStyle(
                      color: AppColors.green,
                      fontSize: 12,
                    ),
                  ),
                  Text(
                    '${tier.powerDraw}W · ${tier.heatOutput} BTU per unit${buildable ? ' · ${_formatDuration(tier.buildTimeSeconds!)} build' : ''}',
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
                      label: 'BUILDING…',
                      color: AppColors.green,
                    ),
                  if (owned > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: GestureDetector(
                        onTap: () => game.sellServer(tier.id),
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
                    ? () => game.buyServer(tier.id)
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
                        buildable ? 'BUILD' : 'BUY',
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

class _ClusterRow extends StatelessWidget {
  final ClusterType type;
  const _ClusterRow({required this.type});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();
    final owned = game.clusters[type.id] ?? 0;
    final unlocked = isClusterUnlocked(type, game.upgrades);
    final cost = getClusterCost(type, owned);
    final sourceOwned = game.servers[type.sourceTierId] ?? 0;

    final sourceTier = serverTiers.cast<ServerTier?>().firstWhere(
          (t) => t!.id == type.sourceTierId,
          orElse: () => null,
        );
    final tierMult = getServerOutputMultiplier(type.sourceTierId, game.upgrades);
    final outputPerCluster = sourceTier != null
        ? sourceTier.baseOutput *
            type.sourceCount *
            type.outputMultiplier *
            tierMult
        : 0.0;
    final totalOutput = getClusterOutput(type, owned, tierMult);

    final enoughSource = sourceOwned >= type.sourceCount;
    final canAfford = game.credits >= cost;
    final canBuild = unlocked && enoughSource && canAfford;
    final refund =
        owned > 0 ? (getClusterCost(type, owned - 1) * 0.5).floor() : 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Opacity(
        opacity: unlocked ? 1.0 : 0.6,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.cardBg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: unlocked
                  ? const Color(0xFF77AAFF)
                  : AppColors.cardBg,
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
                          '${unlocked ? '' : '🔒 '}${type.name}',
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
                            color: Color(0xFF77AAFF),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      type.description,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${outputPerCluster.toStringAsFixed(1)} cr/sec each${tierMult > 1 ? ' (×${tierMult.toStringAsFixed(2)})' : ''}',
                      style: const TextStyle(
                        color: Color(0xFF77AAFF),
                        fontSize: 12,
                      ),
                    ),
                    if (owned > 0)
                      Text(
                        'Total: ${totalOutput.toStringAsFixed(1)} cr/sec',
                        style: const TextStyle(
                          color: Color(0xFF77AAFF),
                          fontSize: 11,
                        ),
                      ),
                    const SizedBox(height: 4),
                    Text(
                      'Build cost: ${type.sourceCount} × ${sourceTier?.name ?? '?'} + ${_formatCost(cost)} cr',
                      style: const TextStyle(
                        color: AppColors.textDim,
                        fontSize: 11,
                      ),
                    ),
                    if (!unlocked)
                      const Padding(
                        padding: EdgeInsets.only(top: 4),
                        child: Text(
                          'Requires CLUSTER SOFTWARE upgrade',
                          style: TextStyle(
                            color: AppColors.gold,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                    if (unlocked && !enoughSource)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          'Need ${type.sourceCount - sourceOwned} more ${sourceTier?.name ?? ''}',
                          style: const TextStyle(
                            color: AppColors.orange,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    if (owned > 0)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: GestureDetector(
                          onTap: () => game.sellCluster(type.id),
                          child: Text(
                            'Sell 1 · refund ${_formatCost(refund)} (servers don\'t return)',
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
                onTap: canBuild ? () => game.buildCluster(type.id) : null,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: canBuild
                        ? const Color(0xFF77AAFF)
                        : const Color(0xFF222222),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'BUILD',
                        style: TextStyle(
                          color: canBuild
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
                          color: canBuild
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
                _formatMs(remainingMs),
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

String _formatDuration(int seconds) {
  if (seconds >= 60) return '${(seconds / 60).round()}min';
  return '${seconds}s';
}

String _formatMs(int ms) {
  final s = (ms / 1000).ceil();
  final m = s ~/ 60;
  final r = s % 60;
  return '$m:${r.toString().padLeft(2, '0')}';
}
