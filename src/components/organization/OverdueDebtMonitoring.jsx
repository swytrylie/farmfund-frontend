import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { peso, loanRef, personName, fetchAllPages } from "../../lib/repaymentData";
import { isOverdue, daysOverdue } from "../../lib/reminderData";
import SendReminderModal from "./SendReminderModal";

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

const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// The most recent reminder attempt for one loan, by when it was made.
function latestReminderFor(reminders, loanId) {
  let latest = null;
  for (const r of reminders) {
    if (String(r.loan?._id || r.loan) !== String(loanId)) continue;
    if (!latest || new Date(r.createdAt) > new Date(latest.createdAt)) latest = r;
  }
  return latest;
}

// reminders, onSendReminder, canSendReminders and remindersError come from
// OrgDashboard as shared state — the same data the bell and the Payment
// Reminders page use, so a reminder sent here shows up there too.
export default function OverdueDebtMonitoring({ reminders = [], onSendReminder, canSendReminders, remindersError }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loans, setLoans] = useState([]);
  const [activeLoan, setActiveLoan] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const all = await fetchAllPages("/api/loans");
        if (!cancelled) setLoans(all);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load your data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSendReminder(payload) {
    // A failure here propagates back into the form, which shows it and
    // stays open — the toast and close below only happen on a real success.
    await onSendReminder(payload);
    setToastMessage(`Reminder sent to ${personName(activeLoan.farmer)}`);
    setActiveLoan(null);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Overdue Debt Monitoring</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading overdue accounts…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Overdue Debt Monitoring</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  // A loan is overdue when it's still out, still owes something, and its
  // due date has passed. The whole remaining balance is "due" — loans have
  // a single maturity date, not installments. Most overdue first.
  const accounts = loans
    .filter((l) => isOverdue(l))
    .map((l) => ({ loan: l, days: daysOverdue(l.dueDate) }))
    .sort((a, b) => b.days - a.days);
  const totalAtRisk = accounts.reduce((sum, a) => sum + a.loan.remainingBalance, 0);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Overdue Debt Monitoring</h2>
      <p className="mt-1 text-gray-500">Farmers with missed or overdue payments</p>

      {remindersError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          Couldn't load past reminders: {remindersError}
        </div>
      )}

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 size={36} className="text-green-500" />
            <p className="mt-3 text-sm font-semibold text-gray-700">No overdue accounts</p>
            <p className="text-sm text-gray-400">Every active loan is within its due date.</p>
          </div>
        ) : (
          <>
            <p className="text-[#8b1e1e] font-bold text-lg mb-4">
              {accounts.length} overdue account{accounts.length === 1 ? "" : "s"} • {peso(totalAtRisk)} at risk
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Borrower</th>
                    <th className="pb-2 font-semibold">Loan</th>
                    <th className="pb-2 font-semibold">Amount Due</th>
                    <th className="pb-2 font-semibold">Days Overdue</th>
                    <th className="pb-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(({ loan, days }) => {
                    const latest = latestReminderFor(reminders, loan._id);
                    return (
                      <tr key={loan._id} className="border-t border-gray-50">
                        <td className="py-3 pr-4 text-gray-900 font-medium">{personName(loan.farmer)}</td>
                        <td className="py-3 pr-4 text-gray-500">{loanRef(loan._id)}</td>
                        <td className="py-3 pr-4 text-red-600 font-semibold">{peso(loan.remainingBalance)}</td>
                        <td className="py-3 pr-4 text-gray-700">
                          {days} day{days === 1 ? "" : "s"}
                        </td>
                        <td className="py-3">
                          {canSendReminders && (
                            <button
                              onClick={() => setActiveLoan(loan)}
                              className="bg-[#4f7331] hover:bg-[#3f5d27] text-white text-xs font-semibold px-4 py-1 rounded-full transition-colors"
                            >
                              Send reminder
                            </button>
                          )}
                          {latest &&
                            (latest.status === "failed" ? (
                              <p className="text-[11px] text-red-500 mt-1">Last attempt failed</p>
                            ) : (
                              <p className="text-[11px] text-gray-400 mt-1">Last sent: {formatShortDate(latest.createdAt)}</p>
                            ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!canSendReminders && (
              <p className="mt-4 text-xs text-gray-400">Only your cooperative's owner or finance managers can send reminders.</p>
            )}
          </>
        )}
      </div>

      {activeLoan && (
        <SendReminderModal loan={activeLoan} onSend={handleSendReminder} onCancel={() => setActiveLoan(null)} />
      )}

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
    </div>
  );
}