import { useState, useEffect } from "react";
import { X, Plus, Eye } from "lucide-react";
import { authedRequest } from "../../api";
import {
  peso,
  round2,
  METHOD_LABEL,
  loanRef,
  personName,
  fetchAllPages,
  withBalanceAfter,
  sanitizeAmount,
  displayAmount,
  todayLocalISO,
} from "../../lib/repaymentData";
import { bytesText, messageFrom } from "../../lib/certificates";
import { PROOF_METHOD_LABEL, STATUS_STYLE, listCooperativeProofs, verifyProof, rejectProof, openProofFile } from "../../lib/paymentProofs";

const MAX_PAYMENT = 500000;
const RECORDING_ROLES = ["owner", "finance_manager"];
const PAGE_SIZE = 25;

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

const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function ProofChip({ status }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.pending;
  const label = status === "pending" ? "Needs review" : style.label;
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${style.chip}`}>{label}</span>;
}

// One farmer's proof of payment, opened for a decision. Verifying records the
// payment on the loan (the server does both together); rejecting needs a
// reason, which the farmer sees.
function ReviewProofModal({ proof, loan, onVerify, onReject, onCancel }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const before = loan ? loan.remainingBalance : null;
  const loanPayable = loan ? loan.status === "active" || loan.status === "defaulted" : true;
  const overBalance = before !== null && proof.amount > before + 0.001;
  const after = before === null ? null : Math.max(0, round2(before - proof.amount));
  const noteOk = note.trim().length >= 3;
  const verifyBlocked = !loanPayable || overBalance;

  async function openFile() {
    setError("");
    try {
      const opened = await openProofFile(proof.id);
      if (!opened) setError("Your browser blocked the new tab. Allow pop-ups for this site and try again.");
    } catch (err) {
      setError(messageFrom(err, "The receipt could not be opened."));
    }
  }

  async function run(kind, fn) {
    setBusy(kind);
    setError("");
    try {
      await fn(note);
    } catch (err) {
      setError(messageFrom(err, "Something went wrong. Please try again."));
      setBusy("");
    }
  }

  const rows = [
    ["Farmer", proof.farmerName || "Unknown"],
    ["Loan", loanRef(proof.loanId)],
    ["Amount paid", peso(proof.amount)],
    ["Method", PROOF_METHOD_LABEL[proof.method] || proof.method],
    ["Date paid", fmtDate(proof.paymentDate)],
    proof.referenceNumber ? ["Reference no.", proof.referenceNumber] : null,
    ["Sent", fmtDate(proof.createdAt)],
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={busy ? undefined : onCancel}>
      <div role="dialog" aria-label="Review payment proof" className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[92vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-gray-900">Review payment proof</h3>
          <button onClick={onCancel} disabled={!!busy} className="text-gray-400 hover:text-gray-600" aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        <dl className="mt-4 text-sm divide-y divide-gray-50">
          {rows.map(([k, v]) => (
            <div key={k} className="py-1.5 flex justify-between gap-4">
              <dt className="text-gray-400">{k}</dt>
              <dd className="font-semibold text-gray-900 text-right break-words min-w-0">{v}</dd>
            </div>
          ))}
        </dl>
        {proof.note && (
          <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 break-words">
            <span className="text-gray-400">Farmer's note: </span>
            {proof.note}
          </p>
        )}

        <button onClick={openFile} className="mt-4 w-full inline-flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Eye size={15} /> View receipt{proof.fileType ? ` (${proof.fileType.toUpperCase()}${proof.bytes ? `, ${bytesText(proof.bytes)}` : ""})` : ""}
        </button>

        {before !== null && (
          <p className={`mt-3 text-xs rounded-xl px-3 py-2 ${verifyBlocked ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"}`}>
            {!loanPayable
              ? `This loan is ${loan.status.replace("_", " ")}, so a payment can't be recorded on it.`
              : overBalance
              ? `This is more than the remaining balance of ${peso(before)}. Reject it and ask the farmer to send the right amount.`
              : `Balance goes from ${peso(before)} to ${peso(after)} when verified.`}
          </p>
        )}

        <div className="mt-4">
          <label htmlFor="rp-note" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
            Note to the farmer <span className="normal-case font-normal">(needed to reject)</span>
          </label>
          <textarea
            id="rp-note"
            rows={2}
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value.replace(/[<>]/g, ""))}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
        </div>

        {error && (
          <p role="alert" className="mt-2 text-xs text-red-500">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={() => run("reject", (n) => onReject(proof, n))}
            disabled={!!busy || !noteOk}
            title={noteOk ? "" : "Write why you are rejecting it (at least 3 characters)"}
            className="px-5 py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === "reject" ? "Rejecting…" : "Reject"}
          </button>
          <button
            onClick={() => run("verify", (n) => onVerify(proof, n))}
            disabled={!!busy || verifyBlocked}
            className="px-5 py-2.5 rounded-xl bg-[#4f7331] text-white hover:bg-[#3f6238] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy === "verify" ? "Recording…" : "Verify & record payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// The farmers' proofs of payment. Waiting ones come first and are the point of
// the section; reviewed ones can be shown underneath.
function ProofsSection({ proofs, pendingCount, reviewed, showReviewed, onToggleReviewed, reviewedError, onReview, onView }) {
  const renderRow = (p, action) => (
    <li key={p.id} className="border border-gray-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3" data-testid="proof-row">
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-900">
          {p.farmerName || "Unknown"} <span className="font-medium text-gray-400">{loanRef(p.loanId)}</span>
        </p>
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-green-700">{peso(p.amount)}</span> via {PROOF_METHOD_LABEL[p.method] || p.method} · paid {fmtDate(p.paymentDate)}
          {p.referenceNumber ? ` · Ref ${p.referenceNumber}` : ""}
        </p>
        {p.status !== "pending" && (
          <p className="text-xs text-gray-400 mt-0.5">
            {p.status === "verified" ? "Verified" : "Rejected"}
            {p.reviewedByName ? ` by ${p.reviewedByName}` : ""}
            {p.reviewedAt ? ` · ${fmtDate(p.reviewedAt)}` : ""}
            {p.reviewNote ? ` — ${p.reviewNote}` : ""}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ProofChip status={p.status} />
        <button onClick={() => onView(p)} className="inline-flex items-center gap-1 text-xs text-[#4f7331] font-medium hover:underline">
          <Eye size={13} /> Receipt
        </button>
        {action}
      </div>
    </li>
  );

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm" data-testid="proofs-section">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-gray-900">
          Payment Proofs from Farmers
          {pendingCount > 0 && <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{pendingCount} to review</span>}
        </h3>
        <button onClick={onToggleReviewed} className="text-xs text-[#4f7331] font-medium hover:underline">
          {showReviewed ? "Hide reviewed" : "Show reviewed"}
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-400">Farmers upload a receipt after paying. A proof only counts once you verify it.</p>

      {proofs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No proofs are waiting for review.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {proofs.map((p) => (
            renderRow(
              p,
              <button onClick={() => onReview(p)} className="px-3 py-1.5 rounded-lg bg-[#4f7331] text-white text-xs font-medium hover:bg-[#3f6238]">
                Review
              </button>
            )
          ))}
        </ul>
      )}
      {pendingCount > proofs.length && <p className="mt-2 text-xs text-gray-400">Showing the newest {proofs.length} of {pendingCount}.</p>}

      {showReviewed && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-bold text-gray-900">Reviewed proofs</h4>
          {reviewedError ? (
            <p className="mt-2 text-xs text-red-500">{reviewedError}</p>
          ) : reviewed === null ? (
            <p className="mt-2 text-xs text-gray-400">Loading…</p>
          ) : reviewed.length === 0 ? (
            <p className="mt-2 text-xs text-gray-400">Nothing has been reviewed yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {reviewed.map((p) => renderRow(p))}
            </ul>
          )}
        </div>
      )}
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
  const [proofs, setProofs] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [proofsError, setProofsError] = useState("");
  const [reviewed, setReviewed] = useState(null);
  const [reviewedError, setReviewedError] = useState("");
  const [showReviewed, setShowReviewed] = useState(false);
  const [reviewing, setReviewing] = useState(null);

  async function loadProofs(coopId) {
    try {
      const r = await listCooperativeProofs(coopId, { status: "pending" });
      setProofs(r.proofs || []);
      setPendingCount(r.pendingCount || 0);
      setProofsError("");
    } catch (err) {
      setProofsError(messageFrom(err, "Could not load the payment proofs."));
    }
  }

  async function loadReviewed(coopId) {
    try {
      const [ok, no] = await Promise.all([
        listCooperativeProofs(coopId, { status: "verified", limit: 50 }),
        listCooperativeProofs(coopId, { status: "rejected", limit: 50 }),
      ]);
      const all = [...(ok.proofs || []), ...(no.proofs || [])].sort((a, b) => new Date(b.reviewedAt || b.createdAt) - new Date(a.reviewedAt || a.createdAt));
      setReviewed(all);
      setReviewedError("");
    } catch (err) {
      setReviewedError(messageFrom(err, "Could not load reviewed proofs."));
    }
  }

  async function loadData(coopId, role = orgRole) {
    const [loansData, paymentsData] = await Promise.all([
      fetchAllPages("/api/loans"),
      fetchAllPages(`/api/loan-payments?cooperative=${coopId}`),
    ]);
    setLoans(loansData);
    setPayments(paymentsData);
    // Only the owner and finance managers may see proofs; for anyone else the
    // server would refuse, so they are not asked.
    if (RECORDING_ROLES.includes(role)) {
      await loadProofs(coopId);
      if (showReviewed) await loadReviewed(coopId);
    }
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
        await loadData(me.cooperativeId, me.orgRole);
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

  async function handleVerify(proof, note) {
    await verifyProof(proof.id, note);
    setReviewing(null);
    setToastMessage("Payment verified and recorded");
    try {
      await loadData(cooperativeId);
    } catch (err) {
      setLoadError(err.message || "The payment was recorded, but the list couldn't be refreshed.");
    }
  }

  async function handleReject(proof, note) {
    await rejectProof(proof.id, note);
    setReviewing(null);
    setToastMessage("Payment proof rejected");
    try {
      await loadData(cooperativeId);
    } catch (err) {
      setLoadError(err.message || "The proof was rejected, but the list couldn't be refreshed.");
    }
  }

  async function handleView(proof) {
    try {
      const opened = await openProofFile(proof.id);
      if (!opened) setProofsError("Your browser blocked the new tab. Allow pop-ups for this site and try again.");
    } catch (err) {
      setProofsError(messageFrom(err, "The receipt could not be opened."));
    }
  }

  function handleToggleReviewed() {
    const next = !showReviewed;
    setShowReviewed(next);
    if (next) {
      setReviewed(null);
      loadReviewed(cooperativeId);
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

      <div className={`mt-6 grid grid-cols-1 sm:grid-cols-3 ${canRecord ? "lg:grid-cols-4" : ""} gap-4`}>
        {canRecord && <KPICard label="PROOFS TO REVIEW" value={pendingCount} valueColor={pendingCount > 0 ? "text-amber-600" : "text-gray-900"} />}
        <KPICard label="COLLECTED THIS MONTH" value={peso(collectedThisMonth)} valueColor="text-[#4f7331]" />
        <KPICard label="TOTAL COLLECTED" value={peso(totalCollected)} valueColor="text-[#be8238]" />
        <KPICard label="OUTSTANDING BALANCE" value={peso(outstanding)} valueColor="text-[#a0522d]" />
      </div>

      {canRecord && proofsError && <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{proofsError}</div>}
      {canRecord && (
        <ProofsSection
          proofs={proofs}
          pendingCount={pendingCount}
          reviewed={reviewed}
          showReviewed={showReviewed}
          onToggleReviewed={handleToggleReviewed}
          reviewedError={reviewedError}
          onReview={setReviewing}
          onView={handleView}
        />
      )}

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

      {reviewing && (
        <ReviewProofModal
          proof={reviewing}
          loan={loansById.get(String(reviewing.loanId))}
          onVerify={handleVerify}
          onReject={handleReject}
          onCancel={() => setReviewing(null)}
        />
      )}
      {isModalOpen && <RecordPaymentModal loans={loans} onSubmit={handleRecord} onCancel={() => setIsModalOpen(false)} />}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
    </div>
  );
}