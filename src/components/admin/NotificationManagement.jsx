import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, Info, X } from "lucide-react";
import { authedRequest } from "../../api";
import { formatDateTime, messageFrom } from "../../lib/adminUsers";

const PAGE_SIZE = 10;
const MAX_RECIPIENTS = 100; // the server's limit for one announcement

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "farm_owners", label: "Farm Owners" },
  { value: "cooperatives", label: "Cooperatives" },
];

const people = (n) => `${n} ${n === 1 ? "person" : "people"}`;

// The server says exactly what was wrong ("The title must be 3–120
// characters"); show that rather than a generic failure.
const detailMessage = (err, fallback) =>
  (Array.isArray(err?.details) && err.details[0]?.message) || messageFrom(err, fallback);

const listAnnouncements = ({ page, limit }) => authedRequest(`/api/admin/announcements?page=${page}&limit=${limit}`);
const postAnnouncement = (body) => authedRequest("/api/admin/announcements", { method: "POST", body });

function StatusBadge({ item }) {
  if (item.status === "sent") {
    return (
      <span className="bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
        Delivered · {item.sent} of {item.recipients}
      </span>
    );
  }
  if (item.status === "partial") {
    return (
      <span className="bg-[#fff3e0] text-[#b26a00] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
        Partly delivered · {item.sent} of {item.recipients}
      </span>
    );
  }
  if (item.status === "failed") {
    return (
      <span className="bg-[#fbe9e7] text-[#c62828] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
        Not delivered · 0 of {item.recipients}
      </span>
    );
  }
  return (
    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
      Sending…
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

// Full view of one announcement. Also used by the bell in the admin header.
export function AnnouncementDetailsModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Announcement details"
        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={20} />
        </button>

        <h3 className="text-2xl font-bold text-gray-900 pr-8 break-words">{item.title}</h3>

        <dl className="mt-5 grid grid-cols-[110px_1fr] gap-y-2.5 text-sm">
          <dt className="text-gray-400">Audience</dt>
          <dd className="text-gray-800 font-medium">{item.audienceLabel}</dd>
          <dt className="text-gray-400">Sent</dt>
          <dd className="text-gray-800">{formatDateTime(item.at)}</dd>
          <dt className="text-gray-400">Sent by</dt>
          <dd className="text-gray-800">{item.sentBy}</dd>
          <dt className="text-gray-400">Delivery</dt>
          <dd>
            <StatusBadge item={item} />
            {item.failed > 0 && <span className="ml-2 text-xs text-gray-400">{item.failed} could not be reached</span>}
          </dd>
        </dl>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-6 mb-2">Message</p>
        <div className="bg-[#f4f4f4] rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap break-words">{item.message}</div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function NewAnnouncementModal({ audienceCounts, busy, error, onSend, onCancel }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState(AUDIENCE_OPTIONS[0].value);
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);

  const count = audienceCounts ? audienceCounts[audience] : undefined;
  const audienceLabel = AUDIENCE_OPTIONS.find((o) => o.value === audience).label;
  const tooMany = typeof count === "number" && count > MAX_RECIPIENTS;
  const nobody = typeof count === "number" && count === 0;

  function handleReview() {
    const newErrors = {
      title: title.trim().length < 3 ? "A title is required (at least 3 characters)." : null,
      message: message.trim().length < 3 ? "A message is required (at least 3 characters)." : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    if (nobody || tooMany) return;
    setConfirming(true);
  }

  async function handleConfirm() {
    if (busy) return;
    const ok = await onSend({ title: title.trim(), message: message.trim(), audience });
    if (!ok) setConfirming(false);
  }

  const cancel = () => {
    if (!busy) onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={cancel}>
      <div
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={cancel}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-2xl font-bold text-gray-900">New Announcement</h3>
        <p className="text-xs text-gray-500 mb-6">
          This will be emailed to everyone in the selected audience.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Title</label>
            <input
              type="text"
              value={title}
              maxLength={120}
              disabled={confirming}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="e.g., Scheduled maintenance this weekend"
              className={`bg-[#f4f4f4] border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] disabled:opacity-60 ${
                errors.title ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Message</label>
            <textarea
              value={message}
              maxLength={2000}
              disabled={confirming}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrors((prev) => ({ ...prev, message: undefined }));
              }}
              placeholder="Write the announcement..."
              className={`bg-[#f4f4f4] border rounded-xl p-3 text-sm w-full h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41] disabled:opacity-60 ${
                errors.message ? "border-red-400" : "border-gray-200"
              }`}
            />
            <div className="flex items-start justify-between">
              {errors.message ? <p className="mt-1 text-xs text-red-500">{errors.message}</p> : <span />}
              <span className="mt-1 text-[11px] text-gray-400">{message.length}/2000</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Audience</label>
            <select
              value={audience}
              disabled={confirming}
              onChange={(e) => setAudience(e.target.value)}
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] disabled:opacity-60"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                  {audienceCounts ? ` (${people(audienceCounts[opt.value] ?? 0)})` : ""}
                </option>
              ))}
            </select>
            {nobody && <p className="mt-1 text-xs text-red-500">No one is in this audience yet.</p>}
            {tooMany && (
              <p className="mt-1 text-xs text-red-500">
                This audience has more than {MAX_RECIPIENTS} people. Choose a smaller one.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-[#c24141] font-medium">{error}</p>}
        </div>

        {confirming ? (
          <div className="mt-8">
            <p className="text-sm text-gray-700 mb-4">
              This will email <strong>{people(count ?? 0)}</strong> ({audienceLabel}) right now. It can't be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={busy}
                className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-60"
              >
                {busy ? "Sending…" : "Yes, send it"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={cancel}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReview}
              disabled={nobody || tooMany}
              className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              Send Announcement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationManagement({ onSignOut, onAnnouncementSent }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ announcements: [], total: 0, pages: 1, audienceCounts: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [sendError, setSendError] = useState("");
  const [toast, setToast] = useState(null);
  const [details, setDetails] = useState(null);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      const id = ++latest.current;
      if (!quiet) setLoading(true);
      setError("");
      try {
        const result = await listAnnouncements({ page, limit: PAGE_SIZE });
        if (id !== latest.current) return;
        setData(result);
      } catch (err) {
        if (id !== latest.current) return;
        if (err && err.status === 401) {
          onSignOut?.();
          return;
        }
        setError(messageFrom(err, "Could not load the announcements."));
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

  // Resolves true when the announcement went out (so the form can close).
  async function handleSend(payload) {
    if (sendingRef.current) return false;
    sendingRef.current = true;
    setSending(true);
    setSendError("");
    try {
      const result = await postAnnouncement(payload);
      const a = result.announcement;
      setIsModalOpen(false);
      if (a.status === "sent") {
        setToast({ message: `Announcement emailed to ${people(a.sent)}`, tone: "success" });
      } else if (a.status === "partial") {
        setToast({ message: `Emailed ${a.sent} of ${a.recipients}. ${a.failed} could not be reached.`, tone: "error" });
      } else {
        setToast({ message: "No emails could be sent. Please try again later.", tone: "error" });
      }
      onAnnouncementSent?.(a);
      if (page !== 1) setPage(1);
      else load({ quiet: true });
      return true;
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return true;
      }
      setSendError(detailMessage(err, "Could not send the announcement. Please try again."));
      load({ quiet: true }); // the audience may have changed
      return false;
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  const { announcements, total, pages } = data;
  const firstShown = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Notification Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Send announcements to users by email and see how each one was delivered
          </p>
        </div>
        <button
          onClick={() => {
            setSendError("");
            setIsModalOpen(true);
          }}
          className="mt-12 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors w-fit"
        >
          + New Announcement
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sent Announcements</h3>

        {error ? (
          <div className="py-8 text-center text-sm text-red-600">
            {error}{" "}
            <button onClick={() => load()} className="font-semibold underline">
              Try again
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="pb-2 font-semibold">Title</th>
                <th className="pb-2 font-semibold">Audience</th>
                <th className="pb-2 font-semibold">Sent</th>
                <th className="pb-2 font-semibold">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-400">
                    No announcements have been sent yet.
                  </td>
                </tr>
              ) : (
                announcements.map((a) => (
                  <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => setDetails(a)}
                        aria-label={`View details of ${a.title}`}
                        className="text-left w-full"
                      >
                        <p className="font-medium text-gray-900 hover:underline">{a.title}</p>
                        <p className="text-xs text-gray-400 max-w-xs truncate">{a.message}</p>
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{a.audienceLabel}</td>
                    <td className="py-3 pr-4 text-gray-600">
                      <p>{formatDateTime(a.at)}</p>
                      <p className="text-xs text-gray-400">by {a.sentBy}</p>
                    </td>
                    <td className="py-3">
                      <StatusBadge item={a} />
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

      {isModalOpen && (
        <NewAnnouncementModal
          audienceCounts={data.audienceCounts}
          busy={sending}
          error={sendError}
          onSend={handleSend}
          onCancel={() => setIsModalOpen(false)}
        />
      )}

      {details && <AnnouncementDetailsModal item={details} onClose={() => setDetails(null)} />}

      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
}