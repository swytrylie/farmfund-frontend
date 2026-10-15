import { authedRequest } from "../api";
import { MAX_FILE_BYTES } from "./certificates";

// A farmer's proof of payment: they say "I paid", attach the receipt, and the
// lending cooperative checks it. Nothing changes on the loan until the
// cooperative verifies it.

export const PROOF_METHODS = [
  { value: "gcash", label: "GCash" },
  { value: "maya", label: "Maya" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
];
export const PROOF_METHOD_LABEL = Object.fromEntries(PROOF_METHODS.map((m) => [m.value, m.label]));

export const submitProof = (formData) => authedRequest("/api/payment-proofs", { method: "POST", body: formData });
export const listMyProofs = () => authedRequest("/api/payment-proofs/mine");
export const listCooperativeProofs = (cooperativeId, { status, limit = 100 } = {}) =>
  authedRequest(`/api/payment-proofs?cooperative=${cooperativeId}&limit=${limit}${status ? `&status=${status}` : ""}`);
export const verifyProof = (id, note) =>
  authedRequest(`/api/payment-proofs/${id}/verify`, { method: "PATCH", body: note && note.trim() ? { note: note.trim() } : {} });
export const rejectProof = (id, note) =>
  authedRequest(`/api/payment-proofs/${id}/reject`, { method: "PATCH", body: { note: (note || "").trim() } });
export const withdrawProof = (id) => authedRequest(`/api/payment-proofs/${id}`, { method: "DELETE" });
const getLink = (id) => authedRequest(`/api/payment-proofs/${id}/link`);

export const STATUS_STYLE = {
  pending: { label: "Waiting for the cooperative", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  verified: { label: "Verified", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", chip: "bg-red-50 text-red-600 border-red-200" },
};

// A reference number may only have letters, numbers, spaces, - _ and /, and
// must start with a letter or number — the same rule the server enforces.
export const REFERENCE_MAX = 50;
export function cleanReference(raw) {
  return String(raw || "")
    .replace(/[^A-Za-z0-9 \-_/]/g, "")
    .replace(/^[^A-Za-z0-9]+/, "")
    .slice(0, REFERENCE_MAX);
}
export const cleanNote = (raw) => String(raw || "").replace(/[<>]/g, "").slice(0, 300);

// Opens the receipt in a new tab (same approach as certificates: the tab is
// opened inside the click so the browser allows it, then pointed at a link
// the server made that stops working after a few minutes).
export async function openProofFile(id) {
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

// Phone photos are often 3-8 MB, over the 2 MB limit. A photo that is too big
// is shrunk here (smaller picture, JPEG) so the farmer doesn't have to; a
// PDF, or a photo already small enough, is sent exactly as it is. If shrinking
// isn't possible the original is returned and the usual "too large" message
// is shown.
export async function prepareReceipt(file, { maxBytes = MAX_FILE_BYTES } = {}) {
  if (!file || file.size <= maxBytes || !/\.(jpe?g|png)$/i.test(file.name || "")) return file;
  try {
    const bitmap = await loadBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    for (const maxSide of [1800, 1400, 1100, 800]) {
      const scale = Math.min(1, maxSide / longest);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; // a PNG's see-through areas would turn black in a JPEG
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.85, 0.7, 0.55]) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size <= maxBytes) {
          const base = (file.name || "receipt").replace(/\.[^.]+$/, "");
          return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
        }
      }
    }
  } catch {
    // fall through to the original
  }
  return file;
}

async function loadBitmap(file) {
  if (typeof createImageBitmap === "function") return createImageBitmap(file);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    img.src = url;
  });
}