// GameState — central state management using ChangeNotifier (Provider).
// This is the Dart equivalent of the Zustand store in the React Native version.
//
// Note: The full game logic (tick, buy/sell, incidents, agents, prestige, etc.)
// is ported from engine/store.ts. All calculation functions are imported from
// the individual engine modules.

import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'servers.dart';
import 'capacity.dart';
import 'clusters.dart';
import 'upgrades.dart';
import 'incidents.dart';
import 'staff.dart';
import 'research.dart';
import 'regions.dart';
import 'gpus.dart';
import 'agents.dart';
import 'prestige.dart';
import 'skill_tree.dart';

const String _saveKey = 'serverIdle_save';
const int _maxOfflineSeconds = 8 * 60 * 60;
const double _baseCreditsPerSec = 0;
const double _overclockMultiplier = 1.5;
const double _overclockFailureChance = 0.005;
const int _cronJobsIntervalSec = 5;
const double _sellRefundRatio = 0.5;
const double _staffRefundRatio = 0.5;

class GameState extends ChangeNotifier {
  // ─── Run state ───
  double credits = 0;
  double researchPoints = 0;
  Map<String, int> servers = {};
  Map<String, int> clusters = {};
  Map<String, int> gpus = {};
  Map<String, int> capacity = {};
  Map<String, bool> upgrades = {};
  Map<String, bool> research = {};
  Map<String, bool> regions = {};
  Map<String, int> staff = {};
  Map<String, bool> agents = {};
  int agentAutonomy = 5;
  double agentDevOpsAccum = 0;
  double agentResponderAccum = 0;
  int totalStaffEverHired = 0;
  ActiveBuild? activeBuild;
  bool overclockEnabled = false;
  double cronTickAccumulator = 0;
  ActiveIncident? activeIncident;
  bool vendorDiscountAvailable = false;
  int ddosResolvedCount = 0;
  int diskFullResolvedCount = 0;
  int vendorOfferAcceptedCount = 0;
  IncidentResolution? lastIncidentResolution;
  ServerFailure? lastFailure;

  // ─── Meta-progression (survives prestige) ───
  double highestCredits = 0;
  int skillPoints = 0;
  int prestigeCount = 0;
  Map<String, bool> skills = {};

  // ─── System ───
  int lastSavedAt = DateTime.now().millisecondsSinceEpoch;
  double pendingOfflineEarnings = 0;
  bool hydrated = false;

  Timer? _tickTimer;
  Timer? _saveTimer;
  final Random _rng = Random();

  // ─── Derived getters ───

  double get creditsPerSec => calcCreditsPerSec(
        servers, clusters, gpus, capacity, upgrades,
        staff, research, regions, overclockEnabled, activeIncident, skills,
      );

  double get totalSalary => getTotalSalaryAmount(staff);

  double get cloudOperatingCost => getOwnedRegionsCost(regions);

  double get agentSalaryCost =>
      getTotalAgentSalary(agents) * getSkillAgentSalaryMult(skills);

  double get netCreditsPerSec =>
      creditsPerSec - totalSalary - cloudOperatingCost - agentSalaryCost;

  PowerCoolingStats get powerStats {
    final drawMult = getResearchPowerDrawMultiplier(research);
    final used = (getTotalPowerDraw(servers) +
            getTotalClusterPower(clusters) +
            getOwnedRegionsPower(regions) +
            getTotalGpuPower(gpus)) *
        drawMult;
    final cap = getTotalCapacityAmount(capacity, 'power') +
        getBonusPowerCapacity(upgrades) +
        getSkillBonusPower(skills);
    return PowerCoolingStats(
      used: used,
      capacity: cap,
      efficiency: getEfficiency(used, cap),
    );
  }

  PowerCoolingStats get coolingStats {
    final used = getTotalHeatOutput(servers) +
        getTotalClusterHeat(clusters) +
        getOwnedRegionsHeat(regions) +
        getTotalGpuHeat(gpus);
    final cap = getTotalCapacityAmount(capacity, 'cooling') *
            getResearchCoolingMultiplier(research) +
        getSkillBonusCooling(skills);
    return PowerCoolingStats(
      used: used,
      capacity: cap,
      efficiency: getEfficiency(used, cap),
    );
  }

  GateState get gateState => GateState(
        totalServers: servers.values.fold(0, (a, b) => a + b),
        totalClusters: clusters.values.fold(0, (a, b) => a + b),
        ddosResolvedCount: ddosResolvedCount,
        diskFullResolvedCount: diskFullResolvedCount,
        vendorOfferAcceptedCount: vendorOfferAcceptedCount,
        hotSwapOwned: upgrades['hot_swap'] ?? false,
        researchLabOwned: upgrades['research_lab'] ?? false,
        totalStaffHired: totalStaffEverHired,
      );

  // ─── Lifecycle ───

  void startTicking() {
    _tickTimer?.cancel();
    _tickTimer = Timer.periodic(const Duration(seconds: 1), (_) => tick());
    _saveTimer?.cancel();
    _saveTimer = Timer.periodic(const Duration(seconds: 1), (_) => saveGame());
  }

  void stopTicking() {
    _tickTimer?.cancel();
    _saveTimer?.cancel();
  }

  @override
  void dispose() {
    stopTicking();
    super.dispose();
  }

  // ─── Tick ───

