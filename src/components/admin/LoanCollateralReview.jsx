import { useState, useEffect, useRef, useCallback } from "react";
import { Search, CheckCircle2, Info } from "lucide-react";
import { listLoanQueue, reviewLoanCollateral, growingText } from "../../lib/loans";
import { messageFrom, moneyText, dateLocal } from "../../lib/certificates";
import LoanBasis from "../shared/LoanBasis";
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

// What the cooperative did with a request after it was verified.
const COOP_DECISION = {
  pending: "Waiting for the cooperative",
  approved: "Approved by the cooperative",
  active: "Active",
  paid_off: "Fully repaid",
  defaulted: "Defaulted",
  rejected: "Rejected by the cooperative",
};

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

// Every loan request goes through here first. The admin opens the farmer's
// collateral proof and either verifies it (the request then goes to the
// cooperative the farmer chose) or rejects it with a reason (it ends here).
export default function LoanCollateralReview({ onSignOut, onReviewed }) {
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ loans: [], total: 0, pages: 1, pendingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const latest = useRef(0);

  // Wait until the admin stops typing before asking the server.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // A new search or filter starts again from page 1 (done while rendering so
  // no request is ever sent for "new filter, old page").
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
        const result = await listLoanQueue({ status, search: debounced, page, limit: LIMIT });
        if (id !== latest.current) return;
        setData(result);
      } catch (err) {
        if (id !== latest.current) return;
        if (err && err.status === 401) {
          onSignOut?.();
          return;
        }
        setError(messageFrom(err, "Could not load the loan requests."));
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

  const [reviewing, setReviewing] = useState(null); // { loan, mode }
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const reviewRef = useRef(false);

  async function handleReview(note) {
    if (reviewRef.current || !reviewing) return;
    reviewRef.current = true;
    setReviewBusy(true);
    setReviewError("");
    try {
      await reviewLoanCollateral(reviewing.loan.id, reviewing.mode, note);
      const who = reviewing.loan.farmer.name;
      const verified = reviewing.mode === "verified";
      setReviewing(null);
      setToast({
        message: verified ? `Collateral verified. ${who}'s request went to ${reviewing.loan.cooperative.name}.` : `Request from ${who} was not verified.`,
        tone: "success",
      });
      load({ quiet: true });
      onReviewed?.(); // the "to verify" bell item is done with
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setReviewError(messageFrom(err, "Could not save the review."));
      // Someone else already decided it: show the list as it really is now.
      if (err && (err.status === 404 || err.status === 409)) load({ quiet: true });
    } finally {
      reviewRef.current = false;
      setReviewBusy(false);
    }
  }

  const { loans, total, pages } = data;
  const first = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const last = Math.min(total, page * LIMIT);

  return (
    <div data-testid="loan-collateral-review">
      <h2 className="text-3xl font-bold text-gray-900">Loan Collateral</h2>
      <p className="text-sm text-gray-500 mt-1">
        Every loan request comes here first. Check the farmer&apos;s collateral proof; once you verify it, the request goes to the cooperative the farmer chose.
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
              aria-label="Search loan requests"
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
          </div>
          <div className="flex flex-wrap gap-2 shrink-0" role="group" aria-label="Request status">
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

        <div className={`mt-5 transition-opacity ${loading && loans.length > 0 ? "opacity-50" : ""}`}>
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
          ) : loading && loans.length === 0 ? (
            <p className="py-8 text-center text-gray-400 text-sm">Loading loan requests…</p>
          ) : loans.length === 0 ? (
            <p className="py-8 text-center text-gray-400 text-sm">
              {debounced ? "No loan requests match your search." : status === "pending" ? "Nothing to verify right now." : "No loan requests here yet."}
            </p>
          ) : (
            <ul className="space-y-3">
              {loans.map((l) => (
                <li key={l.id} className="border border-gray-100 rounded-xl p-4" data-testid="loan-request-row">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 break-words">{l.farmer.name}</p>
                      {l.farmer.email && <p className="text-xs text-gray-400 break-all">{l.farmer.email}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${REVIEW_BADGE[l.review.status] || REVIEW_BADGE.pending}`}>
                      {l.reviewLabel}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div className="border border-gray-100 rounded-xl p-2.5">
                      <p className="text-[11px] text-gray-400">Amount</p>
                      <p className="font-bold text-gray-900">{moneyText(l.principalAmount)}</p>
                    </div>
                    <div className="border border-gray-100 rounded-xl p-2.5">
                      <p className="text-[11px] text-gray-400">Cooperative</p>
                      <p className="font-bold text-gray-900 break-words">{l.cooperative.name}</p>
                    </div>
                    <div className="border border-gray-100 rounded-xl p-2.5">
                      <p className="text-[11px] text-gray-400">Crop</p>
                      <p className="font-bold text-gray-900">{l.cropLabel || "—"}</p>
                    </div>
                    <div className="border border-gray-100 rounded-xl p-2.5">
                      <p className="text-[11px] text-gray-400">Interest</p>
                      <p className="font-bold text-gray-900">{l.interestRatePercent}% per crop cycle</p>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    Requested {dateLocal(l.createdAt)}
                    {l.growingDays ? ` · growing time ${growingText(l.growingDays)}` : ""}
                  </p>

                  <LoanBasis loan={{ _id: l.id, collateral: l.collateral }} />

                  {l.review.status !== "pending" && (
                    <div className="mt-2 text-xs text-gray-500">
                      <p>
                        {l.review.status === "verified" ? "Verified" : "Not verified"}
                        {l.review.reviewedByName ? ` by ${l.review.reviewedByName}` : ""}
                        {l.review.reviewedAt ? ` on ${dateLocal(l.review.reviewedAt)}` : ""}
                        {l.review.status === "verified" && COOP_DECISION[l.loanStatus] ? ` · ${COOP_DECISION[l.loanStatus]}` : ""}
                      </p>
                      {l.review.note && (
                        <p className={`mt-1 rounded-lg px-3 py-2 ${l.review.status === "rejected" ? "bg-[#fbe9e7] text-[#8b1a1a]" : "bg-gray-50 text-gray-600"}`}>{l.review.note}</p>
                      )}
                    </div>
                  )}

                  {l.review.status === "pending" && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setReviewError("");
                          setReviewing({ loan: l, mode: "verified" });
                        }}
                        aria-label={`Verify collateral of ${l.farmer.name}`}
                        className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => {
                          setReviewError("");
                          setReviewing({ loan: l, mode: "rejected" });
                        }}
                        aria-label={`Reject collateral of ${l.farmer.name}`}
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

      {reviewing && (
        <ReviewModal
          cert={{ title: `${moneyText(reviewing.loan.principalAmount)} loan request from ${reviewing.loan.farmer.name}`, type: "loan" }}
          mode={reviewing.mode}
          noun="loan request"
          where="on their loan"
          rejectHint="e.g., The photo is blurry, please upload a clear one."
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