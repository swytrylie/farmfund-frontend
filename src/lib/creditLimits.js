import { authedRequest } from "../api";

// A cooperative's owner can replace the standard ₱25,000 limit for one farmer,
// for loans with THAT cooperative only. The server checks every rule again.
export const MAX_LIMIT = 100000;
export const NOTE_MIN = 3;
export const NOTE_MAX = 300;

export const getCreditLimit = (cooperativeId, farmerId) =>
  authedRequest(`/api/credit-limits?cooperative=${encodeURIComponent(cooperativeId)}&farmer=${encodeURIComponent(farmerId)}`);

export const saveCreditLimit = ({ cooperative, farmer, limit, note }) =>
  authedRequest("/api/credit-limits", { method: "PUT", body: { cooperative, farmer, limit, note } });

// Money with centavos, like the box in the design: ₱30,000.00
export const pesoCentavos = (n) =>
  `₱${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Checks what was typed before sending it. Returns a message, or "" if fine.
export function limitProblem(text, { current, outstanding }) {
  if (text === "" || text === ".") return "Enter the new credit limit.";
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) return "Enter a valid amount.";
  if (value > MAX_LIMIT) return `The credit limit can be at most ${pesoCentavos(MAX_LIMIT)}.`;
  if (Math.round(value * 100) === Math.round(Number(current) * 100)) return `That is already the current limit (${pesoCentavos(current)}). Enter a different amount.`;
  if (Math.round(value * 100) < Math.round(Number(outstanding) * 100)) {
    return `The limit can't be lower than what the farmer still owes your cooperative (${pesoCentavos(outstanding)}).`;
  }
  return "";
}

export function noteProblem(text) {
  const n = text.trim();
  if (n.length < NOTE_MIN) return `Add a short reason (at least ${NOTE_MIN} characters).`;
  if (n.length > NOTE_MAX) return `The reason must be ${NOTE_MAX} characters or fewer.`;
  if (/[<>]/.test(n)) return "The reason can't contain < or >.";
  return "";
}