  void tick() {
    // Build queue completion
    var nextServers = Map<String, int>.from(servers);
    var nextRegions = Map<String, bool>.from(regions);
    var nextGpus = Map<String, int>.from(gpus);
    ActiveBuild? nextActiveBuild = activeBuild;
    final now = DateTime.now().millisecondsSinceEpoch;

    if (activeBuild != null && now >= activeBuild!.completesAt) {
      if (activeBuild!.kind == BuildKind.server) {
        nextServers[activeBuild!.id] = (nextServers[activeBuild!.id] ?? 0) + 1;
      } else if (activeBuild!.kind == BuildKind.gpu) {
        nextGpus[activeBuild!.id] = (nextGpus[activeBuild!.id] ?? 0) + 1;
      } else {
        nextRegions[activeBuild!.id] = true;
      }
      nextActiveBuild = null;
    }

    // Incident expiration / random trigger
    ActiveIncident? nextIncident = activeIncident;
    double incidentPenalty = 0;
    IncidentResolution? incidentResolution;
    final skillPenaltyMult = getSkillTimeoutPenaltyMult(skills);

    if (nextIncident != null && now >= nextIncident.expiresAt) {
      final baseCps = calcCreditsPerSec(
        nextServers, clusters, nextGpus, capacity, upgrades,
        staff, research, nextRegions, false, null, skills,
      );
      final type = nextIncident.type;
      if (type == IncidentType.ddos) {
        incidentPenalty = baseCps * incidentConfigs[type]!.timeoutPenaltySecondsOfCps * skillPenaltyMult;
        incidentResolution = IncidentResolution(type: type, success: false, rewardCredits: 0, penaltyCredits: incidentPenalty);
      } else if (type == IncidentType.diskFull) {
        incidentPenalty = baseCps * incidentConfigs[type]!.timeoutPenaltySecondsOfCps * skillPenaltyMult;
        incidentResolution = IncidentResolution(type: type, success: false, rewardCredits: 0, penaltyCredits: incidentPenalty);
      } else if (type == IncidentType.memoryLeak) {
        incidentPenalty = credits * incidentConfigs[type]!.timeoutCreditPercent * skillPenaltyMult;
        incidentResolution = IncidentResolution(type: type, success: false, rewardCredits: 0, penaltyCredits: incidentPenalty);
      } else if (type == IncidentType.hackerBreach) {
        incidentPenalty = credits * incidentConfigs[type]!.timeoutCreditPercent * skillPenaltyMult;
        incidentResolution = IncidentResolution(type: type, success: false, rewardCredits: 0, penaltyCredits: incidentPenalty);
      } else {
        incidentResolution = IncidentResolution(type: type, success: false, rewardCredits: 0, penaltyCredits: 0);
      }
      nextIncident = null;
    } else if (nextIncident == null) {
      final totalServerCount = nextServers.values.fold(0, (a, b) => a + b);
      final totalClusterCount = clusters.values.fold(0, (a, b) => a + b);
      if (totalServerCount + totalClusterCount > 0 &&
          _rng.nextDouble() < incidentTriggerChancePerSec * getSkillIncidentTriggerMult(skills)) {
        final weights = getIncidentWeightModifiers(staff);
        final chosen = pickRandomIncident(weights, _rng);
        if (chosen != null) {
          nextIncident = createIncident(chosen);
          final timerBonus = getSkillIncidentTimerBonus(skills);
          if (timerBonus > 0) {
            nextIncident = nextIncident.copyWith(
              expiresAt: nextIncident.expiresAt + (timerBonus * 1000).round(),
            );
          }
          if (chosen == IncidentType.ddos) {
            final tapReduction = getSkillDdosTapReduction(skills);
            if (tapReduction > 0) {
              nextIncident = nextIncident.copyWith(
                tapsRemaining: max(1, (nextIncident.tapsRemaining ?? 0) - tapReduction),
              );
            }
          }
        }
      }
    }

    final cps = calcCreditsPerSec(
      nextServers, clusters, nextGpus, capacity, upgrades,
      staff, research, nextRegions, overclockEnabled, nextIncident, skills,
    );

    final salary = getTotalSalaryAmount(staff);
    final cloudCost = getOwnedRegionsCost(nextRegions);
    final agentSalary = getTotalAgentSalary(agents) * getSkillAgentSalaryMult(skills);
    final totalDrain = salary + cloudCost + agentSalary;

    // Research points
    final skillGpuRpMult = getSkillGpuRpMult(skills);
    final rpGain = (getResearchPointsPerSec(staff) +
            getTotalGpuRpOutput(nextGpus) * skillGpuRpMult) *
        getResearchRpMultiplier(research) *
        getSkillResearchMult(skills);

    // Cron jobs auto-tap
    double cronAccum = cronTickAccumulator + 1;
    double cronCredits = 0;
    if (hasCronJobs(upgrades) && cronAccum >= _cronJobsIntervalSec) {
      final taps = (cronAccum / _cronJobsIntervalSec).floor();
      cronAccum = cronAccum % _cronJobsIntervalSec;
      final perTap = (1 + getClickCreditBonus(upgrades) + getSkillTapBonus(skills)) *
          getClickCreditMultiplier(upgrades) *
          getResearchClickMultiplier(research);
      cronCredits = perTap * taps;
    }

    // ─── AI Agent actions ───
    bool nextOverclock = overclockEnabled;
    double devOpsAccum = agentDevOpsAccum + 1;
    double responderAccum = agentResponderAccum;
    bool agentAutoResolved = false;
    double agentAutoReward = 0;
    final agentSpeedMult = getSkillAgentSpeedMult(skills);

    // Cost Optimizer
    if (agents['cost_optimizer'] == true) {
      final hasRedundantPsu = upgrades['hot_swap'] ?? false;
      final sreCount = staff['sre'] ?? 0;
      nextOverclock = shouldOverclock(agentAutonomy, hasRedundantPsu, sreCount);
    }

    // DevOps Agent
    var nextCapacity = Map<String, int>.from(capacity);
    if (agents['devops_agent'] == true) {
      final interval = max(1, (getDevOpsInterval(agentAutonomy) * agentSpeedMult).round());
      if (devOpsAccum >= interval) {
        devOpsAccum = 0;
        final currentCredits = credits + cps + cronCredits - totalDrain - incidentPenalty;
        final minEff = getDevOpsMinEfficiency(agentAutonomy);

        final powerDrawMult = getResearchPowerDrawMultiplier(research);
        final coolingCapMult = getResearchCoolingMultiplier(research);
        final curPowerUsed = (getTotalPowerDraw(nextServers) +
                getTotalClusterPower(clusters) +
                getOwnedRegionsPower(nextRegions) +
                getTotalGpuPower(nextGpus)) *
            powerDrawMult;
        final curHeatUsed = getTotalHeatOutput(nextServers) +
            getTotalClusterHeat(clusters) +
            getOwnedRegionsHeat(nextRegions) +
            getTotalGpuHeat(nextGpus);
        final curPowerCap = getTotalCapacityAmount(nextCapacity, 'power') +
            getBonusPowerCapacity(upgrades) +
            getSkillBonusPower(skills);
        final curCoolingCap =
            getTotalCapacityAmount(nextCapacity, 'cooling') * coolingCapMult +
                getSkillBonusCooling(skills);
        final powerEff = getEfficiency(curPowerUsed, curPowerCap);
        final coolingEff = getEfficiency(curHeatUsed, curCoolingCap);
        final curEff = min(powerEff, coolingEff);

        double spent = 0;
        if (curEff < minEff) {
          final resourceNeeded = powerEff <= coolingEff ? 'power' : 'cooling';
          final candidates =
              capacityBuildings.where((b) => b.resource == resourceNeeded).toList();
          for (int i = candidates.length - 1; i >= 0; i--) {
            final b = candidates[i];
            final owned = nextCapacity[b.id] ?? 0;
            final cost = getCapacityBuildingCost(b, owned);
            if (cost <= currentCredits - spent) {
              nextCapacity[b.id] = owned + 1;
              spent += cost;
              break;
            }
          }
        } else {
          final affordableTiers = serverTiers.where((t) {
            final owned = nextServers[t.id] ?? 0;
            final cost = getServerCost(t, owned);
            return cost <= currentCredits - spent && (t.buildTimeSeconds == null || t.buildTimeSeconds == 0);
          }).toList();
          if (affordableTiers.isNotEmpty) {
            final best = affordableTiers.last;
            final owned = nextServers[best.id] ?? 0;
            final cost = getServerCost(best, owned);
            nextServers[best.id] = owned + 1;
            spent += cost;
          }
        }
        incidentPenalty += spent;
      }
    }

    // Incident Responder
    if (agents['incident_responder'] == true && nextIncident != null) {
      responderAccum += 1;
      final delay = max(1, (getResponderDelay(agentAutonomy) * agentSpeedMult).round());
      if (responderAccum >= delay) {
        final baseCps = calcCreditsPerSec(
          nextServers, clusters, nextGpus, capacity, upgrades,
          staff, research, nextRegions, false, null, skills,
        );
        double rewardMult = getResponderRewardMult(agentAutonomy);
        if (getSkillResponderBonus(skills)) {
          rewardMult = rewardMult + (1 - rewardMult) / 2;
        }

        final type = nextIncident.type;
        if (type == IncidentType.vendorOffer) {
          vendorDiscountAvailable = true;
          vendorOfferAcceptedCount++;
          agentAutoResolved = true;
        } else {
          final config = incidentConfigs[type]!;
          agentAutoReward = baseCps * config.rewardSecondsOfCps * rewardMult;
          agentAutoResolved = true;
        }

        if (agentAutoResolved) {
          incidentResolution = IncidentResolution(
            type: nextIncident.type,
            success: true,
            rewardCredits: agentAutoReward,
            penaltyCredits: 0,
          );
          nextIncident = null;
          responderAccum = 0;
        }
      }
    } else {
      responderAccum = 0;
    }

    if (!(agents['cost_optimizer'] == true)) {
      nextOverclock = overclockEnabled;
    }

    // Overclock failure check
    if (nextOverclock) {
      final totalServerCount = nextServers.values.fold(0, (a, b) => a + b);
      final failureChance = _overclockFailureChance *
          getOverclockFailureMultiplier(staff) *
          getOverclockFailureChanceMultiplier(upgrades) *
          getSkillOverclockFailureMult(skills);
      if (totalServerCount > 0 && _rng.nextDouble() < failureChance) {
        final ownedTiers =
            serverTiers.where((t) => (nextServers[t.id] ?? 0) > 0).toList();
        if (ownedTiers.isNotEmpty) {
          final victim = ownedTiers[_rng.nextInt(ownedTiers.length)];
          final newCredits = max(0.0, credits + cps + cronCredits + agentAutoReward - totalDrain - incidentPenalty);
          credits = newCredits;
          highestCredits = max(highestCredits, newCredits);
          researchPoints += rpGain;
          servers = nextServers;
          servers[victim.id] = (servers[victim.id] ?? 1) - 1;
          this.gpus = nextGpus;
          this.capacity = nextCapacity;
          this.regions = nextRegions;
          overclockEnabled = false;
          cronTickAccumulator = cronAccum;
          activeBuild = nextActiveBuild;
          activeIncident = nextIncident;
          lastIncidentResolution = incidentResolution;
          lastFailure = ServerFailure(tierId: victim.id, lost: 1);
          agentDevOpsAccum = devOpsAccum;
          agentResponderAccum = responderAccum;
          notifyListeners();
          return;
        }
      }
    }

    final newCredits = max(0.0, credits + cps + cronCredits + agentAutoReward - totalDrain - incidentPenalty);
    credits = newCredits;
    highestCredits = max(highestCredits, newCredits);
    researchPoints += rpGain;
    servers = nextServers;
    this.gpus = nextGpus;
    this.capacity = nextCapacity;
    this.regions = nextRegions;
    overclockEnabled = nextOverclock;
    cronTickAccumulator = cronAccum;
    activeBuild = nextActiveBuild;
    activeIncident = nextIncident;
    lastIncidentResolution = incidentResolution;
    agentDevOpsAccum = devOpsAccum;
    agentResponderAccum = responderAccum;
    notifyListeners();
  }

