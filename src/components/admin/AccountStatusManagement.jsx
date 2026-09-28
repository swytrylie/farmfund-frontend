import { useState, useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import {
  getAccountStatuses,
  suspendAccount,
  restoreAccount,
  liftRestriction,
} from "../../mocks/admin/adminAccountStatus.mock";

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
  deactivated: { label: "Deactivated", className: "bg-[#ffebee] text-[#c62828]" },
  restricted: { label: "Restricted", className: "bg-[#e3f2fd] text-[#1565c0]" },
};

function StatusBadge({ status }) {
  const badge = STATUS_BADGE[status];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2d4027] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

function SuspendAccountModal({ user, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function handleConfirm() {
    if (!reason.trim()) {
      setError("A reason is required to suspend this account.");
      return;
    }
    onConfirm(user, reason.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-bold text-gray-900">Suspend Account</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          The user will be temporarily blocked from logging in. This can be
          reversed anytime.
        </p>

        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
          Reason *
        </label>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
          rows={3}
          className={`bg-[#f4f4f4] border rounded-xl p-3 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41] ${
            error ? "border-red-400" : "border-gray-200"
          }`}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="bg-[#38512f] hover:bg-[#2d4027] text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
          >
            Suspend account
          </button>
        </div>
      </div>
    </div>
  );
}

function RestoreAccountModal({ user, onConfirm, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-bold text-gray-900">Restore Account</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          This will reinstate the account's access immediately.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(user)}
            className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
          >
            Restore account
          </button>
        </div>
      </div>
    </div>
  );
}

function LiftRestrictionModal({ user, onConfirm, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-bold text-gray-900">Lift Restriction</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          This will remove view-only restrictions and restore full
          functionality to this account.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(user)}
            className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
          >
            Lift restriction
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ user, onSuspendRequest, onRestoreRequest, onLiftRequest }) {
  if (user.status === "active") {
    return (
      <button
        onClick={() => onSuspendRequest(user)}
        className="border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl px-4 py-1.5 text-xs font-medium transition-colors"
      >
        Suspend
      </button>
    );
  }
  if (user.status === "restricted") {
    return (
      <button
        onClick={() => onLiftRequest(user)}
        className="border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl px-4 py-1.5 text-xs font-medium transition-colors"
      >
        Lift Restriction
      </button>
    );
  }
  // suspended or deactivated
  return (
    <button
      onClick={() => onRestoreRequest(user)}
      className="border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl px-4 py-1.5 text-xs font-medium transition-colors"
    >
      Restore
    </button>
  );
}

export default function AccountStatusManagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [restoringUser, setRestoringUser] = useState(null);
  const [liftingUser, setLiftingUser] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAccountStatuses().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Adjusts the KPI counters based on the REAL old→new status transition,
  // rather than blindly incrementing one bucket — e.g. restoring someone
  // decrements whichever bucket they were actually in (suspended vs
  // deactivated), not a fixed one.
  function adjustCounts(prevKpis, oldStatus, newStatus) {
    const next = { ...prevKpis };
    if (oldStatus in next) next[oldStatus] -= 1;
    if (newStatus in next) next[newStatus] += 1;
    return next;
  }

  async function handleSuspendConfirm(user, reason) {
    await suspendAccount(user.id, reason);
    setData((prev) => ({
      kpis: adjustCounts(prev.kpis, user.status, "suspended"),
      users: prev.users.map((u) =>
        u.id === user.id
          ? { ...u, status: "suspended", reason, changedBy: "Fengfeng Muerza" }
          : u
      ),
    }));
    setToastMessage(`${user.name}'s account suspended`);
    setSuspendingUser(null);
  }

  async function handleRestoreConfirm(user) {
    await restoreAccount(user.id);
    setData((prev) => ({
      kpis: adjustCounts(prev.kpis, user.status, "active"),
      users: prev.users.map((u) =>
        u.id === user.id
          ? { ...u, status: "active", reason: "-", changedBy: "Fengfeng Muerza" }
          : u
      ),
    }));
    setToastMessage(`${user.name}'s account restored`);
    setRestoringUser(null);
  }

  async function handleLiftConfirm(user) {
    await liftRestriction(user.id);
    setData((prev) => ({
      // "restricted" isn't one of the 3 tracked KPI buckets (Active/
      // Suspended/Deactivated), so lifting it only adds to Active —
      // nothing to decrement on the way out.
      kpis: { ...prev.kpis, active: prev.kpis.active + 1 },
      users: prev.users.map((u) =>
        u.id === user.id
          ? { ...u, status: "active", reason: "-", changedBy: "Fengfeng Muerza" }
          : u
      ),
    }));
    setToastMessage(`${user.name}'s restriction lifted`);
    setLiftingUser(null);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Account Status Management</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading accounts…
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Account Status Management</h2>
      <p className="text-sm text-gray-500 mt-1">
        Activate, deactivate, suspend, or restore accounts
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard label="Active" value={data.kpis.active.toLocaleString()} valueColor="text-[#2e7d32]" />
        <KPICard label="Suspended" value={data.kpis.suspended} valueColor="text-[#b8860b]" />
        <KPICard label="Deactivated" value={data.kpis.deactivated} valueColor="text-[#c62828]" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <table className="w-full text-sm">
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
            {data.users.map((u) => (
              <tr key={u.id} className="border-t border-gray-50">
                <td className="py-3 pr-4 font-semibold text-gray-900">{u.name}</td>
                <td className="py-3 pr-4">
                  <StatusBadge status={u.status} />
                </td>
                <td className="py-3 pr-4 text-gray-600 text-sm max-w-xs">{u.reason}</td>
                <td className="py-3 pr-4 text-gray-600 text-sm">{u.changedBy}</td>
                <td className="py-3">
                  <ActionButton
                    user={u}
                    onSuspendRequest={setSuspendingUser}
                    onRestoreRequest={setRestoringUser}
                    onLiftRequest={setLiftingUser}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {suspendingUser && (
        <SuspendAccountModal
          user={suspendingUser}
          onConfirm={handleSuspendConfirm}
          onClose={() => setSuspendingUser(null)}
        />
      )}

      {restoringUser && (
        <RestoreAccountModal
          user={restoringUser}
          onConfirm={handleRestoreConfirm}
          onClose={() => setRestoringUser(null)}
        />
      )}

      {liftingUser && (
        <LiftRestrictionModal
          user={liftingUser}
          onConfirm={handleLiftConfirm}
          onClose={() => setLiftingUser(null)}
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}