import { authedRequest } from "../api";

export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export const listMine = () => authedRequest("/api/certificates");
export const listForFarmer = (farmerId) => authedRequest(`/api/certificates/farmer/${farmerId}`);
export const uploadCertificate = (formData) => authedRequest("/api/certificates", { method: "POST", body: formData });
export const deleteCertificate = (id) => authedRequest(`/api/certificates/${id}`, { method: "DELETE" });
export const reviewCertificate = (id, status, note) =>
  authedRequest(`/api/certificates/${id}/review`, { method: "PATCH", body: { status, note } });
const getLink = (id) => authedRequest(`/api/certificates/${id}/link`);

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