// Progressive lockout timing — tier 0 means "not locked".
// Tier 1: 15 min, Tier 2: 30 min, Tier 3: 1 hour, Tier 4: 2 hours (cap).
export const LOCKOUT_TIER_SECONDS = [0, 15 * 60, 30 * 60, 60 * 60, 120 * 60];
export const MAX_LOCKOUT_TIER = LOCKOUT_TIER_SECONDS.length - 1;
export const MAX_LOGIN_ATTEMPTS = 3;

export function nextLockoutTier(currentTier) {
  return Math.min(currentTier + 1, MAX_LOCKOUT_TIER);
}

// MM:SS under an hour, HH:MM:SS once it reaches an hour or more
export function formatLockoutTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}