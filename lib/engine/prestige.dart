// Prestige (Acqui-hire) — sell your infrastructure to BigCorp.
// Reset everything in the current run. Earn Skill Points based on
// how far you got (peak flops).
//
// Formula: floor(log10(highestFlops) - 6)
//   10M flops  (10^7)  = 1 SP
//   100M flops (10^8)  = 2 SP
//   1B flops   (10^9)  = 3 SP
//   10B flops  (10^10) = 4 SP
//
// Minimum threshold: 10M flops (10^7) to prestige at all.

import 'dart:math';

/// Minimum peak flops required to prestige
const int prestigeMinFlops = 10000000; // 10M

/// Calculate skill points earned from a prestige at the given peak flops
int calcSkillPointsEarned(double highestFlops) {
  if (highestFlops < prestigeMinFlops) return 0;
  return (log(highestFlops) / ln10 - 6).floor();
}

/// Check if prestige is available (met minimum threshold)
bool canPrestige(double highestFlops) {
  return highestFlops >= prestigeMinFlops;
}

/// Show prestige button on dashboard once flops have ever hit 1M+ in this run
bool isPrestigeVisible(double highestFlops) {
  return highestFlops >= 1000000;
}
