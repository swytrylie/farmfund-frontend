import { useEffect } from "react";
import { Megaphone, Receipt, X } from "lucide-react";
import { formatAnnouncementDateTime, formatAnnouncementDate } from "../../lib/announcements";
import { pesoText } from "../../lib/notifications";

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-200 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-900 break-words min-w-0">{children}</span>
    </div>
  );
}

// The full text of one message, opened from the bell or the list: either an
// announcement from the FarmFund team, or a payment reminder from the
// person's cooperative (shown with the facts it carried when it was sent).
export default function AnnouncementModal({ item, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const reminder = item.kind === "payment_reminder";
  const d = item.details || {};
  const contact = [d.contactEmail, d.contactPhone].filter(Boolean).join(" · ");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={reminder ? "Payment reminder" : "Announcement"}
        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${reminder ? "bg-amber-100" : "bg-[#e0ebda]"}`}>
            {reminder ? <Receipt size={18} className="text-amber-700" /> : <Megaphone size={18} className="text-[#2d4027]" />}
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900 break-words">{item.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              From {reminder ? d.coopName || "your cooperative" : "FarmFund"} · {formatAnnouncementDateTime(item.at)}
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