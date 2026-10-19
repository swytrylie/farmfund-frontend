import { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle2, XCircle, Info, Hourglass, LifeBuoy, Snowflake, X } from "lucide-react";
import { authedRequest } from "../../api";
import LoanBasis from "../shared/LoanBasis";
import { rateText, termText, isCycleLoan } from "../../lib/loans";
import { activateFreeze, openClaimProof, isRunning } from "../../lib/calamity";
import { dateLocal } from "../../lib/certificates";

const peso = (n) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

function KPICard({ label, value, valueColor }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

const STATUS_CONFIG = {
  pending: { label: "Pending review", Icon: Clock, iconColor: "text-amber-500", card: "border-2 border-[#4f7331] bg-white" },
  approved: { label: "Approved", Icon: CheckCircle2, iconColor: "text-blue-500", card: "border border-gray-200 bg-white" },
  active: { label: "Active", Icon: Clock, iconColor: "text-amber-500", card: "border border-gray-200 bg-white" },
  grace_period: { label: "Grace period", Icon: Hourglass, iconColor: "text-teal-600", card: "border border-teal-200 bg-white" },
  paid_off: { label: "Paid off", Icon: CheckCircle2, iconColor: "text-emerald-600", card: "border border-emerald-200 bg-[#f4f8f3]" },
  defaulted: { label: "Defaulted", Icon: AlertTriangle, iconColor: "text-red-500", card: "border border-red-200 bg-red-50" },
  rejected: { label: "Rejected", Icon: XCircle, iconColor: "text-gray-400", card: "border border-gray-200 bg-gray-50" },
};

function LoanCard({ loan, isSelected, onSelect }) {
  const config = STATUS_CONFIG[loan.status] || STATUS_CONFIG.pending;
  const Icon = config.Icon;
  const borrowerName = loan.farmer ? `${loan.farmer.firstName} ${loan.farmer.lastName}` : "Unknown farmer";

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl p-4 shadow-sm relative transition-colors ${config.card} ${
        isSelected ? "ring-1 ring-[#4d6b41]" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-gray-900">{borrowerName}</h3>
        <Icon size={16} className={config.iconColor} />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">
        Requested {new Date(loan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-gray-500">{config.label}</span>
        <span className="font-semibold text-gray-700">{peso(loan.principalAmount)}</span>
      </div>
    </button>
  );
}

// A disaster relief claim that a FarmFund admin already verified. The cooperative
// only sees it from that point on. Only the owner gets the freeze button.
function ReliefCard({ loan, onFreeze }) {
  const relief = loan.relief;
  const claim = relief && relief.claim;
  const [proofError, setProofError] = useState("");
  if (!claim) return null;
  const fr = claim.freeze;

  async function viewProof() {
    setProofError("");
    try {
      await openClaimProof(claim.id);
    } catch (err) {
      setProofError(err.message || "Couldn't open the proof. Please try again.");
    }
  }

  return (
    <div data-testid="relief-card" className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-sky-900">
        <LifeBuoy size={15} className="shrink-0" />
        Disaster relief claim: {claim.calamityLabel}
      </div>
      <p className="mt-1 text-xs text-sky-800">
        A FarmFund admin checked the farmer's proof and verified it on {dateLocal(claim.review?.reviewedAt || claim.createdAt)}.
      </p>
      {claim.description && <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{claim.description}</p>}
      {/* The two buttons sit in one wrapping row so they can never overlap */}
      {(claim.hasFile || (!fr && relief.canFreeze)) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
          {claim.hasFile && (
            <button onClick={viewProof} className="text-xs font-semibold text-sky-800 underline hover:text-sky-950">
              View proof
            </button>
          )}
          {!fr && relief.canFreeze && (
            <button
              onClick={onFreeze}
              className="px-4 py-2 rounded-xl bg-sky-700 text-white text-sm font-semibold hover:bg-sky-800 transition-colors"
            >
              Activate calamity freeze
            </button>
          )}
        </div>
      )}
      {proofError && <p className="mt-1 text-xs text-red-600">{proofError}</p>}

      {fr ? (
        <p data-testid="freeze-info" className="mt-3 rounded-lg bg-white border border-sky-200 px-3 py-2 text-xs text-sky-900">
          <Snowflake size={12} className="inline mr-1 -mt-0.5" />
          {fr.running ? "Calamity freeze active" : "Calamity freeze ended"}: no new interest until {dateLocal(fr.endsAt)}. Due date moved from{" "}
          {dateLocal(fr.previousDueDate)} to {dateLocal(fr.newDueDate)}.
        </p>
      ) : relief.canFreeze ? null : (
        <p className="mt-3 text-xs text-sky-800">Only the cooperative's owner can activate the calamity freeze.</p>
      )}
    </div>
  );
}

function FreezeModal({ loan, busy, error, onConfirm, onClose }) {
  const name = loan.farmer ? `${loan.farmer.firstName} ${loan.farmer.lastName}` : "the farmer";
  const close = () => {
    if (!busy) onClose();
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={close}>
      <div role="dialog" aria-label="Activate calamity freeze" className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={18} />
        </button>
        <h3 className="text-lg font-bold text-gray-900">Activate the calamity freeze?</h3>
        <p className="text-sm text-gray-500 mt-2">
          {name}'s due date moves 90 days later and no new interest is added during that time. {name} gets a message now and another when the freeze ends. This cannot be undone.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-end gap-3 mt-5">
          <button onClick={close} disabled={busy} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy} className="px-5 py-2 rounded-xl bg-sky-700 text-white text-sm font-semibold hover:bg-sky-800 disabled:opacity-60">
            {busy ? "Working…" : "Activate freeze"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Shows only real, verified fields — no "outstanding balance" or "total
// paid" chart, since there's no real payment-recording flow yet
// (LoanPayment is read-only: payment gateway integration isn't finalized).
function LoanDetailPanel({ loan, onUpdateStatus, updating, onFreeze }) {
  const config = STATUS_CONFIG[loan.status] || STATUS_CONFIG.pending;
  const borrowerName = loan.farmer ? `${loan.farmer.firstName} ${loan.farmer.lastName}` : "Unknown farmer";

  const stats = [
    { label: "Principal", value: peso(loan.principalAmount), color: "text-gray-900" },
    { label: "Interest Rate", value: rateText(loan), color: "text-gray-900" },
    { label: isCycleLoan(loan) ? "Repayment period" : "Term", value: termText(loan), color: "text-gray-900" },
    { label: "Status", value: config.label, color: "text-gray-900" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="font-bold text-gray-900">{borrowerName}</h3>
      <p className="text-xs text-gray-500 mt-0.5">{loan.farmer?.email || ""}</p>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="border border-gray-100 rounded-xl p-3">
            <p className="text-[11px] text-gray-400">{s.label}</p>
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {typeof loan.totalPayable === "number" && (
        <p className="mt-2 text-xs text-gray-500">
          Total to repay: <span className="font-semibold text-gray-700">{peso(loan.totalPayable)}</span> (principal plus interest)
        </p>
      )}
      <LoanBasis loan={loan} />

      {loan.status === "pending" && (
        <div className="mt-4 bg-[#fff8ed] border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-sm">
          <Info size={14} className="text-amber-700 shrink-0" />
          <span>This request is awaiting your cooperative's decision.</span>
        </div>
      )}

      {loan.status === "grace_period" && (
        <div data-testid="grace-note" className="mt-4 bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center gap-2 text-sm text-teal-900">
          <Hourglass size={14} className="shrink-0" />
          <span>The harvest date has passed. This loan is in its grace period until {dateLocal(loan.graceEndsAt || loan.dueDate)}. The farmer can still pay.</span>
        </div>
      )}

      {(isRunning(loan) || (loan.status === "approved" && isCycleLoan(loan))) && loan.dueDate && (
        <div className="mt-4 bg-[#fff8ed] border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-sm">
          <Info size={14} className="text-amber-700 shrink-0" />
          <span>
            Due <span className="font-bold text-[#8a2d2d]">
              {new Date(loan.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          </span>
        </div>
      )}

      <ReliefCard loan={loan} onFreeze={onFreeze} />

      {loan.status === "pending" && (
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => onUpdateStatus(loan._id, "approved")}
            disabled={updating}
            className="px-6 py-2.5 rounded-xl bg-[#4f7331] text-white text-sm font-semibold hover:bg-[#3f6238] transition-colors disabled:opacity-60"
          >
            {updating ? "Working…" : "Approve"}
          </button>
          <button
            onClick={() => onUpdateStatus(loan._id, "rejected")}
            disabled={updating}
            className="px-6 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            {updating ? "Working…" : "Reject"}
          </button>
        </div>
      )}

      {loan.status === "approved" && (
        <div className="mt-6">
          <button
            onClick={() => onUpdateStatus(loan._id, "active")}
            disabled={updating}
            className="px-6 py-2.5 rounded-xl bg-[#4f7331] text-white text-sm font-semibold hover:bg-[#3f6238] transition-colors disabled:opacity-60"
          >
            {updating ? "Working…" : "Mark as Disbursed (Active)"}
          </button>
        </div>
      )}
    </div>
  );
}

function NoCooperativePrompt() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center max-w-md mx-auto">
      <h3 className="font-bold text-gray-900 text-lg">No cooperative membership found</h3>
      <p className="mt-2 text-sm text-gray-500">
        This page shows loan requests made to your cooperative — your account doesn't appear to belong to one yet.
      </p>
    </div>
  );
}

export default function LoanRecords() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loans, setLoans] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [freezeLoanId, setFreezeLoanId] = useState(null);
  const [freezeBusy, setFreezeBusy] = useState(false);
  const [freezeError, setFreezeError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const data = await authedRequest("/api/loans?limit=100");
        if (cancelled) return;
        setLoans(data);
        setSelectedId(data[0]?._id ?? null);
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

  async function handleUpdateStatus(loanId, newStatus) {
    setUpdatingId(loanId);
    try {
      const updated = await authedRequest(`/api/loans/${loanId}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      setLoans((prev) => prev.map((l) => (l._id === loanId ? { ...l, ...updated } : l)));
    } catch (err) {
      setLoadError(err.message || "Couldn't update this loan. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleFreeze() {
    const loan = loans.find((l) => l._id === freezeLoanId);
    const claimId = loan && loan.relief && loan.relief.claim ? loan.relief.claim.id : null;
    if (!claimId || freezeBusy) return;
    setFreezeBusy(true);
    setFreezeError("");
    try {
      const updated = await activateFreeze(claimId);
      setLoans((prev) => prev.map((l) => (l._id === updated._id ? { ...l, ...updated } : l)));
      setFreezeLoanId(null);
    } catch (err) {
      setFreezeError(err.message || "Couldn't activate the freeze. Please try again.");
    } finally {
      setFreezeBusy(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Loan Records</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading…</div>
      </div>
    );
  }

  if (loadError && loans.length === 0) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Loan Records</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  if (loans.length === 0 && !loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Loan Records</h2>
        <NoCooperativePrompt />
      </div>
    );
  }

  const filteredLoans = statusFilter === "all" ? loans : loans.filter((l) => l.status === statusFilter);
  const selectedLoan = loans.find((l) => l._id === selectedId) || null;

  const pendingCount = loans.filter((l) => l.status === "pending").length;
  const activeCount = loans.filter((l) => isRunning(l) || l.status === "approved").length;
  const totalPrincipal = loans
    .filter((l) => isRunning(l) || l.status === "approved")
    .reduce((s, l) => s + l.principalAmount, 0);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Loan Records</h2>
      <p className="mt-1 text-gray-500">Real loan requests made to your cooperative</p>

      {loadError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{loadError}</div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Pending Review" value={pendingCount} valueColor="text-[#be8238]" />
        <KPICard label="Active / Approved" value={activeCount} valueColor="text-gray-900" />
        <KPICard label="Outstanding Principal" value={peso(totalPrincipal)} valueColor="text-[#b83838]" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["all", "pending", "approved", "active", "grace_period", "paid_off", "rejected"].map((key) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === key ? "bg-[#4f7331] text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {key === "all" ? "All" : STATUS_CONFIG[key]?.label || key}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          {filteredLoans.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No loans match this filter.</p>
          ) : (
            filteredLoans.map((loan) => (
              <LoanCard
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
            <LoanDetailPanel
              loan={selectedLoan}
              onUpdateStatus={handleUpdateStatus}
              updating={updatingId === selectedLoan._id}
              onFreeze={() => {
                setFreezeError("");
                setFreezeLoanId(selectedLoan._id);
              }}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 flex items-center justify-center min-h-[200px] shadow-sm">
              <p className="text-gray-400 text-sm">Select a loan to view details</p>
            </div>
          )}
        </div>
      </div>
      {freezeLoanId && loans.find((l) => l._id === freezeLoanId) && (
        <FreezeModal
          loan={loans.find((l) => l._id === freezeLoanId)}
          busy={freezeBusy}
          error={freezeError}
          onConfirm={handleFreeze}
          onClose={() => setFreezeLoanId(null)}
        />
      )}
    </div>
  );
}