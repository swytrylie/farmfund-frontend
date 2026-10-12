import { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Info, X, RefreshCw } from "lucide-react";
import { authedRequest } from "../../api";
import { formatDate, formatDateTime, messageFrom } from "../../lib/adminUsers";

const REFRESH_MS = 30000;
const MAX_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const getSystem = () => authedRequest("/api/admin/system");
const saveEnabled = (enabled) => authedRequest("/api/admin/system/maintenance", { method: "PATCH", body: { enabled } });
const saveWindow = (start, end) =>
  authedRequest("/api/admin/system/maintenance-window", { method: "PUT", body: { start, end } });

function bytesText(n) {
  if (typeof n !== "number" || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const pad = (n) => String(n).padStart(2, "0");

// An ISO time -> the "2026-10-13T09:30" text a datetime-local box wants (in this browser's time zone).
function toLocalInput(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const timeOf = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function windowText(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) return `${formatDate(start)}, ${timeOf(s)} – ${timeOf(e)}`;
  return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

function windowPhase(start, end, now = Date.now()) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now < s) return "Upcoming";
  if (now < e) return "Running now";
  return "Ended";
}

const DOT = { green: "bg-[#2e7d32]", amber: "bg-amber-500", red: "bg-[#c24141]" };
const DOT_TEXT = { green: "text-[#2e7d32]", amber: "text-amber-600", red: "text-[#c24141]" };

function StatusCard({ label, value, tone, hint }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        {tone && <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT[tone]}`} />}
        <span className={tone ? DOT_TEXT[tone] : "text-gray-900"}>{value}</span>
      </p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Toast({ message, tone = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, tone === "error" ? 6000 : 3500);
    return () => clearTimeout(timer);
  }, [onClose, tone]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium max-w-[90vw] ${
        tone === "error" ? "bg-[#c24141]" : "bg-[#2d4027]"
      }`}
    >
      {tone === "error" ? <Info size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />}
      {message}
    </div>
  );
}