  // ─── Actions ───

  void addCredits(double amount) {
    credits += amount;
    notifyListeners();
  }

  void tapProvision() {
    final tapCredits = (1 + getClickCreditBonus(upgrades) + getSkillTapBonus(skills)) *
        getClickCreditMultiplier(upgrades) *
        getResearchClickMultiplier(research);
    credits += tapCredits;
    notifyListeners();
  }

  void buyServer(String tierId) {
    final tier = serverTiers.firstWhere((t) => t.id == tierId, orElse: () => serverTiers.first);
    if (tier.id != tierId) return;
    final owned = servers[tierId] ?? 0;
    final rawCost = getServerCost(tier, owned);
    final fullCost = (rawCost * getSkillServerCostMult(skills)).floor();
    final cost = vendorDiscountAvailable ? (fullCost * 0.5).floor() : fullCost;
    if (credits < cost) return;

    if (tier.buildTimeSeconds != null && tier.buildTimeSeconds! > 0) {
      if (activeBuild != null) return;
      final now = DateTime.now().millisecondsSinceEpoch;
      final buildMs = (tier.buildTimeSeconds! * 1000 * getSkillBuildTimeMult(skills)).round();
      credits -= cost;
      vendorDiscountAvailable = false;
      activeBuild = ActiveBuild(
        kind: BuildKind.server, id: tierId,
        startedAt: now, completesAt: now + buildMs,
      );
      notifyListeners();
      return;
    }

    credits -= cost;
    servers[tierId] = owned + 1;
    vendorDiscountAvailable = false;
    notifyListeners();
  }

