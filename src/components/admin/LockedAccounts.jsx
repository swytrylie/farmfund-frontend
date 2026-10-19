import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, Lock, LockOpen, MessageSquareText, RefreshCw, X } from "lucide-react";
import { listLockedAccounts, unlockAccount, formatTimeLeft, secondsLeftNow, lockLabel } from "../../lib/lockedAccounts";
import { formatDateTime, messageFrom } from "../../lib/adminUsers";

const REFRESH_MS = 30 * 1000;

function Toast({ message, tone = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, tone === "error" ? 6000 : 3500);
    return () => clearTimeout(timer);
  }, [onClose, tone]);

  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium ${
        tone === "error" ? "bg-[#c24141]" : "bg-[#2d4027]"
      }`}
    >
      {tone === "error" ? <Info size={16} /> : <CheckCircle2 size={16} />}
      {message}
    </div>
  );
}

function KPICard({ label, value, hint }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm border-l-4 border-l-[#4d6b41]">
      <p className="text-xs font-bold text-gray-500 uppercase mb-2">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function UnlockModal({ account, busy, error, onConfirm, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={busy ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Unlock account"
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-bold text-gray-900">Unlock account</h3>
          <button onClick={onClose} disabled={busy} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-2">
          <span className="font-semibold text-gray-800">{account.name}</span> ({account.email}) will be able to log in
          right away, and will be emailed that you unlocked the account.
        </p>
        <p className="text-sm text-gray-500">Their failed-attempt count and lock history start over.</p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={busy}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            data-testid="unlock-confirm"
            onClick={onConfirm}
            disabled={busy}
            className="bg-[#38512f] hover:bg-[#2d4027] text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {busy ? "Unlocking…" : "Unlock account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800">{children}</p>
    </div>
  );
}

function AccountCard({ account, fetchedAt, now, onUnlock }) {
  const left = secondsLeftNow(account, fetchedAt, now);
  const stillLocked = account.locked && left > 0;
  return (
    <div
      data-testid="locked-row"
      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#e8efe5] text-[#2d4027] font-bold flex items-center justify-center shrink-0">
            {(account.name || "?").trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{account.name}</p>
            <p className="text-sm text-gray-500 truncate">{account.email}</p>
            <p className="text-xs text-gray-400 truncate">
              {account.typeLabel}
              {account.org ? ` · ${account.org}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            data-testid="lock-status"
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              stillLocked ? "bg-[#fdecec] text-[#c24141]" : "bg-[#fff8e1] text-[#b8860b]"
            }`}
          >
            <Lock size={12} />
            {stillLocked ? `Locked · ${formatTimeLeft(left)} left` : "Lock ended · waiting for the admin"}
          </span>
          <button
            data-testid="unlock-btn"
            onClick={() => onUnlock(account)}
            className="flex items-center gap-1.5 bg-[#38512f] hover:bg-[#2d4027] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            <LockOpen size={15} />
            Unlock
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Detail label="Locked at">{formatDateTime(account.lockedAt)}</Detail>
        <Detail label="Unlocks by itself at">{formatDateTime(account.lockedUntil)}</Detail>
        <Detail label="Lock">{account.lockCount ? lockLabel(account) : "—"}</Detail>
      </div>

      {account.message ? (
        <div className="mt-4 rounded-xl bg-[#f4f8f3] border border-green-100 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <MessageSquareText size={12} />
            Message from {account.name.split(" ")[0] || "the user"}
            <span className="font-normal normal-case tracking-normal text-gray-400">· {formatDateTime(account.requestedAt)}</span>
          </p>
          <p data-testid="lock-message-text" className="mt-1.5 text-sm text-gray-800 whitespace-pre-wrap break-words">
            “{account.message}”
          </p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-gray-400">No message sent. They have not contacted the admin.</p>
      )}
    </div>
  );
}

export default function LockedAccounts() {
  const [data, setData] = useState({ accounts: [], counts: { locked: 0, waiting: 0 } });
  const [fetchedAt, setFetchedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const [toast, setToast] = useState(null);
  const latest = useRef(0);
  const acting = useRef(false);

  const load = useCallback(async () => {
    const id = ++latest.current;
    try {
      const result = await listLockedAccounts();
      if (id !== latest.current) return; // a newer answer already arrived
      setData(result);
      setFetchedAt(Date.now());
      setNow(Date.now());
      setError("");
    } catch (err) {
      if (id !== latest.current) return;
      setError(messageFrom(err, "Could not load the locked accounts."));
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = setInterval(load, REFRESH_MS);
    return () => clearInterval(refresh);
  }, [load]);

  // The "time left" counters tick every second between refreshes.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  async function handleConfirmUnlock() {
    if (!target || acting.current) return;
    acting.current = true;
    setBusy(true);
    setModalError("");
    try {
      const result = await unlockAccount(target.id);
      setToast({
        message: result?.emailSent === false
          ? `${target.name} is unlocked (the email could not be sent).`
          : `${target.name} is unlocked and has been emailed.`,
        tone: "success",
      });
      setTarget(null);
      await load();
    } catch (err) {
      // Someone else unlocked it first: nothing is wrong, just refresh the list.
      if (err.status === 409) {
        setTarget(null);
        setToast({ message: `${target.name} was already unlocked.`, tone: "success" });
        await load();
      } else {
        setModalError(messageFrom(err, "Could not unlock this account."));
      }
    } finally {
      acting.current = false;
      setBusy(false);
    }
  }

  const { accounts, counts } = data;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Locked Accounts</h2>
          <p className="mt-1 text-sm text-gray-500 max-w-2xl">
            Accounts locked after 4 wrong passwords (15 minutes, then 30 minutes each time), and people who wrote to
            you about it. Unlocking lets them log in right away.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            load();
          }}
          className="mr-12 flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <KPICard label="Locked right now" value={counts.locked} />
        <KPICard label="Waiting for your reply" value={counts.waiting} hint="Sent you a message" />
      </div>

      <div className="mt-6 space-y-4">
        {loading && accounts.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-10">Loading locked accounts…</div>
        ) : error && accounts.length === 0 ? (
          <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-[#c24141] font-medium">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                load();
              }}
              className="mt-4 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Try again
            </button>
          </div>
        ) : accounts.length === 0 ? (
          <div data-testid="locked-empty" className="bg-white rounded-xl p-10 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 text-sm">No locked accounts right now.</p>
          </div>
        ) : (
          accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              fetchedAt={fetchedAt}
              now={now}
              onUnlock={(acct) => {
                setModalError("");
                setTarget(acct);
              }}
            />
          ))
        )}
        {error && accounts.length > 0 && <p className="text-xs text-[#c24141]">Could not refresh: {error}</p>}
      </div>

      {target && (
        <UnlockModal
          account={target}
          busy={busy}
          error={modalError}
          onConfirm={handleConfirmUnlock}
          onClose={() => setTarget(null)}
        />
      )}
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
}