import { useState, useEffect, useRef, useCallback } from "react";
import {
  listCertificateQueue,
  reviewCertificate,
  openCertificate,
  messageFrom,
  moneyText,
  CREDIT_LIMIT_AMOUNT,
} from "../../lib/certificates";
import { StatusBadge, FileIcon, ReviewLine, CertificateMeta, TypeChip, ReviewModal } from "../shared/CertificatesPanel";

const STATUS_FILTERS = [
  { label: "Pending", value: "pending" },
  { label: "Verified", value: "verified" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

const TYPE_OPTIONS = [
  { label: "All documents", value: "all" },
  { label: "Barangay Certificate", value: "barangay_certificate" },
  { label: "Income Certificate", value: "income_certificate" },
  { label: "Other documents", value: "other" },
];

const LIMIT = 10;

// Every farmer's submitted certificates in one list, so the admin can open
// and verify them here without going into each farmer's account. The search
// box above (in User Management) searches by farmer name or email.
export default function CertificateReviewQueue({ search, onSignOut, onPendingCount, onToast }) {
  const [status, setStatus] = useState("pending");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ certificates: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(0);

  // Wait until the admin stops typing before asking the server.
  const [debounced, setDebounced] = useState(search.trim());
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // A new search or filter starts again from page 1 (done while rendering so
  // no request is ever sent for "new filter, old page").
  const key = `${status}|${type}|${debounced}`;
  const [seenKey, setSeenKey] = useState(key);
  if (seenKey !== key) {
    setSeenKey(key);
    setPage(1);
  }

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      const id = ++latest.current;
      if (!quiet) setLoading(true);
      setError("");
      try {
        const result = await listCertificateQueue({ status, type, search: debounced, page, limit: LIMIT });
        if (id !== latest.current) return;
        setData(result);
        onPendingCount?.(result.pendingCount);
      } catch (err) {
        if (id !== latest.current) return;
        if (err && err.status === 401) {
          onSignOut?.();
          return;
        }
        setError(messageFrom(err, "Could not load the certificates."));
      } finally {
        if (id === latest.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, type, debounced, page]
  );

  useEffect(() => {
    load();
    return () => {
      latest.current++;
    };
  }, [load]);

  const [openingId, setOpeningId] = useState(null);
  const openingRef = useRef(false);
  async function handleView(cert) {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpeningId(cert.id);
    try {
      const opened = await openCertificate(cert.id);
      if (!opened) onToast?.("Your browser blocked the new tab. Allow pop-ups for this site and try again.", "error");
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      onToast?.(messageFrom(err, "Could not open that certificate."), "error");
    } finally {
      openingRef.current = false;
      setOpeningId(null);
    }
  }

  const [reviewing, setReviewing] = useState(null); // { cert, mode }
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const reviewRef = useRef(false);

  async function handleReview(note) {
    if (reviewRef.current || !reviewing) return;
    reviewRef.current = true;
    setReviewBusy(true);
    setReviewError("");
    try {
      const result = await reviewCertificate(reviewing.cert.id, reviewing.mode, note);
      const farmer = reviewing.cert.farmer.name;
      const kind = reviewing.mode === "verified" ? "verified" : "rejected";
      const limitNote =
        reviewing.cert.type === "barangay_certificate" && result.credit
          ? ` ${farmer}'s credit limit is now ${moneyText(result.credit.limit)}.`
          : "";
      setReviewing(null);
      onToast?.(`Certificate ${kind}.${limitNote}`, "success");
      load({ quiet: true });
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setReviewError(messageFrom(err, "Could not save the review."));
      if (err && err.status === 404) load({ quiet: true }); // it was removed meanwhile
    } finally {
      reviewRef.current = false;
      setReviewBusy(false);
    }
  }

  const { certificates, total, pages } = data;
  const first = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const last = Math.min(total, page * LIMIT);
  const filtered = Boolean(debounced) || type !== "all";

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm" data-testid="certificate-queue">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900">Certificate verification</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Documents farmers submitted. Verifying a Barangay Certificate sets that farmer&apos;s credit limit to {moneyText(CREDIT_LIMIT_AMOUNT)}.
          </p>
        </div>
        <select
          aria-label="Document type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Certificate status">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            aria-pressed={status === f.value}
            className={
              status === f.value
                ? "bg-[#38512f] text-white font-medium px-3.5 py-1.5 rounded-xl text-xs"
                : "bg-[#f0f0f0] text-gray-700 hover:bg-gray-200 font-medium px-3.5 py-1.5 rounded-xl text-xs transition-colors"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={`mt-4 transition-opacity ${loading && certificates.length > 0 ? "opacity-50" : ""}`}>
        {error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#c24141] font-medium">{error}</p>
            <button
              onClick={() => load()}
              className="mt-4 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Try again
            </button>
          </div>
        ) : loading && certificates.length === 0 ? (
          <p className="py-8 text-center text-gray-400 text-sm">Loading certificates…</p>
        ) : certificates.length === 0 ? (
          <p className="py-8 text-center text-gray-400 text-sm">
            {filtered
              ? "No certificates match your search/filter."
              : status === "pending"
              ? "Nothing to verify right now."
              : "No certificates here yet."}
          </p>
        ) : (
          <ul className="space-y-3">
            {certificates.map((c) => (
              <li key={c.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FileIcon type={c.fileType} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 break-words">{c.farmer.name}</p>
                        {c.farmer.email && <p className="text-xs text-gray-400 break-all">{c.farmer.email}</p>}
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 break-words min-w-0">{c.title}</p>
                      <TypeChip type={c.type} />
                    </div>
                    <CertificateMeta cert={c} />
                    <ReviewLine cert={c} />
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleView(c)}
                        disabled={openingId !== null}
                        aria-label={`View ${c.title} from ${c.farmer.name}`}
                        className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-50"
                      >
                        {openingId === c.id ? "Opening…" : "View"}
                      </button>
                      {c.status !== "verified" && (
                        <button
                          onClick={() => {
                            setReviewError("");
                            setReviewing({ cert: c, mode: "verified" });
                          }}
                          aria-label={`Verify ${c.title} from ${c.farmer.name}`}
                          className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
                        >
                          Verify
                        </button>
                      )}
                      {c.status !== "rejected" && (
                        <button
                          onClick={() => {
                            setReviewError("");
                            setReviewing({ cert: c, mode: "rejected" });
                          }}
                          aria-label={`Reject ${c.title} from ${c.farmer.name}`}
                          className="border border-[#c62828] text-[#c62828] hover:bg-[#fbe9e7] px-3 py-1.5 rounded-xl text-xs font-semibold"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!error && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {first}–{last} of {total}
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

      {reviewing && (
        <ReviewModal
          cert={reviewing.cert}
          mode={reviewing.mode}
          busy={reviewBusy}
          error={reviewError}
          onConfirm={handleReview}
          onClose={() => setReviewing(null)}
        />
      )}
    </div>
  );
}