  void sellServer(String tierId) {
    final tier = serverTiers.firstWhere((t) => t.id == tierId, orElse: () => serverTiers.first);
    if (tier.id != tierId) return;
    final owned = servers[tierId] ?? 0;
    if (owned <= 0) return;
    final refund = (getServerCost(tier, owned - 1) * _sellRefundRatio).floor();
    credits += refund;
    servers[tierId] = owned - 1;
    notifyListeners();
  }

  void buyGpu(String tierId) {
    final tier = gpuTiers.firstWhere((t) => t.id == tierId, orElse: () => gpuTiers.first);
    if (tier.id != tierId) return;
    if (activeBuild != null) return;
    final owned = gpus[tierId] ?? 0;
    final cost = getGpuCost(tier, owned);
    if (credits < cost) return;
    final now = DateTime.now().millisecondsSinceEpoch;
    final buildMs = (tier.buildTimeSeconds * 1000 * getSkillBuildTimeMult(skills)).round();
    credits -= cost;
    activeBuild = ActiveBuild(
      kind: BuildKind.gpu, id: tierId,
      startedAt: now, completesAt: now + buildMs,
    );
    notifyListeners();
  }

  void sellGpu(String tierId) {
    final tier = gpuTiers.firstWhere((t) => t.id == tierId, orElse: () => gpuTiers.first);
    if (tier.id != tierId) return;
    final owned = gpus[tierId] ?? 0;
    if (owned <= 0) return;
    final refund = (getGpuCost(tier, owned - 1) * _sellRefundRatio).floor();
    credits += refund;
    gpus[tierId] = owned - 1;
    notifyListeners();
  }

  void buyRegion(String regionId) {
    final region = cloudRegions.firstWhere((r) => r.id == regionId, orElse: () => cloudRegions.first);
    if (region.id != regionId) return;
    if (regions[regionId] == true) return;
    if (activeBuild != null) return;
    final cost = (region.cost * getSkillCloudCostMult(skills)).floor();
    if (credits < cost) return;
    final now = DateTime.now().millisecondsSinceEpoch;
    final buildMs = (region.buildTimeSeconds * 1000 * getSkillBuildTimeMult(skills)).round();
    credits -= cost;
    activeBuild = ActiveBuild(
      kind: BuildKind.region, id: regionId,
      startedAt: now, completesAt: now + buildMs,
    );
    notifyListeners();
  }

  void sellRegion(String regionId) {
    final region = cloudRegions.firstWhere((r) => r.id == regionId, orElse: () => cloudRegions.first);
    if (region.id != regionId) return;
    if (regions[regionId] != true) return;
    final refund = (region.cost * _sellRefundRatio).floor();
    credits += refund;
    regions.remove(regionId);
    notifyListeners();
  }

  void cancelBuild() {
    if (activeBuild == null) return;
    double refund = 0;
    if (activeBuild!.kind == BuildKind.server) {
      final tier = serverTiers.firstWhere((t) => t.id == activeBuild!.id, orElse: () => serverTiers.first);
      if (tier.id == activeBuild!.id) {
        final owned = servers[activeBuild!.id] ?? 0;
        refund = getServerCost(tier, owned) * 0.5;
      }
    } else if (activeBuild!.kind == BuildKind.gpu) {
      final tier = gpuTiers.firstWhere((t) => t.id == activeBuild!.id, orElse: () => gpuTiers.first);
      if (tier.id == activeBuild!.id) {
        final owned = gpus[activeBuild!.id] ?? 0;
        refund = getGpuCost(tier, owned) * 0.5;
      }
    } else {
      final region = cloudRegions.firstWhere((r) => r.id == activeBuild!.id, orElse: () => cloudRegions.first);
      if (region.id == activeBuild!.id) refund = region.cost * 0.5;
    }
    credits += refund;
    activeBuild = null;
    notifyListeners();
  }

