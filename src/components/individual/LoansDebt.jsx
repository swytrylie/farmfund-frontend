import { useState, useEffect, useRef } from "react";
import { Clock, CheckCircle2, XCircle, AlertTriangle, Info, Plus, Wallet, X, Paperclip, Eye } from "lucide-react";
import { authedRequest } from "../../api";
import { sanitizeAmount, displayAmount, todayLocalISO, loanRef, METHOD_LABEL } from "../../lib/repaymentData";
import { ACCEPT, MAX_FILE_BYTES, fileProblem, bytesText, messageFrom, dateLocal } from "../../lib/certificates";
import {
  PROOF_METHODS,
  PROOF_METHOD_LABEL,
  STATUS_STYLE,
  REFERENCE_MAX,
  cleanReference,
  cleanNote,
  submitProof,
  listMyProofs,
  withdrawProof,
  openProofFile,
  prepareReceipt,
} from "../../lib/paymentProofs";

const MAX_PAYMENT = 500000;
// A loan can be paid while it is running (or late), and only while something is still owed.
const isPayable = (loan) => (loan.status === "active" || loan.status === "defaulted") && loan.remainingBalance > 0;

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

function LoanSelectorCard({ loan, isSelected, onSelect, waitingProofs = 0 }) {
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
        <span className="text-gray-700 font-medium">
          {loan.status === "active" || loan.status === "defaulted"
            ? `${peso(loan.remainingBalance ?? loan.principalAmount)} left`
            : peso(loan.principalAmount)}
        </span>
      </div>
      {waitingProofs > 0 && (
        <p className="mt-1.5 text-[11px] font-medium text-amber-700">
          {waitingProofs} payment proof{waitingProofs === 1 ? "" : "s"} waiting for the cooperative
        </p>
      )}
    </button>
  );
}

