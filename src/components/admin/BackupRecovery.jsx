import { useState, useEffect, useRef, useCallback } from "react";
import { DatabaseBackup, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { authedRequest } from "../../api";
import { formatDate, formatDateTime, messageFrom } from "../../lib/adminUsers";

const PAGE_SIZE = 10;

const listBackups = ({ page, limit }) => authedRequest(`/api/admin/backups?page=${page}&limit=${limit}`);
const createBackup = () => authedRequest("/api/admin/backups", { method: "POST" });
const fetchDownload = (id) => authedRequest(`/api/admin/backups/${id}/download`);
const restoreBackup = (id) =>
  authedRequest(`/api/admin/backups/${id}/restore`, { method: "POST", body: { confirm: "RESTORE" } });

function bytesText(n) {
  if (typeof n !== "number" || n <= 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const records = (n) => `${n} ${n === 1 ? "record" : "records"}`;

// Hands the backup to the browser as a file to save.
function saveFile(filename, content) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function StatusCard({ label, value, hint }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm border-l-4 border-l-[#4d6b41]">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-xl font-extrabold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function StatusBadge({ backup }) {
  if (backup.status === "failed") {
    return (
      <div>
        <span className="bg-[#fbe9e7] text-[#c62828] px-3 py-1 rounded-full text-xs font-semibold">Failed</span>
        {backup.error && <p className="text-[11px] text-gray-400 mt-1 max-w-[220px]">{backup.error}</p>}
      </div>
    );
  }
  return <span className="bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full text-xs font-semibold">Success</span>;
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

function RestoreConfirmModal({ backup, busy, error, onConfirm, onCancel }) {
  const [typed, setTyped] = useState("");
  const ready = typed === "RESTORE";
  const cancel = () => {
    if (!busy) onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={cancel}>
      <div
        role="dialog"
        aria-label="Restore this backup"
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={cancel} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={20} />
        </button>
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
          <AlertTriangle size={18} className="text-amber-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Restore this backup?</h3>
        <p className="text-sm text-gray-600 mt-2">
          This replaces the platform's data (accounts, farms, loans, financial records, cooperatives and the rest) with
          the copy taken on <strong>{formatDateTime(backup.at)}</strong> ({records(backup.totalRecords)}). Anything added
          or changed after that moment will be lost.
        </p>
        <ul className="text-sm text-gray-600 mt-3 space-y-1 list-disc pl-5">
          <li>Admin accounts, audit logs and login history are not touched.</li>
          <li>Everyone else will be signed out and must log in again.</li>
          <li>A safety backup of the current data is saved first, so this can be undone.</li>
        </ul>

        <label htmlFor="restore-confirm" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mt-5 mb-2">
          Type RESTORE to confirm
        </label>
        <input
          id="restore-confirm"
          type="text"
          value={typed}
          disabled={busy}
          autoComplete="off"
          onChange={(e) => setTyped(e.target.value)}
          className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#8b0000] disabled:opacity-60"
        />

        {error && <p className="mt-3 text-sm text-[#c24141] font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={cancel}
            disabled={busy}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => ready && onConfirm()}
            disabled={!ready || busy}
            className="px-5 py-2 rounded-xl bg-[#8b0000] hover:bg-[#660000] text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "Restoring…" : "Restore backup"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BackupRecovery({ onSignOut }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ backups: [], total: 0, pages: 1, summary: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(0);

  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const downloadingRef = useRef(false);
  const [restoring, setRestoring] = useState(null); // the backup the modal is about
  const [restoreBusy, setRestoreBusy] = useState(false);
  const restoreRef = useRef(false);
  const [restoreError, setRestoreError] = useState("");
  const [toast, setToast] = useState(null);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      const id = ++latest.current;
      if (!quiet) setLoading(true);
      setError("");
      try {
        const result = await listBackups({ page, limit: PAGE_SIZE });
        if (id !== latest.current) return;
        setData(result);
      } catch (err) {
        if (id !== latest.current) return;
        if (err && err.status === 401) {
          onSignOut?.();
          return;
        }
        setError(messageFrom(err, "Could not load the backups."));
      } finally {
        if (id === latest.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const showNewest = () => {
    if (page !== 1) setPage(1);
    else load({ quiet: true });
  };

  async function handleRunBackup() {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    try {
      const result = await createBackup();
      const b = result.backup;
      setToast({ message: `Backup completed: ${records(b.totalRecords)}, ${bytesText(b.sizeBytes)}`, tone: "success" });
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setToast({ message: messageFrom(err, "The backup could not be completed."), tone: "error" });
    } finally {
      runningRef.current = false;
      setRunning(false);
      showNewest(); // a failed attempt is listed too
    }
  }

  async function handleDownload(backup) {
    if (downloadingRef.current) return;
    downloadingRef.current = true;
    setDownloadingId(backup.id);
    try {
      const result = await fetchDownload(backup.id);
      saveFile(result.filename, result.file);
      setToast({ message: "Backup file downloaded", tone: "success" });
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setToast({ message: messageFrom(err, "Could not download that backup."), tone: "error" });
    } finally {
      downloadingRef.current = false;
      setDownloadingId(null);
    }
  }

  async function handleConfirmRestore() {
    if (restoreRef.current || !restoring) return;
    restoreRef.current = true;
    setRestoreBusy(true);
    setRestoreError("");
    try {
      await restoreBackup(restoring.id);
      setToast({ message: `Restored to ${formatDateTime(restoring.at)}. A safety backup was saved first.`, tone: "success" });
      setRestoring(null);
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setRestoreError(messageFrom(err, "The restore could not be completed. Please check the list and try again."));
    } finally {
      restoreRef.current = false;
      setRestoreBusy(false);
      showNewest(); // a safety backup may have been added
    }
  }

  const { backups, total, pages, summary } = data;
  const last = summary?.lastBackup;
  const firstShown = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Backup & Recovery</h2>
          <p className="text-sm text-gray-500 mt-1">Saved copies of the platform's data, and a way to go back to one</p>
        </div>
        <button
          onClick={handleRunBackup}
          disabled={running}
          className="mt-4 md:mt-12 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60 w-fit"
        >
          <DatabaseBackup size={16} />
          {running ? "Running backup…" : "Run Backup Now"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatusCard
          label="Last Backup"
          value={last ? formatDateTime(last.at) : loading ? "…" : "No backup yet"}
          hint={last ? `${last.typeLabel} · ${records(last.totalRecords)}` : undefined}
        />
        <StatusCard
          label="Next Scheduled"
          value={
            summary?.scheduleEnabled && summary.nextScheduledAt
              ? formatDate(summary.nextScheduledAt)
              : loading
              ? "…"
              : "Not set up"
          }
          hint={
            summary?.scheduleEnabled
              ? "Runs every day at about 3:00 AM"
              : summary
              ? "Automatic backups are switched off on the server"
              : undefined
          }
        />
        <StatusCard
          label="Backup Size"
          value={last ? bytesText(last.sizeBytes) : loading ? "…" : "—"}
          hint={summary && summary.storedCount > 0 ? `${summary.storedCount} saved · ${bytesText(summary.storedBytes)} in total` : undefined}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Backup History</h3>

        {error ? (
          <div className="py-8 text-center text-sm text-red-600">
            {error}{" "}
            <button onClick={() => load()} className="font-semibold underline">
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Type</th>
                  <th className="pb-2 font-semibold">Records</th>
                  <th className="pb-2 font-semibold">Size</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      Loading…
                    </td>
                  </tr>
                ) : backups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      No backups yet. Press "Run Backup Now" to make the first one.
                    </td>
                  </tr>
                ) : (
                  backups.map((b) => (
                    <tr key={b.id} className="border-t border-gray-50 align-top">
                      <td className="py-3 pr-4 font-medium text-gray-900 whitespace-nowrap">{formatDateTime(b.at)}</td>
                      <td className="py-3 pr-4 text-gray-600">
                        <p>{b.typeLabel}</p>
                        <p className="text-xs text-gray-400">{b.createdBy}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{b.status === "failed" ? "—" : b.totalRecords}</td>
                      <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{b.status === "failed" ? "—" : bytesText(b.sizeBytes)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge backup={b} />
                      </td>
                      <td className="py-3">
                        {b.status === "failed" ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownload(b)}
                              disabled={downloadingId !== null}
                              aria-label={`Download backup from ${formatDateTime(b.at)}`}
                              className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {downloadingId === b.id ? "Preparing…" : "Download"}
                            </button>
                            <button
                              onClick={() => {
                                setRestoreError("");
                                setRestoring(b);
                              }}
                              aria-label={`Restore backup from ${formatDateTime(b.at)}`}
                              className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors"
                            >
                              Restore
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!error && total > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {firstShown}–{lastShown} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span>
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pages}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {restoring && (
        <RestoreConfirmModal
          backup={restoring}
          busy={restoreBusy}
          error={restoreError}
          onConfirm={handleConfirmRestore}
          onCancel={() => setRestoring(null)}
        />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
}