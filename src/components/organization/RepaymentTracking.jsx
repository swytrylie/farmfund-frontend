import { useState, useEffect } from "react";
import { getRepaymentData } from "../../mocks/organization/orgRepayments.mock";

function formatDate(isoDate) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// userRole: "organization" (Owner/Staff — shows Received By) or
// "individual" (private lender — hides it). Only "organization" is
// currently reachable through any real UI in this app; "individual" here
// refers to a private-lender account type that doesn't exist yet, distinct
// from the "individual" farmer/borrower account already in the app.
//
// Read-only: payment records are meant to come from the backend fetching
// real data, not a manual "Record payment" form — that button and its
// modal were removed for exactly that reason.
export default function RepaymentTracking({ userRole = "organization" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isOrganization = userRole === "organization";

  useEffect(() => {
    let cancelled = false;
    getRepaymentData().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Repayment Tracking</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading repayments…
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Repayment Tracking</h2>
      <p className="mt-1 text-gray-500">
        Record and monitor farmers' repayments and remaining balances
      </p>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Recently Recorded</h3>

        {data.payments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No repayments recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Borrower</th>
                  <th className="pb-2 font-semibold">Loan ID</th>
                  <th className="pb-2 font-semibold">Amount</th>
                  <th className="pb-2 font-semibold">Method</th>
                  {isOrganization && <th className="pb-2 font-semibold">Received By</th>}
                  <th className="pb-2 font-semibold">Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id} className="border-t border-gray-50">
                    <td className="py-3 pr-4 text-gray-600">{formatDate(p.date)}</td>
                    <td className="py-3 pr-4 text-gray-900 font-medium">{p.borrower}</td>
                    <td className="py-3 pr-4 text-gray-500">{p.loanId}</td>
                    <td className="py-3 pr-4 text-green-700 font-semibold">
                      ₱{p.amount.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{p.method}</td>
                    {isOrganization && (
                      <td className="py-3 pr-4 text-gray-600">{p.receivedBy}</td>
                    )}
                    <td className="py-3 font-bold text-gray-900">
                      ₱{p.remainingBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}