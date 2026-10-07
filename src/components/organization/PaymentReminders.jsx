import { useState, useEffect } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { personName, fetchAllPages } from "../../lib/repaymentData";
import { canRemind, REMINDER_TYPE_LABEL } from "../../lib/reminderData";
import SendReminderModal from "./SendReminderModal";

const PAGE_SIZE = 25;

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// "Sent" means the mail server accepted it — it does NOT claim the borrower
// received it, since nothing can promise that.
function StatusBadge({ status, failureReason }) {
  if (status === "sent") {
    return <span className="bg-[#e8f5e9] text-[#2e7d32] font-medium px-3 py-1 rounded-full text-xs">Sent</span>;
  }
  return (
    <span title={failureReason || "The email could not be sent"} className="bg-red-50 text-red-700 font-medium px-3 py-1 rounded-full text-xs">
      Failed
    </span>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2d4027] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

// reminders, onSendReminder, canSendReminders and remindersError come from
// OrgDashboard as shared state — the same data the bell popup and Overdue
// Debt Monitoring read, so sending a reminder in any one place shows up in
// all of them.
export default function PaymentReminders({ reminders = [], onSendReminder, canSendReminders, remindersError }) {
  const [loans, setLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [loansError, setLoansError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const all = await fetchAllPages("/api/loans");
        if (!cancelled) setLoans(all);
      } catch (err) {
        if (!cancelled) setLoansError(err.message || "Couldn't load your loans.");
      } finally {
        if (!cancelled) setLoansLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const loanOptions = loans
    .filter((l) => canRemind(l))
    .sort((a, b) => personName(a.farmer).localeCompare(personName(b.farmer)) || String(a._id).localeCompare(String(b._id)));

  async function handleSend(payload) {
    // A failure propagates back into the form, which shows it and stays open.
    await onSendReminder(payload);
    const picked = loans.find((l) => l._id === payload.loan);
    setToastMessage(`Reminder sent to ${picked ? personName(picked.farmer) : "the borrower"}`);
    setIsModalOpen(false);
  }

  const rows = [...reminders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Payment Reminders</h2>
          <p className="mt-1 text-gray-500">Send reminders to farmers about upcoming or overdue repayments</p>
        </div>
        {canSendReminders && (
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={loansLoading || Boolean(loansError)}
            className="mt-12 bg-[#38512f] hover:bg-[#2b3e24] text-white font-medium px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> Send reminder
          </button>
        )}
      </div>

      {loansError && <p className="mt-3 text-sm text-red-600">Couldn't load your loans: {loansError}</p>}
      {remindersError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          Couldn't load reminders: {remindersError}
        </div>
      )}
      {!canSendReminders && (
        <p className="mt-3 text-xs text-gray-400">Only your cooperative's owner or finance managers can send reminders.</p>
      )}

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Recently Sent</h3>

        {rows.length === 0 ? (
          !remindersError && <p className="text-sm text-gray-400 text-center py-8">No reminders sent yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Borrower</th>
                    <th className="pb-2 font-semibold">Type</th>
                    <th className="pb-2 font-semibold">Channel</th>
                    <th className="pb-2 font-semibold">Sent</th>
                    <th className="pb-2 font-semibold">Sent By</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, visibleCount).map((r) => (
                    <tr key={r._id} className="border-t border-gray-50">
                      <td className="py-3 pr-4">
                        <p className="text-gray-900 font-medium">{personName(r.loan?.farmer)}</p>
                        <p className="text-[11px] text-gray-400">{r.recipientEmail}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{REMINDER_TYPE_LABEL[r.type] || r.type}</td>
                      <td className="py-3 pr-4 text-gray-600">Email</td>
                      <td className="py-3 pr-4 text-gray-500">{formatDate(r.createdAt)}</td>
                      <td className="py-3 pr-4 text-gray-600">{r.sentBy ? personName(r.sentBy) : "—"}</td>
                      <td className="py-3">
                        <StatusBadge status={r.status} failureReason={r.failureReason} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > visibleCount && (
              <button onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className="mt-4 text-sm text-[#4f7331] hover:underline font-medium">
                Show more ({rows.length - visibleCount} older)
              </button>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <SendReminderModal loanOptions={loanOptions} onSend={handleSend} onCancel={() => setIsModalOpen(false)} />
      )}

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
    </div>
  );
}