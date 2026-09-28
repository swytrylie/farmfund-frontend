import { useState, useEffect } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { BORROWER_LOAN_OPTIONS } from "../../mocks/organization/orgPaymentReminders.mock";
import SendReminderModal from "./SendReminderModal";

function formatDate(isoDate) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  if (status === "delivered") {
    return (
      <span className="bg-[#eceff1] text-[#455a64] font-medium px-3 py-1 rounded-full text-xs">
        Delivered
      </span>
    );
  }
  return (
    <span className="bg-[#fef3c7] text-[#92400e] font-medium px-3 py-1 rounded-full text-xs">
      Pending
    </span>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2d4027] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

// reminders and onSendReminder now come from OrgDashboard as shared state
// — the same data the bell popup reads, so sending a reminder here is
// reflected there too, and vice versa.
export default function PaymentReminders({ reminders, onSendReminder }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  async function handleSend(payload) {
    await onSendReminder(payload);
    setToastMessage(`Reminder sent to ${payload.borrower}`);
    setIsModalOpen(false);
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Payment Reminders</h2>
          <p className="mt-1 text-gray-500">
            Send reminders to farmers about upcoming or overdue repayments
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-12 bg-[#38512f] hover:bg-[#2b3e24] text-white font-medium px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={16} /> Send reminder
        </button>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Recently Sent</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="pb-2 font-semibold">Borrower</th>
                <th className="pb-2 font-semibold">Type</th>
                <th className="pb-2 font-semibold">Channel</th>
                <th className="pb-2 font-semibold">Sent</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((r) => (
                <tr key={r.id} className="border-t border-gray-50">
                  <td className="py-3 pr-4 text-gray-900 font-medium">{r.borrower}</td>
                  <td className="py-3 pr-4 text-gray-600">{r.type}</td>
                  <td className="py-3 pr-4 text-gray-600">{r.channel}</td>
                  <td className="py-3 pr-4 text-gray-500">{formatDate(r.sent)}</td>
                  <td className="py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <SendReminderModal
          borrowerOptions={BORROWER_LOAN_OPTIONS}
          onSend={handleSend}
          onCancel={() => setIsModalOpen(false)}
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}