import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import {
  getSystemStatus,
  toggleMaintenanceMode,
  updateMaintenanceWindow,
  clearCache,
} from "../../mocks/admin/adminSystemStatus.mock";

function StatusCard({ label, value, dot }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        {dot && <span className="w-2.5 h-2.5 rounded-full bg-[#2e7d32]" />}
        <span className={dot ? "text-[#2e7d32]" : "text-gray-900"}>{value}</span>
      </p>
    </div>
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

function EnableMaintenanceConfirmModal({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
          <AlertTriangle size={18} className="text-amber-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Enable maintenance mode?</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Farmers and cooperatives will immediately see a "Down for
          maintenance" screen. Admin access stays available.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors"
          >
            Enable maintenance mode
          </button>
        </div>
      </div>
    </div>
  );
}

function EditWindowModal({ maintenance, onSave, onCancel }) {
  const [start, setStart] = useState(maintenance.windowStart);
  const [end, setEnd] = useState(maintenance.windowEnd);
  const [error, setError] = useState("");

  function handleSave() {
    if (!start || !end) {
      setError("Both start and end times are required.");
      return;
    }
    if (end <= start) {
      setError("End time must be after the start time.");
      return;
    }
    onSave(start, end);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-1">
          Edit Scheduled Maintenance Window
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          The platform automatically enables maintenance mode at the start
          time and disables it at the end time.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Start
            </label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setError("");
              }}
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              End
            </label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
                setError("");
              }}
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            Save window
          </button>
        </div>
      </div>
    </div>
  );
}

function formatWindowLabel(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateStr = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startTime = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const endTime = endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dateStr}, ${startTime} – ${endTime} (auto-enable/disable)`;
}

export default function SystemMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);
  const [showEditWindow, setShowEditWindow] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    getSystemStatus().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Enabling is the dangerous direction (locks out every non-admin user),
  // so it requires confirmation. Disabling is the safe direction — no
  // confirmation needed to restore normal access.
  function handleToggleRequest() {
    if (data.maintenance.enabled) {
      handleConfirmedToggle();
    } else {
      setShowEnableConfirm(true);
    }
  }

  async function handleConfirmedToggle() {
    await toggleMaintenanceMode();
    setData((prev) => ({
      ...prev,
      maintenance: { ...prev.maintenance, enabled: !prev.maintenance.enabled },
    }));
    setToastMessage(
      data.maintenance.enabled ? "Maintenance mode disabled" : "Maintenance mode enabled"
    );
    setShowEnableConfirm(false);
  }

  async function handleSaveWindow(start, end) {
    await updateMaintenanceWindow();
    setData((prev) => ({
      ...prev,
      maintenance: {
        ...prev.maintenance,
        windowStart: start,
        windowEnd: end,
        windowLabel: formatWindowLabel(start, end),
      },
    }));
    setToastMessage("Maintenance window updated");
    setShowEditWindow(false);
  }

  async function handleClearCache() {
    setIsClearingCache(true);
    await clearCache();
    setIsClearingCache(false);
    setToastMessage("Cache cleared successfully");
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          System Monitoring & Maintenance
        </h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">
        System Monitoring & Maintenance
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        General system and database status, and maintenance activities
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatusCard label="Server Status" value={data.summary.serverStatus} dot />
        <StatusCard label="Database Status" value={data.summary.databaseStatus} dot />
        <StatusCard label="CPU / Memory Load" value={data.summary.cpuMemoryLoad} />
        <StatusCard label="Active DB Connections" value={data.summary.activeDbConnections} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Maintenance Mode</h3>

        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Enable maintenance mode</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Farmers and cooperatives will see a "Down for maintenance"
              screen. Admin access stays available.
            </p>
          </div>
          <button
            onClick={handleToggleRequest}
            className={`w-11 h-6 rounded-full border-2 border-transparent transition-colors shrink-0 ml-4 ${
              data.maintenance.enabled ? "bg-amber-500" : "bg-gray-300"
            }`}
            aria-label="Toggle maintenance mode"
          >
            <span
              className={`block h-5 w-5 bg-white rounded-full shadow-sm transition-transform ${
                data.maintenance.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Scheduled maintenance window</p>
            <p className="text-xs text-gray-500 mt-0.5">{data.maintenance.windowLabel}</p>
          </div>
          <button
            onClick={() => setShowEditWindow(true)}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ml-4"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">System Info</h3>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <p className="font-semibold text-gray-900 text-sm">Platform Version</p>
          <p className="text-gray-700 text-sm">{data.systemInfo.platformVersion}</p>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <p className="font-semibold text-gray-900 text-sm">Last Deployed</p>
          <p className="text-gray-700 text-sm">{data.systemInfo.lastDeployed}</p>
        </div>

        <div className="flex items-center justify-between py-3">
          <p className="font-semibold text-gray-900 text-sm">Cache</p>
          <button
            onClick={handleClearCache}
            disabled={isClearingCache}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-60"
          >
            {isClearingCache ? "Clearing…" : "Clear cache"}
          </button>
        </div>
      </div>

      {showEnableConfirm && (
        <EnableMaintenanceConfirmModal
          onConfirm={handleConfirmedToggle}
          onCancel={() => setShowEnableConfirm(false)}
        />
      )}

      {showEditWindow && (
        <EditWindowModal
          maintenance={data.maintenance}
          onSave={handleSaveWindow}
          onCancel={() => setShowEditWindow(false)}
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}