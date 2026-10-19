import { useState, useEffect, useRef } from "react";
import { Clock, CheckCircle2, XCircle, AlertTriangle, Info, Plus, Wallet, X, Paperclip, Eye, Hourglass, LifeBuoy, Snowflake } from "lucide-react";
import { authedRequest } from "../../api";
import LoanBasis from "../shared/LoanBasis";
import { sanitizeAmount, displayAmount, todayLocalISO, loanRef, METHOD_LABEL } from "../../lib/repaymentData";
import { ACCEPT, MAX_FILE_BYTES, fileProblem, bytesText, messageFrom, dateLocal, getCredit, CREDIT_LIMIT_AMOUNT } from "../../lib/certificates";
import {
  getLoanOptions,
  requestLoan,
  openCollateralFile,
  DESCRIPTION_MIN,
  DESCRIPTION_MAX,
  cleanDescription,
  growingText,
  isCycleLoan,
  rateText,
  termText,
  interestAmount,
  estimatedDue,
  isAwaitingAdmin,
  wasNotVerified,
} from "../../lib/loans";
import { createReliefClaim, openClaimProof, isRunning, isGracePeriod, claimSummary } from "../../lib/calamity";
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
// A loan can be paid while it is running (in its grace period too) or late, and only while something is still owed.
const isPayable = (loan) => (isRunning(loan) || loan.status === "defaulted") && loan.remainingBalance > 0;