  void buildCluster(String clusterId) {
    final type = clusterTypes.firstWhere((c) => c.id == clusterId, orElse: () => clusterTypes.first);
    if (type.id != clusterId) return;
    if (!isClusterUnlocked(type, upgrades)) return;
    final owned = clusters[clusterId] ?? 0;
    final cost = getClusterCost(type, owned);
    if (credits < cost) return;
    final sourceOwned = servers[type.sourceTierId] ?? 0;
    if (sourceOwned < type.sourceCount) return;
    credits -= cost;
    servers[type.sourceTierId] = sourceOwned - type.sourceCount;
    clusters[clusterId] = owned + 1;
    notifyListeners();
  }

  void sellCluster(String clusterId) {
    final type = clusterTypes.firstWhere((c) => c.id == clusterId, orElse: () => clusterTypes.first);
    if (type.id != clusterId) return;
    final owned = clusters[clusterId] ?? 0;
    if (owned <= 0) return;
    final refund = (getClusterCost(type, owned - 1) * _sellRefundRatio).floor();
    credits += refund;
    clusters[clusterId] = owned - 1;
    notifyListeners();
  }

  void buyCapacityBuilding(String buildingId) {
    final building = capacityBuildings.firstWhere((b) => b.id == buildingId, orElse: () => capacityBuildings.first);
    if (building.id != buildingId) return;
    final owned = capacity[buildingId] ?? 0;
    final cost = getCapacityBuildingCost(building, owned);
    if (credits < cost) return;
    credits -= cost;
    capacity[buildingId] = owned + 1;
    notifyListeners();
  }

  void sellCapacityBuilding(String buildingId) {
    final building = capacityBuildings.firstWhere((b) => b.id == buildingId, orElse: () => capacityBuildings.first);
    if (building.id != buildingId) return;
    final owned = capacity[buildingId] ?? 0;
    if (owned <= 0) return;
    final refund = (getCapacityBuildingCost(building, owned - 1) * _sellRefundRatio).floor();
    credits += refund;
    capacity[buildingId] = owned - 1;
    notifyListeners();
  }

  void buyUpgrade(String upgradeId) {
    final upgrade = allUpgrades.firstWhere((u) => u.id == upgradeId, orElse: () => allUpgrades.first);
    if (upgrade.id != upgradeId) return;
    if (upgrades[upgradeId] == true) return;
    if (!isUpgradeAvailable(upgrade, upgrades, servers)) return;
    final cost = (upgrade.cost * getSkillUpgradeCostMult(skills)).floor();
    if (credits < cost) return;
    credits -= cost;
    upgrades[upgradeId] = true;
    notifyListeners();
  }

  void buyResearch(String nodeId) {
    final node = researchNodes.firstWhere((n) => n.id == nodeId, orElse: () => researchNodes.first);
    if (node.id != nodeId) return;
    if (research[nodeId] == true) return;
    if (!isResearchAvailable(node, research)) return;
    if (researchPoints < node.cost) return;
    researchPoints -= node.cost;
    research[nodeId] = true;
    notifyListeners();
  }

  void hireStaff(String roleId) {
    final role = staffRoles.firstWhere((r) => r.id == roleId, orElse: () => staffRoles.first);
    if (role.id != roleId) return;
    final owned = staff[roleId] ?? 0;
    final cost = (getHireCost(role, owned) * getSkillStaffCostMult(skills)).floor();
    if (credits < cost) return;
    if (!role.isUnlocked(gateState)) return;
    credits -= cost;
    staff[roleId] = owned + 1;
    totalStaffEverHired++;
    notifyListeners();
  }

  void fireStaff(String roleId) {
    final role = staffRoles.firstWhere((r) => r.id == roleId, orElse: () => staffRoles.first);
    if (role.id != roleId) return;
    final owned = staff[roleId] ?? 0;
    if (owned <= 0) return;
    final refund = (getHireCost(role, owned - 1) * _staffRefundRatio).floor();
    credits += refund;
    staff[roleId] = owned - 1;
    notifyListeners();
  }

  void hireAgent(String agentId) {
    final agent = agentTypes.firstWhere((a) => a.id == agentId, orElse: () => agentTypes.first);
    if (agent.id != agentId) return;
    if (agents[agentId] == true) return;
    final cost = (agent.cost * getSkillAgentCostMult(skills)).floor();
    if (credits < cost) return;
    credits -= cost;
    agents[agentId] = true;
    notifyListeners();
  }

  void fireAgent(String agentId) {
    final agent = agentTypes.firstWhere((a) => a.id == agentId, orElse: () => agentTypes.first);
    if (agent.id != agentId) return;
    if (agents[agentId] != true) return;
    final refund = (agent.cost * 0.5).floor();
    credits += refund;
    agents.remove(agentId);
    notifyListeners();
  }

  void setAgentAutonomyLevel(int level) {
    agentAutonomy = level.clamp(1, 10);
    notifyListeners();
  }

  void toggleOverclockEnabled() {
    overclockEnabled = !overclockEnabled;
    notifyListeners();
  }

  void clearFailureNotice() {
    lastFailure = null;
    notifyListeners();
  }

  void clearIncidentResolution() {
    lastIncidentResolution = null;
    notifyListeners();
  }

  // ─── Incident actions ───

  void resolveIncident() {
    if (activeIncident == null) return;
    final type = activeIncident!.type;
    if (type != IncidentType.diskFull && type != IncidentType.memoryLeak) return;
    final baseCps = calcCreditsPerSec(
      servers, clusters, gpus, capacity, upgrades,
      staff, research, regions, false, null, skills,
    );
    final config = incidentConfigs[type]!;
    final reward = baseCps * config.rewardSecondsOfCps * getSkillIncidentRewardMult(skills);
    credits += reward;
    if (type == IncidentType.diskFull) diskFullResolvedCount++;
    activeIncident = null;
    lastIncidentResolution = IncidentResolution(type: type, success: true, rewardCredits: reward, penaltyCredits: 0);
    notifyListeners();
  }

