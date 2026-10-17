import { useState, useEffect, useRef, useCallback } from "react";
import { Search, CheckCircle2, Info, LifeBuoy } from "lucide-react";
import { listClaimQueue, reviewClaim, openClaimProof } from "../../lib/calamity";
import { messageFrom, moneyText, dateLocal } from "../../lib/certificates";
import { ReviewModal } from "../shared/CertificatesPanel";

const STATUS_FILTERS = [
  { label: "Waiting", value: "pending" },
  { label: "Verified", value: "verified" },
  { label: "Not verified", value: "rejected" },
  { label: "All", value: "all" },
];

const REVIEW_BADGE = {
  pending: "bg-amber-100 text-amber-700",
  verified: "bg-[#e8f5e9] text-[#2e7d32]",
  rejected: "bg-[#fbe9e7] text-[#c62828]",
};
const REVIEW_LABEL = { pending: "Waiting for review", verified: "Verified", rejected: "Not verified" };

const LIMIT = 10;

function Toast({ message, tone, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, tone === "error" ? 6000 : 3500);
    return () => clearTimeout(t);
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

// Only farmers who asked for disaster relief appear here. The admin opens the
// proof and either verifies it (the cooperative's owner can then activate the
// calamity freeze) or rejects it with a reason.
export default function CalamityClaims({ onSignOut, onReviewed }) {
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ claims: [], total: 0, pages: 1, pendingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const latest = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const key = `${status}|${debounced}`;
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
        const result = await listClaimQueue({ status, search: debounced, page, limit: LIMIT });
        if (id !== latest.current) return;
        setData(result);
      } catch (err) {
        if (id !== latest.current) return;
        if (err && err.status === 401) {
          onSignOut?.();
          return;
        }
        setError(messageFrom(err, "Could not load the disaster relief claims."));
      } finally {
        if (id === latest.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, debounced, page]
  );

  useEffect(() => {
    load();
    return () => {
      latest.current++;
    };
  }, [load]);

  const [reviewing, setReviewing] = useState(null); // { claim, mode }
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const reviewRef = useRef(false);

  async function handleReview(note) {
    if (reviewRef.current || !reviewing) return;
    reviewRef.current = true;
    setReviewBusy(true);
    setReviewError("");
    try {
      await reviewClaim(reviewing.claim.id, reviewing.mode, note);
      const who = reviewing.claim.farmer.name;
      const verified = reviewing.mode === "verified";
      setReviewing(null);
      setToast({
        message: verified ? `Claim verified. ${who} and ${reviewing.claim.cooperative.name} were told.` : `Claim from ${who} was not verified.`,
        tone: "success",
      });
      load({ quiet: true });
      onReviewed?.();
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setReviewError(messageFrom(err, "Could not save the review."));
      if (err && (err.status === 404 || err.status === 409)) load({ quiet: true });
    } finally {
      reviewRef.current = false;
      setReviewBusy(false);
    }
  }

  async function handleProof(claim) {
    try {
      await openClaimProof(claim.id);
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setToast({ message: messageFrom(err, "Could not open the proof."), tone: "error" });
    }
  }

  const { claims, total, pages } = data;
  const first = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const last = Math.min(total, page * LIMIT);

  return (
    <div data-testid="calamity-claims">
      <h2 className="text-3xl font-bold text-gray-900">Calamity Claims</h2>
      <p className="text-sm text-gray-500 mt-1">
        Farmers whose crops were hit by a calamity can ask for relief and send a proof. Check the proof; once you verify it, the cooperative&apos;s owner can activate a calamity freeze.
      </p>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full min-w-0 md:flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by farmer name or email..."
              aria-label="Search calamity claims"
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
          </div>
          <div className="flex flex-wrap gap-2 shrink-0" role="group" aria-label="Claim status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                aria-pressed={status === f.value}
                className={
                  status === f.value
                    ? "bg-[#38512f] text-white font-medium px-4 py-2 rounded-xl text-sm"
                    : "bg-[#f0f0f0] text-gray-700 hover:bg-gray-200 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
                }
              >
                {f.label}
                {f.value === "pending" && data.pendingCount > 0 ? ` (${data.pendingCount})` : ""}
              </button>
            ))}
          </div>
        </div>

        <div className={`mt-5 transition-opacity ${loading && claims.length > 0 ? "opacity-50" : ""}`}>
          {error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#c24141] font-medium">{error}</p>
              <button onClick={() => load()} className="mt-4 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                Try again
              </button>
            </div>
          ) : loading && claims.length === 0 ? (
            <p className="py-8 text-center text-gray-400 text-sm">Loading claims…</p>
          ) : claims.length === 0 ? (
            <p className="py-8 text-center text-gray-400 text-sm">
              {debounced ? "No claims match your search." : status === "pending" ? "No claims to check right now." : "No claims here yet."}
            </p>
          ) : (
            <ul className="space-y-3">
              {claims.map((c) => (
                <li key={c.id} className="border border-gray-100 rounded-xl p-4" data-testid="claim-row">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 break-words">{c.farmer.name}</p>
                      {c.farmer.email && <p className="text-xs text-gray-400 break-all">{c.farmer.email}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${REVIEW_BADGE[c.status] || REVIEW_BADGE.pending}`}>
                      {REVIEW_LABEL[c.status] || REVIEW_LABEL.pending}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div className="border border-gray-100 rounded-xl p-2.5">
                      <p className="text-[11px] text-gray-400">Calamity</p>
                      <p className="font-bold text-gray-900">{c.calamityLabel}</p>
                    </div>
                    <div className="border border-gray-100 rounded-xl p-2.5">
                      <p className="text-[11px] text-gray-400">Cooperative</p>
                      <p className="font-bold text-gray-900 break-words">{c.cooperative.name}</p>
                    </div>
                    <div className="border border-gray-100 rounded-xl p-2.5">
                      <p className="text-[11px] text-gray-400">Loan</p>
                      <p className="font-bold text-gray-900">{c.loan.principalAmount == null ? "—" : moneyText(c.loan.principalAmount)}</p>
                    </div>
                    <div className="border border-gray-100 rounded-xl p-2.5">
                      <p className="text-[11px] text-gray-400">Crop</p>
                      <p className="font-bold text-gray-900">{c.loan.cropLabel || "—"}</p>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-400">Sent {dateLocal(c.createdAt)}</p>

                  {c.description && (
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg px-3 py-2">{c.description}</p>
                  )}
                  {c.hasFile && (
                    <button
                      onClick={() => handleProof(c)}
                      aria-label={`View proof of ${c.farmer.name}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#2d4027] underline hover:text-[#1f2d1b]"
                    >
                      <LifeBuoy size={12} /> View proof{c.fileName ? ` (${c.fileName})` : ""}
                    </button>
                  )}

                  {c.status !== "pending" && (
                    <div className="mt-2 text-xs text-gray-500">
                      <p>
                        {c.status === "verified" ? "Verified" : "Not verified"}
                        {c.review?.reviewedByName ? ` by ${c.review.reviewedByName}` : ""}
                        {c.review?.reviewedAt ? ` on ${dateLocal(c.review.reviewedAt)}` : ""}
                      </p>
                      {c.review?.note && (
                        <p className={`mt-1 rounded-lg px-3 py-2 ${c.status === "rejected" ? "bg-[#fbe9e7] text-[#8b1a1a]" : "bg-gray-50 text-gray-600"}`}>{c.review.note}</p>
                      )}
                      {c.status === "verified" && (
                        <p data-testid="claim-freeze-state" className="mt-1">
                          {c.freeze
                            ? `Calamity freeze ${c.freeze.running ? "active" : "ended"}: until ${dateLocal(c.freeze.endsAt)}.`
                            : "Waiting for the cooperative's owner to activate the calamity freeze."}
                        </p>
                      )}
                    </div>
                  )}

                  {c.status === "pending" && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setReviewError("");
                          setReviewing({ claim: c, mode: "verified" });
                        }}
                        aria-label={`Verify claim of ${c.farmer.name}`}
                        className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => {
                          setReviewError("");
                          setReviewing({ claim: c, mode: "rejected" });
                        }}
                        aria-label={`Reject claim of ${c.farmer.name}`}
                        className="border border-[#c62828] text-[#c62828] hover:bg-[#fbe9e7] px-3 py-1.5 rounded-xl text-xs font-semibold"
                      >
                        Reject
                      </button>
                    </div>
                  )}
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

      {reviewing && (
        <ReviewModal
          cert={{ title: `${reviewing.claim.calamityLabel} claim from ${reviewing.claim.farmer.name}`, type: "claim" }}
          mode={reviewing.mode}
          noun="claim"
          where="on their loan"
          rejectHint="e.g., The photo does not show the damage, please send a clearer one."
          busy={reviewBusy}
          error={reviewError}
          onConfirm={handleReview}
          onClose={() => setReviewing(null)}
        />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
}