function EnableMaintenanceConfirmModal({ busy, error, onConfirm, onCancel }) {
  const cancel = () => {
    if (!busy) onCancel();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={cancel}>
      <div
        role="dialog"
        aria-label="Enable maintenance mode"
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
          <AlertTriangle size={18} className="text-amber-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Enable maintenance mode?</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Farmers and cooperatives will immediately see a "Down for maintenance" screen and cannot use the platform
          until you turn it off. Admin access stays available.
        </p>

        {error && <p className="mb-4 text-sm text-[#c24141] font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={cancel}
            disabled={busy}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {busy ? "Turning on…" : "Enable maintenance mode"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditWindowModal({ maintenance, busy, error: serverError, onSave, onRemove, onCancel }) {
  const [start, setStart] = useState(toLocalInput(maintenance.windowStart));
  const [end, setEnd] = useState(toLocalInput(maintenance.windowEnd));
  const [error, setError] = useState("");
  const hasWindow = Boolean(maintenance.windowStart && maintenance.windowEnd);
  const zone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "";
    }
  })();

  const cancel = () => {
    if (!busy) onCancel();
  };

  function handleSave() {
    if (!start || !end) {
      setError("Both start and end times are required.");
      return;
    }
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      setError("Enter valid start and end times.");
      return;
    }
    if (e <= s) {
      setError("End time must be after the start time.");
      return;
    }
    if (e.getTime() <= Date.now()) {
      setError("The end time must be in the future.");
      return;
    }
    if (e - s > MAX_WINDOW_MS) {
      setError("A maintenance window can be at most 7 days long.");
      return;
    }
    onSave(s.toISOString(), e.toISOString());
  }

  const shownError = error || serverError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={cancel}>
      <div
        role="dialog"
        aria-label="Edit scheduled maintenance window"
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={cancel} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-1">Edit Scheduled Maintenance Window</h3>
        <p className="text-xs text-gray-500 mb-6">
          Maintenance mode switches on by itself at the start time and off at the end time.
          {zone ? ` Times are in your time zone (${zone}).` : ""}
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="mw-start" className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Start
            </label>
            <input
              id="mw-start"
              type="datetime-local"
              value={start}
              disabled={busy}
              onChange={(e) => {
                setStart(e.target.value);
                setError("");
              }}
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="mw-end" className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              End
            </label>
            <input
              id="mw-end"
              type="datetime-local"
              value={end}
              disabled={busy}
              onChange={(e) => {
                setEnd(e.target.value);
                setError("");
              }}
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] disabled:opacity-60"
            />
          </div>
          {shownError && <p className="text-sm text-[#c24141] font-medium">{shownError}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 mt-6">
          <div>
            {hasWindow && (
              <button
                onClick={onRemove}
                disabled={busy}
                className="text-sm font-medium text-[#c24141] hover:underline disabled:opacity-60"
              >
                Remove window
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={cancel}
              disabled={busy}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={busy}
              className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save window"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3 ${last ? "" : "border-b border-gray-100"}`}>
      <p className="font-semibold text-gray-900 text-sm shrink-0">{label}</p>
      <p className="text-gray-700 text-sm text-right break-words min-w-0">{value}</p>
    </div>
  );
}

export default function SystemMonitoring({ onSignOut }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const latest = useRef(0);

  const [showEnableConfirm, setShowEnableConfirm] = useState(false);
  const [showEditWindow, setShowEditWindow] = useState(false);
  const [toggleBusy, setToggleBusy] = useState(false);
  const toggleRef = useRef(false);
  const [windowBusy, setWindowBusy] = useState(false);
  const windowRef = useRef(false);
  const [modalError, setModalError] = useState("");
  const [toast, setToast] = useState(null);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      const id = ++latest.current;
      if (quiet) setRefreshing(true);
      else {
        setLoading(true);
        setError("");
      }
      try {
        const result = await getSystem();
        if (id !== latest.current) return;
        setData(result);
        setError("");
        setRefreshFailed(false);
      } catch (err) {
        if (id !== latest.current) return;
        if (err && err.status === 401) {
          onSignOut?.();
          return;
        }
        if (quiet) setRefreshFailed(true);
        else setError(messageFrom(err, "Could not load the system status."));
      } finally {
        if (id === latest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  // Keep the figures fresh while the page stays open.
  useEffect(() => {
    const timer = setInterval(() => {
      if (!toggleRef.current && !windowRef.current) load({ quiet: true });
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  // A change made here is newer than any check still on its way.
  const applyMaintenance = (maintenance) => {
    latest.current++;
    setRefreshing(false);
    setData((prev) => ({ ...prev, maintenance }));
  };

  async function runToggle(enabled) {
    if (toggleRef.current) return;
    toggleRef.current = true;
    setToggleBusy(true);
    setModalError("");
    try {
      const result = await saveEnabled(enabled);
      applyMaintenance(result.maintenance);
      setShowEnableConfirm(false);
      setToast({ message: enabled ? "Maintenance mode enabled" : "Maintenance mode disabled", tone: "success" });
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      const message = messageFrom(err, "Could not change maintenance mode.");
      if (enabled) setModalError(message);
      else setToast({ message, tone: "error" });
    } finally {
      toggleRef.current = false;
      setToggleBusy(false);
    }
  }

  // Turning it on locks every farmer and cooperative out, so it asks first.
  // Turning it off only restores access, so it does not.
  function handleToggleRequest() {
    if (!data || toggleRef.current) return;
    if (data.maintenance.enabled) runToggle(false);
    else {
      setModalError("");
      setShowEnableConfirm(true);
    }
  }

  async function runWindow(start, end) {
    if (windowRef.current) return;
    windowRef.current = true;
    setWindowBusy(true);
    setModalError("");
    try {
      const result = await saveWindow(start, end);
      applyMaintenance(result.maintenance);
      setShowEditWindow(false);
      setToast({ message: start === null ? "Maintenance window removed" : "Maintenance window updated", tone: "success" });
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setModalError(messageFrom(err, "Could not save the maintenance window."));
    } finally {
      windowRef.current = false;
      setWindowBusy(false);
    }
  }

  const header = (
    <>
      <h2 className="text-3xl font-bold text-gray-900">System Monitoring & Maintenance</h2>
      <p className="text-sm text-gray-500 mt-1">General system and database status, and maintenance activities</p>
    </>
  );

  if (loading && !data) {
    return (
      <div>
        {header}
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        {header}
        <div className="mt-6 py-10 text-center text-sm text-red-600">
          {error || "Could not load the system status."}{" "}
          <button onClick={() => load()} className="font-semibold underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { server, database: db, maintenance: m, info } = data;
  const dbTone = db.status === "Healthy" ? "green" : db.status === "Slow" ? "amber" : "red";
  const hasWindow = Boolean(m.windowStart && m.windowEnd);
  const phase = hasWindow ? windowPhase(m.windowStart, m.windowEnd) : null;
  const connections = db.connections
    ? db.connections.max
      ? `${db.connections.current} of ${db.connections.max}`
      : String(db.connections.current)
    : "Not available";

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-start justify-between">
        <div>{header}</div>
        <div className="mt-4 md:mt-8 flex items-center gap-3 text-xs text-gray-500">
          <span>
            {refreshFailed ? "Could not refresh — showing the last check from " : "Last checked "}
            {formatDateTime(data.checkedAt)}
          </span>
          <button
            onClick={() => load({ quiet: true })}
            disabled={refreshing}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Checking…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatusCard
          label="Server Status"
          value={server.status}
          tone="green"
          hint={typeof server.memoryMb === "number" ? `Using ${server.memoryMb} MB of memory` : undefined}
        />
        <StatusCard
          label="Database Status"
          value={db.status}
          tone={dbTone}
          hint={typeof db.collections === "number" ? `${db.collections} collections` : undefined}
        />
        <StatusCard
          label="Database Response"
          value={typeof db.pingMs === "number" ? `${db.pingMs} ms` : "—"}
          hint="How long the database took to answer"
        />
        <StatusCard label="Active DB Connections" value={connections} hint="Open right now" />
      </div>

      {m.active && (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p>
            {m.reason === "scheduled"
              ? `The scheduled maintenance window is running. Farmers and cooperatives see the "Down for maintenance" screen until ${formatDateTime(m.until)}.`
              : 'Maintenance mode is ON. Farmers and cooperatives see the "Down for maintenance" screen until you turn it off.'}
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Maintenance Mode</h3>

        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Enable maintenance mode</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Farmers and cooperatives will see a "Down for maintenance" screen. Admin access stays available.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={m.enabled}
            aria-label="Maintenance mode"
            onClick={handleToggleRequest}
            disabled={toggleBusy}
            className={`w-11 h-6 rounded-full border-2 border-transparent transition-colors shrink-0 ml-4 disabled:opacity-60 ${
              m.enabled ? "bg-amber-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`block h-5 w-5 bg-white rounded-full shadow-sm transition-transform ${
                m.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Scheduled maintenance window</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasWindow ? (
                <>
                  {windowText(m.windowStart, m.windowEnd)} (auto-enable/disable) ·{" "}
                  <span className={phase === "Running now" ? "text-amber-700 font-semibold" : ""}>{phase}</span>
                </>
              ) : (
                "No window scheduled"
              )}
            </p>
          </div>
          <button
            onClick={() => {
              setModalError("");
              setShowEditWindow(true);
            }}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ml-4"
          >
            {hasWindow ? "Edit" : "Set"}
          </button>
        </div>

        {m.updatedAt && (
          <p className="text-xs text-gray-400 pt-3 border-t border-gray-100">
            Last changed {formatDateTime(m.updatedAt)}
            {m.updatedBy ? ` by ${m.updatedBy}` : ""}
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">System Info</h3>
        <InfoRow label="Platform Version" value={info.version ? `v${info.version}` : "—"} />
        {info.commit && (
          <InfoRow label="Latest Change" value={info.commitMessage ? `${info.commit} · ${info.commitMessage}` : info.commit} />
        )}
        <InfoRow label="Last Deployed" value={info.deployedAt ? formatDateTime(info.deployedAt) : "Not available"} />
        <InfoRow label="Environment" value={info.environment || "—"} />
        {info.region && <InfoRow label="Region" value={info.region} />}
        <InfoRow label="Server Runtime" value={info.node || "—"} />
        <InfoRow
          label="Database Size"
          value={
            typeof db.dataBytes === "number"
              ? `${bytesText(db.dataBytes)} of data · ${bytesText(db.storageBytes)} stored`
              : "Not available"
          }
          last
        />
      </div>

      {showEnableConfirm && (
        <EnableMaintenanceConfirmModal
          busy={toggleBusy}
          error={modalError}
          onConfirm={() => runToggle(true)}
          onCancel={() => setShowEnableConfirm(false)}
        />
      )}

      {showEditWindow && (
        <EditWindowModal
          maintenance={m}
          busy={windowBusy}
          error={modalError}
          onSave={runWindow}
          onRemove={() => runWindow(null, null)}
          onCancel={() => setShowEditWindow(false)}
        />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
}