const peso = (n) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const STATUS_CONFIG = {
  pending_admin: { label: "Awaiting admin check", Icon: Clock, iconColor: "text-amber-500", card: "bg-white border-gray-100" },
  admin_rejected: { label: "Not verified", Icon: XCircle, iconColor: "text-red-400", card: "bg-gray-50 border-gray-200" },
  pending: { label: "Pending review", Icon: Clock, iconColor: "text-amber-500", card: "bg-white border-gray-100" },
  approved: { label: "Approved", Icon: CheckCircle2, iconColor: "text-blue-500", card: "bg-white border-gray-100" },
  active: { label: "Active", Icon: Clock, iconColor: "text-amber-500", card: "border-2 border-[#4f7331] bg-white" },
  grace_period: { label: "Grace period", Icon: Hourglass, iconColor: "text-teal-600", card: "border-2 border-teal-500 bg-white" },
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

      {loan.cropLabel && <p className="text-xs text-gray-500 mt-0.5">{loan.cropLabel}</p>}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-gray-500">{config.label}</span>
        <span className="text-gray-700 font-medium">
          {isRunning(loan) || loan.status === "defaulted"
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

// Disaster relief on a running crop loan: the button to ask, and where the
// latest claim stands.
const TONE = {
  wait: "bg-amber-50 border-amber-200 text-amber-900",
  bad: "bg-red-50 border-red-200 text-red-800",
  good: "bg-sky-50 border-sky-200 text-sky-900",
  done: "bg-gray-50 border-gray-200 text-gray-700",
};
function ReliefSection({ loan, onRequest, onViewProof }) {
  const relief = loan.relief;
  if (!relief || (!relief.claim && !relief.canRequest)) return null;
  const claim = relief.claim;
  const summary = claimSummary(claim);
  return (
    <div className="mt-4 border border-gray-100 rounded-xl p-3" data-testid="relief-section">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <LifeBuoy size={15} className="text-[#4f7331]" /> Disaster relief
        </p>
        {relief.canRequest && (
          <button
            type="button"
            onClick={() => onRequest(loan)}
            className="px-3 py-1.5 rounded-lg border border-[#3f6238] text-[#3f6238] text-xs font-semibold hover:bg-[#f4f8f3] transition-colors"
          >
            Request disaster relief
          </button>
        )}
      </div>
      {!claim && (
        <p className="mt-1 text-xs text-gray-500">
          Did a flood, typhoon or other calamity hit your farm? Send a proof. If it is verified, your cooperative can freeze this loan: you owe no new interest for 90 days and the due date moves later.
        </p>
      )}
      {summary && (
        <div className={`mt-2 rounded-lg border p-2.5 text-xs ${TONE[summary.tone]}`} data-testid="claim-status" data-tone={summary.tone}>
          <p className="font-semibold flex items-center gap-1.5">
            {summary.tone === "good" && <Snowflake size={13} />}
            {summary.title} <span className="font-normal opacity-80">· {claim.calamityLabel}</span>
          </p>
          <p className="mt-0.5">{summary.text}</p>
          <button type="button" onClick={() => onViewProof(claim)} className="mt-1.5 inline-flex items-center gap-1 font-medium underline">
            <Eye size={12} /> View proof
          </button>
        </div>
      )}
    </div>
  );
}

function LoanDetailPanel({ loan, proofs, onViewProof, onWithdrawProof, withdrawingId, paymentsRefresh, onRequestRelief, onViewClaimProof }) {
  const config = STATUS_CONFIG[loan.status] || STATUS_CONFIG.pending;
  const hasBalance = typeof loan.totalPayable === "number" && ["active", "grace_period", "defaulted", "paid_off"].includes(loan.status);
  const stats = [
    { label: "Principal", value: peso(loan.principalAmount), color: "text-gray-900" },
    { label: "Interest Rate", value: rateText(loan), color: "text-gray-900" },
    { label: isCycleLoan(loan) ? "Repayment period" : "Term", value: termText(loan), color: "text-gray-900" },
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
      <LoanBasis loan={loan} />
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

      {isAwaitingAdmin(loan) && (
        <div className="mt-4 bg-[#fff7ed] border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-amber-900" data-testid="awaiting-admin">
          <Info size={14} className="shrink-0" />
          A FarmFund admin is checking your collateral proof. After that, your request goes to {loan.cooperative?.name || "the cooperative"}.
        </div>
      )}
      {wasNotVerified(loan) && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800" data-testid="not-verified">
          <p className="flex items-center gap-2 font-medium">
            <XCircle size={14} className="shrink-0" />
            A FarmFund admin could not verify your collateral proof, so this request was not sent to {loan.cooperative?.name || "the cooperative"}.
          </p>
          {loan.adminReview && loan.adminReview.note && <p className="mt-1.5 pl-6">Reason: {loan.adminReview.note}</p>}
          <p className="mt-1.5 pl-6">You can send a new request with a clearer proof.</p>
        </div>
      )}
      {loan.status === "pending" && (
        <div className="mt-4 bg-[#fff7ed] border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-amber-900">
          <Info size={14} className="shrink-0" />
          Your collateral was verified. Waiting for {loan.cooperative?.name || "the cooperative"} to review this request.
        </div>
      )}
      {loan.status === "approved" && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-blue-900">
          <Info size={14} className="shrink-0" />
          Approved. You can start paying once {loan.cooperative?.name || "the cooperative"} releases the loan.
        </div>
      )}
      {isGracePeriod(loan) && (
        <div className="mt-4 bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-900" data-testid="grace-banner">
          <p className="flex items-center gap-2 font-semibold">
            <Hourglass size={14} className="shrink-0" />
            Grace period: your {loan.cropLabel ? loan.cropLabel.toLowerCase() : "crop"} is ready to harvest.
          </p>
          <p className="mt-1 pl-6">
            You have until {dateLocal(loan.graceEndsAt || loan.dueDate)} to dry, mill and sell it and pay this loan. No extra interest is added, and you can pay any time.
          </p>
        </div>
      )}
      {(isRunning(loan) || (loan.status === "approved" && isCycleLoan(loan))) && loan.dueDate && (
        <div className="mt-4 bg-[#fff7ed] border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-amber-900" data-testid="due-banner">
          <Info size={14} className="shrink-0" />
          <span>
            Due {new Date(loan.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {isCycleLoan(loan) && <span className="font-normal"> — you can pay any time before then, but it must be fully paid by this date.</span>}
          </span>
        </div>
      )}
      {loan.status === "rejected" && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-gray-600">
          <XCircle size={14} className="shrink-0" />
          This request was not approved.
        </div>
      )}

      <ReliefSection loan={loan} onRequest={onRequestRelief} onViewProof={onViewClaimProof} />

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

// Why the farmer can or cannot request a loan right now.
function CreditBanner({ credit }) {
  if (!credit) return null;
  const coopLimits = credit.byCooperative || [];
  if (credit.limit <= 0) {
    const text = {
      none: `Your credit limit is ${peso(0)}. Upload your Barangay Certificate in your farm profile (Certificates tab). Once the FarmFund admin verifies it, ${coopLimits.length ? "your credit limits apply" : `your limit becomes ${peso(CREDIT_LIMIT_AMOUNT)}`} and you can request a loan.`,
      pending: `Your credit limit is ${peso(0)} for now. Your Barangay Certificate is waiting for the FarmFund admin to verify it. You can request a loan once it is verified.`,
      rejected: `Your credit limit is ${peso(0)}. Your Barangay Certificate was rejected. Upload a new one in your farm profile (Certificates tab).`,
    }[credit.barangayStatus];
    return (
      <div role="status" data-testid="credit-banner" className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        {text}
      </div>
    );
  }
  const pct = Math.min(100, Math.round((credit.used / credit.limit) * 100));
  return (
    <div data-testid="credit-banner" className="mt-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">
          {coopLimits.length ? "Standard credit limit" : "Credit limit"} {peso(credit.limit)}
        </p>
        <p className="text-sm text-gray-600">
          Used {peso(credit.used)} · <span className="font-semibold text-[#3f6238]">Available {peso(credit.available)}</span>
        </p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
        <div className="h-full bg-[#4f7331]" style={{ width: `${pct}%` }} />
      </div>
      {coopLimits.length > 0 && (
        <>
          <p className="mt-1 text-[11px] text-gray-400">Applies to cooperatives that have not set their own limit for you.</p>
          <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3" data-testid="coop-limits">
            {coopLimits.map((c) => (
              <li key={c.cooperativeId} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold text-gray-900">
                  {c.cooperativeName || "A cooperative"} set your limit to {peso(c.setLimit)}
                </span>
                <span className="text-gray-600">
                  Used {peso(c.used)} · <span className="font-semibold text-[#3f6238]">Available {peso(c.available)}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// Requests a real loan from a real, active cooperative — status is always
// decided by the backend (forced to "pending_admin" there regardless of anything
// sent here), so there's nothing to pick for that on this form. The farmer
// chooses a crop and puts up collateral (with a proof file); the server works
// out the interest rate from the collateral and the due date from the crop's
// growing time, so neither is typed here. The summary below is only a preview.
function NewLoanModal({ cooperatives, credit, onSave, onCancel }) {
  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState("");
  const [cooperative, setCooperative] = useState(cooperatives[0]?._id || "");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [crop, setCrop] = useState("");
  const [collateralType, setCollateralType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [fileMsg, setFileMsg] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);
  // The most a farmer can borrow is whatever credit they still have. (If the
  // credit figures did not load, the server still checks every request.)
  // If this cooperative's owner set a limit for the farmer, that limit (and what
  // is owed to that cooperative) is what counts for a loan with it.
  const shown = credit ? (credit.byCooperative || []).find((c) => c.cooperativeId === String(cooperative)) || credit : null;
  const cap = shown ? shown.available : null;
  const overLimit = cap !== null && Math.round((Number(principalAmount) || 0) * 100) > Math.round(cap * 100);

  function loadOptions() {
    setOptionsError("");
    getLoanOptions()
      .then(setOptions)
      .catch((err) => setOptionsError(messageFrom(err, "Could not load the crops and collateral choices.")));
  }
  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (!file || !/^image\//.test(file.type) || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const cropOption = options && crop ? options.crops.find((c) => c.key === crop) : null;
  const collateralOption = options && collateralType ? options.collateral.find((c) => c.key === collateralType) : null;
  const principal = Number(principalAmount) || 0;
  const descriptionLength = description.trim().length;
  const descriptionOk = descriptionLength >= DESCRIPTION_MIN;
  const showSummary = Boolean(cropOption && collateralOption && principal > 0);
  const interest = showSummary ? interestAmount(principal, collateralOption.ratePercent) : 0;

  const canSubmit =
    !saving && !preparing && !!options && !!cooperative && principal >= 1 && !overLimit && !!cropOption && !!collateralOption && descriptionOk && !!file && !fileMsg;

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

  async function handleSave() {
    if (!cooperative) {
      setError("Select a cooperative.");
      return;
    }
    if (!principal || principal < 1) {
      setError("Enter a principal amount of at least ₱1.");
      return;
    }
    if (shown && overLimit) {
      setError(
        shown.available > 0
          ? `That is more than your available credit. You can borrow up to ${peso(shown.available)}.`
          : "You have no available credit with this cooperative right now."
      );
      return;
    }
    if (!cropOption) {
      setError("Choose the crop this loan is for.");
      return;
    }
    if (!collateralOption) {
      setError("Choose what you are putting up as collateral.");
      return;
    }
    if (!descriptionOk) {
      setError(`Describe your collateral (at least ${DESCRIPTION_MIN} characters).`);
      return;
    }
    if (!file) {
      setError("Upload a photo or PDF as proof of your collateral.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("cooperative", cooperative);
      body.append("principalAmount", String(principal));
      body.append("crop", crop);
      body.append("collateralType", collateralType);
      body.append("collateralDescription", description.trim());
      body.append("file", file);
      const newLoan = await requestLoan(body);
      onSave(newLoan);
    } catch (err) {
      setError(messageFrom(err, "Something went wrong. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={saving ? undefined : onCancel}>
      <div
        role="dialog"
        aria-label="Request a Loan"
        className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-900">Request a Loan</h3>

        {optionsError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-center justify-between gap-3">
            <span>{optionsError}</span>
            <button type="button" onClick={loadOptions} className="font-semibold underline shrink-0">
              Try again
            </button>
          </div>
        )}

        <div>
          <label htmlFor="rl-coop" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Cooperative *</label>
          {cooperatives.length === 0 ? (
            <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
              No active cooperatives are available to request a loan from yet.
            </p>
          ) : (
            <select id="rl-coop" value={cooperative} onChange={(e) => setCooperative(e.target.value)} className={selectClass}>
              {cooperatives.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="rl-amount" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Principal Amount (PHP) *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">
              ₱
            </span>
            <input
              id="rl-amount"
              type="text"
              inputMode="decimal"
              value={displayAmount(principalAmount)}
              onChange={(e) => {
                // Keeps only digits and one decimal point (max 2 decimals)
                // as it's typed — letters/symbols can never enter the
                // field, and the type="number" quirk where browsers accept
                // "e" notation (1e9) is avoided.
                setPrincipalAmount(sanitizeAmount(e.target.value.replace(/,/g, "")));
              }}
              placeholder="0.00"
              className={`${selectClass} pl-8 ${overLimit ? "ring-2 ring-red-400 border-red-300" : ""}`}
            />
          </div>
          <p
            className={`mt-1 text-[11px] ${
              overLimit ? "text-red-500 font-semibold" : "text-gray-400"
            }`}
          >
            {principalAmount ? peso(Number(principalAmount)) : "₱0.00"}
            {shown ? ` / ${peso(shown.available)} available` : ""}
            {overLimit && " — over your available credit"}
          </p>
          {shown && shown.available > 0 && (
            <button
              type="button"
              onClick={() => setPrincipalAmount(String(shown.available))}
              className="mt-1 text-[11px] font-medium text-[#4f7331] hover:underline"
            >
              Borrow my full available credit
            </button>
          )}
        </div>

        <div>
          <label htmlFor="rl-crop" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Crop you will grow *</label>
          <select id="rl-crop" value={crop} onChange={(e) => setCrop(e.target.value)} disabled={!options} className={selectClass}>
            <option value="">{options ? "Select a crop" : "Loading crops…"}</option>
            {options &&
              options.crops.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                  {c.examples ? ` (${c.examples})` : ""}
                </option>
              ))}
          </select>
          {cropOption ? (
            <p className="mt-1 text-[11px] text-gray-500" data-testid="growing-time">
              Growing time: <span className="font-semibold text-gray-700">{growingText(cropOption.growingDays)}</span>. Your payment is due {options.graceDays} days after it ends.
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-gray-400">How long the crop takes to grow decides when you pay back.</p>
          )}
        </div>

        <div>
          <label htmlFor="rl-collateral" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Collateral *</label>
          <select id="rl-collateral" value={collateralType} onChange={(e) => setCollateralType(e.target.value)} disabled={!options} className={selectClass}>
            <option value="">{options ? "Select what you are putting up" : "Loading…"}</option>
            {options &&
              options.collateral.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label} — {c.ratePercent}% interest
                </option>
              ))}
          </select>
          <p className="mt-1 text-[11px] text-gray-400">The interest rate depends on your collateral. It is a flat percentage for the whole crop cycle.</p>
        </div>

        <div>
          <label htmlFor="rl-collateral-desc" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Collateral description *</label>
          <textarea
            id="rl-collateral-desc"
            rows={3}
            value={description}
            maxLength={DESCRIPTION_MAX}
            onChange={(e) => setDescription(cleanDescription(e.target.value))}
            placeholder="e.g. Two carabaos, ear-tagged, kept at my farm in Brgy. San Isidro"
            className={`${selectClass} resize-none`}
          />
          <p className={`mt-1 text-[11px] ${description && !descriptionOk ? "text-red-500 font-semibold" : "text-gray-400"}`}>
            {description && !descriptionOk
              ? `Write at least ${DESCRIPTION_MIN} characters`
              : `What it is, how many, where it is. ${descriptionLength}/${DESCRIPTION_MAX}`}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Proof of collateral *</span>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            onChange={handlePick}
            onClick={(e) => {
              e.currentTarget.value = ""; // so choosing the same file again still counts as a change
            }}
            className="hidden"
            aria-label="Collateral proof file"
            data-testid="collateral-input"
          />
          {file ? (
            <div className="flex items-center gap-3 border border-gray-200 rounded-xl p-2.5">
              {previewUrl ? (
                <img src={previewUrl} alt="Collateral preview" className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
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
              <Paperclip size={16} /> {preparing ? "Getting your photo ready…" : "Choose a photo or PDF as proof"}
            </button>
          )}
          <p className={`mt-1 text-[11px] ${fileMsg ? "text-red-500 font-semibold" : "text-gray-400"}`}>
            {fileMsg || `A land title, a photo of the animals or equipment, or a receipt. JPG, PNG or PDF, up to ${bytesText(MAX_FILE_BYTES)}.`}
          </p>
        </div>

        {showSummary && (
          <div className="bg-[#f4f8f3] border border-green-100 rounded-xl px-4 py-3 text-sm" data-testid="loan-summary">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your loan at a glance</p>
            <dl className="mt-2 space-y-1.5">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Interest rate</dt>
                <dd className="font-semibold text-gray-900">{collateralOption.ratePercent}% for the crop cycle</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Interest</dt>
                <dd className="font-semibold text-gray-900">{peso(interest)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Total to pay back</dt>
                <dd className="font-bold text-gray-900">{peso(principal + interest)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Payment due</dt>
                <dd className="font-semibold text-gray-900">
                  about {estimatedDue(cropOption.growingDays, options.graceDays).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-[11px] text-gray-500">
              The due date counts from the day your cooperative approves the loan. You can pay any time before it, but the full amount must be paid by the due date.
            </p>
          </div>
        )}

        <p className="text-[11px] text-gray-500" data-testid="admin-first-note">
          After you submit, a FarmFund admin checks your collateral proof first. Once it is verified, your request goes to the cooperative you chose.
        </p>

        {error && (
          <p role="alert" className="text-xs text-red-500">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} disabled={saving} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSubmit || cooperatives.length === 0}
            className="px-6 py-2 rounded-xl bg-[#4f7331] text-white hover:bg-[#3f6238] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// "A calamity hit my farm." Sends what happened and a proof to a FarmFund
// admin. Nothing about the loan changes until the admin verifies it and the
// cooperative's owner activates the freeze.
function ReliefModal({ loan, onSent, onCancel }) {
  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState("");
  const [calamity, setCalamity] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [fileMsg, setFileMsg] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);
  const pickTurn = useRef(0);

  function loadOptions() {
    setOptionsError("");
    getLoanOptions()
      .then(setOptions)
      .catch((err) => setOptionsError(messageFrom(err, "Could not load the list of calamities.")));
  }
  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (!file || !/^image\//.test(file.type) || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const descriptionLength = description.trim().length;
  const descriptionOk = descriptionLength >= DESCRIPTION_MIN;
  const canSubmit = !saving && !preparing && !!options && !!calamity && descriptionOk && !!file && !fileMsg;

  async function handlePick(e) {
    const picked = e.target.files && e.target.files[0];
    if (!picked) return;
    setError("");
    setPreparing(true);
    const turn = ++pickTurn.current;
    const ready = await prepareReceipt(picked);
    if (turn !== pickTurn.current) return; // a newer file was chosen meanwhile: only that one counts
    setPreparing(false);
    const problem = fileProblem(ready);
    setFileMsg(problem);
    setFile(problem ? null : ready);
  }

  async function handleSend() {
    if (!calamity) return setError("Choose what happened to your farm.");
    if (!descriptionOk) return setError(`Describe what happened (at least ${DESCRIPTION_MIN} characters).`);
    if (!file) return setError("Upload a photo or PDF as proof that your farm was affected.");
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("loan", loan._id);
      body.append("calamity", calamity);
      body.append("description", description.trim());
      body.append("file", file);
      const result = await createReliefClaim(body);
      onSent(result.claim);
    } catch (err) {
      setError(messageFrom(err, "Something went wrong. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={saving ? undefined : onCancel}>
      <div
        role="dialog"
        aria-label="Request disaster relief"
        className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-xl font-bold text-gray-900">Request disaster relief</h3>
          <p className="mt-1 text-xs text-gray-500">
            For your {loan.cropLabel ? `${loan.cropLabel.toLowerCase()} ` : ""}loan with {loan.cooperative?.name || "your cooperative"}. A FarmFund admin checks your proof first. If it is verified, your cooperative's owner can activate a calamity freeze: you owe no new interest for {options ? options.freezeDays : 90} days and your due date moves later.
          </p>
        </div>

        {optionsError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-center justify-between gap-3">
            <span>{optionsError}</span>
            <button type="button" onClick={loadOptions} className="font-semibold underline shrink-0">
              Try again
            </button>
          </div>
        )}

        <div>
          <label htmlFor="rd-calamity" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">What happened *</label>
          <select id="rd-calamity" value={calamity} onChange={(e) => setCalamity(e.target.value)} disabled={!options} className={selectClass}>
            <option value="">{options ? "Select the calamity" : "Loading…"}</option>
            {options && options.calamities.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="rd-desc" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Describe the damage *</label>
          <textarea
            id="rd-desc"
            rows={3}
            value={description}
            maxLength={DESCRIPTION_MAX}
            onChange={(e) => setDescription(cleanDescription(e.target.value))}
            placeholder="e.g. The river flooded my rice field on Oct 3. About 2 hectares were under water for four days."
            className={`${selectClass} resize-none`}
          />
          <p className={`mt-1 text-[11px] ${description && !descriptionOk ? "text-red-500 font-semibold" : "text-gray-400"}`}>
            {description && !descriptionOk ? `Write at least ${DESCRIPTION_MIN} characters` : `When it happened and how much was lost. ${descriptionLength}/${DESCRIPTION_MAX}`}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Proof *</span>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            onChange={handlePick}
            onClick={(e) => {
              e.currentTarget.value = ""; // so choosing the same file again still counts as a change
            }}
            className="hidden"
            aria-label="Disaster proof file"
            data-testid="relief-input"
          />
          {file ? (
            <div className="flex items-center gap-3 border border-gray-200 rounded-xl p-2.5">
              {previewUrl ? (
                <img src={previewUrl} alt="Proof preview" className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
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
              <Paperclip size={16} /> {preparing ? "Getting your photo ready…" : "Choose a photo or PDF as proof"}
            </button>
          )}
          <p className={`mt-1 text-[11px] ${fileMsg ? "text-red-500 font-semibold" : "text-gray-400"}`}>
            {fileMsg || `A photo of the damaged field, a barangay or weather report. JPG, PNG or PDF, up to ${bytesText(MAX_FILE_BYTES)}.`}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-500">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} disabled={saving} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!canSubmit}
            className="px-6 py-2 rounded-xl bg-[#4f7331] text-white hover:bg-[#3f6238] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Sending…" : "Send claim"}
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
  const [reliefLoan, setReliefLoan] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [toast, setToast] = useState("");
  const [actionError, setActionError] = useState("");
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [paymentsRefresh, setPaymentsRefresh] = useState(0);
  const [credit, setCredit] = useState(null);

  async function refreshCredit() {
    try {
      const result = await getCredit();
      setCredit(result.credit || null);
    } catch {
      /* the credit limit is extra: the server still checks every request */
    }
  }

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
        try {
          const c = await getCredit();
          if (!cancelled) setCredit(c.credit || null);
        } catch {
          if (!cancelled) setCredit(null);
        }
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

  // A claim was sent: show the loan as it is now (the claim is on it).
  async function handleReliefSent() {
    setReliefLoan(null);
    setActionError("");
    setToast("Claim sent. A FarmFund admin will check your proof first.");
    try {
      setLoans(await authedRequest("/api/loans?limit=100"));
    } catch {
      /* the claim is saved; the list refreshes next time */
    }
  }

  async function handleViewClaimProof(claim) {
    setActionError("");
    try {
      const opened = await openClaimProof(claim.id);
      if (!opened) setActionError("Your browser blocked the new tab. Allow pop-ups for this site and try again.");
    } catch (err) {
      setActionError(messageFrom(err, "The proof could not be opened."));
    }
  }

  function handleNewLoan(newLoan) {
    setLoans((prev) => [newLoan, ...prev]);
    setSelectedId(newLoan._id);
    setIsNewLoanOpen(false);
    refreshCredit();
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
  const owing = loans.filter((l) => ["active", "grace_period", "approved", "defaulted"].includes(l.status));
  const totalOutstanding = owing.reduce((sum, l) => sum + (typeof l.remainingBalance === "number" ? l.remainingBalance : l.principalAmount), 0);
  const pendingCount = loans.filter((l) => l.status === "pending" || l.status === "pending_admin").length;
  const canPay = loans.some(isPayable);
  // Only block the button when we know the limit; if it could not be loaded the server still decides.
  const cannotRequest = Boolean(credit) && credit.available <= 0 && !(credit.byCooperative || []).some((c) => c.available > 0);
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
            disabled={cannotRequest}
            title={cannotRequest ? (credit.limit <= 0 ? "Your credit limit is ₱0 until your Barangay Certificate is verified" : "You have no available credit") : undefined}
            className="bg-[#3f6238] hover:bg-[#34512e] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> Request a Loan
          </button>
        </div>
      </div>

      <CreditBanner credit={credit} />

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
              onRequestRelief={setReliefLoan}
              onViewClaimProof={handleViewClaimProof}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 flex items-center justify-center min-h-[200px] shadow-sm">
              <p className="text-gray-400 text-sm">Select a loan to view details</p>
            </div>
          )}
        </div>
      </div>

      {isNewLoanOpen && (
        <NewLoanModal cooperatives={cooperatives} credit={credit} onSave={handleNewLoan} onCancel={() => setIsNewLoanOpen(false)} />
      )}
      {isPaymentOpen && (
        <LoanPaymentModal loans={loans} initialLoanId={selectedId} onSent={handleProofSent} onCancel={() => setIsPaymentOpen(false)} />
      )}
      {reliefLoan && <ReliefModal loan={reliefLoan} onSent={handleReliefSent} onCancel={() => setReliefLoan(null)} />}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}