  void tapDdosMitigate() {
    if (activeIncident == null || activeIncident!.type != IncidentType.ddos) return;
    final remaining = (activeIncident!.tapsRemaining ?? 1) - 1;
    if (remaining > 0) {
      activeIncident = activeIncident!.copyWith(tapsRemaining: remaining);
      notifyListeners();
      return;
    }
    final baseCps = calcCreditsPerSec(
      servers, clusters, gpus, capacity, upgrades,
      staff, research, regions, false, null, skills,
    );
    final reward = baseCps * incidentConfigs[IncidentType.ddos]!.rewardSecondsOfCps * getSkillIncidentRewardMult(skills);
    credits += reward;
    ddosResolvedCount++;
    activeIncident = null;
    lastIncidentResolution = IncidentResolution(type: IncidentType.ddos, success: true, rewardCredits: reward, penaltyCredits: 0);
    notifyListeners();
  }

  void tapHackerSequence(String letter) {
    if (activeIncident == null || activeIncident!.type != IncidentType.hackerBreach) return;
    final seq = activeIncident!.sequence ?? [];
    final step = activeIncident!.currentStep ?? 0;
    if (step >= seq.length) return;
    final expected = seq[step];
    if (letter == expected) {
      final nextStep = step + 1;
      if (nextStep >= seq.length) {
        final baseCps = calcCreditsPerSec(
          servers, clusters, gpus, capacity, upgrades,
          staff, research, regions, false, null, skills,
        );
        final reward = baseCps *
            incidentConfigs[IncidentType.hackerBreach]!.rewardSecondsOfCps *
            getSkillIncidentRewardMult(skills) *
            getSkillHackerRewardMult(skills);
        credits += reward;
        activeIncident = null;
        lastIncidentResolution = IncidentResolution(type: IncidentType.hackerBreach, success: true, rewardCredits: reward, penaltyCredits: 0);
      } else {
        activeIncident = activeIncident!.copyWith(currentStep: nextStep);
      }
    } else {
      activeIncident = activeIncident!.copyWith(currentStep: 0);
    }
    notifyListeners();
  }

  void acceptVendorOffer() {
    if (activeIncident == null || activeIncident!.type != IncidentType.vendorOffer) return;
    vendorDiscountAvailable = true;
    vendorOfferAcceptedCount++;
    activeIncident = null;
    lastIncidentResolution = IncidentResolution(type: IncidentType.vendorOffer, success: true, rewardCredits: 0, penaltyCredits: 0);
    notifyListeners();
  }

  // ─── Prestige ───

  void doPrestige() {
    final spEarned = calcSkillPointsEarned(highestCredits);
    if (spEarned <= 0) return;
    final startCredits = getSkillStartingCredits(skills);
    final startServers = getSkillStartingServers(skills);

    credits = startCredits.toDouble();
    researchPoints = 0;
    servers = startServers;
    clusters = {};
    gpus = {};
    capacity = {};
    upgrades = {};
    research = {};
    regions = {};
    staff = {};
    agents = {};
    agentAutonomy = 5;
    agentDevOpsAccum = 0;
    agentResponderAccum = 0;
    highestCredits = startCredits.toDouble();
    skillPoints += spEarned;
    prestigeCount++;
    totalStaffEverHired = 0;
    activeBuild = null;
    overclockEnabled = false;
    cronTickAccumulator = 0;
    activeIncident = null;
    vendorDiscountAvailable = false;
    ddosResolvedCount = 0;
    diskFullResolvedCount = 0;
    vendorOfferAcceptedCount = 0;
    lastIncidentResolution = null;
    lastFailure = null;
    pendingOfflineEarnings = 0;
    notifyListeners();
  }

  void buySkill(String skillId) {
    final node = skillNodes.firstWhere((n) => n.id == skillId, orElse: () => skillNodes.first);
    if (node.id != skillId) return;
    if (!isSkillAvailable(node, skills, prestigeCount)) return;
    if (skillPoints < node.cost) return;
    skillPoints -= node.cost;
    skills[skillId] = true;
    notifyListeners();
  }

  // ─── Dev tools ───

  void devTriggerIncident(IncidentType type) {
    activeIncident = createIncident(type);
    notifyListeners();
  }

  void devSkipBuild() {
    if (activeBuild == null) return;
    if (activeBuild!.kind == BuildKind.server) {
      servers[activeBuild!.id] = (servers[activeBuild!.id] ?? 0) + 1;
    } else if (activeBuild!.kind == BuildKind.gpu) {
      gpus[activeBuild!.id] = (gpus[activeBuild!.id] ?? 0) + 1;
    } else {
      regions[activeBuild!.id] = true;
    }
    activeBuild = null;
    notifyListeners();
  }

  void devAddResearchPoints(double n) {
    researchPoints += n;
    notifyListeners();
  }

