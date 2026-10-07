import { useState } from "react";
import { X } from "lucide-react";
import { peso, loanRef, personName } from "../../lib/repaymentData";
import { REMINDER_TYPES, MAX_MESSAGE, daysOverdue, defaultReminderType, defaultMessage } from "../../lib/reminderData";

// Shared by Overdue Debt Monitoring (passes `loan` — one specific overdue
// loan, so the borrower is fixed and read-only) and Payment Reminders
// (passes `loanOptions` instead, so the staff member picks which loan to
// send about). Either way the reminder is a real email to the borrower's
// address on file, and onSend only needs { loan, type, message } — what's
// owed and when it's due are filled in by the server from the loan itself.
export default function SendReminderModal({ loan, loanOptions = [], onSend, onCancel }) {
  const isPreSelected = Boolean(loan);

  const [selectedId, setSelectedId] = useState("");
  const [type, setType] = useState(isPreSelected ? defaultReminderType(loan) : REMINDER_TYPES[0].value);
  const [message, setMessage] = useState(
    isPreSelected ? defaultMessage(defaultReminderType(loan), loan) : ""
  );
  // Once the person edits the message themselves, changing the type or the
  // loan must never overwrite what they wrote.
  const [messageEdited, setMessageEdited] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [sending, setSending] = useState(false);

  const activeLoan = isPreSelected ? loan : loanOptions.find((l) => l._id === selectedId);
  const recipientEmail = activeLoan?.farmer?.email;

  function handleSelectLoan(id) {
    setSelectedId(id);
    setErrors((prev) => ({ ...prev, borrower: undefined }));
    setServerError("");
    const picked = loanOptions.find((l) => l._id === id);
    if (picked && !messageEdited) {
      const suggested = defaultReminderType(picked);
      setType(suggested);
      setMessage(defaultMessage(suggested, picked));
    }
  }

  function handleTypeChange(value) {
    setType(value);
    if (activeLoan && !messageEdited) setMessage(defaultMessage(value, activeLoan));
  }

  async function handleSend() {
    if (sending) return;
    const newErrors = {
      borrower: !activeLoan ? "Select a borrower/loan." : null,
      message: !message.trim()
        ? "Message is required."
        : message.length > MAX_MESSAGE
        ? `Message must be ${MAX_MESSAGE} characters or fewer.`
        : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSending(true);
    setServerError("");
    try {
      await onSend({ loan: activeLoan._id, type, message: message.trim() });
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.");
      setSending(false);
    }
  }

  const fieldClass =
    "bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30";
  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Send Payment Reminder</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              This is emailed to the borrower's address on file, along with their real balance and due date.
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {!isPreSelected && loanOptions.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
            There are no active loans with a balance to send a reminder about.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <label className={labelClass}>Borrower / Loan *</label>
              {isPreSelected ? (
                <input
                  type="text"
                  readOnly
                  value={`${personName(loan.farmer)} - ${loanRef(loan._id)}`}
                  className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full text-gray-600 cursor-not-allowed"
                />
              ) : (
                <>
                  <select
                    value={selectedId}
                    onChange={(e) => handleSelectLoan(e.target.value)}
                    className={`${fieldClass} ${errors.borrower ? "border-red-400" : "border-gray-200"}`}
                  >
                    <option value="" disabled>
                      Select a borrower/loan
                    </option>
                    {loanOptions.map((l) => {
                      const days = daysOverdue(l.dueDate);
                      return (
                        <option key={l._id} value={l._id}>
                          {personName(l.farmer)} {loanRef(l._id)} — {peso(l.remainingBalance)} left
                          {days !== null && days > 0 ? ` · ${days} day${days === 1 ? "" : "s"} overdue` : ""}
                        </option>
                      );
                    })}
                  </select>
                  {errors.borrower && <p className="mt-1 text-xs text-red-500">{errors.borrower}</p>}
                </>
              )}
              {activeLoan &&
                (recipientEmail ? (
                  <p className="mt-1.5 text-xs text-gray-500">
                    Will be emailed to <strong>{recipientEmail}</strong>
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-red-500">
                    This borrower has no email address on file, so a reminder can't be sent.
                  </p>
                ))}
            </div>

            <div>
              <label className={labelClass}>Reminder Type *</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className={`${fieldClass} border-gray-200`}
              >
                {REMINDER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Message *</label>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setMessageEdited(true);
                  setErrors((prev) => ({ ...prev, message: undefined }));
                }}
                rows={4}
                maxLength={MAX_MESSAGE}
                className={`${fieldClass} resize-none ${errors.message ? "border-red-400" : "border-gray-200"}`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.message ? <p className="text-xs text-red-500">{errors.message}</p> : <span />}
                <p className="text-xs text-gray-400">
                  {message.length} / {MAX_MESSAGE}
                </p>
              </div>
            </div>

            {serverError && <p className="text-xs text-red-500">{serverError}</p>}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || (!isPreSelected && loanOptions.length === 0) || (activeLoan && !recipientEmail)}
            className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white rounded-xl px-5 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending…" : "Send reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}