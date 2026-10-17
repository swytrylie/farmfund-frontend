import { authedRequest } from "../api";
import { dateLocal } from "./certificates";

// Disaster relief. A farmer whose crop loan is running can report a calamity
// (flood, typhoon...) with a proof. A FarmFund admin checks the proof first.
// After that the lending cooperative's owner can activate a calamity freeze:
// that loan's due date moves 90 days later and nothing new is added in that time.

export const createReliefClaim = (formData) => authedRequest("/api/calamity-claims", { method: "POST", body: formData });

// The admin's check of claims. Only farmers who asked for relief appear.
export function listClaimQueue({ status = "pending", search = "", page = 1, limit = 10 } = {}) {
  const q = new URLSearchParams();
  q.set("status", status);
  if (search) q.set("search", search);
  q.set("page", String(page));
  q.set("limit", String(limit));
  return authedRequest(`/api/calamity-claims/admin/queue?${q.toString()}`);
}
export const reviewClaim = (id, status, note) =>
  authedRequest(`/api/calamity-claims/${id}/admin-review`, { method: "PATCH", body: { status, note } });

// The cooperative owner's freeze. Answers with the loan, up to date.
export const activateFreeze = (claimId) => authedRequest(`/api/calamity-claims/${claimId}/freeze`, { method: "POST" });

const getProofLink = (claimId) => authedRequest(`/api/calamity-claims/${claimId}/proof/link`);

// Opens the proof in a new tab (opened inside the click so the browser allows
// it, then pointed at a link that stops working after a few minutes).
export async function openClaimProof(claimId) {
  const tab = window.open("", "_blank");
  try {
    const { url } = await getProofLink(claimId);
    if (!tab) return false;
    tab.opener = null;
    tab.location.href = url;
    return true;
  } catch (err) {
    if (tab) tab.close();
    throw err;
  }
}

// A loan that is running: the grace period counts as running.
export const RUNNING_STATUSES = ["active", "grace_period"];
export const isRunning = (loan) => Boolean(loan) && RUNNING_STATUSES.includes(loan.status);
export const isGracePeriod = (loan) => Boolean(loan) && loan.status === "grace_period";

// What the farmer reads about their latest claim on a loan.
export function claimSummary(claim) {
  if (!claim) return null;
  const sent = dateLocal(claim.createdAt);
  if (claim.status === "pending") {
    return { tone: "wait", title: "Waiting for a FarmFund admin", text: `You sent your ${claim.calamityLabel.toLowerCase()} claim on ${sent}. An admin is checking your proof.` };
  }
  if (claim.status === "rejected") {
    const why = claim.review && claim.review.note ? ` Reason: ${claim.review.note}.` : "";
    return { tone: "bad", title: "Claim not verified", text: `A FarmFund admin could not verify your ${claim.calamityLabel.toLowerCase()} claim.${why} You can send a new claim.` };
  }
  const fr = claim.freeze;
  if (!fr) {
    return { tone: "wait", title: "Claim verified", text: `A FarmFund admin verified your ${claim.calamityLabel.toLowerCase()} claim. Waiting for your cooperative's owner to activate the calamity freeze.` };
  }
  if (fr.running) {
    return {
      tone: "good",
      title: "Calamity freeze active",
      text: `No new interest until ${dateLocal(fr.endsAt)}. Your new due date is ${dateLocal(fr.newDueDate)}.`,
    };
  }
  return { tone: "done", title: "Calamity freeze ended", text: `The freeze ended on ${dateLocal(fr.endsAt)}. Your loan is due on ${dateLocal(fr.newDueDate)}.` };
}
