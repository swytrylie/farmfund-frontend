import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { getOverdueAccounts, sendReminder } from "../../mocks/organization/orgOverdueDebt.mock";
import SendReminderModal from "./SendReminderModal";

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

export default function OverdueDebtMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAccount, setActiveAccount] = useState(null);
  const [lastReminders, setLastReminders] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    getOverdueAccounts().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSendReminder() {
    await sendReminder();
    setLastReminders((prev) => ({
      ...prev,
      [activeAccount.loanId]: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
    setToastMessage(`Reminder sent to ${activeAccount.borrower}`);
    setActiveAccount(null);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Overdue Debt Monitoring</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading overdue accounts…
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Overdue Debt Monitoring</h2>
      <p className="mt-1 text-gray-500">Farmers with missed or overdue payments</p>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <p className="text-[#8b1e1e] font-bold text-lg mb-4">
          {data.accounts.length} overdue accounts • ₱{data.totalAtRisk.toLocaleString()} at risk
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="pb-2 font-semibold">Borrower</th>
                <th className="pb-2 font-semibold">Loan ID</th>
                <th className="pb-2 font-semibold">Amount Due</th>
                <th className="pb-2 font-semibold">Days Overdue</th>
                <th className="pb-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((account) => (
                <tr key={account.loanId} className="border-t border-gray-50">
                  <td className="py-3 pr-4 text-gray-900 font-medium">{account.borrower}</td>
                  <td className="py-3 pr-4 text-gray-500">{account.loanId}</td>
                  <td className="py-3 pr-4 text-red-600 font-semibold">
                    ₱{account.amountDue.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 text-gray-700">{account.daysOverdue} days</td>
                  <td className="py-3">
                    <button
                      onClick={() => setActiveAccount(account)}
                      className="bg-[#4f7331] hover:bg-[#3f5d27] text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
                    >
                      Send reminder
                    </button>
                    {lastReminders[account.loanId] && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        Last sent: {lastReminders[account.loanId]}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeAccount && (
        <SendReminderModal
          account={activeAccount}
          onSend={handleSendReminder}
          onCancel={() => setActiveAccount(null)}
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}