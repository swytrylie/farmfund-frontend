import { authedRequest } from "../api";

export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export const listMine = () => authedRequest("/api/certificates");
// With a cooperative id, the limit that applies to loans with THAT cooperative
// (its owner may have set a different one).
const withCoop = (cooperativeId) => (cooperativeId ? `?cooperative=${encodeURIComponent(cooperativeId)}` : "");
export const getCredit = (cooperativeId) => authedRequest(`/api/certificates/credit${withCoop(cooperativeId)}`);
// The admin's review queue: every farmer's certificates in one list.
export function listCertificateQueue({ status = "pending", type = "all", search = "", page = 1, limit = 20 } = {}) {
  const q = new URLSearchParams();
  q.set("status", status);
  if (type && type !== "all") q.set("type", type);
  if (search) q.set("search", search);
  q.set("page", String(page));
  q.set("limit", String(limit));
  return authedRequest(`/api/certificates/queue?${q.toString()}`);
}
export const listForFarmer = (farmerId, cooperativeId) => authedRequest(`/api/certificates/farmer/${farmerId}${withCoop(cooperativeId)}`);
export const uploadCertificate = (formData) => authedRequest("/api/certificates", { method: "POST", body: formData });
export const deleteCertificate = (id) => authedRequest(`/api/certificates/${id}`, { method: "DELETE" });
export const reviewCertificate = (id, status, note) =>
  authedRequest(`/api/certificates/${id}/review`, { method: "PATCH", body: { status, note } });
const getLink = (id) => authedRequest(`/api/certificates/${id}/link`);

// The kinds of document a farmer can upload. Only a verified Barangay
// Certificate raises the credit limit (to ₱25,000); the others are extra.
export const CREDIT_LIMIT_AMOUNT = 25000;
export const DOC_TYPES = [
  { value: "barangay_certificate", label: "Barangay Certificate of Agricultural Activity (required for verification)" },
  { value: "income_certificate", label: "Proof of Monthly Income / Income Certificate (optional)" },
  { value: "other", label: "Other document" },
];
export const TYPE_LABEL = {
  barangay_certificate: "Barangay Certificate",
  income_certificate: "Income Certificate",
  other: "Other document",
};
export const typeLabel = (type) => TYPE_LABEL[type] || TYPE_LABEL.other;

export const moneyText = (n) => `₱${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

// The server explains what was wrong (e.g. "That file is larger than 2 MB.").
export const messageFrom = (err, fallback) =>
  (Array.isArray(err?.details) && err.details[0]?.message) || err?.message || fallback;

export function bytesText(n) {
  if (typeof n !== "number" || n < 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// A date picked without a time is stored as midnight UTC, so show it in UTC
// (otherwise it can slip to the day before in some time zones).
export function dateOnly(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function dateLocal(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Checks the chosen file before sending it. Returns a message, or "" if fine.
export function fileProblem(file) {
  if (!file) return "Choose a file to upload.";
  const name = (file.name || "").toLowerCase();
  const okType = /\.(pdf|jpe?g|png)$/.test(name);
  if (!okType) return "Only PDF, JPG or PNG files can be uploaded.";
  if (file.size > MAX_FILE_BYTES) return "That file is larger than 2 MB. Choose a smaller one.";
  if (file.size === 0) return "That file is empty.";
  return "";
}

// Opens a certificate in a new tab. The tab is opened straight away (inside
// the click) so the browser does not block it, then pointed at the file once
// the server has made a short-lived link. Returns false if the browser blocked it.
export async function openCertificate(id) {
  const tab = window.open("", "_blank");
  try {
    const { url } = await getLink(id);
    if (!tab) return false;
    tab.opener = null;
    tab.location.href = url;
    return true;
  } catch (err) {
    if (tab) tab.close();
    throw err;
  }
}