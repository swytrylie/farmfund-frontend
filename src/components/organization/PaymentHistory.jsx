import { useState, useEffect } from "react";
import { FileClock } from "lucide-react";
import { peso, METHOD_LABEL, loanRef, personName, fetchAllPages, withBalanceAfter } from "../../lib/repaymentData";

const MS_PER_DAY = 86400000;
const money = (n) => (typeof n === "number" ? peso(n) : "—");
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const LOAN_STATUS_LABEL = { active: "Active", paid_off: "Paid off", defaulted: "Defaulted" };
const LOAN_STATUS_STYLE = {
  active: "bg-green-100 text-green-800",
  paid_off: "bg-emerald-100 text-emerald-800",
  defaulted: "bg-red-100 text-red-700",
};

const startOfLocalDay = (d) => {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
};

// Loans have a single due date, not an installment schedule — so a payment
// is "on time" if it was made on or before that date, and otherwise "late"
// by exactly the number of days past it. Compared by calendar day, so the
// time of day a payment was entered never tips it over.
function paymentTiming(paymentDate, dueDate) {
  if (!dueDate) return null;
  const daysPast = Math.round((startOfLocalDay(paymentDate) - startOfLocalDay(dueDate)) / MS_PER_DAY);
  return { late: Math.max(0, daysPast) };
}

function StatusBadge({ timing }) {
  if (!timing) return <span className="text-gray-400">—</span>;
  if (timing.late === 0) {
    return <span className="bg-[#e8f5e9] text-[#2e7d32] font-medium px-3 py-1 rounded-full text-xs">On time</span>;
  }
  return (
    <span className="bg-[#fef3c7] text-[#92400e] font-medium px-3 py-1 rounded-full text-xs">
      {timing.late} day{timing.late === 1 ? "" : "s"} late
    </span>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <FileClock size={40} className="text-gray-300" />
      <p className="mt-3 text-sm text-gray-400">{message}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 min-w-0">
      <p className="text-[11px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-900 truncate" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

export default function PaymentHistory() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [payments, setPayments] = useState(null); // null while a loan's payments are loading
  const [paymentsError, setPaymentsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const all = await fetchAllPages("/api/loans");
        if (cancelled) return;
        // Only loans that have actually been disbursed can have a payment
        // history: still-pending, approved-but-not-yet-disbursed, and
        // rejected loans never will.
        const withHistory = all
          .filter((l) => ["active", "paid_off", "defaulted"].includes(l.status))
          .sort((a, b) => personName(a.farmer).localeCompare(personName(b.farmer)) || String(a._id).localeCompare(String(b._id)));
        setLoans(withHistory);
        setSelectedLoanId(withHistory[0]?._id || "");
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

  useEffect(() => {
    if (!selectedLoanId) return;
    // The cancelled flag stops a slow response for a loan you've already
    // switched away from from landing on top of the one you're looking at.
    let cancelled = false;
    setPayments(null);
    setPaymentsError("");
    fetchAllPages(`/api/loan-payments?loan=${selectedLoanId}`)
      .then((data) => {
        if (!cancelled) setPayments(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPayments([]);
          setPaymentsError(err.message || "Couldn't load this loan's payments.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedLoanId]);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Payment History</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Payment History</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  const selected = loans.find((l) => l._id === selectedLoanId);
  const rows =
    payments && selected
      ? withBalanceAfter(payments, new Map([[String(selected._id), selected]])).sort(
          (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate) || String(b._id).localeCompare(String(a._id))
        )
      : [];

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Payment History</h2>
      <p className="mt-1 text-gray-500">Complete repayment history for each borrower</p>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {loans.length === 0 ? (
          <EmptyState message="No loans have been disbursed yet — a payment history appears here once a loan is active." />
        ) : (
          <>
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium w-full sm:w-96 focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            >
              {loans.map((l) => (
                <option key={l._id} value={l._id}>
                  {personName(l.farmer)} {loanRef(l._id)} — {peso(l.principalAmount)} ({LOAN_STATUS_LABEL[l.status]})
                </option>
              ))}
            </select>

            {selected && (
              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">
                    {personName(selected.farmer)} · {loanRef(selected._id)}
                  </h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${LOAN_STATUS_STYLE[selected.status]}`}>
                    {LOAN_STATUS_LABEL[selected.status]}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="Total owed" value={money(selected.totalPayable)} />
                  <Stat label="Paid so far" value={money(selected.amountPaid)} />
                  <Stat label="Remaining" value={money(selected.remainingBalance)} />
                  <Stat label="Due date" value={selected.dueDate ? formatDate(selected.dueDate) : "—"} />
                </div>
              </div>
            )}

            <div className="mt-5">
              {paymentsError && <p className="mb-3 text-sm text-red-600">{paymentsError}</p>}
              {payments === null ? (
                <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
              ) : rows.length === 0 ? (
                !paymentsError && <EmptyState message="No payment history found for this loan." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                        <th className="pb-2 font-semibold">Date</th>
                        <th className="pb-2 font-semibold">Amount</th>
                        <th className="pb-2 font-semibold">Method</th>
                        <th className="pb-2 font-semibold">Balance After</th>
                        <th className="pb-2 font-semibold">Received By</th>
                        <th className="pb-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => (
                        <tr key={p._id} className="border-t border-gray-50">
                          <td className="py-3 pr-4 text-gray-600">{formatDate(p.paymentDate)}</td>
                          <td className="py-3 pr-4 font-bold text-[#4f7331]">{peso(p.amount)}</td>
                          <td className="py-3 pr-4 text-gray-600">{METHOD_LABEL[p.method] || p.method}</td>
                          <td className="py-3 pr-4 text-gray-900 font-medium">{money(p.balanceAfter)}</td>
                          <td className="py-3 pr-4 text-gray-600">{p.recordedBy ? personName(p.recordedBy) : "—"}</td>
                          <td className="py-3">
                            <StatusBadge timing={paymentTiming(p.paymentDate, selected?.dueDate)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}