import { useState } from "react";
import { X } from "lucide-react";
import { REMINDER_TYPE_OPTIONS, SEND_VIA_OPTIONS } from "../../mocks/organization/orgPaymentReminders.mock";

// Shared by Overdue Debt Monitoring (passes `account` — a specific overdue
// row, so Borrower/Loan is pre-filled and read-only, and the message is
// personalized with that account's real amount/days overdue) and Payment
// Reminders (passes `borrowerOptions` instead — no specific row context, so
// Borrower/Loan is a real dropdown the person must pick from, and the
// message defaults to a generic reminder since there's no per-borrower
// amount/days data available in that generic context).
export default function SendReminderModal({
  account,
  borrowerOptions,
  onSend,
  onCancel,
}) {
  const isPreSelected = Boolean(account);

  const [borrowerKey, setBorrowerKey] = useState("");
  const [reminderType, setReminderType] = useState(REMINDER_TYPE_OPTIONS[0]);
  const [sendVia, setSendVia] = useState(SEND_VIA_OPTIONS[1]); // "App notification only" default
  const [message, setMessage] = useState(
    isPreSelected
      ? `Your loan payment of ₱${account.amountDue.toLocaleString()} is now ${account.daysOverdue} days overdue. Please settle at your earliest convenience.`
      : "This is a reminder regarding your loan repayment. Please settle at your earliest convenience."
  );
  const [errors, setErrors] = useState({});

  const selectedBorrowerLabel = isPreSelected
    ? `${account.borrower} - ${account.loanId}`
    : borrowerOptions.find((o) => o.value === borrowerKey)?.label ?? "";

  function handleSend() {
    const newErrors = {
      borrower: !isPreSelected && !borrowerKey ? "Select a borrower/loan." : null,
      message: !message.trim()
        ? "Message is required."
        : message.length > 200
        ? "Message must be 200 characters or fewer."
        : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    const [borrowerName, loanId] = isPreSelected
      ? [account.borrower, account.loanId]
      : borrowerKey.split("|");

    onSend({ borrower: borrowerName, loanId, reminderType, sendVia, message });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Send Payment Reminder</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              This message will be sent through the selected channel to the
              borrower on file.
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Borrower / Loan *
            </label>
            {isPreSelected ? (
              <input
                type="text"
                value={selectedBorrowerLabel}
                readOnly
                className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full text-gray-600 cursor-not-allowed"
              />
            ) : (
              <>
                <select
                  value={borrowerKey}
                  onChange={(e) => {
                    setBorrowerKey(e.target.value);
                    setErrors((prev) => ({ ...prev, borrower: undefined }));
                  }}
                  className={`bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                    errors.borrower ? "border-red-400" : "border-gray-200"
                  }`}
                >
                  <option value="" disabled>
                    Select a borrower/loan
                  </option>
                  {borrowerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.borrower && (
                  <p className="mt-1 text-xs text-red-500">{errors.borrower}</p>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Reminder Type *
              </label>
              <select
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
              >
                {REMINDER_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Send Via *
              </label>
              <select
                value={sendVia}
                onChange={(e) => setSendVia(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
              >
                {SEND_VIA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrors((prev) => ({ ...prev, message: undefined }));
              }}
              rows={4}
              maxLength={200}
              className={`bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                errors.message ? "border-red-400" : "border-gray-200"
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.message ? (
                <p className="text-xs text-red-500">{errors.message}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-gray-400">{message.length} / 200</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white rounded-xl px-5 py-2.5 transition-colors"
          >
            Send reminder
          </button>
        </div>
      </div>
    </div>
  );
}