import { useState, useEffect, useRef } from "react";
import { CheckCircle2, X, Search, Info } from "lucide-react";
import {
  useAdminUserList,
  suspendAdminUser,
  reactivateAdminUser,
  messageFrom,
  formatDateTime,
} from "../../lib/adminUsers";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
];

function KPICard({ label, value, valueColor }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm border-l-4 border-l-[#4d6b41]">
      <p className="text-xs font-bold text-gray-500 uppercase mb-2">{label}</p>
      <p className={`text-3xl font-extrabold ${valueColor}`}>{value}</p>
    </div>
  );
}

const STATUS_BADGE = {
  active: { label: "Active", className: "bg-[#e8f5e9] text-[#2e7d32]" },
  suspended: { label: "Suspended", className: "bg-[#fff8e1] text-[#b8860b]" },
};

function StatusBadge({ status }) {
  const badge = STATUS_BADGE[status] || STATUS_BADGE.active;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function Toast({ message, tone = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, tone === "error" ? 6000 : 3000);
    return () => clearTimeout(timer);
  }, [onClose, tone]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium ${
        tone === "error" ? "bg-[#c24141]" : "bg-[#2d4027]"
      }`}
    >
      {tone === "error" ? <Info size={16} /> : <CheckCircle2 size={16} />}
      {message}
    </div>
  );
}

function SuspendAccountModal({ user, busy, error: serverError, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function handleConfirm() {
    if (busy) return;
    const r = reason.trim();
    if (r.length < 3) {
      setError("Give a reason of at least 3 characters.");
      return;
    }
    if (r.length > 300) {
      setError("The reason must be 300 characters or fewer.");
      return;
    }
    onConfirm(r);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={busy ? undefined : onClose}
    >
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-bold text-gray-900">Suspend Account</h3>
          <button onClick={onClose} disabled={busy} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {user.name} will be signed out and blocked from logging in, and will be emailed this reason. You can reverse it anytime.
        </p>

        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block" htmlFor="as-reason">
          Reason *
        </label>
        <textarea
          id="as-reason"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(""); }}
          rows={3}
          maxLength={300}
          className={`bg-[#f4f4f4] border rounded-xl p-3 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41] ${
            error ? "border-red-400" : "border-gray-200"
          }`}
        />
        <div className="flex justify-between">
          <p className="mt-1 text-xs text-red-500">{error}</p>
          <p className="mt-1 text-xs text-gray-400">{reason.length}/300</p>
        </div>
        {serverError && <p className="mt-2 text-sm text-red-600">{serverError}</p>}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} disabled={busy} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={busy} className="bg-[#38512f] hover:bg-[#2d4027] text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-60">
            {busy ? "Suspending…" : "Suspend account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RestoreAccountModal({ user, busy, error, onConfirm, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={busy ? undefined : onClose}
    >
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-bold text-gray-900">Restore Account</h3>
          <button onClick={onClose} disabled={busy} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {user.name} will be able to log in again immediately, and will be emailed that their account is active.
        </p>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={busy} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy} className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-60">
            {busy ? "Restoring…" : "Restore account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ user, onSuspendRequest, onRestoreRequest }) {
  if (user.status === "active") {
    return (
      <button
        onClick={() => onSuspendRequest(user)}
        aria-label={`Suspend ${user.name}`}
        className="border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl px-4 py-1.5 text-xs font-medium transition-colors"
      >
        Suspend
      </button>
    );
  }
  return (
    <button
      onClick={() => onRestoreRequest(user)}
      aria-label={`Restore ${user.name}`}
      className="border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl px-4 py-1.5 text-xs font-medium transition-colors"
    >
      Restore
    </button>
  );
}

export default function AccountStatusManagement({ onSignOut }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const list = useAdminUserList({ status: statusFilter, onUnauthorized: onSignOut });
  const { users, total, page, pages, limit, counts, loading, error, search, setSearch, setPage, reload } = list;

  const [suspendingUser, setSuspendingUser] = useState(null);
  const [restoringUser, setRestoringUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const actingRef = useRef(false);

  function closeModals() {
    setSuspendingUser(null);
    setRestoringUser(null);
    setModalError("");
  }

  async function perform(run) {
    if (actingRef.current) return;
    actingRef.current = true;
    setBusy(true);
    setModalError("");
    try {
      const outcome = await run();
      closeModals();
      setToast({ message: outcome.message, tone: outcome.tone });
      // Filtering by "Suspended"/"Active" can leave a page empty after a change.
      if (users.length === 1 && page > 1 && statusFilter !== "all") setPage(page - 1);
      else reload({ quiet: true });
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setModalError(messageFrom(err, "Something went wrong. Please try again."));
      // 409/404 mean the list was out of date — refresh it behind the modal.
      if (err && (err.status === 409 || err.status === 404)) reload({ quiet: true });
    } finally {
      actingRef.current = false;
      setBusy(false);
    }
  }

  const done = (result, ok) =>
    result && result.emailSent === false
      ? { message: `${ok}, but the email couldn't be sent.`, tone: "error" }
      : { message: ok, tone: "success" };

  const handleSuspendConfirm = (reason) =>
    perform(async () => done(await suspendAdminUser(suspendingUser.id, reason), `${suspendingUser.name}'s account suspended`));

  const handleRestoreConfirm = () =>
    perform(async () => done(await reactivateAdminUser(restoringUser.id), `${restoringUser.name}'s account restored`));

  const firstShown = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastShown = Math.min(total, page * limit);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Account Status Management</h2>
      <p className="text-sm text-gray-500 mt-1">Suspend or restore accounts</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <KPICard label="Active" value={Number(counts.active).toLocaleString("en-US")} valueColor="text-[#2e7d32]" />
        <KPICard label="Suspended" value={Number(counts.suspended).toLocaleString("en-US")} valueColor="text-[#b8860b]" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative w-full min-w-0 sm:flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search accounts"
            className="bg-[#f4f4f4] border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={
                statusFilter === f.value
                  ? "bg-[#38512f] text-white font-medium px-4 py-2 rounded-xl text-sm"
                  : "bg-[#f0f0f0] text-gray-700 hover:bg-gray-200 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
        {error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#c24141] font-medium">{error}</p>
            <button
              onClick={() => reload()}
              className="mt-4 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <table className={`w-full text-sm transition-opacity ${loading && users.length > 0 ? "opacity-50" : ""}`}>
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="pb-2 font-semibold">User</th>
                <th className="pb-2 font-semibold">Current Status</th>
                <th className="pb-2 font-semibold">Reason</th>
                <th className="pb-2 font-semibold">Changed By</th>
                <th className="pb-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">Loading accounts…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                    {search || statusFilter !== "all" ? "No accounts match your search/filter." : "No accounts yet."}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-50">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 pr-4 text-gray-600 text-sm max-w-xs">{u.statusReason || "—"}</td>
                    <td className="py-3 pr-4 text-gray-600 text-sm">
                      {u.statusChangedBy ? (
                        <>
                          <p>{u.statusChangedBy}</p>
                          {u.statusChangedAt && <p className="text-xs text-gray-400">{formatDateTime(u.statusChangedAt)}</p>}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3">
                      <ActionButton
                        user={u}
                        onSuspendRequest={(x) => { setModalError(""); setSuspendingUser(x); }}
                        onRestoreRequest={(x) => { setModalError(""); setRestoringUser(x); }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {!error && total > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {firstShown}–{lastShown} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Previous
              </button>
              <span>
                Page {page} of {pages}
              </span>
              <button onClick={() => setPage(page + 1)} disabled={page >= pages} className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {suspendingUser && (
        <SuspendAccountModal user={suspendingUser} busy={busy} error={modalError} onConfirm={handleSuspendConfirm} onClose={closeModals} />
      )}

      {restoringUser && (
        <RestoreAccountModal user={restoringUser} busy={busy} error={modalError} onConfirm={handleRestoreConfirm} onClose={closeModals} />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
}