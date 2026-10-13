import { useState, useEffect, useRef, useCallback } from "react";
import { Archive, Search, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import {
  listArchive,
  getArchived,
  restoreArchived,
  purgeArchived,
  countRows,
  countsText,
  expiresText,
} from "../../lib/adminArchive";
import { formatDateTime, messageFrom } from "../../lib/adminUsers";

const PAGE_SIZE = 10;

const KIND_FILTERS = [
  { label: "All", value: "all", countKey: "all" },
  { label: "Cooperatives", value: "cooperative", countKey: "cooperative" },
  { label: "Accounts", value: "user", countKey: "user" },
];

const KIND_BADGE = {
  cooperative: "bg-[#fff8e1] text-[#b8860b]",
  user: "bg-[#e8f5e9] text-[#2e7d32]",
};

function KindBadge({ kind, label }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${KIND_BADGE[kind] ?? "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
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

function ModalShell({ label, onClose, children, width = "max-w-md" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={label}
        className={`bg-white rounded-3xl p-8 ${width} w-full shadow-2xl relative max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

function ViewModal({ item, onClose, onSignOut }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getArchived(item.id)
      .then((d) => alive && setDetail(d))
      .catch((err) => {
        if (!alive) return;
        if (err && err.status === 401) {
          onSignOut?.();
          return;
        }
        setError(messageFrom(err, "Could not load the details."));
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const rows = countRows(item.counts);
  const people = detail?.people || [];
  const kept = detail?.kept || [];

  return (
    <ModalShell label="Archived item details" onClose={onClose} width="max-w-lg">
      <h3 className="text-xl font-bold text-gray-900 pr-8 break-words">{item.label}</h3>
      <div className="mt-1">
        <KindBadge kind={item.kind} label={item.kindLabel} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Deleted</p>
          <div className="bg-[#f4f4f4] rounded-xl px-4 py-3 text-sm font-medium text-gray-800">
            {formatDateTime(item.deletedAt)}
            <span className="block text-xs font-normal text-gray-500">by {item.deletedBy}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Removed for good</p>
          <div className="bg-[#f4f4f4] rounded-xl px-4 py-3 text-sm font-medium text-gray-800">
            {expiresText(item.daysLeft)}
            <span className="block text-xs font-normal text-gray-500">{formatDateTime(item.expiresAt)}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#f8f9f8] border border-gray-200 rounded-2xl p-4 mt-4">
        <p className="text-xs font-bold text-gray-800 mb-2">What is saved</p>
        {rows.length === 0 ? (
          <p className="text-xs text-gray-500">Nothing else was attached.</p>
        ) : (
          <ul className="text-xs text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
            {rows.map((r) => (
              <li key={r.key}>{r.text}</li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-[#c24141] font-medium">{error}</p>}
      {!detail && !error && <p className="mt-4 text-xs text-gray-400">Loading the people…</p>}

      {people.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold text-gray-800 mb-2">Accounts deleted</p>
          <ul className="space-y-1.5">
            {people.map((p, i) => (
              <li key={`${p.email}-${i}`} className="text-sm text-gray-700 flex items-center justify-between gap-3">
                <span className="min-w-0 break-words">
                  {p.name} <span className="text-xs text-gray-400">{p.email}</span>
                </span>
                <span className="text-xs text-gray-500 shrink-0">{p.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {kept.length > 0 && (
        <div className="mt-4 bg-[#fff8e1] border border-[#f1d98a] rounded-2xl p-4">
          <p className="text-xs font-bold text-[#8c6a00] mb-2">Accounts that were kept</p>
          <ul className="space-y-1">
            {kept.map((p, i) => (
              <li key={`${p.email}-${i}`} className="text-xs text-gray-700">
                {p.name} <span className="text-gray-400">{p.email}</span> {p.reason}. Only their place in the cooperative was removed.
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button onClick={onClose} className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-xl text-sm font-medium transition-colors">
          Close
        </button>
      </div>
    </ModalShell>
  );
}

function RestoreModal({ item, busy, error, onConfirm, onCancel }) {
  const cancel = () => {
    if (!busy) onCancel();
  };
  const isCoop = item.kind === "cooperative";
  return (
    <ModalShell label="Restore this item" onClose={cancel}>
      <h3 className="text-lg font-bold text-gray-900 pr-8">Restore {item.label}?</h3>
      <p className="text-sm text-gray-600 mt-2">
        {isCoop
          ? "This puts the cooperative back exactly as it was: its owner and team accounts, loans, payments, reminders, notifications and invitations."
          : "This puts the account back exactly as it was, with its farm records, certificates and notifications."}{" "}
        Everyone who was removed can sign in again with their old password.
      </p>
      <p className="text-sm text-gray-500 mt-3">
        {isCoop
          ? "If the owner's email or the registration number has been taken since, the restore is refused and nothing changes. Anything else that can't come back is left out and listed for you afterwards."
          : "If the email has been taken since, the restore is refused and nothing changes."}
      </p>
      {error && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
      <div className="flex items-center justify-end gap-3 mt-6">
        <button onClick={cancel} disabled={busy} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm transition-colors disabled:opacity-60">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={busy} className="px-5 py-2 rounded-xl bg-[#2d4027] hover:bg-[#1f2d1b] text-white text-sm font-semibold transition-colors disabled:opacity-60">
          {busy ? "Restoring…" : "Restore"}
        </button>
      </div>
    </ModalShell>
  );
}

function PurgeModal({ item, busy, error, onConfirm, onCancel }) {
  const cancel = () => {
    if (!busy) onCancel();
  };
  return (
    <ModalShell label="Delete this item for good" onClose={cancel}>
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-3">
        <AlertTriangle size={18} className="text-red-600" />
      </div>
      <h3 className="text-lg font-bold text-red-600 pr-8">Delete {item.label} for good?</h3>
      <p className="text-sm text-gray-600 mt-2">
        This removes the saved copy now instead of waiting for the 30 days to pass. It can no longer be restored, and any
        uploaded certificate files are deleted too. This cannot be undone.
      </p>
      {error && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
      <div className="flex items-center justify-end gap-3 mt-6">
        <button onClick={cancel} disabled={busy} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm transition-colors disabled:opacity-60">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={busy} className="px-5 py-2 rounded-xl bg-[#8b0000] hover:bg-[#660000] text-white text-sm font-semibold transition-colors disabled:opacity-60">
          {busy ? "Deleting…" : "Delete permanently"}
        </button>
      </div>
    </ModalShell>
  );
}

// Shown after a restore that had to leave some things out.
function LeftOutModal({ result, onClose }) {
  return (
    <ModalShell label="Restored with some items left out" onClose={onClose}>
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
        <AlertTriangle size={18} className="text-amber-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 pr-8">{result.label} was restored</h3>
      <p className="text-sm text-gray-600 mt-2">Some things could not come back because something they belong to no longer exists:</p>
      <ul className="text-sm text-gray-700 mt-3 space-y-2 list-disc pl-5">
        {result.skipped.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      <div className="flex justify-end mt-6">
        <button onClick={onClose} className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors">
          OK
        </button>
      </div>
    </ModalShell>
  );
}

export default function ArchiveManagement({ onSignOut }) {
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1, counts: { all: 0, cooperative: 0, user: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(0);
  const applied = useRef("");

  const [viewing, setViewing] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [purging, setPurging] = useState(null);
  const [leftOut, setLeftOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const [toast, setToast] = useState(null);
  const actingRef = useRef(false);

  // Waits for typing to stop; a new search starts again from page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = search.trim();
      if (next === applied.current) return;
      applied.current = next;
      setDebounced(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      const id = ++latest.current;
      if (!quiet) setLoading(true);
      setError("");
      try {
        const result = await listArchive({ kind, search: debounced, page, limit: PAGE_SIZE });
        if (id !== latest.current) return;
        setData(result);
      } catch (err) {
        if (id !== latest.current) return;
        if (err && err.status === 401) {
          onSignOut?.();
          return;
        }
        setError(messageFrom(err, "Could not load the archive."));
      } finally {
        if (id === latest.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, debounced, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  function chooseKind(value) {
    if (value === kind) return;
    setKind(value);
    setPage(1);
  }

  function closeModals() {
    setRestoring(null);
    setPurging(null);
    setModalError("");
  }

  // One action at a time. Success: close, tell the admin, refresh the list.
  // Failure: keep the dialog open and say why.
  async function perform(run) {
    if (actingRef.current) return;
    actingRef.current = true;
    setBusy(true);
    setModalError("");
    try {
      const outcome = await run();
      closeModals();
      if (outcome.leftOut) setLeftOut(outcome.leftOut);
      else setToast({ message: outcome.message, tone: "success" });
      if (data.items.length === 1 && page > 1) setPage(page - 1);
      else load({ quiet: true });
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setModalError(messageFrom(err, "Something went wrong. Please try again."));
      // 404: someone already restored or removed it. Refresh so the list is truthful.
      if (err && err.status === 404) load({ quiet: true });
    } finally {
      actingRef.current = false;
      setBusy(false);
    }
  }

  const handleRestore = () =>
    perform(async () => {
      const result = await restoreArchived(restoring.id);
      const skipped = result?.skipped || [];
      if (skipped.length > 0) return { leftOut: { label: restoring.label, skipped } };
      return { message: `${restoring.label} restored` };
    });

  const handlePurge = () =>
    perform(async () => {
      await purgeArchived(purging.id);
      return { message: `${purging.label} deleted for good` };
    });

  const { items, total, pages, counts } = data;
  const firstShown = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Archive</h2>
        <p className="mt-1 text-gray-500">
          Deleted cooperatives and accounts are kept here for 30 days, then removed for good. Restore one if it was a mistake.
        </p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full min-w-0 sm:flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the archive by name or email..."
            aria-label="Search the archive"
            className="bg-[#f4f4f4] border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {KIND_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => chooseKind(f.value)}
              className={
                kind === f.value
                  ? "bg-[#38512f] text-white font-medium px-4 py-2 rounded-xl text-sm"
                  : "bg-[#f0f0f0] text-gray-700 hover:bg-gray-200 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
              }
            >
              {f.label} ({counts?.[f.countKey] ?? 0})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
        {error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#c24141] font-medium">{error}</p>
            <button onClick={() => load()} className="mt-4 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              Try again
            </button>
          </div>
        ) : (
          <table className={`w-full text-sm transition-opacity ${loading && items.length > 0 ? "opacity-50" : ""}`}>
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="pb-2 font-semibold">Item</th>
                <th className="pb-2 font-semibold">What was removed</th>
                <th className="pb-2 font-semibold">Deleted</th>
                <th className="pb-2 font-semibold">Removed for good</th>
                <th className="pb-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">Loading…</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    {debounced || kind !== "all"
                      ? "Nothing in the archive matches your search/filter."
                      : "The archive is empty. Deleted cooperatives and accounts will show up here for 30 days."}
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="border-t border-gray-50 align-top">
                    <td className="py-3 pr-4">
                      <p className="text-gray-900 font-medium break-words">{it.label}</p>
                      <div className="mt-1">
                        <KindBadge kind={it.kind} label={it.kindLabel} />
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 max-w-[220px]">{countsText(it.counts)}</td>
                    <td className="py-3 pr-4 text-gray-600">
                      <p className="whitespace-nowrap">{formatDateTime(it.deletedAt)}</p>
                      <p className="text-xs text-gray-400">by {it.deletedBy}</p>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className={it.daysLeft <= 3 ? "text-[#b85d19] font-medium" : "text-gray-600"}>{expiresText(it.daysLeft)}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewing(it)}
                          aria-label={`View ${it.label}`}
                          className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setModalError("");
                            setRestoring(it);
                          }}
                          aria-label={`Restore ${it.label}`}
                          className="border border-[#4d6b41] text-[#2d4027] hover:bg-[#e8f5e9] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => {
                            setModalError("");
                            setPurging(it);
                          }}
                          aria-label={`Delete ${it.label} for good`}
                          className="border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                        >
                          Delete now
                        </button>
                      </div>
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

      <p className="mt-4 text-xs text-gray-400 flex items-center gap-1.5">
        <Archive size={13} />
        Archived copies are not part of backups. They are removed automatically once their 30 days are over.
      </p>

      {viewing && <ViewModal item={viewing} onClose={() => setViewing(null)} onSignOut={onSignOut} />}
      {restoring && <RestoreModal item={restoring} busy={busy} error={modalError} onConfirm={handleRestore} onCancel={closeModals} />}
      {purging && <PurgeModal item={purging} busy={busy} error={modalError} onConfirm={handlePurge} onCancel={closeModals} />}
      {leftOut && <LeftOutModal result={leftOut} onClose={() => setLeftOut(null)} />}
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
}