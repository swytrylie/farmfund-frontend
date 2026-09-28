import { useState, useEffect } from "react";
import { DatabaseBackup, CheckCircle2, AlertTriangle, X } from "lucide-react";
import {
  getBackupData,
  runBackupNow,
  restoreBackup,
} from "../../mocks/admin/adminBackup.mock";

function StatusCard({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm border-l-4 border-l-[#4d6b41]">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className="text-xl font-extrabold text-gray-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className="bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full text-xs font-semibold">
      Success
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

function RestoreConfirmModal({ backup, onConfirm, onCancel }) {
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
        <h3 className="text-lg font-bold text-gray-900">Restore this backup?</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          This will roll the system back to the state captured on{" "}
          <strong>{backup.date}</strong>. Any changes made after this
          backup will be lost. This action cannot be undone.
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
            className="px-5 py-2 rounded-xl bg-[#8b0000] hover:bg-[#660000] text-white text-sm font-semibold transition-colors"
          >
            Restore backup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BackupRecovery() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRunningBackup, setIsRunningBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    getBackupData().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRunBackup() {
    setIsRunningBackup(true);
    await runBackupNow();
    setIsRunningBackup(false);

    const now = new Date();
    const newBackup = {
      id: `backup-${Date.now()}`,
      date: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + " " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      type: "Manual",
      size: data.status.backupSize,
      status: "success",
    };

    setData((prev) => ({
      status: { ...prev.status, lastBackup: newBackup.date },
      history: [newBackup, ...prev.history],
    }));
    setToastMessage("Backup completed successfully");
  }

  async function handleConfirmRestore() {
    const backup = restoringBackup;
    await restoreBackup(backup.id);
    setToastMessage(`System restored to ${backup.date}`);
    setRestoringBackup(null);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Backup & Recovery</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Backup & Recovery</h2>
          <p className="text-sm text-gray-500 mt-1">
            System database backups and restore points
          </p>
        </div>
        <button
          onClick={handleRunBackup}
          disabled={isRunningBackup}
          className="mt-12 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          <DatabaseBackup size={16} />
          {isRunningBackup ? "Running backup…" : "Run Backup Now"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatusCard label="Last Backup" value={data.status.lastBackup} />
        <StatusCard label="Next Scheduled" value={data.status.nextScheduled} />
        <StatusCard label="Backup Size" value={data.status.backupSize} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Backup History</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="pb-2 font-semibold">Date</th>
              <th className="pb-2 font-semibold">Type</th>
              <th className="pb-2 font-semibold">Size</th>
              <th className="pb-2 font-semibold">Status</th>
              <th className="pb-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.history.map((b) => (
              <tr key={b.id} className="border-t border-gray-50">
                <td className="py-3 pr-4 font-medium text-gray-900">{b.date}</td>
                <td className="py-3 pr-4 text-gray-600">{b.type}</td>
                <td className="py-3 pr-4 text-gray-600">{b.size}</td>
                <td className="py-3 pr-4">
                  <StatusBadge status={b.status} />
                </td>
                <td className="py-3">
                  <button
                    onClick={() => setRestoringBackup(b)}
                    className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors"
                  >
                    Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {restoringBackup && (
        <RestoreConfirmModal
          backup={restoringBackup}
          onConfirm={handleConfirmRestore}
          onCancel={() => setRestoringBackup(null)}
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}