  Future<void> devResetGame() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_saveKey);
    credits = 0;
    researchPoints = 0;
    servers = {};
    clusters = {};
    gpus = {};
    capacity = {};
    upgrades = {};
    research = {};
    regions = {};
    staff = {};
    agents = {};
    agentAutonomy = 5;
    agentDevOpsAccum = 0;
    agentResponderAccum = 0;
    highestCredits = 0;
    skillPoints = 0;
    prestigeCount = 0;
    skills = {};
    totalStaffEverHired = 0;
    activeBuild = null;
    overclockEnabled = false;
    cronTickAccumulator = 0;
    activeIncident = null;
    vendorDiscountAvailable = false;
    ddosResolvedCount = 0;
    diskFullResolvedCount = 0;
    vendorOfferAcceptedCount = 0;
    lastIncidentResolution = null;
    lastFailure = null;
    pendingOfflineEarnings = 0;
    lastSavedAt = DateTime.now().millisecondsSinceEpoch;
    notifyListeners();
  }

  // ─── Offline earnings ───

  Future<void> collectOfflineEarnings() async {
    if (pendingOfflineEarnings <= 0) return;
    credits += pendingOfflineEarnings;
    pendingOfflineEarnings = 0;
    notifyListeners();
    await saveGame();
  }

  // ─── Persistence ───

  Future<void> saveGame() async {
    final prefs = await SharedPreferences.getInstance();
    final now = DateTime.now().millisecondsSinceEpoch;
    final data = {
      'credits': credits,
      'researchPoints': researchPoints,
      'servers': servers,
      'clusters': clusters,
      'gpus': gpus,
      'capacity': capacity,
      'upgrades': upgrades,
      'research': research,
      'regions': regions,
      'staff': staff,
      'agents': agents,
      'agentAutonomy': agentAutonomy,
      'highestCredits': highestCredits,
      'skillPoints': skillPoints,
      'prestigeCount': prestigeCount,
      'skills': skills,
      'totalStaffEverHired': totalStaffEverHired,
      'activeBuild': activeBuild?.toJson(),
      'overclockEnabled': overclockEnabled,
      'vendorDiscountAvailable': vendorDiscountAvailable,
      'ddosResolvedCount': ddosResolvedCount,
      'diskFullResolvedCount': diskFullResolvedCount,
      'vendorOfferAcceptedCount': vendorOfferAcceptedCount,
      'savedAt': now,
      'pendingOfflineEarnings': pendingOfflineEarnings,
    };
    await prefs.setString(_saveKey, jsonEncode(data));
    lastSavedAt = now;
  }

  Future<void> loadGame() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_saveKey);
    if (raw == null) {
      hydrated = true;
      lastSavedAt = DateTime.now().millisecondsSinceEpoch;
      notifyListeners();
      return;
    }

    final data = jsonDecode(raw) as Map<String, dynamic>;
    final now = DateTime.now().millisecondsSinceEpoch;
    final savedAt = (data['savedAt'] as num?)?.toInt() ?? now;
    final elapsedSec = ((now - savedAt) / 1000).clamp(0, _maxOfflineSeconds).toDouble();

    final savedServers = _toIntMap(data['servers']);
    final savedClusters = _toIntMap(data['clusters']);
    final savedGpus = _toIntMap(data['gpus']);
    final savedCapacity = _toIntMap(data['capacity']);
    final savedUpgrades = _toBoolMap(data['upgrades']);
    final savedResearch = _toBoolMap(data['research']);
    final savedRegions = _toBoolMap(data['regions']);
    final savedStaff = _toIntMap(data['staff']);
    final savedAgents = _toBoolMap(data['agents']);
    final savedSkills = _toBoolMap(data['skills']);

    // Complete build if timer expired while offline
    var loadedServers = Map<String, int>.from(savedServers);
    var loadedGpus = Map<String, int>.from(savedGpus);
    var loadedRegions = Map<String, bool>.from(savedRegions);
    ActiveBuild? loadedBuild = data['activeBuild'] != null
        ? ActiveBuild.fromJson(data['activeBuild'] as Map<String, dynamic>)
        : null;
    if (loadedBuild != null && now >= loadedBuild.completesAt) {
      if (loadedBuild.kind == BuildKind.server) {
        loadedServers[loadedBuild.id] = (loadedServers[loadedBuild.id] ?? 0) + 1;
      } else if (loadedBuild.kind == BuildKind.gpu) {
        loadedGpus[loadedBuild.id] = (loadedGpus[loadedBuild.id] ?? 0) + 1;
      } else {
        loadedRegions[loadedBuild.id] = true;
      }
      loadedBuild = null;
    }

    final grossCps = calcCreditsPerSec(
      loadedServers, savedClusters, loadedGpus, savedCapacity,
      savedUpgrades, savedStaff, savedResearch, loadedRegions,
      data['overclockEnabled'] as bool? ?? false, null, savedSkills,
    );
    final salaryAmt = getTotalSalaryAmount(savedStaff);
    final cloudCostAmt = getOwnedRegionsCost(loadedRegions);
    final agentCostAmt = getTotalAgentSalary(savedAgents) * getSkillAgentSalaryMult(savedSkills);
    final netCps = max(0.0, grossCps - salaryAmt - cloudCostAmt - agentCostAmt);
    final offlineEff = getSkillOfflineEfficiency(savedSkills);
    final newOffline = elapsedSec * netCps * offlineEff;
    final totalPending = ((data['pendingOfflineEarnings'] as num?)?.toDouble() ?? 0) + newOffline;

    // RP accumulates offline at full rate
    final rpRate = (getResearchPointsPerSec(savedStaff) +
            getTotalGpuRpOutput(loadedGpus) * getSkillGpuRpMult(savedSkills)) *
        getResearchRpMultiplier(savedResearch) *
        getSkillResearchMult(savedSkills);
    final rpGained = elapsedSec * rpRate;

    credits = (data['credits'] as num?)?.toDouble() ?? 0;
    researchPoints = ((data['researchPoints'] as num?)?.toDouble() ?? 0) + rpGained;
    servers = loadedServers;
    clusters = savedClusters;
    gpus = loadedGpus;
    capacity = savedCapacity;
    upgrades = savedUpgrades;
    research = savedResearch;
    regions = loadedRegions;
    staff = savedStaff;
    agents = savedAgents;
    agentAutonomy = (data['agentAutonomy'] as num?)?.toInt() ?? 5;
    agentDevOpsAccum = 0;
    agentResponderAccum = 0;
    highestCredits = (data['highestCredits'] as num?)?.toDouble() ?? 0;
    skillPoints = (data['skillPoints'] as num?)?.toInt() ?? 0;
    prestigeCount = (data['prestigeCount'] as num?)?.toInt() ?? 0;
    skills = savedSkills;
    totalStaffEverHired = (data['totalStaffEverHired'] as num?)?.toInt() ?? 0;
    activeBuild = loadedBuild;
    overclockEnabled = data['overclockEnabled'] as bool? ?? false;
    vendorDiscountAvailable = data['vendorDiscountAvailable'] as bool? ?? false;
    ddosResolvedCount = (data['ddosResolvedCount'] as num?)?.toInt() ?? 0;
    diskFullResolvedCount = (data['diskFullResolvedCount'] as num?)?.toInt() ?? 0;
    vendorOfferAcceptedCount = (data['vendorOfferAcceptedCount'] as num?)?.toInt() ?? 0;
    activeIncident = null;
    pendingOfflineEarnings = totalPending;
    lastSavedAt = now;
    hydrated = true;
    notifyListeners();
    await saveGame();
  }

  // ─── Helpers ───

  static Map<String, int> _toIntMap(dynamic data) {
    if (data == null) return {};
    return (data as Map<String, dynamic>).map(
      (k, v) => MapEntry(k, (v as num).toInt()),
    );
  }

  static Map<String, bool> _toBoolMap(dynamic data) {
    if (data == null) return {};
    return (data as Map<String, dynamic>).map(
      (k, v) => MapEntry(k, v as bool),
    );
  }
}

