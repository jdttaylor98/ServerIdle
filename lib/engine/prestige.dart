// Prestige (Acqui-hire) — sell your infrastructure to BigCorp.
// Reset everything in the current run. Earn Skill Points based on
// how far you got (peak credits).
//
// Formula: floor(log10(highestCredits) - 6)
//   10M credits  (10^7)  = 1 SP
//   100M credits (10^8)  = 2 SP
//   1B credits   (10^9)  = 3 SP
//   10B credits  (10^10) = 4 SP
//
// Minimum threshold: 10M credits (10^7) to prestige at all.

import 'dart:math';

/// Minimum peak credits required to prestige
const int prestigeMinCredits = 10000000; // 10M

/// Calculate skill points earned from a prestige at the given peak credits
int calcSkillPointsEarned(double highestCredits) {
  if (highestCredits < prestigeMinCredits) return 0;
  return (log(highestCredits) / ln10 - 6).floor();
}

/// Check if prestige is available (met minimum threshold)
bool canPrestige(double highestCredits) {
  return highestCredits >= prestigeMinCredits;
}

/// Show prestige button on dashboard once credits have ever hit 1M+ in this run
bool isPrestigeVisible(double highestCredits) {
  return highestCredits >= 1000000;
}
