import { authedRequest } from "../api";

// Calls and small helpers for "Delete cooperative" and the Archive page. All of
// them hit /api/admin/..., which the server only allows for admin accounts.

export const getCooperativeImpact = (cooperativeId) =>
  authedRequest(`/api/admin/cooperatives/${cooperativeId}/impact`);

export const deleteCooperative = (cooperativeId, confirmName) =>
  authedRequest(`/api/admin/cooperatives/${cooperativeId}`, { method: "DELETE", body: { confirmName } });

export function listArchive({ kind = "all", search = "", page = 1, limit = 10 } = {}) {
  const q = new URLSearchParams();
  if (kind && kind !== "all") q.set("kind", kind);
  if (search) q.set("search", search);
  q.set("page", String(page));
  q.set("limit", String(limit));
  return authedRequest(`/api/admin/archive?${q.toString()}`);
}

export const getArchived = (id) => authedRequest(`/api/admin/archive/${id}`);
export const restoreArchived = (id) => authedRequest(`/api/admin/archive/${id}/restore`, { method: "POST" });
export const purgeArchived = (id) => authedRequest(`/api/admin/archive/${id}`, { method: "DELETE" });

// How each kind of saved record is named, in the order they are listed.
// (The cooperative itself, and small bookkeeping rows, are not listed.)
const COUNT_NAMES = [
  ["User", "account", "accounts"],
  ["Loan", "loan", "loans"],
  ["LoanPayment", "payment", "payments"],
  ["LoanReminder", "reminder", "reminders"],
  ["Notification", "notification", "notifications"],
  ["CooperativeInvite", "invitation", "invitations"],
  ["CooperativeMember", "team membership", "team memberships"],
  ["Farm", "farm", "farms"],
  ["Field", "field", "fields"],
  ["FarmingCycle", "farming cycle", "farming cycles"],
  ["FinancialRecord", "financial record", "financial records"],
  ["Budget", "budget", "budgets"],
  ["Certificate", "certificate", "certificates"],
];

// [{ key, text }] for every kind that has at least one record.
export function countRows(counts) {
  const c = counts || {};
  return COUNT_NAMES.filter(([key]) => c[key] > 0).map(([key, one, many]) => ({
    key,
    n: c[key],
    text: `${c[key]} ${c[key] === 1 ? one : many}`,
  }));
}

// "2 accounts, 3 loans, 3 payments +4 more kinds" — at most `max` kinds shown.
export function countsText(counts, max = 4) {
  const rows = countRows(counts);
  if (rows.length === 0) return "Nothing else";
  const shown = rows.slice(0, max).map((r) => r.text).join(", ");
  const more = rows.length - max;
  return more > 0 ? `${shown} +${more} more` : shown;
}

export function expiresText(daysLeft) {
  if (daysLeft <= 0) return "Today";
  if (daysLeft === 1) return "Tomorrow";
  return `In ${daysLeft} days`;
}