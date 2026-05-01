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

/** Minimum peak credits required to prestige */
export const PRESTIGE_MIN_CREDITS = 10_000_000; // 10M

/** Calculate skill points earned from a prestige at the given peak credits */
export function calcSkillPointsEarned(highestCredits: number): number {
  if (highestCredits < PRESTIGE_MIN_CREDITS) return 0;
  return Math.floor(Math.log10(highestCredits) - 6);
}

/** Check if prestige is available (met minimum threshold) */
export function canPrestige(highestCredits: number): boolean {
  return highestCredits >= PRESTIGE_MIN_CREDITS;
}

/** Show prestige button on dashboard once credits have ever hit 1M+ in this run */
export function isPrestigeVisible(highestCredits: number): boolean {
  return highestCredits >= 1_000_000;
}