// ─── Helper types ───

enum BuildKind { server, region, gpu }

class ActiveBuild {
  final BuildKind kind;
  final String id;
  final int startedAt;
  final int completesAt;

  const ActiveBuild({
    required this.kind,
    required this.id,
    required this.startedAt,
    required this.completesAt,
  });

  Map<String, dynamic> toJson() => {
        'kind': kind.name,
        'id': id,
        'startedAt': startedAt,
        'completesAt': completesAt,
      };

  factory ActiveBuild.fromJson(Map<String, dynamic> json) => ActiveBuild(
        kind: BuildKind.values.firstWhere((e) => e.name == json['kind']),
        id: json['id'] as String,
        startedAt: (json['startedAt'] as num).toInt(),
        completesAt: (json['completesAt'] as num).toInt(),
      );
}

class ServerFailure {
  final String tierId;
  final int lost;
  const ServerFailure({required this.tierId, required this.lost});
}

class IncidentResolution {
  final IncidentType type;
  final bool success;
  final double rewardCredits;
  final double penaltyCredits;
  const IncidentResolution({
    required this.type,
    required this.success,
    required this.rewardCredits,
    required this.penaltyCredits,
  });
}

class PowerCoolingStats {
  final double used;
  final double capacity;
  final double efficiency;
  const PowerCoolingStats({
    required this.used,
    required this.capacity,
    required this.efficiency,
  });
}

// ─── Global CPS calculation ───

double calcCreditsPerSec(
  Map<String, int> servers,
  Map<String, int> clusters,
  Map<String, int> gpus,
  Map<String, int> capacity,
  Map<String, bool> upgrades,
  Map<String, int> staff,
  Map<String, bool> research,
  Map<String, bool> regions,
  bool overclockEnabled,
  ActiveIncident? activeIncident, [
  Map<String, bool> skills = const {},
]) {
  final skillServerMult = getSkillServerOutputMult(skills);
  final skillGpuMult = getSkillGpuOutputMult(skills);

  double serverOutput = 0;
  for (final tier in serverTiers) {
    final owned = servers[tier.id] ?? 0;
    final tierMult = getServerOutputMultiplier(tier.id, upgrades);
    serverOutput += getServerOutput(tier, owned) * tierMult;
  }
  serverOutput *= skillServerMult;

  final clusterOutput = getTotalClusterOutput(clusters, upgrades,
          (tierId) => getServerOutputMultiplier(tierId, upgrades)) *
      skillServerMult;

  final regionsOutput = getOwnedRegionsOutput(regions);
  final gpuOutput = getTotalGpuOutput(gpus) * skillGpuMult;

  final staffMult = getStaffOutputMultiplier(staff);
  final researchMult = getResearchOutputMultiplier(research);
  final baseOutput = _baseCreditsPerSec +
      (serverOutput + clusterOutput + regionsOutput + gpuOutput) *
          staffMult *
          researchMult;
  final overclockMult = overclockEnabled ? _overclockMultiplier : 1.0;

  final powerDrawMult = getResearchPowerDrawMultiplier(research);
  final coolingCapMult = getResearchCoolingMultiplier(research);
  final totalPower = (getTotalPowerDraw(servers) +
          getTotalClusterPower(clusters) +
          getOwnedRegionsPower(regions) +
          getTotalGpuPower(gpus)) *
      powerDrawMult;
  final totalHeat = getTotalHeatOutput(servers) +
      getTotalClusterHeat(clusters) +
      getOwnedRegionsHeat(regions) +
      getTotalGpuHeat(gpus);

  final powerCap = getTotalCapacityAmount(capacity, 'power') +
      getBonusPowerCapacity(upgrades) +
      getSkillBonusPower(skills);
  final powerEff = getEfficiency(totalPower, powerCap);
  final coolingEff = getEfficiency(
      totalHeat,
      getTotalCapacityAmount(capacity, 'cooling') * coolingCapMult +
          getSkillBonusCooling(skills));
  final efficiency = min(powerEff, coolingEff);
  final incidentMult = getIncidentMultiplier(activeIncident);

  return baseOutput * overclockMult * efficiency * incidentMult;
}
