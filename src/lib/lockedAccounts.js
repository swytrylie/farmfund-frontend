import { authedRequest } from "../api";

// Accounts that are locked out after too many wrong passwords, and the people
// who wrote to the admin about it. Admin-only on the server.
export const listLockedAccounts = () => authedRequest("/api/admin/locked-accounts");
export const unlockAccount = (id) => authedRequest(`/api/admin/locked-accounts/${id}/unlock`, { method: "POST" });

// "12:34" under an hour, "1 h 05 min" above it.
export function formatTimeLeft(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")} min`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// How many seconds are left for a row, counted from when the list arrived (the
// server's own "seconds left" at that moment), so this computer's clock can't
// make it wrong.
export function secondsLeftNow(row, fetchedAt, now = Date.now()) {
  if (!row.locked) return 0;
  return Math.max(0, row.secondsLeft - Math.floor((now - fetchedAt) / 1000));
}

// "2nd lock · 30 minutes"
export function lockLabel(row) {
  const n = row.lockCount || 1;
  const ord = n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
  return `${ord} lock · ${row.lockMinutes} minutes`;
}