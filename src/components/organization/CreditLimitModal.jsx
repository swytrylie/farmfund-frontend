import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { sanitizeAmount, displayAmount } from "../../lib/repaymentData";
import { messageFrom } from "../../lib/certificates";
import { saveCreditLimit, limitProblem, noteProblem, pesoCentavos, MAX_LIMIT, NOTE_MAX } from "../../lib/creditLimits";

// The cooperative owner's box for one farmer: see the current limit and what
// is still owed, then set a new limit (it replaces the standard ₱25,000 for
// loans with this cooperative only) and say why.
export default function CreditLimitModal({ info, onSaved, onClose }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [problem, setProblem] = useState("");
  const [noteMsg, setNoteMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const closeRef = useRef(null);

  const close = () => {
    if (!busyRef.current) onClose();
  };

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    if (busyRef.current) return;
    const limitMsg = limitProblem(amount, { current: info.currentLimit, outstanding: info.outstanding });
    const nMsg = noteProblem(note);
    setProblem(limitMsg);
    setNoteMsg(nMsg);
    setError("");
    if (limitMsg || nMsg) return;

    busyRef.current = true;
    setBusy(true);
    try {
      const result = await saveCreditLimit({
        cooperative: info.cooperative.id,
        farmer: info.farmer.id,
        limit: Number(amount),
        note: note.trim(),
      });
      onSaved(result.creditLimit);
    } catch (err) {
      setError(messageFrom(err, "Could not save the credit limit. Please try again."));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const unverified = info.barangayStatus !== "verified";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={close}>
      <div
        role="dialog"
        aria-label="Set credit limit"
        className="bg-white rounded-3xl p-7 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} onClick={close} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={18} />
        </button>
        <h3 className="text-lg font-bold text-gray-900">Set Credit Limit</h3>
        <p className="text-xs text-gray-500 mt-1">
          This replaces the standard limit for loans with {info.cooperative.name} only. Other cooperatives are not affected.
        </p>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Farmer</dt>
            <dd className="font-semibold text-gray-900 text-right" data-testid="cl-farmer">{info.farmer.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Current Credit Limit</dt>
            <dd className="font-semibold text-gray-900" data-testid="cl-current">{pesoCentavos(info.currentLimit)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Active Loans Outstanding</dt>
            <dd className="font-semibold text-gray-900" data-testid="cl-outstanding">{pesoCentavos(info.outstanding)}</dd>
          </div>
        </dl>

        <label htmlFor="cl-amount" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mt-5 mb-2">
          New Credit Limit (₱)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">₱</span>
          <input
            id="cl-amount"
            type="text"
            inputMode="decimal"
            value={displayAmount(amount)}
            disabled={busy}
            onChange={(e) => {
              setAmount(sanitizeAmount(e.target.value.replace(/,/g, "")));
              setProblem("");
            }}
            placeholder="0.00"
            className={`bg-[#f4f4f4] border rounded-xl pl-8 pr-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] disabled:opacity-60 ${problem ? "border-red-300" : "border-gray-200"}`}
          />
        </div>
        {problem ? (
          <p role="alert" className="mt-1 text-xs text-red-500">{problem}</p>
        ) : (
          <p className="mt-1 text-xs text-gray-400">From ₱0 up to {pesoCentavos(MAX_LIMIT)}. It can't be lower than what is still owed.</p>
        )}

        <label htmlFor="cl-note" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mt-5 mb-2">
          Reason / Note
        </label>
        <textarea
          id="cl-note"
          value={note}
          rows={3}
          maxLength={NOTE_MAX}
          disabled={busy}
          onChange={(e) => {
            setNote(e.target.value);
            setNoteMsg("");
          }}
          placeholder="e.g., Good repayment history on past 2 loans"
          className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-3 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41] disabled:opacity-60"
        />
        <div className="flex justify-between">
          <p role={noteMsg ? "alert" : undefined} className="mt-1 text-xs text-red-500">{noteMsg}</p>
          <p className="mt-1 text-xs text-gray-400" data-testid="cl-count">{note.length}/{NOTE_MAX}</p>
        </div>

        {unverified && (
          <p className="mt-3 text-xs rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2">
            This farmer's Barangay Certificate is not verified yet, so their limit stays ₱0 until the FarmFund admin verifies it.
          </p>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={close} disabled={busy} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60">
            Cancel
          </button>
          <button onClick={submit} disabled={busy} className="px-5 py-2 rounded-xl text-white text-sm font-semibold bg-[#2d4027] hover:bg-[#1f2d1b] disabled:opacity-60">
            {busy ? "Saving…" : "Save Credit Limit"}
          </button>
        </div>
      </div>
    </div>
  );
}