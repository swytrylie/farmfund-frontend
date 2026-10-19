import { authedRequest } from "../api";
import { METHOD_LABEL } from "./repaymentData";

// Official receipts the farmer's cooperative issues automatically when it
// verifies a loan payment. Newest first.
export const listLoanReceipts = () => authedRequest("/api/loan-receipts");

const TZ = "Asia/Manila"; // receipt numbers use Philippine months too

// "Oct 19, 2026 | 08:21 PM"
export function receiptDateTime(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: TZ });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: TZ });
  return `${date} | ${time}`;
}

export function receiptDate(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: TZ });
}

export const methodText = (m) => METHOD_LABEL[m] || "—";
export const pesoAmount = (n) =>
  `₱${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;