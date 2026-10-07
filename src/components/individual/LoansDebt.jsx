import { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, AlertTriangle, Info, Plus } from "lucide-react";
import { authedRequest } from "../../api";

const peso = (n) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const STATUS_CONFIG = {
  pending: { label: "Pending review", Icon: Clock, iconColor: "text-amber-500", card: "bg-white border-gray-100" },
  approved: { label: "Approved", Icon: CheckCircle2, iconColor: "text-blue-500", card: "bg-white border-gray-100" },
  active: { label: "Active", Icon: Clock, iconColor: "text-amber-500", card: "border-2 border-[#4f7331] bg-white" },
  paid_off: { label: "Fully repaid", Icon: CheckCircle2, iconColor: "text-emerald-600", card: "bg-[#f0fdf4] border-emerald-300" },
  defaulted: { label: "Defaulted", Icon: AlertTriangle, iconColor: "text-red-500", card: "bg-red-50 border-red-200" },
  rejected: { label: "Rejected", Icon: XCircle, iconColor: "text-gray-400", card: "bg-gray-50 border-gray-200" },
};

function KPICard({ label, value, valueColor }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function LoanSelectorCard({ loan, isSelected, onSelect }) {
  const config = STATUS_CONFIG[loan.status] || STATUS_CONFIG.pending;
  const Icon = config.Icon;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left border rounded-2xl p-4 transition-colors ${config.card} ${
        isSelected ? "ring-1 ring-[#4d6b41]" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-gray-900">{loan.cooperative?.name || "Cooperative"}</h3>
        <Icon size={16} className={config.iconColor} />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">
        Requested {new Date(loan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-gray-500">{config.label}</span>
        <span className="text-gray-700 font-medium">{peso(loan.principalAmount)}</span>
      </div>
    </button>
  );
}

// Shows only real, verified fields — no invented "outstanding balance" or
// "total paid" figures, since there's no real payment-recording flow yet
// (LoanPayment is read-only: payment gateway integration isn't finalized).
function LoanDetailPanel({ loan }) {
  const config = STATUS_CONFIG[loan.status] || STATUS_CONFIG.pending;
  const stats = [
    { label: "Principal", value: peso(loan.principalAmount), color: "text-gray-900" },
    { label: "Interest Rate", value: `${loan.interestRatePercent}% p.a.`, color: "text-gray-900" },
    { label: "Term", value: `${loan.termMonths} months`, color: "text-gray-900" },
    { label: "Status", value: config.label, color: "text-gray-900" },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-gray-900">{loan.cooperative?.name || "Cooperative"}</h3>
      <p className="text-xs text-gray-400 mt-0.5">
        Requested {new Date(loan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="border border-gray-100 rounded-xl p-3">
            <p className="text-[11px] text-gray-400">{s.label}</p>
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loan.status === "pending" && (
        <div className="mt-4 bg-[#fff7ed] border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-amber-900">
          <Info size={14} className="shrink-0" />
          Waiting for {loan.cooperative?.name || "the cooperative"} to review this request.
        </div>
      )}
      {loan.status === "active" && loan.dueDate && (
        <div className="mt-4 bg-[#fff7ed] border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-amber-900">
          <Info size={14} className="shrink-0" />
          Due {new Date(loan.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      )}
      {loan.status === "rejected" && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-gray-600">
          <XCircle size={14} className="shrink-0" />
          This request was not approved.
        </div>
      )}
    </div>
  );
}

const selectClass =
  "bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30";

// Requests a real loan from a real, active cooperative — status is always
// decided by the backend (forced to "pending" there regardless of anything
// sent here), so there's nothing to pick for that on this form.
function NewLoanModal({ cooperatives, onSave, onCancel }) {
  const [cooperative, setCooperative] = useState(cooperatives[0]?._id || "");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestRatePercent, setInterestRatePercent] = useState("");
  const [termMonths, setTermMonths] = useState("12");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const principal = parseFloat(principalAmount);
    const rate = parseFloat(interestRatePercent);
    const term = parseInt(termMonths, 10);

    if (!cooperative) {
      setError("Select a cooperative.");
      return;
    }
    if (!principal || principal <= 0 || principal > 500000) {
      setError("Enter a principal amount between ₱1 and ₱500,000.");
      return;
    }
    if (rate === undefined || isNaN(rate) || rate < 0 || rate > 100) {
      setError("Enter an interest rate between 0 and 100.");
      return;
    }
    if (!term || term < 1 || term > 120) {
      setError("Enter a term between 1 and 120 months.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const newLoan = await authedRequest("/api/loans", {
        method: "POST",
        body: { cooperative, principalAmount: principal, interestRatePercent: rate, termMonths: term },
      });
      onSave(newLoan);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-900">Request a Loan</h3>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Cooperative *</label>
          {cooperatives.length === 0 ? (
            <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
              No active cooperatives are available to request a loan from yet.
            </p>
          ) : (
            <select value={cooperative} onChange={(e) => setCooperative(e.target.value)} className={selectClass}>
              {cooperatives.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Principal Amount (PHP) *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">
              ₱
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={principalAmount ? Number(principalAmount).toLocaleString("en-US") : ""}
              onChange={(e) => {
                // Strips anything that isn't a digit as it's typed — this
                // genuinely prevents letters/symbols from ever entering the
                // field, rather than just validating after the fact. Also
                // avoids the type="number" quirk where browsers still
                // accept "e" notation (e.g. typing "1e9" silently becomes
                // 1,000,000,000, bypassing any max attribute).
                const digitsOnly = e.target.value.replace(/[^\d]/g, "");
                setPrincipalAmount(digitsOnly);
              }}
              placeholder="50,000"
              className={`${selectClass} pl-8 ${
                Number(principalAmount) > 500000 ? "ring-2 ring-red-400 border-red-300" : ""
              }`}
            />
          </div>
          <p
            className={`mt-1 text-[11px] ${
              Number(principalAmount) > 500000 ? "text-red-500 font-semibold" : "text-gray-400"
            }`}
          >
            {principalAmount ? peso(Number(principalAmount)) : "₱0.00"} / ₱500,000.00 max
            {Number(principalAmount) > 500000 && " — over the limit"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Interest Rate (% p.a.) *</label>
            <input
              type="number"
              value={interestRatePercent}
              onChange={(e) => setInterestRatePercent(e.target.value)}
              placeholder="e.g., 12"
              max={100}
              className={selectClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Term (months) *</label>
            <select value={termMonths} onChange={(e) => setTermMonths(e.target.value)} className={selectClass}>
              {[6, 12, 24, 36, 60].map((m) => (
                <option key={m} value={m}>
                  {m} months
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || cooperatives.length === 0}
            className="px-6 py-2 rounded-xl bg-[#4f7331] text-white hover:bg-[#3f6238] transition-colors disabled:opacity-60"
          >
            {saving ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoansDebt() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loans, setLoans] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const [loansData, coopsData] = await Promise.all([
          authedRequest("/api/loans?limit=100"),
          authedRequest("/api/cooperatives"),
        ]);
        if (cancelled) return;
        setLoans(loansData);
        setCooperatives(coopsData);
        setSelectedId(loansData[0]?._id ?? null);
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

  function handleNewLoan(newLoan) {
    setLoans((prev) => [newLoan, ...prev]);
    setSelectedId(newLoan._id);
    setIsNewLoanOpen(false);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Loans & Debt</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Loans & Debt</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
          {loadError}
        </div>
      </div>
    );
  }

  const selectedLoan = loans.find((l) => l._id === selectedId) || null;
  const activeOrApproved = loans.filter((l) => l.status === "active" || l.status === "approved");
  const totalOutstanding = activeOrApproved.reduce((sum, l) => sum + l.principalAmount, 0);
  const pendingCount = loans.filter((l) => l.status === "pending").length;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Loans & Debt</h2>
          <p className="mt-1 text-gray-500">Track your loan requests and active borrowing</p>
        </div>
        <button
          onClick={() => setIsNewLoanOpen(true)}
          className="mt-12 bg-[#3f6238] hover:bg-[#34512e] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
        >
          <Plus size={16} /> Request a Loan
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Approved / Active Principal" value={peso(totalOutstanding)} valueColor="text-[#b83838]" />
        <KPICard label="Pending Requests" value={pendingCount} valueColor="text-[#be8238]" />
        <KPICard label="Total Loans" value={loans.length} valueColor="text-gray-900" />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          {loans.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No loans yet — click "Request a Loan" to submit your first request.
            </p>
          ) : (
            loans.map((loan) => (
              <LoanSelectorCard
                key={loan._id}
                loan={loan}
                isSelected={selectedId === loan._id}
                onSelect={() => setSelectedId(loan._id)}
              />
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedLoan ? (
            <LoanDetailPanel loan={selectedLoan} />
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 flex items-center justify-center min-h-[200px] shadow-sm">
              <p className="text-gray-400 text-sm">Select a loan to view details</p>
            </div>
          )}
        </div>
      </div>

      {isNewLoanOpen && (
        <NewLoanModal cooperatives={cooperatives} onSave={handleNewLoan} onCancel={() => setIsNewLoanOpen(false)} />
      )}
    </div>
  );
}