function ProofRow({ proof, onView, onWithdraw, busy }) {
  const style = STATUS_STYLE[proof.status] || STATUS_STYLE.pending;
  return (
    <li className="border border-gray-100 rounded-xl p-3" data-testid="proof-row">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-gray-900">
          {peso(proof.amount)} <span className="font-medium text-gray-500">via {PROOF_METHOD_LABEL[proof.method] || proof.method}</span>
        </p>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${style.chip}`}>{style.label}</span>
      </div>
      <p className="mt-0.5 text-xs text-gray-400">
        Paid {dateLocal(proof.paymentDate)} · sent {dateLocal(proof.createdAt)}
        {proof.referenceNumber ? ` · Ref ${proof.referenceNumber}` : ""}
      </p>
      {proof.status === "verified" && (
        <p className="mt-1.5 text-xs text-emerald-700">Verified{proof.reviewedByName ? ` by ${proof.reviewedByName}` : ""} — this payment is now counted on your loan.</p>
      )}
      {proof.status === "rejected" && (
        <p className="mt-1.5 text-xs text-red-600">
          Rejected{proof.reviewedByName ? ` by ${proof.reviewedByName}` : ""}
          {proof.reviewNote ? `: ${proof.reviewNote}` : "."} You can send a new proof.
        </p>
      )}
      {proof.status === "verified" && proof.reviewNote && <p className="mt-0.5 text-xs text-gray-500">Note: {proof.reviewNote}</p>}
      <div className="mt-2 flex items-center gap-3 text-xs">
        <button onClick={() => onView(proof)} className="inline-flex items-center gap-1 text-[#4f7331] font-medium hover:underline">
          <Eye size={13} /> View receipt
        </button>
        {proof.status === "pending" && (
          <button onClick={() => onWithdraw(proof)} disabled={busy} className="text-gray-500 hover:text-red-600 hover:underline disabled:opacity-50">
            Take back
          </button>
        )}
      </div>
    </li>
  );
}

// The payments the cooperative has recorded on this loan (including ones
// that came from a verified proof), newest first.
function RecordedPayments({ loanId, refreshKey }) {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: "", rows: [] });
    authedRequest(`/api/loan-payments?loan=${loanId}&limit=100`)
      .then((rows) => {
        if (!cancelled) setState({ loading: false, error: "", rows });
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, error: err.message || "Could not load payments.", rows: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [loanId, refreshKey]);

  if (state.loading) return <p className="text-xs text-gray-400">Loading payments…</p>;
  if (state.error) return <p className="text-xs text-red-500">{state.error}</p>;
  if (state.rows.length === 0) return <p className="text-xs text-gray-400">No payments recorded on this loan yet.</p>;

  return (
    <ul className="divide-y divide-gray-50" data-testid="recorded-payments">
      {state.rows.map((p) => (
        <li key={p._id} className="py-2 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {dateLocal(p.paymentDate)} · {METHOD_LABEL[p.method] || p.method}
          </span>
          <span className="font-semibold text-emerald-700">{peso(p.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

function LoanDetailPanel({ loan, proofs, onViewProof, onWithdrawProof, withdrawingId, paymentsRefresh }) {
  const config = STATUS_CONFIG[loan.status] || STATUS_CONFIG.pending;
  const hasBalance = typeof loan.totalPayable === "number" && ["active", "defaulted", "paid_off"].includes(loan.status);
  const stats = [
    { label: "Principal", value: peso(loan.principalAmount), color: "text-gray-900" },
    { label: "Interest Rate", value: `${loan.interestRatePercent}% p.a.`, color: "text-gray-900" },
    { label: "Term", value: `${loan.termMonths} months`, color: "text-gray-900" },
    { label: "Status", value: config.label, color: "text-gray-900" },
  ];
  const balanceStats = hasBalance
    ? [
        { label: "Total to repay", value: peso(loan.totalPayable), color: "text-gray-900" },
        { label: "Paid so far", value: peso(loan.amountPaid || 0), color: "text-emerald-700" },
        { label: "Remaining balance", value: peso(loan.remainingBalance ?? 0), color: "text-[#b83838]" },
      ]
    : [];

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
      {balanceStats.length > 0 && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {balanceStats.map((s) => (
            <div key={s.label} className="border border-gray-100 rounded-xl p-3 bg-gray-50/60">
              <p className="text-[11px] text-gray-400">{s.label}</p>
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loan.status === "pending" && (
        <div className="mt-4 bg-[#fff7ed] border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-amber-900">
          <Info size={14} className="shrink-0" />
          Waiting for {loan.cooperative?.name || "the cooperative"} to review this request.
        </div>
      )}
      {loan.status === "approved" && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-blue-900">
          <Info size={14} className="shrink-0" />
          Approved. You can start paying once {loan.cooperative?.name || "the cooperative"} releases the loan.
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

      {hasBalance && (
        <div className="mt-5">
          <h4 className="text-sm font-bold text-gray-900">Payments on this loan</h4>
          <div className="mt-1.5">
            <RecordedPayments loanId={loan._id} refreshKey={`${paymentsRefresh}:${loan.amountPaid}`} />
          </div>
        </div>
      )}

      {proofs.length > 0 && (
        <div className="mt-5">
          <h4 className="text-sm font-bold text-gray-900">Proofs you sent</h4>
          <p className="text-xs text-gray-400">Your balance only changes after the cooperative verifies a proof.</p>
          <ul className="mt-2 space-y-2">
            {proofs.map((p) => (
              <ProofRow key={p.id} proof={p} onView={onViewProof} onWithdraw={onWithdrawProof} busy={withdrawingId === p.id} />
            ))}
          </ul>
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

const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5";

// "I paid — here is my receipt." Sends the receipt to the cooperative that
// lent the money; nothing about the loan changes until they verify it.
function LoanPaymentModal({ loans, initialLoanId, onSent, onCancel }) {
  const payable = loans.filter(isPayable);
  const [loanId, setLoanId] = useState(payable.some((l) => l._id === initialLoanId) ? initialLoanId : payable[0]?._id || "");
  const [method, setMethod] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [date, setDate] = useState(todayLocalISO());
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [fileMsg, setFileMsg] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);

  const loan = payable.find((l) => l._id === loanId);
  const remaining = loan ? loan.remainingBalance : 0;
  const amount = amountRaw === "" || amountRaw === "." ? 0 : Number(amountRaw);
  const overLimit = amount > MAX_PAYMENT;
  const overBalance = loan ? amount > remaining + 0.001 : false;
  const futureDate = date > todayLocalISO();
  const canSend = !saving && !preparing && !!loan && !!method && amount > 0 && !overLimit && !overBalance && !!date && !futureDate && !!file && !fileMsg;

  useEffect(() => {
    if (!file || !/^image\//.test(file.type) || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handlePick(e) {
    const picked = e.target.files && e.target.files[0];
    if (!picked) return;
    setError("");
    setPreparing(true);
    const ready = await prepareReceipt(picked);
    setPreparing(false);
    const problem = fileProblem(ready);
    setFileMsg(problem);
    setFile(problem ? null : ready);
  }

  async function handleSend() {
    if (!canSend) return;
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("loan", loanId);
      body.append("amount", String(amount));
      body.append("method", method);
      // Noon UTC keeps the calendar day the same from the Americas to the Philippines.
      body.append("paymentDate", `${date}T12:00:00.000Z`);
      if (reference) body.append("referenceNumber", reference);
      if (note.trim()) body.append("note", note.trim());
      body.append("file", file);
      const result = await submitProof(body);
      onSent(result.proof);
    } catch (err) {
      setError(messageFrom(err, "Something went wrong. Please try again."));
      setSaving(false);
    }
  }

  const fieldClass = "bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={saving ? undefined : onCancel}>
      <div
        role="dialog"
        aria-label="Loan payment"
        className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-gray-900">Loan Payment</h3>
          <button onClick={onCancel} disabled={saving} className="text-gray-400 hover:text-gray-600" aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Paid your cooperative already? Upload your receipt here. Your balance changes once they check and verify it.
        </p>

        {payable.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">You have no active loan with a balance to pay.</p>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="lp-loan" className={labelClass}>Loan *</label>
              <select
                id="lp-loan"
                value={loanId}
                onChange={(e) => {
                  setLoanId(e.target.value);
                  setError("");
                }}
                className={fieldClass}
              >
                {payable.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.cooperative?.name || "Cooperative"} {loanRef(l._id)} — {peso(l.remainingBalance)} left
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lp-method" className={labelClass}>Payment method *</label>
              <select id="lp-method" value={method} onChange={(e) => setMethod(e.target.value)} className={fieldClass}>
                <option value="">Select a payment method</option>
                {PROOF_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lp-amount" className={labelClass}>Amount paid (PHP) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">₱</span>
                <input
                  id="lp-amount"
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
                <button type="button" onClick={() => setAmountRaw(String(Math.min(remaining, MAX_PAYMENT)))} className="text-[#4f7331] hover:underline font-medium">
                  Pay full balance
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lp-date" className={labelClass}>Date you paid *</label>
                <input id="lp-date" type="date" value={date} max={todayLocalISO()} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
                {futureDate && <p className="mt-1 text-[11px] text-red-500 font-semibold">Date can't be in the future</p>}
              </div>
              <div>
                <label htmlFor="lp-ref" className={labelClass}>{method === "cash" ? "Receipt / OR no." : "Reference no."} (optional)</label>
                <input
                  id="lp-ref"
                  type="text"
                  value={reference}
                  maxLength={REFERENCE_MAX}
                  onChange={(e) => setReference(cleanReference(e.target.value))}
                  placeholder="e.g. 5012 345 678"
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="lp-note" className={labelClass}>Note to the cooperative (optional)</label>
              <textarea
                id="lp-note"
                rows={2}
                value={note}
                maxLength={300}
                onChange={(e) => setNote(cleanNote(e.target.value))}
                className={`${fieldClass} resize-none`}
              />
            </div>

            <div>
              <span className={labelClass}>Proof of payment *</span>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPT}
                onChange={handlePick}
                onClick={(e) => {
                  e.currentTarget.value = ""; // so choosing the same file again still counts as a change
                }}
                className="hidden" aria-label="Receipt file" data-testid="receipt-input" />
              {file ? (
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl p-2.5">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Receipt preview" className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                  ) : (
                    <span className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">PDF</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{bytesText(file.size)}</p>
                  </div>
                  <button type="button" onClick={() => fileInput.current?.click()} className="text-xs text-[#4f7331] font-medium hover:underline">
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={preparing}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-4 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                >
                  <Paperclip size={16} /> {preparing ? "Getting your photo ready…" : "Choose a photo or PDF of your receipt"}
                </button>
              )}
              <p className={`mt-1 text-[11px] ${fileMsg ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                {fileMsg || `JPG, PNG or PDF, up to ${bytesText(MAX_FILE_BYTES)}. Big photos are made smaller for you.`}
              </p>
            </div>

            {error && (
              <p role="alert" className="text-xs text-red-500">
                {error}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onCancel} disabled={saving} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          {payable.length > 0 && (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="px-6 py-2.5 rounded-xl bg-[#4f7331] text-white hover:bg-[#3f6238] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Sending…" : "Send proof"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium max-w-[90vw] text-center">
      {message}
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
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [proofs, setProofs] = useState([]);
  const [toast, setToast] = useState("");
  const [actionError, setActionError] = useState("");
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [paymentsRefresh, setPaymentsRefresh] = useState(0);

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
        // The proofs are extra: if they can't be loaded the loans still show.
        try {
          const mine = await listMyProofs();
          if (!cancelled) setProofs(mine.proofs || []);
        } catch {
          if (!cancelled) setProofs([]);
        }
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

  function handleProofSent(proof) {
    setProofs((prev) => [proof, ...prev]);
    setSelectedId(proof.loanId);
    setIsPaymentOpen(false);
    setActionError("");
    setToast("Proof sent. Your cooperative will check it and verify it.");
  }

  async function handleViewProof(proof) {
    setActionError("");
    try {
      const opened = await openProofFile(proof.id);
      if (!opened) setActionError("Your browser blocked the new tab. Allow pop-ups for this site and try again.");
    } catch (err) {
      setActionError(messageFrom(err, "The receipt could not be opened."));
    }
  }

  async function handleWithdrawProof(proof) {
    if (!window.confirm(`Take back your ${peso(proof.amount)} payment proof? The cooperative will no longer see it.`)) return;
    setActionError("");
    setWithdrawingId(proof.id);
    try {
      await withdrawProof(proof.id);
      setProofs((prev) => prev.filter((p) => p.id !== proof.id));
      setToast("Proof taken back.");
    } catch (err) {
      setActionError(messageFrom(err, "Could not take the proof back."));
      // it may have been reviewed in the meantime: show what is true now
      try {
        const [mine, fresh] = await Promise.all([listMyProofs(), authedRequest("/api/loans?limit=100")]);
        setProofs(mine.proofs || []);
        setLoans(fresh);
        setPaymentsRefresh((n) => n + 1);
      } catch {
        // keep the message above
      }
    } finally {
      setWithdrawingId(null);
    }
  }

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
  // What is still owed, counting interest and subtracting what was paid.
  // (An approved loan has not paid anything yet, so it owes its full amount.)
  const owing = loans.filter((l) => ["active", "approved", "defaulted"].includes(l.status));
  const totalOutstanding = owing.reduce((sum, l) => sum + (typeof l.remainingBalance === "number" ? l.remainingBalance : l.principalAmount), 0);
  const pendingCount = loans.filter((l) => l.status === "pending").length;
  const canPay = loans.some(isPayable);
  const waitingByLoan = proofs.reduce((acc, p) => (p.status === "pending" ? { ...acc, [p.loanId]: (acc[p.loanId] || 0) + 1 } : acc), {});
  const selectedProofs = proofs.filter((p) => p.loanId === selectedId);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Loans & Debt</h2>
          <p className="mt-1 text-gray-500">Track your loan requests and active borrowing</p>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-end gap-2">
          {canPay && (
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="bg-white hover:bg-[#f4f8f3] text-[#3f6238] border border-[#3f6238] px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
            >
              <Wallet size={16} /> Loan Payment
            </button>
          )}
          <button
            onClick={() => setIsNewLoanOpen(true)}
            className="bg-[#3f6238] hover:bg-[#34512e] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={16} /> Request a Loan
          </button>
        </div>
      </div>

      {actionError && (
        <div role="alert" className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          {actionError}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Remaining Balance" value={peso(totalOutstanding)} valueColor="text-[#b83838]" />
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
                waitingProofs={waitingByLoan[loan._id] || 0}
              />
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedLoan ? (
            <LoanDetailPanel
              loan={selectedLoan}
              proofs={selectedProofs}
              onViewProof={handleViewProof}
              onWithdrawProof={handleWithdrawProof}
              withdrawingId={withdrawingId}
              paymentsRefresh={paymentsRefresh}
            />
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
      {isPaymentOpen && (
        <LoanPaymentModal loans={loans} initialLoanId={selectedId} onSent={handleProofSent} onCancel={() => setIsPaymentOpen(false)} />
      )}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}