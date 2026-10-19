import { useEffect } from "react";
import { X } from "lucide-react";
import { formatAnnouncementDateTime, formatAnnouncementDate } from "../../lib/announcements";
import { pesoText, messageKind } from "../../lib/notifications";
import { uiFor } from "./messageKinds";

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-200 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-900 break-words min-w-0">{children}</span>
    </div>
  );
}

// The full text of one message, opened from the bell or the list: an
// announcement from the FarmFund team, a payment reminder from the person's
// cooperative (shown with the facts it carried when it was sent), or a note
// that an admin verified one of their certificates, or news about one of their loans.
export default function AnnouncementModal({ item, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const kind = messageKind(item);
  const reminder = kind === "payment_reminder";
  const certificate = kind === "certificate_verified";
  const loanUpdate = kind === "loan_update";
  const ui = uiFor(item);
  const KindIcon = ui.Icon;
  const d = item.details || {};
  const contact = [d.contactEmail, d.contactPhone].filter(Boolean).join(" · ");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={ui.label}
        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ui.iconWrap}`}>
            <KindIcon size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900 break-words">{item.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              From {reminder ? d.coopName || "your cooperative" : ui.from} · {formatAnnouncementDateTime(item.at)}
            </p>
          </div>
        </div>

        <div className="mt-6 bg-[#f4f4f4] rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap break-words">
          {item.message}
        </div>

        {reminder && (
          <div className="mt-4 bg-[#fff8ec] border border-amber-100 rounded-xl px-4 py-2 text-sm">
            {d.loanRef && <Row label="Loan">{d.loanRef}</Row>}
            {d.remaining !== null && d.remaining !== undefined && <Row label="Amount remaining">{pesoText(d.remaining)}</Row>}
            <Row label="Due date">
              {d.dueDate ? `${formatAnnouncementDate(d.dueDate)}${d.dueNote ? ` (${d.dueNote})` : ""}` : "Not set"}
            </Row>
            {contact && <Row label="Questions?">{contact}</Row>}
          </div>
        )}
        {certificate && (
          <div className="mt-4 bg-[#effaf3] border border-emerald-100 rounded-xl px-4 py-2 text-sm">
            {d.typeLabel && <Row label="Document">{d.typeLabel}</Row>}
            {d.amount !== null && d.amount !== undefined && <Row label="Credit limit">{pesoText(d.amount)}</Row>}
          </div>
        )}
        {loanUpdate && (
          <div className="mt-4 bg-[#eff6ff] border border-blue-100 rounded-xl px-4 py-2 text-sm">
            {d.typeLabel && <Row label="Update">{d.typeLabel}</Row>}
            {d.receiptNo && <Row label="Receipt no.">{d.receiptNo}</Row>}
            {d.loanRef && d.receiptNo && <Row label="Loan">{d.loanRef}</Row>}
            {d.amount !== null && d.amount !== undefined && <Row label={d.receiptNo ? "Amount paid" : d.typeLabel === "Credit limit" ? "New credit limit" : "Loan amount"}>{pesoText(d.amount)}</Row>}
            {d.methodLabel && d.receiptNo && <Row label="Payment method">{d.methodLabel}</Row>}
            {d.receiptNo && d.remaining !== null && d.remaining !== undefined && <Row label="Remaining balance">{pesoText(d.remaining)}</Row>}
            {d.coopName && <Row label="Cooperative">{d.coopName}</Row>}
            {d.dueDate && <Row label="Due date">{`${formatAnnouncementDate(d.dueDate)}${d.dueNote ? ` (${d.dueNote})` : ""}`}</Row>}
            {d.reason && <Row label="Reason">{d.reason}</Row>}
          </div>
        )}
        {reminder && (
          <p className="mt-2 text-[11px] text-gray-400">
            These figures are as of {formatAnnouncementDate(item.at)}, the day this reminder was sent.
          </p>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}