import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../engine/game_state.dart';
import '../engine/staff.dart';
import '../engine/research.dart';
import '../engine/regions.dart';
import '../engine/gpus.dart';
import '../engine/agents.dart';
import '../engine/prestige.dart';
import '../engine/upgrades.dart';
import '../theme.dart';
import '../widgets/mini_meter.dart';
import '../widgets/nav_tile.dart';
import 'servers_screen.dart';
import 'power_screen.dart';
import 'cooling_screen.dart';
import 'upgrades_screen.dart';
import 'staff_screen.dart';
import 'research_screen.dart';
import 'cloud_screen.dart';
import 'gpu_screen.dart';
import 'agent_screen.dart';
import 'prestige_screen.dart';
import 'skill_tree_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _devMode = false;
  int _devTapCount = 0;
  DateTime _lastDevTap = DateTime.now();

  void _handleTitleTap() {
    final now = DateTime.now();
    if (now.difference(_lastDevTap).inMilliseconds > 2000) {
      _devTapCount = 0;
    }
    _lastDevTap = now;
    _devTapCount++;
    if (_devTapCount >= 5) {
      setState(() => _devMode = !_devMode);
      _devTapCount = 0;
    }
  }

  void _pushScreen(Widget screen) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  void _showSettings(GameState game) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.cardBg,
        title: const Text('Settings', style: TextStyle(color: AppColors.textPrimary)),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _confirmReset(game);
            },
            child: const Text('Reset All Progress', style: TextStyle(color: AppColors.red)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Close', style: TextStyle(color: AppColors.textSecondary)),
          ),
        ],
      ),
    );
  }

  void _confirmReset(GameState game) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.cardBg,
        title: const Text('Reset Game?', style: TextStyle(color: AppColors.textPrimary)),
        content: const Text(
          'This wipes ALL progress — credits, servers, upgrades, prestige, skill tree, everything. This cannot be undone.',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              game.devResetGame();
              Navigator.of(ctx).pop();
            },
            child: const Text('Delete Everything', style: TextStyle(color: AppColors.red)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameState>();

    final cps = game.creditsPerSec;
    final salary = game.totalSalary;
    final cloudCost = game.cloudOperatingCost;
    final agentCostTotal = game.agentSalaryCost;
    final totalCosts = salary + cloudCost + agentCostTotal;
    final netCps = cps - totalCosts;

    final totalServers = game.servers.values.fold(0, (a, b) => a + b);
    final totalStaff = game.staff.values.fold(0, (a, b) => a + b);
    final pStats = game.powerStats;
    final cStats = game.coolingStats;

    final gates = game.gateState;
    final showStaffNav = isStaffNavVisible(gates);
    final staffRpPerSec = getResearchPointsPerSec(game.staff);
    final gpuRpPerSec = getTotalGpuRpOutput(game.gpus);
    final rpPerSec = staffRpPerSec + gpuRpPerSec;
    final showResearch = game.researchPoints > 0 || rpPerSec > 0 || gates.researchLabOwned;
    final showResearchNav = isResearchNavVisible(gates.researchLabOwned, game.researchPoints);
    final showCloudNav = isCloudUnlocked(game.upgrades);
    final showGpuNav = isGpuNavVisible(game.research);
    final totalGpuCount = game.gpus.values.fold(0, (a, b) => a + b);
    final showAgentsNav = isAgentsNavVisible(game.gpus);
    final hiredAgentCount = game.agents.values.where((v) => v).length;
    final agentSalaryDisplay = getTotalAgentSalary(game.agents);
    final ownedRegionCount = game.regions.values.where((v) => v).length;
    final showPrestigeNav = isPrestigeVisible(game.highestCredits);
    final showSkillsNav = game.prestigeCount >= 1;
    final ownedSkillCount = game.skills.values.where((v) => v).length;

    final tapCredits = (1 + getClickCreditBonus(game.upgrades)) *
        getClickCreditMultiplier(game.upgrades);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Top bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: _handleTitleTap,
                    child: const Text(
                      'SERVER IDLE',
                      style: TextStyle(
                        color: AppColors.green,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 3,
                      ),
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => _pushScreen(const UpgradesScreen()),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.border),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'UPGRADES →',
                        style: TextStyle(
                          color: AppColors.green,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => _showSettings(game),
                    child: const Text('⚙️', style: TextStyle(fontSize: 18)),
                  ),
                ],
              ),
            ),

            // Scrollable content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Onboarding hint
                    if (totalServers == 0 && game.credits < 10) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0A1A0A),
                          border: Border.all(color: AppColors.green),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Tap PROVISION to earn credits, then buy your first server below.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.green, fontSize: 13),
                        ),
                      ),
                    ],

                    // Stats card
                    Container(
                      padding: const EdgeInsets.all(18),
                      margin: const EdgeInsets.only(bottom: 18),
                      decoration: BoxDecoration(
                        color: AppColors.cardBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        children: [
                          Text(
                            game.credits.floor().toStringAsFixed(0).replaceAllMapped(
                                RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
                                (m) => '${m[1]},'),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 42,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const Text(
                            'credits',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${cps.toStringAsFixed(1)} / sec ${game.overclockEnabled ? '⚡' : ''}',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: game.overclockEnabled ? AppColors.red : AppColors.green,
                              fontSize: 14,
                            ),
                          ),
                          if (totalCosts > 0) ...[
                            const SizedBox(height: 4),
                            if (salary > 0)
                              Text(
                                '− ${salary.toStringAsFixed(1)} payroll',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                    color: AppColors.orange, fontSize: 11,
                                    fontFeatures: [FontFeature.tabularFigures()]),
                              ),
                            if (cloudCost > 0)
                              Text(
                                '− ${cloudCost.toStringAsFixed(0)} cloud ops',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                    color: AppColors.orange, fontSize: 11,
                                    fontFeatures: [FontFeature.tabularFigures()]),
                              ),
                            if (agentCostTotal > 0)
                              Text(
                                '− ${agentCostTotal.toStringAsFixed(0)} agents',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                    color: AppColors.orange, fontSize: 11,
                                    fontFeatures: [FontFeature.tabularFigures()]),
                              ),
                            Text(
                              '= ${netCps.toStringAsFixed(1)} net',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: netCps < 0 ? AppColors.red : AppColors.textPrimary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                fontFeatures: const [FontFeature.tabularFigures()],
                              ),
                            ),
                          ],
                          if (game.vendorDiscountAvailable)
                            const Padding(
                              padding: EdgeInsets.only(top: 6),
                              child: Text(
                                '💰 50% OFF NEXT SERVER',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    color: Color(0xFFDDEE77), fontSize: 11,
                                    fontWeight: FontWeight.bold, letterSpacing: 1),
                              ),
                            ),
                          if (showResearch) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.only(top: 8),
                              decoration: const BoxDecoration(
                                border: Border(top: BorderSide(color: AppColors.border)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    '🔬 RESEARCH',
                                    style: TextStyle(
                                        color: AppColors.textSecondary, fontSize: 10,
                                        fontWeight: FontWeight.bold, letterSpacing: 2),
                                  ),
                                  Text(
                                    '${game.researchPoints.toStringAsFixed(1)} RP${rpPerSec > 0 ? ' · +${rpPerSec.toStringAsFixed(2)}/sec' : ''}',
                                    style: const TextStyle(
                                        color: AppColors.purple, fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        fontFeatures: [FontFeature.tabularFigures()]),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          const Divider(color: AppColors.border, height: 28),
                          MiniMeter(
                            icon: '⚡',
                            label: 'POWER',
                            used: pStats.used,
                            capacity: pStats.capacity,
                            unit: 'W',
                          ),
                          MiniMeter(
                            icon: '❄',
                            label: 'COOLING',
                            used: cStats.used,
                            capacity: cStats.capacity,
                            unit: 'BTU',
                          ),
                        ],
                      ),
                    ),

                    // Provision button
                    GestureDetector(
                      onTap: game.tapProvision,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 16),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: AppColors.cardBg,
                          border: Border.all(color: AppColors.green, width: 2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          children: [
                            const Text(
                              'PROVISION',
                              style: TextStyle(
                                color: AppColors.green, fontSize: 18,
                                fontWeight: FontWeight.bold, letterSpacing: 2,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '+${tapCredits % 1 == 0 ? tapCredits.toInt() : tapCredits.toStringAsFixed(1)} credit${tapCredits == 1 ? '' : 's'}',
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Overclock toggle
                    _buildOverclockToggle(game),

                    // Dev tools (hidden)
                    if (_devMode) _buildDevPanel(game),

                    // Nav section
                    const Padding(
                      padding: EdgeInsets.only(top: 14, bottom: 10),
                      child: Text(
                        'BUILD',
                        style: TextStyle(
                          color: AppColors.textDim, fontSize: 11,
                          letterSpacing: 3, fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    NavTile(
                      icon: '🖥️',
                      label: 'SERVERS',
                      hint: '$totalServers owned',
                      onPress: () => _pushScreen(const ServersScreen()),
                    ),
                    NavTile(
                      icon: '⚡',
                      label: 'POWER',
                      hint: '${pStats.used.floor()} / ${pStats.capacity.floor()} W',
                      onPress: () => _pushScreen(const PowerScreen()),
                    ),
                    NavTile(
                      icon: '❄',
                      label: 'COOLING',
                      hint: '${cStats.used.floor()} / ${cStats.capacity.floor()} BTU',
                      onPress: () => _pushScreen(const CoolingScreen()),
                    ),
                    if (showStaffNav)
                      NavTile(
                        icon: '👥',
                        label: 'STAFF',
                        hint: totalStaff > 0
                            ? '$totalStaff hired · ${salary.toStringAsFixed(1)} cr/sec payroll'
                            : 'Hire your team',
                        onPress: () => _pushScreen(const StaffScreen()),
                      ),
                    if (showResearchNav)
                      NavTile(
                        icon: '🔬',
                        label: 'RESEARCH',
                        hint: '${game.researchPoints.toStringAsFixed(1)} RP available',
                        onPress: () => _pushScreen(const ResearchScreen()),
                      ),
                    if (showCloudNav)
                      NavTile(
                        icon: '🌐',
                        label: 'CLOUD',
                        hint: ownedRegionCount > 0
                            ? '$ownedRegionCount/4 regions leased'
                            : 'Lease cloud regions',
                        onPress: () => _pushScreen(const CloudScreen()),
                      ),
                    if (showGpuNav)
                      NavTile(
                        icon: '🎮',
                        label: 'GPU',
                        hint: totalGpuCount > 0
                            ? '$totalGpuCount units · ${getTotalGpuOutput(game.gpus).toStringAsFixed(0)} cr/sec'
                            : 'Build GPU hardware',
                        onPress: () => _pushScreen(const GpuScreen()),
                      ),
                    if (showAgentsNav)
                      NavTile(
                        icon: '🤖',
                        label: 'AI AGENTS',
                        hint: hiredAgentCount > 0
                            ? '$hiredAgentCount/3 active · ${agentSalaryDisplay.toStringAsFixed(0)} cr/sec'
                            : 'Hire AI to automate',
                        onPress: () => _pushScreen(const AgentScreen()),
                      ),
                    if (showPrestigeNav)
                      NavTile(
                        icon: '💼',
                        label: 'ACQUI-HIRE',
                        hint: game.skillPoints > 0
                            ? '${game.skillPoints} SP earned'
                            : 'Sell to BigCorp for SP',
                        onPress: () => _pushScreen(const PrestigeScreen()),
                      ),
                    if (showSkillsNav)
                      NavTile(
                        icon: '🌳',
                        label: 'SKILL TREE',
                        hint: ownedSkillCount > 0
                            ? '$ownedSkillCount/32 skills · ${game.skillPoints} SP'
                            : '${game.skillPoints} SP to spend',
                        onPress: () => _pushScreen(const SkillTreeScreen()),
                      ),

                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverclockToggle(GameState game) {
    final enabled = game.overclockEnabled;
    return GestureDetector(
      onTap: game.toggleOverclockEnabled,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: enabled ? const Color(0xFF2A0D18) : AppColors.cardBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: enabled ? AppColors.red : AppColors.border,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: enabled ? AppColors.red : const Color(0xFF444444),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'OVERCLOCK',
                  style: TextStyle(
                    color: enabled ? AppColors.red : AppColors.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 3),
              child: Text(
                enabled ? '+50% output · risk of failure' : 'tap to boost',
                style: TextStyle(
                  color: enabled
                      ? const Color(0xFFFF7799)
                      : AppColors.textDim,
                  fontSize: 11,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDevPanel(GameState game) {
    return Container(
      padding: const EdgeInsets.all(8),
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: AppColors.devBg,
        border: Border.all(color: AppColors.devBorder),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          const Text(
            'DEV TOOLS',
            style: TextStyle(
              color: AppColors.devBorder, fontSize: 9,
              fontWeight: FontWeight.bold, letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              _devBtn('+10K', () => game.addCredits(10000)),
              const SizedBox(width: 6),
              _devBtn('+1M', () => game.addCredits(1000000)),
              const SizedBox(width: 6),
              _devBtn('+10M', () => game.addCredits(10000000)),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              _devBtn('SKIP BUILD', game.devSkipBuild),
              const SizedBox(width: 6),
              _devBtn('+100 RP', () => game.devAddResearchPoints(100)),
              const SizedBox(width: 6),
              _devBtn('RESET', () => _confirmReset(game), danger: true),
            ],
          ),
        ],
      ),
    );
  }

  Widget _devBtn(String label, VoidCallback onTap, {bool danger = false}) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: danger ? AppColors.dangerBg : AppColors.devButton,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: danger ? const Color(0xFFFF7799) : AppColors.gold,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1,
            ),
          ),
        ),
      ),
    );
  }
}
