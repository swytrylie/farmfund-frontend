import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { authedRequest } from "../../api";
import { peso, round2, METHOD_LABEL, loanRef, personName, fetchAllPages, withBalanceAfter } from "../../lib/repaymentData";

const MAX_PAYMENT = 500000;
const RECORDING_ROLES = ["owner", "finance_manager"];
const PAGE_SIZE = 25;

const todayLocalISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Keeps only what a money amount can contain as it's typed: digits and one
// decimal point, at most 2 decimal places — so letters, symbols, and the
// "1e9" scientific-notation trick can never get into the field at all.
function sanitizeAmount(raw) {
  let cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  if (cleaned.startsWith(".")) cleaned = "0" + cleaned;
  const [intPart, decPart] = cleaned.split(".");
  const trimmedInt = intPart.replace(/^0+(?=\d)/, "");
  return decPart === undefined ? trimmedInt : `${trimmedInt}.${decPart.slice(0, 2)}`;
}

function displayAmount(raw) {
  if (raw === "") return "";
  const [intPart, decPart] = raw.split(".");
  const formattedInt = Number(intPart).toLocaleString("en-US");
  return decPart === undefined ? formattedInt : `${formattedInt}.${decPart}`;
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
      {message}
    </div>
  );
}

function KPICard({ label, value, valueColor }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 min-w-0">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold truncate ${valueColor}`} title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function RecordPaymentModal({ loans, onSubmit, onCancel }) {
  const eligible = loans
    .filter((l) => (l.status === "active" || l.status === "defaulted") && l.remainingBalance > 0)
    .sort((a, b) => personName(a.farmer).localeCompare(personName(b.farmer)));

  const [loanId, setLoanId] = useState(eligible[0]?._id || "");
  const [amountRaw, setAmountRaw] = useState("");
  const [method, setMethod] = useState("cash");
  const [date, setDate] = useState(todayLocalISO());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = eligible.find((l) => l._id === loanId);
  const remaining = selected ? selected.remainingBalance : 0;
  const amount = amountRaw === "" || amountRaw === "." ? 0 : Number(amountRaw);
  const overLimit = amount > MAX_PAYMENT;
  const overBalance = selected ? amount > remaining + 0.001 : false;
  const futureDate = date > todayLocalISO();
  const canSave = !saving && !!selected && amount > 0 && !overLimit && !overBalance && !!date && !futureDate;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      // Noon UTC keeps the calendar day the same for anyone from the
      // Americas to the Philippines — a bare date would be read as UTC
      // midnight and could land on the previous day for some timezones.
      await onSubmit({ loan: loanId, amount, method, paymentDate: `${date}T12:00:00.000Z` });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const fieldClass = "bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30";
  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-gray-900">Record a Payment</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">Enter money your cooperative has actually received on a loan.</p>

        {eligible.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
            There are no active loans with a balance to record a payment against.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <label className={labelClass}>Loan *</label>
              <select
                value={loanId}
                onChange={(e) => {
                  setLoanId(e.target.value);
                  setError("");
                }}
                className={fieldClass}
              >
                {eligible.map((l) => (
                  <option key={l._id} value={l._id}>
                    {personName(l.farmer)} {loanRef(l._id)} — {peso(l.remainingBalance)} left
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Amount (PHP) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">₱</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={displayAmount(amountRaw)}
                  onChange={(e) => {
                    setAmountRaw(sanitizeAmount(e.target.value.replace(/,/g, "")));
                    setError("");
                  }}
                  placeholder="0.00"
                  className={`${fieldClass} pl-8 ${overLimit || overBalance ? "ring-2 ring-red-400 border-red-300" : ""}`}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className={overLimit || overBalance ? "text-red-500 font-semibold" : "text-gray-400"}>
                  {overLimit
                    ? `Over the ${peso(MAX_PAYMENT)} limit per payment`
                    : overBalance
                    ? `More than the remaining balance of ${peso(remaining)}`
                    : `Remaining balance: ${peso(remaining)}`}
                </span>
                <button
                  type="button"
                  onClick={() => setAmountRaw(String(round2(remaining)))}
                  className="text-[#4f7331] hover:underline font-medium"
                >
                  Pay full balance
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Method *</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className={fieldClass}>
                  {Object.entries(METHOD_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Date received *</label>
                <input type="date" value={date} max={todayLocalISO()} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
                {futureDate && <p className="mt-1 text-[11px] text-red-500 font-semibold">Date can't be in the future</p>}
              </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-6 py-2.5 rounded-xl bg-[#4f7331] text-white hover:bg-[#3f6238] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Recording…" : "Record payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RepaymentTracking() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cooperativeId, setCooperativeId] = useState(null);
  const [orgRole, setOrgRole] = useState(null);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  async function loadData(coopId) {
    const [loansData, paymentsData] = await Promise.all([
      fetchAllPages("/api/loans"),
      fetchAllPages(`/api/loan-payments?cooperative=${coopId}`),
    ]);
    setLoans(loansData);
    setPayments(paymentsData);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const me = await authedRequest("/api/auth/me");
        if (cancelled) return;
        if (!me.cooperativeId) {
          setLoadError("No cooperative membership found on this account.");
          setLoading(false);
          return;
        }
        setCooperativeId(me.cooperativeId);
        setOrgRole(me.orgRole);
        await loadData(me.cooperativeId);
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

  async function handleRecord(body) {
    // A failure here propagates to the form, which shows it inline and
    // stays open — nothing below runs unless the payment genuinely saved.
    await authedRequest("/api/loan-payments", { method: "POST", body });
    setIsModalOpen(false);
    setToastMessage("Payment recorded");
    try {
      await loadData(cooperativeId);
    } catch (err) {
      setLoadError(err.message || "The payment was saved, but the list couldn't be refreshed.");
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Repayment Tracking</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading repayments…</div>
      </div>
    );
  }

  if (loadError && payments.length === 0 && loans.length === 0) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Repayment Tracking</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  const canRecord = RECORDING_ROLES.includes(orgRole);
  const loansById = new Map(loans.map((l) => [String(l._id), l]));
  const rows = withBalanceAfter(payments, loansById).sort(
    (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate) || String(b._id).localeCompare(String(a._id))
  );

  const now = new Date();
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const collectedThisMonth = payments
    .filter((p) => {
      const d = new Date(p.paymentDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((s, p) => s + p.amount, 0);
  const outstanding = loans
    .filter((l) => l.status === "active" || l.status === "defaulted")
    .reduce((s, l) => s + l.remainingBalance, 0);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Repayment Tracking</h2>
          <p className="mt-1 text-gray-500">Record and monitor farmers' repayments and remaining balances</p>
        </div>
        {canRecord && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-12 bg-[#3f6238] hover:bg-[#34512e] text-white px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={16} /> Record Payment
          </button>
        )}
      </div>

      {loadError && <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{loadError}</div>}

      {!canRecord && (
        <p className="mt-4 text-xs text-gray-400">Only your cooperative's owner or finance managers can record payments.</p>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="COLLECTED THIS MONTH" value={peso(collectedThisMonth)} valueColor="text-[#4f7331]" />
        <KPICard label="TOTAL COLLECTED" value={peso(totalCollected)} valueColor="text-[#be8238]" />
        <KPICard label="OUTSTANDING BALANCE" value={peso(outstanding)} valueColor="text-[#a0522d]" />
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Recently Recorded</h3>

        {rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No repayments recorded yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Borrower</th>
                    <th className="pb-2 font-semibold">Loan</th>
                    <th className="pb-2 font-semibold">Amount</th>
                    <th className="pb-2 font-semibold">Method</th>
                    <th className="pb-2 font-semibold">Received By</th>
                    <th className="pb-2 font-semibold">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, visibleCount).map((p) => {
                    const loan = loansById.get(String(p.loan?._id || p.loan));
                    return (
                      <tr key={p._id} className="border-t border-gray-50">
                        <td className="py-3 pr-4 text-gray-600">
                          {new Date(p.paymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 pr-4 text-gray-900 font-medium">{personName(p.loan?.farmer || loan?.farmer)}</td>
                        <td className="py-3 pr-4 text-gray-500">{loanRef(p.loan?._id || p.loan)}</td>
                        <td className="py-3 pr-4 text-green-700 font-semibold">{peso(p.amount)}</td>
                        <td className="py-3 pr-4 text-gray-600">{METHOD_LABEL[p.method] || p.method}</td>
                        <td className="py-3 pr-4 text-gray-600">{p.recordedBy ? personName(p.recordedBy) : "—"}</td>
                        <td className="py-3 font-bold text-gray-900">{p.balanceAfter === null ? "—" : peso(p.balanceAfter)}</td>
                      </tr>
                    );
                  })}
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

      {isModalOpen && <RecordPaymentModal loans={loans} onSubmit={handleRecord} onCancel={() => setIsModalOpen(false)} />}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
    </div>
  );
}