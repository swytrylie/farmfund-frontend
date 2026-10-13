import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Image as ImageIcon, X } from "lucide-react";
import {
  listForFarmer,
  reviewCertificate,
  openCertificate,
  messageFrom,
  bytesText,
  dateOnly,
  dateLocal,
} from "../../lib/certificates";

const STATUS = {
  pending: { label: "Pending review", className: "bg-amber-100 text-amber-700" },
  verified: { label: "Verified", className: "bg-[#e8f5e9] text-[#2e7d32]" },
  rejected: { label: "Rejected", className: "bg-[#fbe9e7] text-[#c62828]" },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${s.className}`}>{s.label}</span>;
}

export function FileIcon({ type }) {
  const Icon = type === "pdf" ? FileText : ImageIcon;
  return (
    <div className="w-10 h-10 rounded-xl bg-[#f4f8f3] flex items-center justify-center shrink-0">
      <Icon size={18} className="text-[#4f7331]" />
    </div>
  );
}

// "Verified by Ana Cruz (Cooperative) on Oct 13, 2026" plus the reason if rejected.
export function ReviewLine({ cert }) {
  if (cert.status === "pending") return null;
  const who = cert.reviewedByName
    ? `${cert.reviewedByName}${cert.reviewedByRole === "admin" ? " (FarmFund admin)" : cert.reviewedByRole === "cooperative" ? " (Cooperative)" : ""}`
    : "";
  return (
    <div className="mt-2 text-xs text-gray-500">
      <p>
        {cert.status === "verified" ? "Verified" : "Rejected"}
        {who ? ` by ${who}` : ""}
        {cert.reviewedAt ? ` on ${dateLocal(cert.reviewedAt)}` : ""}
      </p>
      {cert.reviewNote && (
        <p className={`mt-1 rounded-lg px-3 py-2 ${cert.status === "rejected" ? "bg-[#fbe9e7] text-[#8b1a1a]" : "bg-gray-50 text-gray-600"}`}>
          {cert.reviewNote}
        </p>
      )}
    </div>
  );
}

export function CertificateMeta({ cert }) {
  const bits = [
    cert.issuer ? `Issued by ${cert.issuer}` : null,
    cert.issuedOn ? dateOnly(cert.issuedOn) : null,
    [cert.fileType ? cert.fileType.toUpperCase() : null, bytesText(cert.bytes)].filter(Boolean).join(" · "),
    `Uploaded ${dateLocal(cert.createdAt)}`,
  ].filter(Boolean);
  return <p className="text-xs text-gray-400 mt-0.5 break-words">{bits.join(" · ")}</p>;
}

function ReviewModal({ cert, mode, busy, error, onConfirm, onClose }) {
  const [note, setNote] = useState("");
  const [problem, setProblem] = useState("");
  const rejecting = mode === "rejected";
  const close = () => {
    if (!busy) onClose();
  };

  function submit() {
    if (busy) return;
    const n = note.trim();
    if (rejecting && n.length < 3) {
      setProblem("Say why it is being rejected (at least 3 characters).");
      return;
    }
    if (n.length > 300) {
      setProblem("The note must be 300 characters or fewer.");
      return;
    }
    onConfirm(n);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={close}>
      <div
        role="dialog"
        aria-label={rejecting ? "Reject certificate" : "Verify certificate"}
        className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={close} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={18} />
        </button>
        <h3 className="text-lg font-bold text-gray-900">{rejecting ? "Reject this certificate?" : "Verify this certificate?"}</h3>
        <p className="text-sm text-gray-500 mt-1">
          “{cert.title}”. The farmer will see the result {rejecting ? "and your reason " : ""}on their profile.
        </p>

        <label htmlFor="cert-note" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mt-5 mb-2">
          {rejecting ? "Reason *" : "Note (optional)"}
        </label>
        <textarea
          id="cert-note"
          value={note}
          rows={3}
          maxLength={300}
          disabled={busy}
          onChange={(e) => {
            setNote(e.target.value);
            setProblem("");
          }}
          placeholder={rejecting ? "e.g., The scan is blurry, please upload it again." : "e.g., Checked against the original."}
          className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-3 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41] disabled:opacity-60"
        />
        <div className="flex justify-between">
          <p className="mt-1 text-xs text-red-500">{problem}</p>
          <p className="mt-1 text-xs text-gray-400">{note.length}/300</p>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={close}
            disabled={busy}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className={`px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60 ${
              rejecting ? "bg-[#8b0000] hover:bg-[#660000]" : "bg-[#2d4027] hover:bg-[#1f2d1b]"
            }`}
          >
            {busy ? "Saving…" : rejecting ? "Reject" : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}

// A farmer's certificates, as seen by the admin or a cooperative's staff:
// open each one and mark it Verified or Rejected.
export default function CertificatesPanel({ farmerId, onSignOut }) {
  const [items, setItems] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(0);

  const [notice, setNotice] = useState(null); // { text, tone }
  const [openingId, setOpeningId] = useState(null);
  const openingRef = useRef(false);

  const [reviewing, setReviewing] = useState(null); // { cert, mode }
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const reviewRef = useRef(false);

  const load = useCallback(async () => {
    const id = ++latest.current;
    setLoading(true);
    setError("");
    try {
      const result = await listForFarmer(farmerId);
      if (id !== latest.current) return;
      setItems(result.certificates || []);
      setCanReview(Boolean(result.canReview));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerId]);

  useEffect(() => {
    load();
    return () => {
      latest.current++;
    };
  }, [load]);

  async function handleView(cert) {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpeningId(cert.id);
    setNotice(null);
    try {
      const opened = await openCertificate(cert.id);
      if (!opened) setNotice({ text: "Your browser blocked the new tab. Allow pop-ups for this site and try again.", tone: "error" });
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setNotice({ text: messageFrom(err, "Could not open that certificate."), tone: "error" });
    } finally {
      openingRef.current = false;
      setOpeningId(null);
    }
  }

  async function handleReview(note) {
    if (reviewRef.current || !reviewing) return;
    reviewRef.current = true;
    setReviewBusy(true);
    setReviewError("");
    try {
      const result = await reviewCertificate(reviewing.cert.id, reviewing.mode, note);
      const updated = result.certificate;
      setItems((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setNotice({ text: reviewing.mode === "verified" ? "Certificate verified." : "Certificate rejected.", tone: "success" });
      setReviewing(null);
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setReviewError(messageFrom(err, "Could not save the review."));
      if (err && err.status === 404) load(); // it was removed meanwhile
    } finally {
      reviewRef.current = false;
      setReviewBusy(false);
    }
  }

  return (
    <div className="bg-[#f8f9f8] border border-gray-200 rounded-2xl p-4 mt-4">
      <p className="text-xs font-bold text-gray-800 mb-3">Certificates</p>

      {loading ? (
        <p className="text-xs text-gray-400">Loading certificates…</p>
      ) : error ? (
        <p className="text-xs text-red-600">
          {error}{" "}
          <button onClick={load} className="font-semibold underline">
            Try again
          </button>
        </p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400">This farmer has not uploaded any certificates.</p>
      ) : (
        <>
        {!canReview && (
          <p className="text-xs text-gray-500 mb-3">Only the FarmFund admin can verify or reject certificates. You can view them here.</p>
        )}
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="flex items-start gap-3">
                <FileIcon type={c.fileType} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 break-words min-w-0">{c.title}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <CertificateMeta cert={c} />
                  <ReviewLine cert={c} />
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleView(c)}
                      disabled={openingId !== null}
                      aria-label={`View ${c.title}`}
                      className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-50"
                    >
                      {openingId === c.id ? "Opening…" : "View"}
                    </button>
                    {canReview && c.status !== "verified" && (
                      <button
                        onClick={() => {
                          setReviewError("");
                          setReviewing({ cert: c, mode: "verified" });
                        }}
                        aria-label={`Verify ${c.title}`}
                        className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
                      >
                        Verify
                      </button>
                    )}
                    {canReview && c.status !== "rejected" && (
                      <button
                        onClick={() => {
                          setReviewError("");
                          setReviewing({ cert: c, mode: "rejected" });
                        }}
                        aria-label={`Reject ${c.title}`}
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
        </>
      )}

      {notice && (
        <p role="status" className={`mt-3 text-xs font-medium ${notice.tone === "error" ? "text-red-600" : "text-[#2e7d32]"}`}>
          {notice.text}
        </p>
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