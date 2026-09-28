import { useState, useEffect } from "react";
import { FileClock } from "lucide-react";
import { getPaymentHistory, LOAN_OPTIONS } from "../../mocks/organization/orgPaymentHistory.mock";

function formatDate(isoDate) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  if (status === "on-time") {
    return (
      <span className="bg-[#e8f5e9] text-[#2e7d32] font-medium px-3 py-1 rounded-full text-xs">
        On time
      </span>
    );
  }
  // "late-3" → "3 days late"
  const daysLate = status.startsWith("late-") ? status.split("-")[1] : null;
  return (
    <span className="bg-[#fef3c7] text-[#92400e] font-medium px-3 py-1 rounded-full text-xs">
      {daysLate} days late
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <FileClock size={40} className="text-gray-300" />
      <p className="mt-3 text-sm text-gray-400">
        No payment history found for this loan.
      </p>
    </div>
  );
}

// userRole: "organization" (Owner/Staff — shows Received By) or
// "individual" (private lender — hides it). Only "organization" is
// currently reachable through any real UI in this app; "individual" here
// refers to a private-lender account type that doesn't exist yet, distinct
// from the "individual" farmer/borrower account already in the app.
export default function PaymentHistory({ userRole = "organization" }) {
  const [selectedLoanId, setSelectedLoanId] = useState(LOAN_OPTIONS[0].value);
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const isOrganization = userRole === "organization";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPaymentHistory(selectedLoanId).then((data) => {
      if (!cancelled) {
        setPayments(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedLoanId]);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Payment History</h2>
      <p className="mt-1 text-gray-500">
        Complete repayment history for each borrower
      </p>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <select
          value={selectedLoanId}
          onChange={(e) => setSelectedLoanId(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium w-72 focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
        >
          {LOAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="mt-5">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
          ) : payments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Amount</th>
                    <th className="pb-2 font-semibold">Method</th>
                    <th className="pb-2 font-semibold">Balance After</th>
                    {isOrganization && <th className="pb-2 font-semibold">Received By</th>}
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="py-3 pr-4 text-gray-600">{formatDate(p.date)}</td>
                      <td className="py-3 pr-4 font-bold text-[#4f7331]">
                        ₱{p.amount.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{p.method}</td>
                      <td className="py-3 pr-4 text-gray-900 font-medium">
                        ₱{p.balanceAfter.toLocaleString()}
                      </td>
                      {isOrganization && (
                        <td className="py-3 pr-4 text-gray-600">{p.receivedBy}</td>
                      )}
                      <td className="py-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}