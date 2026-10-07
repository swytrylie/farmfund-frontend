import { authedRequest } from "../api";

// Shared by the repayment-related pages (Repayment Tracking, Payment
// History, and the ones that follow) so they all calculate and label
// things the same way instead of each keeping its own copy.

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const peso = (n) =>
  `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const METHOD_LABEL = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  mobile_wallet: "Mobile Wallet (GCash, Maya)",
  other: "Other",
};

// Real loans have no human-friendly number, so this gives each one a short,
// stable reference (the last 6 characters of its id) to tell two loans from
// the same borrower apart.
export const loanRef = (id) => `#${String(id).slice(-6).toUpperCase()}`;

export const personName = (user) =>
  user && user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Unknown";

// Fetches every page of a list endpoint instead of stopping at the first
// 100 — otherwise a larger cooperative would silently get totals that are
// too low. The 20-page cap is a safety stop (2,000 records), not an
// expected limit.
export async function fetchAllPages(basePath) {
  const separator = basePath.includes("?") ? "&" : "?";
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const batch = await authedRequest(`${basePath}${separator}limit=100&page=${page}`);
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

// Adds `balanceAfter` to each payment: what the loan still owed right after
// that payment was applied. It's worked out by replaying each loan's
// payments oldest-first against what the loan owes in total, so it needs
// EVERY payment for a loan (not a partial page) to be right.
// loansById: Map of loan id -> loan, where loan.totalPayable is what it owes.
export function withBalanceAfter(payments, loansById) {
  const byLoan = new Map();
  for (const p of payments) {
    const id = String(p.loan?._id || p.loan);
    if (!byLoan.has(id)) byLoan.set(id, []);
    byLoan.get(id).push(p);
  }

  const balanceById = new Map();
  for (const [loanId, list] of byLoan) {
    const payable = loansById.get(loanId)?.totalPayable;
    const oldestFirst = [...list].sort(
      (a, b) => new Date(a.paymentDate) - new Date(b.paymentDate) || String(a._id).localeCompare(String(b._id))
    );
    let paid = 0;
    for (const p of oldestFirst) {
      paid = round2(paid + p.amount);
      balanceById.set(p._id, payable === undefined ? null : round2(Math.max(0, payable - paid)));
    }
  }

  return payments.map((p) => ({ ...p, balanceAfter: balanceById.get(p._id) ?? null }));
}