import { authedRequest } from "../api";

// Requesting a loan: the farmer picks a crop and what they put up as
// collateral. The server works out the interest rate (from the collateral)
// and the due date (from the crop's growing time); the form only shows a
// preview of those so nothing is a surprise.

export const getLoanOptions = () => authedRequest("/api/loans/options");
export const requestLoan = (formData) => authedRequest("/api/loans", { method: "POST", body: formData });
const getCollateralLink = (loanId) => authedRequest(`/api/loans/${loanId}/collateral/link`);

// The admin's check of a new request's collateral, before the cooperative sees it.
export function listLoanQueue({ status = "pending", search = "", page = 1, limit = 10 } = {}) {
  const q = new URLSearchParams();
  q.set("status", status);
  if (search) q.set("search", search);
  q.set("page", String(page));
  q.set("limit", String(limit));
  return authedRequest(`/api/loans/admin/queue?${q.toString()}`);
}
export const reviewLoanCollateral = (id, status, note) =>
  authedRequest(`/api/loans/${id}/admin-review`, { method: "PATCH", body: { status, note } });

// Requests still with the admin, or not verified by them, are not the
// cooperative's to see; the farmer sees them with these names.
export const isAwaitingAdmin = (loan) => loan && loan.status === "pending_admin";
export const wasNotVerified = (loan) => loan && loan.status === "admin_rejected";

export const DESCRIPTION_MIN = 5;
export const DESCRIPTION_MAX = 500;
export const cleanDescription = (raw) => String(raw || "").replace(/[<>]/g, "").slice(0, DESCRIPTION_MAX);

const trimNumber = (n) => String(Math.round(n * 10) / 10).replace(/\.0$/, "");

// 30 -> "1 month", 75 -> "2.5 months", 130 -> "4.3 months"
export function monthsText(days) {
  const months = Math.round((Number(days) / 30) * 10) / 10;
  return `${trimNumber(months)} ${months === 1 ? "month" : "months"}`;
}
// 120 -> "120 days (about 4 months)"
export const growingText = (days) => `${days} days (about ${monthsText(days)})`;

// Loans made with a crop carry one flat rate for the whole crop cycle; older
// loans carry a yearly rate and a number of months.
export const isCycleLoan = (loan) => loan && loan.rateBasis === "cycle";
export const rateText = (loan) =>
  isCycleLoan(loan) ? `${loan.interestRatePercent}% per crop cycle` : `${loan.interestRatePercent}% p.a.`;
export const termText = (loan) =>
  isCycleLoan(loan) && loan.growingDays ? growingText(loan.growingDays) : `${loan.termMonths} months`;

const roundCents = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export const interestAmount = (principal, ratePercent) => roundCents(principal * (ratePercent / 100));

// The day payment becomes due if the loan were approved today.
export function estimatedDue(growingDays, graceDays, from = new Date()) {
  return new Date(from.getTime() + (growingDays + graceDays) * 86400000);
}

// Opens the collateral proof in a new tab (opened inside the click so the
// browser allows it, then pointed at a link that stops working after a few minutes).
export async function openCollateralFile(loanId) {
  const tab = window.open("", "_blank");
  try {
    const { url } = await getCollateralLink(loanId);
    if (!tab) return false;
    tab.opener = null;
    tab.location.href = url;
    return true;
  } catch (err) {
    if (tab) tab.close();
    throw err;
  }
}